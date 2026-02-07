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
  selectedservices: [],
  deceasednames: [],
  amount: '',
  customAmount: '',
  requestorname: '',
  requestorphoneno: '',
  requestoremail: '',
  customservice: '',
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
  longitude: '',
  photourl: '',
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

export const defaultOrganisationField = {
  name: '',
  parentorganisation: null,
  organisationtype: null,
  states: '',
  address: '',
  phone: '',
  email: '',
  url: '',
  latitude: '',
  longitude: '',
  canbedonated: false,
  status: 'active'
}

export const defaultPaymentConfigField = {
  code: '',
  name: '',
  category: 'manual',
  status: 'active',
  icon: ''
}

export const defaultDeadPersonField = {
  name: '',
  icnumber: '',
  dateofbirth: '',
  dateofdeath: '',
  causeofdeath: '',
  grave: '',
  biography: '',
  photourl: '',
  gpslatitude: '',
  gpslongitude: '',
}

export const defaultPaymentField = {
  paymentplatform: null,
  key: '',
  label: '',
  fieldtype: 'text',
  required: false,
  placeholder: ''
}

export const defaultHeritageField = {
  name: '',
  era: '',
  eradescription: '',
  description: '',
  historicalsources: '',
  latitude: '',
  longitude: '',
  photourl: '',
  address: '',
  state: '',
  url: '',
  isfeatured: false,
}

export const defaultActivityPost = {
  title: '',
  content: '',
  photourl: '',
  ispublished: false,
  tahfizcenter: null,
  mosque: null,
}

export const defaultMosqueField = {
  name: '',
  state: '',
  address: '',
  phone: '',
  email: '',
  url: '',
  latitude: '',
  longitude: '',
  organisation: '',
  photourl: '',
};
