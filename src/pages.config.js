// ─── Dashboards ───────────────────────────────────────────────────────────────
import __Layout from '@/Layout.jsx';
import UserDashboard from '@/pages/Dashboards/UserDashboard.jsx';
import AdminDashboard from '@/pages/Dashboards/AdminDashboard';
import TahfizDashboard from '@/pages/Dashboards/TahfizDashboard';
import SuperadminDashboard from '@/pages/Dashboards/SuperadminDashboard';
import StatisticDashboard from '@/pages/Dashboards/StatisticDashboard';

// ─── Auth ─────────────────────────────────────────────────────────────────────
import AppUserLogin from '@/pages/AppUserLogin';
import ImpersonateUser from '@/pages/ImpersonateUser';

// ─── Public / User-facing ─────────────────────────────────────────────────────
import ScanQR from '@/pages/ScanQR';
import SearchGrave from '@/pages/SearchGrave';
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

// ─── Donations & Payments ─────────────────────────────────────────────────────
import DonationPage from '@/pages/DonationPage';
import DeathCharityUserPayment from '@/pages/DeathCharityUserPayment.jsx';
import CheckServiceStatus from '@/pages/CheckServiceStatus';

// ─── Tahlil & Requests ────────────────────────────────────────────────────────
import TahlilRequestPage from '@/pages/TahlilRequestPage';
import SearchTahlil from '@/pages/SearchTahlil';
import CheckTahlilStatus from '@/pages/CheckTahlilStatus';

// ─── Islamic Content ──────────────────────────────────────────────────────────
import SurahPage from '@/pages/SurahPage';
import SolatJenazah from '@/pages/SolatJenazah.jsx';
import JenazahEmergency from '@/pages/JenazahEmergency.jsx';
import IslamicCalendar from '@/pages/IslamicCalendar.jsx';
import DailyDua from '@/pages/DailyDua.jsx';
import AsmaulHusna from '@/pages/Asmaulhusna.jsx';
import Tasbih from '@/pages/Tasbih.jsx';
import PrayerTimes from '@/pages/PrayerTimes.jsx';
import RukunIslam from '@/pages/RukunIslam.jsx';

// ─── Suggestions & Misc ───────────────────────────────────────────────────────
import SubmitSuggestion from '@/pages/SubmitSuggestion';
import JitsiRoom from '@/pages/JitsiRoom.jsx';
import OrganisationQuickRegister from '@/pages/OrganisationQuickRegister.jsx';

// ─── Settings (public pages) ──────────────────────────────────────────────────
import PrivacyPolicy from '@/pages/Settings/PrivacyPolicy';
import TermsAndConditions from '@/pages/Settings/TermsAndConditions';
import UserTransactionRecords from '@/pages/Settings/UserTransactionRecords';
import FAQ from '@/pages/Settings/FAQ';

// ─── Management ───────────────────────────────────────────────────────────────
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
import ManageDeathCharityMember from '@/pages/Management/ManageDeathCharityMember.jsx';
import ManageDeathCharityClaim from '@/pages/Management/ManageDeathCharityClaim.jsx';
import ManageDeathCharityLedger from '@/pages/Management/ManageDeathCharityLedger.jsx';
import ManageQuotations from '@/pages/Management/ManageQuotations.jsx';

// ─── Payment ──────────────────────────────────────────────────────────────────
import ManagePaymentDistribution from '@/pages/Management/ManagePaymentDistribution';
import ManagePaymentFields from '@/pages/Management/ManagePaymentFields';
import ManagePaymentPlatforms from '@/pages/Management/ManagePaymentPlatforms';
import FinancialReports from '@/pages/Payment/FinancialReports.jsx';
import ToyyibPayConfigPage from '@/pages/Payment/ToyyibPayConfigPage.jsx';
import BillplzConfigPage from '@/pages/Payment/BillplzConfigPage.jsx';
import PaymentComparison from '@/pages/Payment/PaymentComparison.jsx';

// ─── Superadmin / System ──────────────────────────────────────────────────────
import GanttChartScheduling from '@/pages/GanttChartScheduling';
import ViewLogs from '@/pages/ViewLogs';
import IconLibrary from '@/pages/Settings/IconLibrary';
import Ollama from '@/pages/Settings/Ollama.jsx';


export const PAGES = {
    // ── Dashboards ──────────────────────────────────────────────────────────
    "UserDashboard": UserDashboard,
    "AdminDashboard": AdminDashboard,
    "TahfizDashboard": TahfizDashboard,
    "SuperadminDashboard": SuperadminDashboard,
    "StatisticDashboard": StatisticDashboard,

    // ── Auth ────────────────────────────────────────────────────────────────
    "AppUserLogin": AppUserLogin,
    "ImpersonateUser": ImpersonateUser,

    // ── Public / User-facing ────────────────────────────────────────────────
    "ScanQR": ScanQR,
    "SearchGrave": SearchGrave,
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

    // ── Donations & Payments ────────────────────────────────────────────────
    "DonationPage": DonationPage,
    "DeathCharityUserPayment": DeathCharityUserPayment,
    "CheckServiceStatus": CheckServiceStatus,

    // ── Tahlil & Requests ───────────────────────────────────────────────────
    "TahlilRequestPage": TahlilRequestPage,
    "SearchTahlil": SearchTahlil,
    "CheckTahlilStatus": CheckTahlilStatus,

    // ── Islamic Content ─────────────────────────────────────────────────────
    "SurahPage": SurahPage,
    "SolatJenazah": SolatJenazah,
    "JenazahEmergency": JenazahEmergency,
    "IslamicCalendar": IslamicCalendar,
    "DailyDua": DailyDua,
    "Asmaulhusna": AsmaulHusna,
    "Tasbih": Tasbih,
    "PrayerTimes": PrayerTimes,
    "RukunIslam": RukunIslam,

    // ── Suggestions & Misc ──────────────────────────────────────────────────
    "SubmitSuggestion": SubmitSuggestion,
    "JitsiRoom": JitsiRoom,
    "OrganisationQuickRegister": OrganisationQuickRegister,
    
    // ── Settings (public pages) ─────────────────────────────────────────────
    "PrivacyPolicy": PrivacyPolicy,
    "TermsAndConditions": TermsAndConditions,
    "UserTransactionRecords": UserTransactionRecords,
    "FAQ": FAQ,
    
    // ── Management ──────────────────────────────────────────────────────────
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
    "ManageDeathCharityMember": ManageDeathCharityMember,
    "ManageDeathCharityClaim": ManageDeathCharityClaim,
    "ManageDeathCharityLedger": ManageDeathCharityLedger,
    "ManageQuotations": ManageQuotations,

    // ── Payment ─────────────────────────────────────────────────────────────
    "ManagePaymentDistribution": ManagePaymentDistribution,
    "ManagePaymentFields": ManagePaymentFields,
    "ManagePaymentPlatforms": ManagePaymentPlatforms,
    "FinancialReports": FinancialReports,
    
    // ── Superadmin / System ─────────────────────────────────────────────────
    "PaymentComparison": PaymentComparison,
    "ToyyibPayConfigPage": ToyyibPayConfigPage,
    "BillplzConfigPage": BillplzConfigPage,
    "GanttChartScheduling": GanttChartScheduling,
    "ViewLogs": ViewLogs,
    "IconLibrary": IconLibrary,
    "Ollama": Ollama,

}

export const pagesConfig = {
    mainPage: "UserDashboard",
    Pages: PAGES,
    Layout: __Layout,
};
