import Homepage from "./pages/Homepage/Homepage"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import SigninPage from "./pages/SigninPage/SigninPage"
import DashboardPage from "./pages/DashboardPage/DashboardPage"
import PricingPage from "./pages/PricingPage/PricingPage"
import ContactPage from "./pages/ContactPage/ContactPage"
import AboutPage from "./pages/AboutPage/AboutPage"
import WorkSearchPage from "./pages/WorkSearchPage/WorkSearchPage"
// import ProfilePage from "./pages/ProfilePage/ProfilePage"
import SignupPage from "./pages/SignupPage/SignupPage"
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage';
import GoogleAuthCallbackPage from "./pages/GoogleAuthCallbackPage/GoogleAuthCallbackPage"
import GigDetailsPage from "./pages/GigDetailsPage/GigDetailsPage"
import GigPreferencesPage from "./pages/GigPreferencesPage/GigPreferencesPage"
import UserProfilePage from "./pages/UserProfilePage/UserProfilePage"
import UpdateAccountDetailsPage from "./pages/UpdateAccountDetailPage/UpdateAccountDetailPage"
import SettingsPage from "./pages/SettingsPage/SettingsPage"
import JobApplicationStatusPage from "./pages/JobApplicationStatusPage/JobApplicationStatusPage"
import ProjectPage from "./pages/ProjectPage/ProjectPage"
import PortfolioPage from "./pages/PortfolioPage/PortfolioPage"
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage"
import CompanyForm from "./components/Company/CompanyForm"
import CompanyList from "./components/Company/CompanyList"
import { ToastProvider } from "./components/Toast/ToastProvider"

function App() {

  return (
    <div>
    <ToastProvider>
    <BrowserRouter>
    <Routes>
    <Route path="/" element={<Homepage />} />
    <Route path="/signin" element={<SigninPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/auth/google/callback" element={<GoogleAuthCallbackPage />} />
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/pricing" element={<PricingPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/work" element={<WorkSearchPage />} />
    <Route path="/gigs/:jobId" element={<GigDetailsPage />} />
    <Route path="/gig-preferences" element={<GigPreferencesPage />} />
    <Route path="/job-application-status" element={<JobApplicationStatusPage />} />
    <Route path="/profile" element={<UserProfilePage/>} />
    <Route path="/projects" element={<ProjectPage/>} />
    <Route path="/portfolio" element={<PortfolioPage/>} />
    <Route path="/update-account" element={<UpdateAccountDetailsPage/>} />
    <Route path="/settings" element={<SettingsPage/>} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
    <Route path="/companies" element={<CompanyList />} />
        <Route path="/companies/new" element={<CompanyForm isEdit={false} />} />
        <Route path="/companies/:id/edit" element={<CompanyForm isEdit={true} />} />
    <Route path="*" element={<NotFoundPage />} />




    </Routes>
    </BrowserRouter>
    </ToastProvider>
    </div>
  )
}

export default App
