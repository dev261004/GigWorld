import Homepage from "./pages/Homepage/Homepage"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import SigninPage from "./pages/SigninPage/SigninPage"
import SignupForm from "./components/Signup/SignupForm"
import DashboardPage from "./pages/DashboardPage/DashboardPage"


function App() {

  return (
    <div>
    <BrowserRouter>
    <Routes>
    <Route path="/" element={<Homepage />} />
    <Route path="/signin" element={<SigninPage />} />
    <Route path="/signup" element={<SignupForm />} />
    <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
    </BrowserRouter>
    </div>
  )
}

export default App
