import Dashboard from './pages/Dashboard';
import SearchGrave from './pages/SearchGrave';
import GraveDetails from './pages/GraveDetails';
import DeadPersonDetails from './pages/DeadPersonDetails';
import MapKubur from './pages/MapKubur';
import MapTahfiz from './pages/MapTahfiz';
import ScanQR from './pages/ScanQR';
import DonationPage from './pages/DonationPage';
import TahlilRequestPage from './pages/TahlilRequestPage';
import SurahPage from './pages/SurahPage';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "SearchGrave": SearchGrave,
    "GraveDetails": GraveDetails,
    "DeadPersonDetails": DeadPersonDetails,
    "MapKubur": MapKubur,
    "MapTahfiz": MapTahfiz,
    "ScanQR": ScanQR,
    "DonationPage": DonationPage,
    "TahlilRequestPage": TahlilRequestPage,
    "SurahPage": SurahPage,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};