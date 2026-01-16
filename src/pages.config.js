import AdminDashboard from './pages/AdminDashboard';
import AppUserLogin from './pages/AppUserLogin';
import CheckTahlilStatus from './pages/CheckTahlilStatus';
import DeadPersonDetails from './pages/DeadPersonDetails';
import DonationPage from './pages/DonationPage';
import GraveDetails from './pages/GraveDetails';
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
import ViewLogs from './pages/ViewLogs';
import ToyyibPayConfigPage from './pages/ToyyibPayConfigPage.jsx';
import SolatJenazah from './pages/SolatJenazah.jsx';
import __Layout from './Layout.jsx';
import UserDashboard from './pages/UserDashboard';
import UserDashboard1 from './pages/Dashboards/UserDashboard1';
import UserDashboard2 from './pages/Dashboards/UserDashboard2';
import UserDashboard3 from './pages/Dashboards/UserDashboard3';
import UserDashboard4 from './pages/Dashboards/UserDashboard4';
import UserDashboard5 from './pages/Dashboards/UserDashboard5';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
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
    "ViewLogs": ViewLogs,
    "ToyyibPayConfigPage": ToyyibPayConfigPage,
    "SolatJenazah": SolatJenazah,

    "UserDashboard": UserDashboard,
    "UserDashboard1": UserDashboard1,
    "UserDashboard2": UserDashboard2,
    "UserDashboard3": UserDashboard3,
    "UserDashboard4": UserDashboard4,
    "UserDashboard5": UserDashboard5,
}

export const pagesConfig = {
    mainPage: "UserDashboard2",
    Pages: PAGES,
    Layout: __Layout,
};