import Dashboard from './pages/Dashboard';
import SearchGrave from './pages/SearchGrave';
import GraveDetails from './pages/GraveDetails';
import DeadPersonDetails from './pages/DeadPersonDetails';
import MapKubur from './pages/MapKubur';
import MapTahfiz from './pages/MapTahfiz';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "SearchGrave": SearchGrave,
    "GraveDetails": GraveDetails,
    "DeadPersonDetails": DeadPersonDetails,
    "MapKubur": MapKubur,
    "MapTahfiz": MapTahfiz,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};