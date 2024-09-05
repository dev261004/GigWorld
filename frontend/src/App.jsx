import Homepage from "./pages/Homepage/Homepage"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import SigninPage from "./pages/SigninPage/SigninPage"
import SignupForm from "./components/Signup/SignupForm"
import DashboardPage from "./pages/DashboardPage/DashboardPage"
import PricingPage from "./pages/PricingPage/PricingPage"
import ContactPage from "./pages/ContactPage/ContactPage"
import WorkSearchPage from "./pages/WorkSearchPage/WorkSearchPage"
import ProfilePage from "./pages/ProfilePage/ProfilePage"


function App() {

  return (
    <div>
    <BrowserRouter>
    <Routes>
    <Route path="/" element={<Homepage />} />
    <Route path="/signin" element={<SigninPage />} />
    <Route path="/signup" element={<SignupForm />} />
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/pricing" element={<PricingPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/work" element={<WorkSearchPage />} />
    <Route path="/profile" element={<ProfilePage />} />
    </Routes>
    </BrowserRouter>
    </div>
  )
}

export default App
