import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from 'react-hook-form';
import { showError, showSuccess } from '../ToastrNotification';
import { translate } from '@/utils/translations';
import TextInputForm from '../forms/TextInputForm';
import SelectForm from '../forms/SelectForm';
import { ProjectStatus, WaqfCategory, WaqfType } from '@/utils/enums';
import { defaultWaqfProjectField } from '@/utils/defaultformfields';
import { resolveFileUrl } from '@/utils';

export default function WaqfForm({ project, onSubmit, onCancel, }) {
    const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting }} = useForm({
      defaultValues: project
    });
    
    useEffect(() => {
      if (project) {
        const formValues = {
          ...project,
          totalrequired: Number(project.totalrequired) || 0,
          amountcollected: Number(project.amountcollected) || 0,
          progresspercentage: Number(project.progresspercentage) || 0,
        };
        reset(formValues);
      } else {
        reset(defaultWaqfProjectField);
      }
    }, [project, reset]);

    const photourl = watch('photourl');

    const [uploading, setUploading] = useState(false);
    const [photoUrlInput, setPhotoUrlInput] = useState('');
    const [photoFileKey, setPhotoFileKey] = useState(0);

    useEffect(() => {
      if (!photourl) {
        setPhotoUrlInput('');
        return;
      }

      if (/^https?:\/\//i.test(photourl)) {
        setPhotoUrlInput(photourl);
        return;
      }
      if (photoUrlInput && photourl !== photoUrlInput) {
        setPhotoUrlInput('');
      }
    }, [photourl, photoUrlInput]);

    const handleFileUpload = async (file) => {
        setUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
        
            const res = await fetch('/api/upload/waqf-project', { method: 'POST', body: formDataUpload });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                showError(errorData.error || 'Failed to upload photo');
                return;
            }
            const data = await res.json();
            setValue('photourl', data.file_url);
            setPhotoUrlInput('');
            showSuccess('Photo uploaded');
        } catch (err) {
            console.error(err);
            showError('Failed to upload photo');
        } finally {
            setUploading(false);
        }
    };

  const validateForm = async (formData) => {
    
    if (formData.startdate && formData.enddate) {
      const start = new Date(formData.startdate);
      const end = new Date(formData.enddate);
      if (start > end) {
        alert('Start date must be before end date');
        return;
      }
    }
    
    const totalRequired = Number(formData.totalrequired) || 0;
    const amountCollected = Number(formData.amountcollected) || 0;
    
    const calculatedProgress = totalRequired > 0 
      ? Math.min(100, Math.round((amountCollected / totalRequired) * 100))
      : 0;
    
    const dataToSubmit = {
      ...formData,
      amountcollected: amountCollected,
      totalrequired: totalRequired,
      progresspercentage: calculatedProgress
    };
    
    if (calculatedProgress === 100 && dataToSubmit.status !== 'Completed') {
      dataToSubmit.status = 'Completed';
    }
    
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit(validateForm)} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
            <TextInputForm
              name="waqfname"
              control={control}
              label={translate("Waqf Name")}
              required
              errors={errors}
            />    
        </div>
        <div className="space-y-2">
          <SelectForm
            name="category"
            control={control}
            placeholder={translate("Select waqf category")}
            label={translate("Waqf Category")}
            options={Object.values(WaqfCategory).map((category) => ({
              value: category,
              label: category,
            }))}
            required
            errors={errors}
          />
        </div>
      </div>
      <div className="space-y-2">
        <TextInputForm
          name="description"
          control={control}
          label={translate("Description")}
          isTextArea
        />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <TextInputForm
            name="beneficiaries"
            control={control}
            label={translate("Beneficiaries")}
            required
            errors={errors}
          />
        </div>
        <div className="space-y-2">
          <TextInputForm
            name="location"
            control={control}
            label={translate("Location")}
            required
            errors={errors}
          />
        </div>
        <div className="space-y-2">
          <TextInputForm
            name="state"
            control={control}
            label={translate("State")}
            required
            errors={errors}
          />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <TextInputForm
            name="startdate"
            control={control}
            label="Start Date"
            isDate
            required
            errors={errors}
          />
        </div>
        <div className="space-y-2">
          <TextInputForm
            name="enddate"
            control={control}
            label="End Date"
            isDate
            required
            errors={errors}
          />
        </div>
        <div className="space-y-2">
          <SelectForm
            name="status"
            control={control}
            placeholder={translate("Select waqf status")}
            label={translate("Waqf Status")}
            options={Object.values(ProjectStatus).map((status) => ({
              value: status,
              label: status,
            }))}
            required
            errors={errors}
          />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <TextInputForm
            name="totalrequired"
            control={control}
            label="Total Required"
            required
            isMoney
          />
        </div>
        <div className="space-y-2">
          <TextInputForm
            name="amountcollected"
            control={control}
            label="Amount Collected"
            required
            isMoney
          />
        </div>
        <div className="space-y-2">
          <TextInputForm
            name="progresspercentage"
            control={control}
            label="Progress (%)"
            isNumber
            step="0.1"
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <SelectForm
            name="waqftype"
            control={control}
            placeholder={translate("Select waqf type")}
            label={translate("Waqf Type")}
            options={Object.values(WaqfType).map((type) => ({
              value: type,
              label: type,
            }))}
            required
            errors={errors}
          />
        </div>
        <div className="space-y-2">
          <TextInputForm
            name="responsibleperson"
            control={control}
            label={translate("Responsible Person / Organization")}
            required
            errors={errors}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{translate('Photo')}</Label>
        <div className="flex items-center gap-3">
          <Input
            key={photoFileKey}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              handleFileUpload(file);
            }}
            disabled={uploading}
          />
          {uploading && (
            <span className="text-sm text-gray-500">
              {translate('uploading...')}
            </span>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">
            {translate('Or paste image URL')}
          </Label>
          <Input
            type="url"
            placeholder="https://"
            value={photoUrlInput}
            onChange={(e) => {
              const value = e.target.value;
              setPhotoUrlInput(value);
              setValue('photourl', value);
              if (value) {
                setPhotoFileKey((prev) => prev + 1);
              }
            }}
          />
        </div>
        {photourl && (
          <img
            src={
              photoUrlInput
                ? photoUrlInput
                : resolveFileUrl(photourl, 'waqf-project')
            }
            alt={translate('Preview')}
          />
        )}
      </div>
      <div className="space-y-2">
        <TextInputForm
          name="notes"
          control={control}
          label={translate("Notes / Updates")}
          isTextArea
        />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
          {project ? 'Update' : 'Create'} Waqf Project
        </Button>
      </div>
    </form>
  );
}
