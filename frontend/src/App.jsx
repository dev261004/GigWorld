import Homepage from "./pages/Homepage/Homepage"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import SigninPage from "./pages/SigninPage/SigninPage"
import DashboardPage from "./pages/DashboardPage/DashboardPage"
import PricingPage from "./pages/PricingPage/PricingPage"
import ContactPage from "./pages/ContactPage/ContactPage"
import WorkSearchPage from "./pages/WorkSearchPage/WorkSearchPage"
// import ProfilePage from "./pages/ProfilePage/ProfilePage"
import SignupPage from "./pages/SignupPage/SignupPage"
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage';
import ApplyJobPage from './pages/ApplyJobPage/ApplyJobPage'
import UserProfilePage from "./pages/UserProfilePage/UserProfilePage"
import UpdateAccountDetailsPage from "./pages/UpdateAccountDetailPage/UpdateAccountDetailPage"
import JobApplicationStatusPage from "./pages/JobApplicationStatusPage/JobApplicationStatusPage"

function App() {

  return (
    <div>
    <BrowserRouter>
    <Routes>
    <Route path="/" element={<Homepage />} />
    <Route path="/signin" element={<SigninPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/pricing" element={<PricingPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/work" element={<WorkSearchPage />} />
    <Route path="/apply-job/:jobId" element={<ApplyJobPage />} />
    <Route path="/job-application-status" element={<JobApplicationStatusPage />} />
    <Route path="/profile" element={<UserProfilePage/>} />
    <Route path="/update-account" element={<UpdateAccountDetailsPage/>} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />



    </Routes>
    </BrowserRouter>
    </div>
  )
}

export default App
