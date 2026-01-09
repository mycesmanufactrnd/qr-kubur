import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export default function PaymentConfigDialog({ 
  open, 
  onOpenChange, 
  entityId, 
  entityType
}) {
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [configValues, setConfigValues] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});

  const queryClient = useQueryClient();
  const configEntity = entityType === 'tahfiz' ? 'TahfizPaymentConfig' : 'OrganisationPaymentConfig';
  const entityKey = entityType === 'tahfiz' ? 'tahfiz_id' : 'organisation_id';

  const { data: platforms = [] } = useQuery({
    queryKey: ['payment-platforms-active'],
    queryFn: () => base44.entities.PaymentPlatform.filter({ status: 'active' }),
    enabled: open
  });

  const { data: platformFields = [] } = useQuery({
    queryKey: ['payment-fields'],
    queryFn: () => base44.entities.PaymentPlatformField.list(),
    enabled: open
  });

  const { data: existingConfigs = [] } = useQuery({
    queryKey: ['payment-config', entityType, entityId],
    queryFn: () => base44.entities[configEntity].filter({ [entityKey]: entityId }),
    enabled: open && !!entityId
  });

  useEffect(() => {
    if (existingConfigs.length > 0) {
      const values = {};
      const platformSet = new Set();
      existingConfigs.forEach(config => {
        if (config?.payment_platform_code && config?.key) {
          platformSet.add(config.payment_platform_code);
          values[`${config.payment_platform_code}_${config.key}`] = config.value;
        }
      });
      setSelectedPlatforms(Array.from(platformSet));
      setConfigValues(values);
    }
  }, [existingConfigs]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Delete existing configs
      await Promise.all(
        existingConfigs.map(config => 
          base44.entities[configEntity].delete(config.id)
        )
      );

      // Create new configs
      const configs = [];
      for (const platformCode of selectedPlatforms) {
        const fields = platformFields.filter(f => f?.payment_platform_code === platformCode);
        for (const field of fields) {
          if (field?.key) {
            const value = configValues[`${platformCode}_${field.key}`];
            if (value) {
              configs.push({
                [entityKey]: entityId,
                payment_platform_code: platformCode,
                key: field.key,
                value: value
              });
            }
          }
        }
      }

      await Promise.all(
        configs.map(config => base44.entities[configEntity].create(config))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-config']);
      showSuccess('Payment Configuration Saved');
      onOpenChange(false);
    }
  });

  const handleFileUpload = async (platformCode, fieldKey, file) => {
    const uploadKey = `${platformCode}_${fieldKey}`;
    setUploadingFiles({ ...uploadingFiles, [uploadKey]: true });
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setConfigValues({ ...configValues, [`${platformCode}_${fieldKey}`]: file_url });
      showSuccess('File Uploaded');
    } catch (error) {
      showError("Failed To Upload File");
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
        f?.payment_platform_code === platformCode && f?.required
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
    saveMutation.mutate();
  };

  const renderField = (platform, field) => {
    const fieldId = `${platform.code}_${field.key}`;
    const value = configValues[fieldId] || '';
    const isUploading = uploadingFiles[fieldId];

    switch (field.field_type) {
      case 'image':
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
            {value && (
              <img src={value} alt="Preview" className="mt-2 h-20 rounded border" />
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
              type={field.field_type === 'password' ? 'password' : 'text'}
              value={value}
              onChange={(e) => setConfigValues({ ...configValues, [fieldId]: e.target.value })}
              placeholder={field.placeholder}
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            const fields = platformFields.filter(f => f?.payment_platform_code === platformCode);
            
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
          <Button onClick={handleSave} disabled={saveMutation.isPending || selectedPlatforms.length === 0}>
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? translate('saving...') : translate('savingConfig')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}