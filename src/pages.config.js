import AppUserLogin from '@/pages/AppUserLogin';
import CheckTahlilStatus from '@/pages/CheckTahlilStatus';
import DeadPersonDetails from '@/pages/DeadPersonDetails';
import DonationPage from '@/pages/DonationPage';
import GraveDetails from '@/pages/GraveDetails';
import ManageUsers from '@/pages/Management/ManageUsers';
import NotificationPage from '@/pages/NotificationPage';
import ScanQR from '@/pages/ScanQR';
import SearchGrave from '@/pages/SearchGrave';
import SearchWaqf from '@/pages/SearchWaqf';
import SearchHeritage from '@/pages/SearchHeritage';
import HeritageDetails from '@/pages/HeritageDetails';
import SearchTahfiz from '@/pages/SearchTahfiz';
import TahfizDetails from '@/pages/TahfizDetails';
import OrganisationDetails from '@/pages/OrganisationDetails.jsx';
import SettingsPage from '@/pages/SettingsPage';
import SubmitSuggestion from '@/pages/SubmitSuggestion';
import SurahPage from '@/pages/SurahPage';
import TahlilRequestPage from '@/pages/TahlilRequestPage';
import SolatJenazah from '@/pages/SolatJenazah.jsx';
import SearchMosque from '@/pages/SearchMosque.jsx';
import IslamicCalendar from '@/pages/IslamicCalendar.jsx';
import DailyDua from '@/pages/DailyDua.jsx';
import JitsiRoom from '@/pages/JitsiRoom.jsx';
import WaqfDetail from '@/pages/WaqfDetail.jsx';
import MosqueDetails from '@/pages/MosqueDetails.jsx';
import JenazahEmergency from '@/pages/JenazahEmergency.jsx';
import AsmaulHusna from '@/pages/Asmaulhusna.jsx';
import Tasbih from '@/pages/Tasbih.jsx';
import PrayerTimes from '@/pages/PrayerTimes.jsx';
import RukunIslam from '@/pages/RukunIslam.jsx';
import DeathCharityUserPayment from '@/pages/DeathCharityUserPayment.jsx';
// Superadmin & Settings
import ViewLogs from '@/pages/ViewLogs';
import ImpersonateUser from '@/pages/ImpersonateUser';
import IconLibrary from '@/pages/Settings/IconLibrary';
import Ollama from '@/pages/Settings/Ollama.jsx';
import PrivacyPolicy from '@/pages/Settings/PrivacyPolicy';
import TermsAndConditions from '@/pages/Settings/TermsAndConditions';
import UserTransactionRecords from '@/pages/Settings/UserTransactionRecords';
import ManagePaymentDistribution from '@/pages/Management/ManagePaymentDistribution';
// Management
import ManageDeadPersons from '@/pages/Management/ManageDeadPersons';
import ManageDonations from '@/pages/Management/ManageDonations';
import ManageGraves from '@/pages/Management/ManageGraves';
import ManageOrganisationTypes from '@/pages/Management/ManageOrganisationTypes';
import ManageOrganisations from '@/pages/Management/ManageOrganisations.jsx';
import ManageTempOrganisations from '@/pages/Management/ManageTempOrganisations.jsx';
import ManagePaymentFields from '@/pages/Management/ManagePaymentFields';
import ManagePaymentPlatforms from '@/pages/Management/ManagePaymentPlatforms';
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
import ManageDeathCharityMember from '@/pages/Management/ManageDeathCharityMember.jsx';
import ManageDeathCharityClaim from '@/pages/Management/ManageDeathCharityClaim.jsx';
import ManageDeathCharityLedger from '@/pages/Management/ManageDeathCharityLedger.jsx';
// Payment
import ToyyibPayConfigPage from '@/pages/Payment/ToyyibPayConfigPage.jsx';
import BillplzConfigPage from '@/pages/Payment/BillplzConfigPage.jsx';
// Dashboard
import __Layout from '@/Layout.jsx';
import AdminDashboard from '@/pages/Dashboards/AdminDashboard';
import TahfizDashboard from '@/pages/Dashboards/TahfizDashboard';
import SuperadminDashboard from '@/pages/Dashboards/SuperadminDashboard';
import UserDashboard from '@/pages/Dashboards/UserDashboard.jsx';
import OrganisationQuickRegister from '@/pages/OrganisationQuickRegister.jsx';
import MyPaymentConfig from '@/pages/MyPaymentConfig.jsx';


export const PAGES = {
    "Ollama": Ollama,
    "JitsiRoom": JitsiRoom,
    "AppUserLogin": AppUserLogin,
    "CheckTahlilStatus": CheckTahlilStatus,
    "DeadPersonDetails": DeadPersonDetails,
    "DonationPage": DonationPage,
    "GraveDetails": GraveDetails,
    "IconLibrary": IconLibrary,
    "IslamicCalendar": IslamicCalendar,
    "DailyDua": DailyDua,
    "ManageDeadPersons": ManageDeadPersons,
    "ManageDonations": ManageDonations,
    "ManageGraves": ManageGraves,
    "ManageOrganisationTypes": ManageOrganisationTypes,
    "ManageOrganisations": ManageOrganisations,
    "ManageTempOrganisations": ManageTempOrganisations,
    "ManagePaymentFields": ManagePaymentFields,
    "ManagePaymentDistribution": ManagePaymentDistribution,
    "ManagePaymentPlatforms": ManagePaymentPlatforms,
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
    "ManageDeathCharityMember": ManageDeathCharityMember,
    "ManageDeathCharityClaim": ManageDeathCharityClaim,
    "ManageDeathCharityLedger": ManageDeathCharityLedger,
    "ImpersonateUser": ImpersonateUser,
    "ManageUsers": ManageUsers,
    "NotificationPage": NotificationPage,
    "PrivacyPolicy": PrivacyPolicy,
    "ScanQR": ScanQR,
    "SearchGrave": SearchGrave,
    "SearchWaqf": SearchWaqf,
    "SearchHeritage": SearchHeritage,
    "HeritageDetails": HeritageDetails,
    "SearchTahfiz": SearchTahfiz,
    "TahfizDetails": TahfizDetails,
    "OrganisationDetails": OrganisationDetails,
    "SettingsPage": SettingsPage,
    "OrganisationQuickRegister": OrganisationQuickRegister,
    "MyPaymentConfig": MyPaymentConfig,
    "SubmitSuggestion": SubmitSuggestion,
    "SurahPage": SurahPage,
    "TahlilRequestPage": TahlilRequestPage,
    "TermsAndConditions": TermsAndConditions,
    "UserTransactionRecords": UserTransactionRecords,
    "ViewLogs": ViewLogs,
    "ToyyibPayConfigPage": ToyyibPayConfigPage,
    "BillplzConfigPage": BillplzConfigPage,
    "SolatJenazah": SolatJenazah,
    "SearchMosque": SearchMosque,
    "WaqfDetail": WaqfDetail,
    "MosqueDetailsPage": MosqueDetails,
    "JenazahEmergency": JenazahEmergency,
    "Asmaulhusna": AsmaulHusna,
    "Tasbih": Tasbih,
    "PrayerTimes": PrayerTimes,
    "RukunIslam": RukunIslam,
    "DeathCharityUserPayment": DeathCharityUserPayment,
    
    // Dashboard
    "AdminDashboard": AdminDashboard,
    "TahfizDashboard": TahfizDashboard,
    "SuperadminDashboard": SuperadminDashboard,
    "UserDashboard": UserDashboard,
}

export const pagesConfig = {
    mainPage: "UserDashboard",
    Pages: PAGES,
    Layout: __Layout,
};
