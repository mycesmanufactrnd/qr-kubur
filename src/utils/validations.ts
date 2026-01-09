import { showError, showRequiredError } from '../components/ToastrNotification';

export type ValidationField = {
  field: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'array' | 'select' | 'phone';
  minLength?: number;
  required?: boolean; 
  onlyIfExists?: boolean; 
  errorMessage?: string;
};

export const validateFields = (
  data: Record<string, any>,
  fields: ValidationField[]
): boolean => {
  for (const f of fields) {
    const { field, label, type, minLength, required = true, onlyIfExists = false, errorMessage } = f;
    const value = data[field];

    if (onlyIfExists && !value) continue;

    if (required && !onlyIfExists) {
      if (type === 'array') {
        if (!Array.isArray(value) || value.length === 0) {
          showRequiredError(label);
          return false;
        }
      } else if (type === 'select') {
        if (value === null || value === undefined || value === '') {
          showRequiredError(label);
          return false;
        }
      } else {
        if (!value || (typeof value === 'string' && !value.trim())) {
          showRequiredError(label);
          return false;
        }
      }
    }

    if ((type === 'text' || type === 'password') && minLength && value) {
      if (value.length < minLength) {
        showError(errorMessage || `${label} mesti sekurang-kurangnya ${minLength} aksara`, 'Pengesahan Gagal');
        return false;
      }
    }

    if (type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        showError(errorMessage || `Format ${label} tidak sah`, 'Format Gagal');
        return false;
      }
    }

    if (type === 'phone' && value) {
      const phoneRegex = /^[0-9\-\+\(\)\s]+$/;
      if (!phoneRegex.test(value)) {
        showError(errorMessage || `Format ${label} tidak sah`, 'Format Gagal');
        return false;
      }
    }
  }

  return true;
};

