/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AboutUs from './pages/AboutUs';
import AdminVerificationPanel from './pages/AdminVerificationPanel';
import Advertise from './pages/Advertise';
import Chat from './pages/Chat';
import Contact from './pages/Contact';
import CreateAd from './pages/CreateAd';
import CreateProject from './pages/CreateProject';
import Discover from './pages/Discover';
import EditProfile from './pages/EditProfile';
import EditProject from './pages/EditProject';
import FeatureRequest from './pages/FeatureRequest';
import Feed from './pages/Feed';
import Leaderboard from './pages/Leaderboard';
import Marketplace from './pages/Marketplace';
import MyBookings from './pages/MyBookings';
import MyProjects from './pages/MyProjects';
import NotificationSettings from './pages/NotificationSettings';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ProjectDetail from './pages/ProjectDetail';
import ReportBug from './pages/ReportBug';
import Support from './pages/Support';
import SupportCU from './pages/SupportCU';
import TermsOfService from './pages/TermsOfService';
import Testimonials from './pages/Testimonials';
import UserProfile from './pages/UserProfile';
import Welcome from './pages/Welcome';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AboutUs": AboutUs,
    "AdminVerificationPanel": AdminVerificationPanel,
    "Advertise": Advertise,
    "Chat": Chat,
    "Contact": Contact,
    "CreateAd": CreateAd,
    "CreateProject": CreateProject,
    "Discover": Discover,
    "EditProfile": EditProfile,
    "EditProject": EditProject,
    "FeatureRequest": FeatureRequest,
    "Feed": Feed,
    "Leaderboard": Leaderboard,
    "Marketplace": Marketplace,
    "MyBookings": MyBookings,
    "MyProjects": MyProjects,
    "NotificationSettings": NotificationSettings,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "PrivacyPolicy": PrivacyPolicy,
    "ProjectDetail": ProjectDetail,
    "ReportBug": ReportBug,
    "Support": Support,
    "SupportCU": SupportCU,
    "TermsOfService": TermsOfService,
    "Testimonials": Testimonials,
    "UserProfile": UserProfile,
    "Welcome": Welcome,
}

export const pagesConfig = {
    mainPage: "Feed",
    Pages: PAGES,
    Layout: __Layout,
};