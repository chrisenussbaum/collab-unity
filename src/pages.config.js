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
import ProjectTemplates from './pages/ProjectTemplates';
import SubmitProjectTemplate from './pages/SubmitProjectTemplate';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import JoinProjects from './pages/JoinProjects';
import Sync from './pages/Sync';
import Welcome from './pages/Welcome';
import About from './pages/About';
import Contact from './pages/Contact';
import SupportCU from './pages/SupportCU';
import ReportBug from './pages/ReportBug';
import FeatureRequest from './pages/FeatureRequest';
import Testimonials from './pages/Testimonials';
import Events from './pages/Events';
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
    "ProjectTemplates": ProjectTemplates,
    "SubmitProjectTemplate": SubmitProjectTemplate,
    "TermsOfService": TermsOfService,
    "PrivacyPolicy": PrivacyPolicy,
    "JoinProjects": JoinProjects,
    "Sync": Sync,
    "Welcome": Welcome,
    "About": About,
    "Contact": Contact,
    "SupportCU": SupportCU,
    "ReportBug": ReportBug,
    "FeatureRequest": FeatureRequest,
    "Testimonials": Testimonials,
    "Events": Events,
}

export const pagesConfig = {
    mainPage: "Feed",
    Pages: PAGES,
    Layout: __Layout,
};