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
import Welcome from './pages/Welcome';
import Playground from './pages/Playground';
import Templates from './pages/Templates';
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
    "Welcome": Welcome,
    "Playground": Playground,
    "Templates": Templates,
}

export const pagesConfig = {
    mainPage: "Feed",
    Pages: PAGES,
    Layout: __Layout,
};