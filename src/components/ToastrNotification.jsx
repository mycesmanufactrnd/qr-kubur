import { ACTION_FAILURE_MAPS, ACTION_MAPS } from '@/utils/enums';
import { translate } from '@/utils/translations';
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';

toastr.options = {
  closeButton: true,
  debug: false,
  newestOnTop: true,
  progressBar: true,
  positionClass: 'toast-top-right',
  preventDuplicates: false,
  onclick: null,
  showDuration: 300,
  hideDuration: 1000,
  timeOut: 3000,
  extendedTimeOut: 1000,
  showEasing: 'swing',
  hideEasing: 'linear',
  showMethod: 'fadeIn',
  hideMethod: 'fadeOut'
};

export const showSuccess = (successType = null, message = '', title = 'Success') => {
  let translatedMessage = translate(message);

  if (ACTION_MAPS[successType]) {
    translatedMessage += ` ${translate(ACTION_MAPS[successType])}`;
  }

  toastr.success(translatedMessage, translate(title));
};

export const showError = (errorType = null, message = '', title = 'Ralat') => {
  let translatedMessage = translate(message);

  if (ACTION_FAILURE_MAPS[errorType]) {
    translatedMessage += ` ${translate(ACTION_FAILURE_MAPS[errorType])}`;
  }
  
  toastr.error(translatedMessage, title);
};

export const showInfo = (message, title = 'Info') => {
  toastr.info(message, title);
};

export const showWarning = (message, title = 'Amaran') => {
  toastr.warning(message, title);
};

export const showValidationError = (field) => {
  toastr.error(`Sila lengkapkan medan: ${field}`, 'Pengesahan Gagal');
};

export const showUniqueError = (field, value) => {
  toastr.error(`${field} "${value}" sudah wujud dalam sistem`, 'Data Pendua');
};

export const showApiError = (error) => {
  const message = error?.message || error?.response?.data?.message || 'Operasi gagal';
  toastr.error(message, 'Ralat API');
};

export const showApiSuccess = (operation) => {
  const messages = {
    create: 'Data berjaya ditambah',
    update: 'Data berjaya dikemaskini',
    delete: 'Data berjaya dipadam',
    upload: 'Fail berjaya dimuat naik',
    import: 'Data berjaya diimport'
  };
  toastr.success(messages[operation] || 'Operasi berjaya', 'Berjaya');
};