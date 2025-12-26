import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Save, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function PaymentConfigDialog({ 
  open, 
  onOpenChange, 
  entityId, 
  entityType // 'tahfiz' or 'organisation'
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

  React.useEffect(() => {
    if (existingConfigs.length > 0) {
      const values = {};
      const platforms = new Set();
      existingConfigs.forEach(config => {
        platforms.add(config.payment_platform_code);
        values[`${config.payment_platform_code}_${config.key}`] = config.value;
      });
      setSelectedPlatforms(Array.from(platforms));
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
        const fields = platformFields.filter(f => f.payment_platform_code === platformCode);
        for (const field of fields) {
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

      await Promise.all(
        configs.map(config => base44.entities[configEntity].create(config))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-config']);
      toast.success('Payment configuration saved');
      onOpenChange(false);
    }
  });

  const handleFileUpload = async (platformCode, fieldKey, file) => {
    const uploadKey = `${platformCode}_${fieldKey}`;
    setUploadingFiles({ ...uploadingFiles, [uploadKey]: true });
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setConfigValues({ ...configValues, [`${platformCode}_${fieldKey}`]: file_url });
      toast.success('File uploaded');
    } catch (error) {
      toast.error('Failed to upload file');
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
        f.payment_platform_code === platformCode && f.required
      );
      for (const field of fields) {
        const value = configValues[`${platformCode}_${field.key}`];
        if (!value || value.trim() === '') {
          toast.error(`${field.label || field.key} is required for ${platforms.find(p => p.code === platformCode)?.name}`);
          return false;
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
              {isUploading && <span className="text-sm text-gray-500">Uploading...</span>}
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
            Payment Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">Select Payment Platforms</Label>
            <div className="grid gap-3">
              {platforms.map(platform => (
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
            const platform = platforms.find(p => p.code === platformCode);
            const fields = platformFields.filter(f => f.payment_platform_code === platformCode);
            
            if (fields.length === 0) return null;

            return (
              <div key={platformCode} className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  {platform?.name} Configuration
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
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending || selectedPlatforms.length === 0}>
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}