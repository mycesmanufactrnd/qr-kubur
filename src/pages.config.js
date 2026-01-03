import AboutSystem from './pages/AboutSystem';
import AdminDashboard from './pages/AdminDashboard';
import AppUserLogin from './pages/AppUserLogin';
import CheckTahlilStatus from './pages/CheckTahlilStatus';
import DeadPersonDetails from './pages/DeadPersonDetails';
import DonationPage from './pages/DonationPage';
import GraveDetails from './pages/GraveDetails';
import Home from './pages/Home';
import IconLibrary from './pages/IconLibrary';
import ManageDeadPersons from './pages/ManageDeadPersons';
import ManageDonations from './pages/ManageDonations';
import ManageGraves from './pages/ManageGraves';
import ManageOrganisationTypes from './pages/ManageOrganisationTypes';
import ManageOrganisations from './pages/ManageOrganisations';
import ManagePaymentFields from './pages/ManagePaymentFields';
import ManagePaymentPlatforms from './pages/ManagePaymentPlatforms';
import ManagePermissions from './pages/ManagePermissions';
import ManageSuggestions from './pages/ManageSuggestions';
import ManageTahfizCenters from './pages/ManageTahfizCenters';
import ManageTahlilRequests from './pages/ManageTahlilRequests';
import ImpersonateUser from './pages/ImpersonateUser';
import ManageUsers from './pages/ManageUsers';
import NotificationPage from './pages/NotificationPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ScanQR from './pages/ScanQR';
import SearchGrave from './pages/SearchGrave';
import SearchTahfiz from './pages/SearchTahfiz';
import SettingsPage from './pages/SettingsPage';
import SubmitSuggestion from './pages/SubmitSuggestion';
import SuperadminDashboard from './pages/SuperadminDashboard';
import SurahPage from './pages/SurahPage';
import TahlilRequestPage from './pages/TahlilRequestPage';
import TermsAndConditions from './pages/TermsAndConditions';
import UserDashboard from './pages/UserDashboard';
import ViewLogs from './pages/ViewLogs';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AboutSystem": AboutSystem,
    "AdminDashboard": AdminDashboard,
    "AppUserLogin": AppUserLogin,
    "CheckTahlilStatus": CheckTahlilStatus,
    "DeadPersonDetails": DeadPersonDetails,
    "DonationPage": DonationPage,
    "GraveDetails": GraveDetails,
    "Home": Home,
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
    "ImpersonateUser": ImpersonateUser,
    "ManageUsers": ManageUsers,
    "NotificationPage": NotificationPage,
    "PrivacyPolicy": PrivacyPolicy,
    "ScanQR": ScanQR,
    "SearchGrave": SearchGrave,
    "SearchTahfiz": SearchTahfiz,
    "SettingsPage": SettingsPage,
    "SubmitSuggestion": SubmitSuggestion,
    "SuperadminDashboard": SuperadminDashboard,
    "SurahPage": SurahPage,
    "TahlilRequestPage": TahlilRequestPage,
    "TermsAndConditions": TermsAndConditions,
    "UserDashboard": UserDashboard,
    "ViewLogs": ViewLogs,
}

export const pagesConfig = {
    mainPage: "UserDashboard",
    Pages: PAGES,
    Layout: __Layout,
};