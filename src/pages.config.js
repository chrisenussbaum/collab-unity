import AboutUs from './pages/AboutUs';
import AdminVerificationPanel from './pages/AdminVerificationPanel';
import Chat from './pages/Chat';
import Contact from './pages/Contact';
import CreateProject from './pages/CreateProject';
import Discover from './pages/Discover';
import EditProfile from './pages/EditProfile';
import EditProject from './pages/EditProject';
import FeatureRequest from './pages/FeatureRequest';
import Feed from './pages/Feed';
import Home from './pages/Home';
import JoinProjects from './pages/JoinProjects';
import MyProjects from './pages/MyProjects';
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
import UserProjects from './pages/UserProjects';
import Welcome from './pages/Welcome';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AboutUs": AboutUs,
    "AdminVerificationPanel": AdminVerificationPanel,
    "Chat": Chat,
    "Contact": Contact,
    "CreateProject": CreateProject,
    "Discover": Discover,
    "EditProfile": EditProfile,
    "EditProject": EditProject,
    "FeatureRequest": FeatureRequest,
    "Feed": Feed,
    "Home": Home,
    "JoinProjects": JoinProjects,
    "MyProjects": MyProjects,
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
    "UserProjects": UserProjects,
    "Welcome": Welcome,
}

export const pagesConfig = {
    mainPage: "Feed",
    Pages: PAGES,
    Layout: __Layout,
};