import AppUserLogin from '@/pages/AppUserLogin';
import CheckTahlilStatus from '@/pages/CheckTahlilStatus';
import DeadPersonDetails from '@/pages/DeadPersonDetails';
import DonationPage from '@/pages/DonationPage';
import GraveDetails from '@/pages/GraveDetails';
import ManageUsers from '@/pages/Management/ManageUsers';
import NotificationPage from '@/pages/NotificationPage';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import ScanQR from '@/pages/ScanQR';
import SearchGrave from '@/pages/SearchGrave';
import SearchHeritage from '@/pages/SearchHeritage';
import HeritageDetails from '@/pages/HeritageDetails';
import SearchTahfiz from '@/pages/SearchTahfiz';
import TahfizDetails from '@/pages/TahfizDetails';
import SettingsPage from '@/pages/SettingsPage';
import SubmitSuggestion from '@/pages/SubmitSuggestion';
import SurahPage from '@/pages/SurahPage';
import TahlilRequestPage from '@/pages/TahlilRequestPage';
import TermsAndConditions from '@/pages/TermsAndConditions';
import SolatJenazah from '@/pages/SolatJenazah.jsx';
import MosquePage from '@/pages/MosquePage.jsx';
// Superadmin
import ViewLogs from '@/pages/ViewLogs';
import ImpersonateUser from '@/pages/ImpersonateUser';
import IconLibrary from '@/pages/IconLibrary';
// Management
import ManageDeadPersons from '@/pages/Management/ManageDeadPersons';
import ManageDonations from '@/pages/Management/ManageDonations';
import ManageGraves from '@/pages/Management/ManageGraves';
import ManageOrganisationTypes from '@/pages/Management/ManageOrganisationTypes';
import ManageOrganisations from '@/pages/Management/ManageOrganisations.jsx';
import ManagePaymentFields from '@/pages/Management/ManagePaymentFields';
import ManagePaymentPlatforms from '@/pages/Management/ManagePaymentPlatforms';
import ManagePermissions from '@/pages/Management/ManagePermissions.jsx';
import ManageSuggestions from '@/pages/Management/ManageSuggestions';
import ManageTahfizCenters from '@/pages/Management/ManageTahfizCenters';
import ManageTahlilRequests from '@/pages/Management/ManageTahlilRequests';
import ManageHeritageSites from '@/pages/Management/ManageHeritageSites';
// Payment
import ToyyibPayConfigPage from '@/pages/Payment/ToyyibPayConfigPage.jsx';
import BillplzConfigPage from '@/pages/Payment/BillplzConfigPage.jsx';
// Dashboard
import __Layout from '@/Layout.jsx';
import AdminDashboard from '@/pages/Dashboards/AdminDashboard';
import TahfizDashboard from '@/pages/Dashboards/TahfizDashboard';
import SuperadminDashboard from '@/pages/Dashboards/SuperadminDashboard';
import UserDashboard from '@/pages/Dashboards/UserDashboard.jsx';


export const PAGES = {
    "AppUserLogin": AppUserLogin,
    "CheckTahlilStatus": CheckTahlilStatus,
    "DeadPersonDetails": DeadPersonDetails,
    "DonationPage": DonationPage,
    "GraveDetails": GraveDetails,
    "IconLibrary": IconLibrary,
    "ManageDeadPersons": ManageDeadPersons,
    "ManageDonations": ManageDonations,
    "ManageGraves": ManageGraves,
    "ManageOrganisationTypes": ManageOrganisationTypes,
    "ManageOrganisations": ManageOrganisations,
    "ManagePaymentFields": ManagePaymentFields,
    "ManagePaymentPlatforms": ManagePaymentPlatforms,
    "ManagePermissions": ManagePermissions,
    "ManageSuggestions": ManageSuggestions,
    "ManageTahfizCenters": ManageTahfizCenters,
    "ManageTahlilRequests": ManageTahlilRequests,
    "ManageHeritageSites": ManageHeritageSites,
    "ImpersonateUser": ImpersonateUser,
    "ManageUsers": ManageUsers,
    "NotificationPage": NotificationPage,
    "PrivacyPolicy": PrivacyPolicy,
    "ScanQR": ScanQR,
    "SearchGrave": SearchGrave,
    "SearchHeritage": SearchHeritage,
    "HeritageDetails": HeritageDetails,
    "SearchTahfiz": SearchTahfiz,
    "TahfizDetails": TahfizDetails,
    "SettingsPage": SettingsPage,
    "SubmitSuggestion": SubmitSuggestion,
    "SurahPage": SurahPage,
    "TahlilRequestPage": TahlilRequestPage,
    "TermsAndConditions": TermsAndConditions,
    "ViewLogs": ViewLogs,
    "ToyyibPayConfigPage": ToyyibPayConfigPage,
    "BillplzConfigPage": BillplzConfigPage,
    "SolatJenazah": SolatJenazah,
    "MosquePage": MosquePage,
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