import Dashboard from './pages/Dashboard';
import SearchGrave from './pages/SearchGrave';
import GraveDetails from './pages/GraveDetails';
import DeadPersonDetails from './pages/DeadPersonDetails';
import MapTahfiz from './pages/MapTahfiz';
import ScanQR from './pages/ScanQR';
import DonationPage from './pages/DonationPage';
import TahlilRequestPage from './pages/TahlilRequestPage';
import SurahPage from './pages/SurahPage';
import SubmitSuggestion from './pages/SubmitSuggestion';
import AdminDashboard from './pages/AdminDashboard';
import ManageGraves from './pages/ManageGraves';
import ManageDeadPersons from './pages/ManageDeadPersons';
import ManageOrganisations from './pages/ManageOrganisations';
import ManageTahfizCenters from './pages/ManageTahfizCenters';
import ManageSuggestions from './pages/ManageSuggestions';
import ManageDonations from './pages/ManageDonations';
import SuperadminDashboard from './pages/SuperadminDashboard';
import ManageTahlilRequests from './pages/ManageTahlilRequests';
import AboutSystem from './pages/AboutSystem';
import MoreMenu from './pages/MoreMenu';
import ManageUsers from './pages/ManageUsers';
import ManagePermissions from './pages/ManagePermissions';
import Documentation from './pages/Documentation';
import ManageEmployees from './pages/ManageEmployees';
import AppUserLogin from './pages/AppUserLogin';
import ViewLogs from './pages/ViewLogs';
import UserDashboard from './pages/UserDashboard';
import SettingsPage from './pages/SettingsPage';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "SearchGrave": SearchGrave,
    "GraveDetails": GraveDetails,
    "DeadPersonDetails": DeadPersonDetails,
    "MapTahfiz": MapTahfiz,
    "ScanQR": ScanQR,
    "DonationPage": DonationPage,
    "TahlilRequestPage": TahlilRequestPage,
    "SurahPage": SurahPage,
    "SubmitSuggestion": SubmitSuggestion,
    "AdminDashboard": AdminDashboard,
    "ManageGraves": ManageGraves,
    "ManageDeadPersons": ManageDeadPersons,
    "ManageOrganisations": ManageOrganisations,
    "ManageTahfizCenters": ManageTahfizCenters,
    "ManageSuggestions": ManageSuggestions,
    "ManageDonations": ManageDonations,
    "SuperadminDashboard": SuperadminDashboard,
    "ManageTahlilRequests": ManageTahlilRequests,
    "AboutSystem": AboutSystem,
    "MoreMenu": MoreMenu,
    "ManageUsers": ManageUsers,
    "ManagePermissions": ManagePermissions,
    "Documentation": Documentation,
    "ManageEmployees": ManageEmployees,
    "AppUserLogin": AppUserLogin,
    "ViewLogs": ViewLogs,
    "UserDashboard": UserDashboard,
    "SettingsPage": SettingsPage,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};