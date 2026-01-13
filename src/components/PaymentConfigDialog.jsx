import { useEffect, useState } from 'react';
import { CreditCard, Save, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { showError, showSuccess } from './ToastrNotification';
import { translate } from '@/utils/translations';
import { trpc } from '@/utils/trpc';
import { useGetConfigByEntity, useUpsertConfigByEntity } from '@/hooks/usePaymentConfigMutations';

export default function PaymentConfigDialog({ 
  open, 
  hasAdminAccess, 
  onOpenChange, 
  entityId, 
  entityType
}) {
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [configValues, setConfigValues] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [previewUrls, setPreviewUrls] = useState({});

  const buildPaymentConfigPayload = (entityType, entityId, configsToUpsert) => {
    switch (entityType) {
      case "organisation":
        return { organisationId: entityId, configs: configsToUpsert };
      case "tahfiz":
        return { tahfizId: entityId, configs: configsToUpsert };
      default:
        throw new Error(`Unsupported entityType: ${entityType}`);
    }
  }

  const resetForm = () => {
    setSelectedPlatforms([]);
    setConfigValues({});
    setUploadingFiles({});
    setPreviewUrls({});
  };

  const { data: platforms = [] } = 
    trpc.paymentPlatform.getActivePlatform.useQuery(
      undefined,
      { enabled: hasAdminAccess && open }
    );

  const platformFields = platforms.flatMap(platform =>
    (platform.paymentfields ?? []).map(field => ({
      ...field,
      platformCode: platform.code,
      platformName: platform.name,
      platformId: platform.id,
    }))
  );
  
  
  const existingConfigs = useGetConfigByEntity({
    entityId: Number(entityId),
    entityType: entityType,
  });

  const upsertMutation = useUpsertConfigByEntity();

  useEffect(() => {
    if (existingConfigs.length > 0) {
      const fetchAllFileUrls = async () => {
        const values = {};
        const platformSet = new Set();

        for (const config of existingConfigs) {
          const platformCode = config.paymentplatform?.code;
          const fieldKey = config.paymentfield?.key;
          const filename = config.value;

          if (platformCode && fieldKey && filename) {
            platformSet.add(platformCode);

            try {
              const res = await fetch(`/api/file/${encodeURIComponent(filename)}`);
              if (!res.ok) {
                console.warn(`Failed to fetch file: ${filename}`);
                values[`${platformCode}_${fieldKey}`] = '';
                continue;
              }

              const blob = await res.blob();
              values[`${platformCode}_${fieldKey}`] = URL.createObjectURL(blob);
            } catch (err) {
              console.error('Error fetching file:', err);
              values[`${platformCode}_${fieldKey}`] = '';
            }
          }
        }

        setSelectedPlatforms(Array.from(platformSet));
        setConfigValues(values);
      };

      fetchAllFileUrls();
    }
  }, [existingConfigs]);

  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);
  
  const handleFileUpload = async (platformCode, fieldKey, file) => {
    const uploadKey = `${platformCode}_${fieldKey}`;
    setUploadingFiles({ ...uploadingFiles, [uploadKey]: true });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      
      console.info('respose', res);

      let data;
      try {
        data = await res.json();
      } catch {
        console.error("Failed to parse JSON from response");
        showError('Upload failed (invalid response)');
        return;
      }

      if (res.ok) {
        setConfigValues({ ...configValues, [uploadKey]: data.file_url });
        setPreviewUrls(prev => ({ ...prev, [uploadKey]: URL.createObjectURL(file) }));
        showSuccess('File Uploaded');
      } else {
        showError(data.error || 'Failed To Upload File');
      }
    } catch (err) {
      console.error("Fetch error:", err);
      showError('Failed To Upload File');
    } finally {
      setUploadingFiles({ ...uploadingFiles, [uploadKey]: false });
    }
  };

  const togglePlatform = (platformCode) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformCode) 
        ? prev.filter(p => p !== platformCode)
        : [...prev, platformCode]
    );
  };

  const validateConfig = () => {
    for (const platformCode of selectedPlatforms) {
      const fields = platformFields.filter(f => 
        f?.platformCode === platformCode && f?.required
      );
      for (const field of fields) {
        if (field?.key) {
          const value = configValues[`${platformCode}_${field.key}`];
          if (!value || value.trim() === '') {
            const platformName = platforms.find(p => p?.code === platformCode)?.name || 'platform';
            showError(`${field.label || field.key} is required for ${platformName}`);
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleSave = () => {
    if (!validateConfig()) return;

    const configsToUpsert = selectedPlatforms.flatMap(platformCode => {
      const fields = platformFields.filter(f => f.platformCode === platformCode);
      return fields
        .map(field => {
          const value = configValues[`${platformCode}_${field.key}`];
          if (value) {
            return {
              paymentPlatformId: field.platformId,
              paymentFieldId: field.id,
              value,
            };
          }
          return null;
        })
        .filter(Boolean);
    });

    const payload = buildPaymentConfigPayload(entityType, entityId, configsToUpsert);

    upsertMutation.mutateAsync(payload)
    .then((res) => {
      if (res) {
        onOpenChange(false);
        resetForm();
      }
    })
  };

  const renderField = (platform, field) => {
    const fieldId = `${platform.code}_${field.key}`;
    const value = configValues[fieldId] || '';
    const isUploading = uploadingFiles[fieldId];

    switch (field.fieldtype) {
      case 'image':
        const previewSrc = previewUrls[fieldId] || value;
        return (
          <div>
            <Label>{field.label || field.key} {field.required && <span className="text-red-500">*</span>}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(platform.code, field.key, file);
                }}
                disabled={isUploading}
              />
              {isUploading && <span className="text-sm text-gray-500">translate('uploading...')</span>}
            </div>
            {previewSrc && (
              <img src={previewSrc} alt="Preview" className="mt-2 h-20 rounded border" />
            )}
          </div>
        );
      
      case 'textarea':
        return (
          <div>
            <Label htmlFor={fieldId}>{field.label || field.key} {field.required && <span className="text-red-500">*</span>}</Label>
            <Textarea
              id={fieldId}
              value={value}
              onChange={(e) => setConfigValues({ ...configValues, [fieldId]: e.target.value })}
              placeholder={field.placeholder}
            />
          </div>
        );
      
      case 'url':
      case 'text':
      case 'password':
      default:
        return (
          <div>
            <Label htmlFor={fieldId}>{field.label || field.key} {field.required && <span className="text-red-500">*</span>}</Label>
            <Input
              id={fieldId}
              type={field.fieldtype === 'password' ? 'password' : 'text'}
              value={value}
              onChange={(e) => setConfigValues({ ...configValues, [fieldId]: e.target.value })}
              placeholder={field.placeholder}
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(openState) => {
      if (!openState) resetForm();
      onOpenChange(openState);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {translate('paymentConfig')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">{translate('selectPaymentPlatforms')}</Label>
            <div className="grid gap-3">
              {platforms.filter(p => p?.code).map(platform => (
                <Label 
                  key={platform.code}
                  className="flex items-center gap-3 p-3 rounded border cursor-pointer hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedPlatforms.includes(platform.code)}
                    onCheckedChange={() => togglePlatform(platform.code)}
                  />
                  <div>
                    <span className="font-medium">{platform.name}</span>
                    <Badge variant="secondary" className="ml-2 capitalize text-xs">
                      {platform.category}
                    </Badge>
                  </div>
                </Label>
              ))}
            </div>
          </div>

          {selectedPlatforms.map(platformCode => {
            const platform = platforms.find(p => p?.code === platformCode);
            const fields = platformFields.filter(f => f?.platformCode === platformCode);
            
            if (!platform || fields.length === 0) return null;

            return (
              <div key={platformCode} className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  {platform.name} {translate('config')}
                </h3>
                <div className="space-y-4">
                  {fields.map(field => (
                    <div key={field.id}>
                      {renderField(platform, field)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {translate('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={
            upsertMutation.orgMutation.isPending || 
            upsertMutation.tahfizMutation.isPending || 
            selectedPlatforms.length === 0
          }>
            <Save className="w-4 h-4 mr-2" />
            { (upsertMutation.orgMutation.isPending || upsertMutation.tahfizMutation.isPending) 
              ? translate('saving...') : translate('savingConfig')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}