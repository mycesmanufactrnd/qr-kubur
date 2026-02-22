import { ActiveInactiveStatus, ClaimStatus, ProjectStatus, WaqfCategory, WaqfType } from "./enums";

export const defaultGraveField = {
  name: '',
  state: '',
  block: '',
  lot: '',
  address: '',
  latitude: '',
  longitude: '',
  photourl: '',
  picname: '',
  picphoneno: '',
  organisation: '',
  status: ActiveInactiveStatus.ACTIVE,
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

export const defaultOrganisationTypeField = {
  organisations: '',
  name: '',
  description: '',
  status: ActiveInactiveStatus.ACTIVE,
}

export const defaultOrganisationField = {
  name: '',
  parentorganisation: null,
  organisationtype: null,
  serviceoffered: [],
  serviceprice: {},
  states: '',
  address: '',
  photourl: '',
  phone: '',
  email: '',
  url: '',
  latitude: '',
  longitude: '',
  canbedonated: false,
  isgraveservices: false,
  status: ActiveInactiveStatus.ACTIVE,
}

export const defaultPaymentConfigField = {
  code: '',
  name: '',
  category: 'manual',
  status: ActiveInactiveStatus.ACTIVE,
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
  latitude: '',
  longitude: '',
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

export const defaultWaqfProjectField = {
  waqfname: '',
  description: '',
  state: '',
  category: WaqfCategory.MOSQUE,
  beneficiaries: '',
  startdate: '',
  enddate: '',
  status: ProjectStatus.PLANNED,
  progresspercentage: 0,
  totalrequired: 0,
  amountcollected: 0,
  location: '',
  responsibleperson: '',
  waqftype: WaqfType.CASH,
  photourl: '',
  notes: ''
}

export const defaultMosqueField = {
  name: '',
  state: '',
  address: '',
  email: '',
  url: '',
  latitude: '',
  longitude: '',
  organisation: '',
  photourl: '',
  picname: '',
  picphoneno: '',
  canarrangefuneral: false,
  hasdeathcharity: false,
};

export const defaultDeathCharityField = {
  name: "",
  description: "",
  state: "",
  contactperson: "",
  contactphone: "",
  registrationfee: 0,
  yearlyfee: 0,
  deathbenefitamount: 0,
  coversspouse: true,
  coverschildren: true,
  maxdependents: 0,
  isselfregister: true,
  isactive: true,
  organisation: '',
  mosqueid: null,
};

export const defaultDeathCharityMemberField = {
  fullname: "",
  icnumber: "",
  phone: "",
  email: "",
  address: "",
  isactive: true,
  deathcharity: "",
};

export const defaultDeathCharityClaimField = {
  deceasedname: "",
  relationship: "",
  payoutamount: 0,
  deathcharity: "",
  member: "",
  dependent: "",
  status: ClaimStatus.PENDING,
};
