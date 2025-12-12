import CreateProject from './pages/CreateProject';
import MyProjects from './pages/MyProjects';
import Notifications from './pages/Notifications';
import ProjectDetail from './pages/ProjectDetail';
import EditProject from './pages/EditProject';
import UserProfile from './pages/UserProfile';
import EditProfile from './pages/EditProfile';
import Feed from './pages/Feed';
import Discover from './pages/Discover';
import Advertise from './pages/Advertise';
import CreateAd from './pages/CreateAd';
import AdminVerificationPanel from './pages/AdminVerificationPanel';
import Onboarding from './pages/Onboarding';
import UserProjects from './pages/UserProjects';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import JoinProjects from './pages/JoinProjects';
import Welcome from './pages/Welcome';
import Contact from './pages/Contact';
import SupportCU from './pages/SupportCU';
import ReportBug from './pages/ReportBug';
import FeatureRequest from './pages/FeatureRequest';
import Testimonials from './pages/Testimonials';
import AboutUs from './pages/AboutUs';
import Chat from './pages/Chat';
import Search from './pages/Search';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CreateProject": CreateProject,
    "MyProjects": MyProjects,
    "Notifications": Notifications,
    "ProjectDetail": ProjectDetail,
    "EditProject": EditProject,
    "UserProfile": UserProfile,
    "EditProfile": EditProfile,
    "Feed": Feed,
    "Discover": Discover,
    "Advertise": Advertise,
    "CreateAd": CreateAd,
    "AdminVerificationPanel": AdminVerificationPanel,
    "Onboarding": Onboarding,
    "UserProjects": UserProjects,
    "TermsOfService": TermsOfService,
    "PrivacyPolicy": PrivacyPolicy,
    "JoinProjects": JoinProjects,
    "Welcome": Welcome,
    "Contact": Contact,
    "SupportCU": SupportCU,
    "ReportBug": ReportBug,
    "FeatureRequest": FeatureRequest,
    "Testimonials": Testimonials,
    "AboutUs": AboutUs,
    "Chat": Chat,
    "Search": Search,
}

export const pagesConfig = {
    mainPage: "Feed",
    Pages: PAGES,
    Layout: __Layout,
};