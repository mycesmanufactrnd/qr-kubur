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
  timeOut: 5000,
  extendedTimeOut: 1000,
  showEasing: 'swing',
  hideEasing: 'linear',
  showMethod: 'fadeIn',
  hideMethod: 'fadeOut'
};

export const showSuccess = (message, title = 'Success') => {
  toastr.success(message, title);
};

export const showError = (message, title = 'Ralat') => {
  toastr.error(message, title);
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