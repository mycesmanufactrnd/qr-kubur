export const defaultGraveField = {
  name: '',
  state: '',
  block: '',
  lot: '',
  address: '',
  latitude: '',
  longitude: '',
  organisation: '',
  status: 'active',
  totalgraves: 0,
};

export const defaultTahlilRequestField = {
  tahfizId: null,
  serviceTypes: [''],
  deceasedNames: [''],
  amount: '',
  customAmount: '',
  requesterName: '',
  requesterPhone: '',
  requesterEmail: '',
  preferredDate: '',
  customService: '',
  paymentMethod: '',
}

export const defaultSuggestionField = {
  name: '',
  phoneno: '',
  type: '',
  watchSelectedGrave: '',
  entityId: '',
  suggestedchanges: '',
  reason: ''
}

export const defaultTahfizField = {
  name: '',
  description: '',
  serviceoffered: [],
  serviceprice: {}, 
  state: '',
  address: '',
  phone: '',
  email: '',
  latitude: '', 
  longitude: ''
}

export const defaultDonationField = {
  recipientType: 'organisation',
  selectedRecipient: '',
  amount: '',
  customAmount: '',
  paymentMethod: '',
  donorname: '',
  donoremail: '',
  donorphoneno: '',
  notes: 'Sedeqah',
}