import AboutSystem from './pages/AboutSystem';
import AdminDashboard from './pages/AdminDashboard';
import AppUserLogin from './pages/AppUserLogin';
import CheckTahlilStatus from './pages/CheckTahlilStatus';
import DeadPersonDetails from './pages/DeadPersonDetails';
import Documentation from './pages/Documentation';
import DonationPage from './pages/DonationPage';
import GraveDetails from './pages/GraveDetails';
import Home from './pages/Home';
import IconLibrary from './pages/IconLibrary';
import ManageDeadPersons from './pages/ManageDeadPersons';
import ManageDonations from './pages/ManageDonations';
import ManageGraves from './pages/ManageGraves';
import ManageOrganisationTypes from './pages/ManageOrganisationTypes';
import ManageOrganisations from './pages/ManageOrganisations';
import ManageSuggestions from './pages/ManageSuggestions';
import ManageTahfizCenters from './pages/ManageTahfizCenters';
import ManageTahlilRequests from './pages/ManageTahlilRequests';
import ManageUsers from './pages/ManageUsers';
import NotificationPage from './pages/NotificationPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import QiblaCompass from './pages/QiblaCompass';
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
    "Documentation": Documentation,
    "DonationPage": DonationPage,
    "GraveDetails": GraveDetails,
    "Home": Home,
    "IconLibrary": IconLibrary,
    "ManageDeadPersons": ManageDeadPersons,
    "ManageDonations": ManageDonations,
    "ManageGraves": ManageGraves,
    "ManageOrganisationTypes": ManageOrganisationTypes,
    "ManageOrganisations": ManageOrganisations,
    "ManageSuggestions": ManageSuggestions,
    "ManageTahfizCenters": ManageTahfizCenters,
    "ManageTahlilRequests": ManageTahlilRequests,
    "ManageUsers": ManageUsers,
    "NotificationPage": NotificationPage,
    "PrivacyPolicy": PrivacyPolicy,
    "QiblaCompass": QiblaCompass,
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