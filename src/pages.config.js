import __Layout from '@/Layout.jsx';
import UserDashboard from '@/pages/Dashboards/UserDashboard.jsx';
import AdminDashboard from '@/pages/Dashboards/AdminDashboard';
import TahfizDashboard from '@/pages/Dashboards/TahfizDashboard';
import SuperadminDashboard from '@/pages/Dashboards/SuperadminDashboard';
import StatisticDashboard from '@/pages/Dashboards/StatisticDashboard';

import AppUserLogin from '@/pages/AppUserLogin';
import ImpersonateUser from '@/pages/ImpersonateUser';

import ScanQR from '@/pages/ScanQR';
import SearchGrave from '@/pages/User/SearchGrave';
import UserQariahRegistration from '@/pages/User/UserQariahRegistration';
import GraveDetails from '@/pages/GraveDetails';
import DeadPersonDetails from '@/pages/DeadPersonDetails';
import SearchTahfiz from '@/pages/SearchTahfiz';
import TahfizDetails from '@/pages/TahfizDetails';
import SearchHeritage from '@/pages/SearchHeritage';
import HeritageDetails from '@/pages/HeritageDetails';
import SearchWaqf from '@/pages/SearchWaqf';
import WaqfDetail from '@/pages/WaqfDetail.jsx';
import SearchMosque from '@/pages/SearchMosque.jsx';
import MosqueDetails from '@/pages/MosqueDetails.jsx';
import OrganisationDetails from '@/pages/OrganisationDetails.jsx';
import MapView from '@/pages/MapView.jsx';
import NotificationPage from '@/pages/NotificationPage';
import SettingsPage from '@/pages/SettingsPage';

import DonationPage from '@/pages/DonationPage';
import DeathCharityUserPayment from '@/pages/DeathCharityUserPayment.jsx';
import CheckServiceStatus from '@/pages/User/CheckServiceStatus';
import StatusCheck from '@/pages/User/StatusCheck';

import TahlilRequestPage from '@/pages/TahlilRequestPage';
import SearchTahlil from '@/pages/SearchTahlil';
import CheckTahlilStatus from '@/pages/User/CheckTahlilStatus';

import SurahPage from '@/pages/User/SurahPage';
import SolatJenazah from '@/pages/SolatJenazah.jsx';
import JenazahEmergency from '@/pages/JenazahEmergency.jsx';
import JenazahEmergencyRequest from '@/pages/User/JenazahEmergencyRequest.jsx';
import IslamicCalendar from '@/pages/IslamicCalendar.jsx';
import DailyDua from '@/pages/ExtraFeatures/DailyDua.jsx';
import AsmaulHusna from '@/pages/ExtraFeatures/Asmaulhusna.jsx';
import Tasbih from '@/pages/ExtraFeatures/Tasbih.jsx';
import PrayerTimes from '@/pages/ExtraFeatures/PrayerTimes.jsx';
import RukunIslam from '@/pages/ExtraFeatures/RukunIslam.jsx';

import SubmitSuggestion from '@/pages/SubmitSuggestion';
import JitsiRoom from '@/pages/JitsiRoom.jsx';
import OrganisationQuickRegister from '@/pages/OrganisationQuickRegister.jsx';

import PrivacyPolicy from '@/pages/Settings/PrivacyPolicy';
import TermsAndConditions from '@/pages/Settings/TermsAndConditions';
import UserTransactionRecords from '@/pages/Settings/UserTransactionRecords';
import FAQ from '@/pages/Settings/FAQ';

import ManagePaymentConfig from '@/pages/Management/ManagePaymentConfig.jsx';
import ManageUsers from '@/pages/Management/ManageUsers';
import ManageCollectionTree from '@/pages/Management/ManageCollectionTree';
import ManageDeadPersons from '@/pages/Management/ManageDeadPersons';
import ManageDonations from '@/pages/Management/ManageDonations';
import ManageGraves from '@/pages/Management/ManageGraves';
import ManageOrganisationTypes from '@/pages/Management/ManageOrganisationTypes';
import ManageOrganisations from '@/pages/Management/ManageOrganisations.jsx';
import ManageTempOrganisations from '@/pages/Management/ManageTempOrganisations.jsx';
import ManagePermissions from '@/pages/Management/ManagePermissions.jsx';
import ManageSuggestions from '@/pages/Management/ManageSuggestions';
import ManageTahfizCenters from '@/pages/Management/ManageTahfizCenters';
import ManageTahlilRequests from '@/pages/Management/ManageTahlilRequests';
import ManageHeritageSites from '@/pages/Management/ManageHeritageSites';
import ManageActivityPosts from '@/pages/Management/ManageActivityPosts';
import ManageIslamicEvent from '@/pages/Management/ManageIslamicEvent';
import ManageWaqfProject from '@/pages/Management/ManageWaqfProject';
import ManageMosques from '@/pages/Management/ManageMosques.jsx';
import ManageDeathCharity from '@/pages/Management/ManageDeathCharity.jsx';
import ManageNotifyDeathQariah from '@/pages/Management/ManageNotifyDeathQariah.jsx';
import ManageDeathCharityMember from '@/pages/Management/ManageDeathCharityMember.jsx';
import ManageQariahMember from '@/pages/Management/ManageQariahMember.jsx';
import ManageDeathCharityClaim from '@/pages/Management/ManageDeathCharityClaim.jsx';
import ManageDeathCharityLedger from '@/pages/Management/ManageDeathCharityLedger.jsx';
import ManageQuotations from '@/pages/Management/ManageQuotations.jsx';
import InventoryDashboard from '@/pages/Management/InventoryDashboard.jsx';
import ManageInventoryItems from '@/pages/Management/ManageInventoryItems.jsx';
import ManageInventoryPackages from '@/pages/Management/ManageInventoryPackages.jsx';
import InventoryStockIn from '@/pages/Management/InventoryStockIn.jsx';
import InventoryStockOut from '@/pages/Management/InventoryStockOut.jsx';
import InventoryHistory from '@/pages/Management/InventoryHistory.jsx';
import InventoryAudit from '@/pages/Management/InventoryAudit.jsx';
import InventoryReports from '@/pages/Management/InventoryReports.jsx';
import ManageJenazahCase from '@/pages/Management/ManageJenazahCase.jsx';
import DetailJenazah from '@/pages/DetailJenazah';

import ManagePaymentDistribution from '@/pages/Management/ManagePaymentDistribution';
import ManagePaymentFields from '@/pages/Management/ManagePaymentFields';
import ManagePaymentPlatforms from '@/pages/Management/ManagePaymentPlatforms';
import FinancialReports from '@/pages/Payment/FinancialReports.jsx';
import ToyyibPayConfigPage from '@/pages/Payment/ToyyibPayConfigPage.jsx';
import BillplzConfigPage from '@/pages/Payment/BillplzConfigPage.jsx';
import PaymentComparison from '@/pages/Payment/PaymentComparison.jsx';

import GanttChartScheduling from '@/pages/Settings/GanttChartScheduling';
import ViewLogs from '@/pages/Settings/ViewLogs';
import IconLibrary from '@/pages/Settings/IconLibrary';
import Ollama from '@/pages/Settings/Ollama.jsx';
import UserManual from '@/pages/Settings/Manuals/UserManual.jsx';
import AdminOrganisationManual from '@/pages/Settings/Manuals/AdminOrganisationManual.jsx';
import AdminTahfizManual from '@/pages/Settings/Manuals/AdminTahfizManual.jsx';


export const PAGES = {
    "UserDashboard": UserDashboard,
    "AdminDashboard": AdminDashboard,
    "TahfizDashboard": TahfizDashboard,
    "SuperadminDashboard": SuperadminDashboard,
    "StatisticDashboard": StatisticDashboard,

    "AppUserLogin": AppUserLogin,
    "ImpersonateUser": ImpersonateUser,

    "ScanQR": ScanQR,
    "SearchGrave": SearchGrave,
    "UserQariahRegistration": UserQariahRegistration,
    "GraveDetails": GraveDetails,
    "DeadPersonDetails": DeadPersonDetails,
    "SearchTahfiz": SearchTahfiz,
    "TahfizDetails": TahfizDetails,
    "SearchHeritage": SearchHeritage,
    "HeritageDetails": HeritageDetails,
    "SearchWaqf": SearchWaqf,
    "WaqfDetail": WaqfDetail,
    "SearchMosque": SearchMosque,
    "MosqueDetailsPage": MosqueDetails,
    "OrganisationDetails": OrganisationDetails,
    "MapView": MapView,
    "NotificationPage": NotificationPage,
    "SettingsPage": SettingsPage,

    "DonationPage": DonationPage,
    "DeathCharityUserPayment": DeathCharityUserPayment,
    "CheckServiceStatus": CheckServiceStatus,
    "StatusCheck": StatusCheck,

    "TahlilRequestPage": TahlilRequestPage,
    "SearchTahlil": SearchTahlil,
    "CheckTahlilStatus": CheckTahlilStatus,

    "SurahPage": SurahPage,
    "SolatJenazah": SolatJenazah,
    "JenazahEmergency": JenazahEmergency,
    "JenazahEmergencyRequest": JenazahEmergencyRequest,
    "IslamicCalendar": IslamicCalendar,
    "DailyDua": DailyDua,
    "Asmaulhusna": AsmaulHusna,
    "Tasbih": Tasbih,
    "PrayerTimes": PrayerTimes,
    "RukunIslam": RukunIslam,

    "SubmitSuggestion": SubmitSuggestion,
    "JitsiRoom": JitsiRoom,
    "OrganisationQuickRegister": OrganisationQuickRegister,
    
    "PrivacyPolicy": PrivacyPolicy,
    "TermsAndConditions": TermsAndConditions,
    "UserTransactionRecords": UserTransactionRecords,
    "FAQ": FAQ,
    
    "ManagePaymentConfig": ManagePaymentConfig,
    "ManageUsers": ManageUsers,
    "ManageCollectionTree": ManageCollectionTree,
    "ManageDeadPersons": ManageDeadPersons,
    "ManageDonations": ManageDonations,
    "ManageGraves": ManageGraves,
    "ManageOrganisationTypes": ManageOrganisationTypes,
    "ManageOrganisations": ManageOrganisations,
    "ManageTempOrganisations": ManageTempOrganisations,
    "ManagePermissions": ManagePermissions,
    "ManageSuggestions": ManageSuggestions,
    "ManageTahfizCenters": ManageTahfizCenters,
    "ManageTahlilRequests": ManageTahlilRequests,
    "ManageHeritageSites": ManageHeritageSites,
    "ManageActivityPosts": ManageActivityPosts,
    "ManageIslamicEvent": ManageIslamicEvent,
    "ManageWaqfProject": ManageWaqfProject,
    "ManageMosques": ManageMosques,
    "ManageDeathCharity": ManageDeathCharity,
    "ManageNotifyDeathQariah": ManageNotifyDeathQariah,
    "ManageDeathCharityMember": ManageDeathCharityMember,
    "ManageQariahMember": ManageQariahMember,
    "ManageDeathCharityClaim": ManageDeathCharityClaim,
    "ManageDeathCharityLedger": ManageDeathCharityLedger,
    "ManageQuotations": ManageQuotations,
    "InventoryDashboard": InventoryDashboard,
    "ManageInventoryItems": ManageInventoryItems,
    "ManageInventoryPackages": ManageInventoryPackages,
    "InventoryStockIn": InventoryStockIn,
    "InventoryStockOut": InventoryStockOut,
    "InventoryHistory": InventoryHistory,
    "InventoryAudit": InventoryAudit,
    "InventoryReports": InventoryReports,
    "ManageJenazahCase": ManageJenazahCase,
    "DetailJenazah": DetailJenazah,

    "ManagePaymentDistribution": ManagePaymentDistribution,
    "ManagePaymentFields": ManagePaymentFields,
    "ManagePaymentPlatforms": ManagePaymentPlatforms,
    "FinancialReports": FinancialReports,
    
    "PaymentComparison": PaymentComparison,
    "ToyyibPayConfigPage": ToyyibPayConfigPage,
    "BillplzConfigPage": BillplzConfigPage,
    "GanttChartScheduling": GanttChartScheduling,
    "ViewLogs": ViewLogs,
    "IconLibrary": IconLibrary,
    "Ollama": Ollama,
    "UserManual": UserManual,
    "AdminOrganisationManual": AdminOrganisationManual,
    "AdminTahfizManual": AdminTahfizManual,

}

export const pagesConfig = {
    mainPage: "UserDashboard",
    Pages: PAGES,
    Layout: __Layout,
};
