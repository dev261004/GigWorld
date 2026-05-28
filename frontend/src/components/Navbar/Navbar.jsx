import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "../BrandLogo/BrandLogo";

const Navbar = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGigsMenuOpen, setIsGigsMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/75 text-slate-700 shadow-[0_14px_34px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="relative mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <Link to="/" className="flex items-center text-2xl">
          <BrandLogo />
        </Link>
        <input type="checkbox" className="peer hidden" id="navbar-open" />
        <label className="absolute right-5 top-5 cursor-pointer rounded-lg p-1 text-slate-800 transition hover:bg-slate-100 lg:hidden" htmlFor="navbar-open">
          <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </label>
        <nav aria-label="Header Navigation" className="peer-checked:max-h-96 peer-checked:pt-6 flex max-h-0 w-full flex-col items-center overflow-hidden transition-all duration-300 lg:ml-16 lg:max-h-full lg:flex-row lg:overflow-visible lg:pt-0">
          <ul className="flex w-full flex-col items-center gap-2 text-sm font-semibold lg:flex-row lg:justify-center lg:gap-8">
            <li><Link className="rounded-lg px-3 py-2 text-slate-700 transition hover:bg-white hover:text-blue-700" to="/">Home</Link></li>
            <li
              className="relative w-full text-center lg:w-auto"
              onMouseEnter={() => setIsGigsMenuOpen(true)}
              onMouseLeave={() => setIsGigsMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsGigsMenuOpen((current) => !current)}
                className={`inline-flex items-center justify-center border-b-2 px-3 py-2 text-slate-700 transition hover:border-blue-700 hover:text-blue-700 ${
                  isGigsMenuOpen ? "border-blue-700 text-blue-700" : "border-transparent"
                }`}
                aria-expanded={isGigsMenuOpen}
                aria-haspopup="true"
              >
                Gigs
              </button>
              {isGigsMenuOpen && (
                <div className="mt-2 grid w-full gap-1 rounded-lg border border-blue-100 bg-white p-2 text-left shadow-xl shadow-blue-950/10 lg:absolute lg:left-1/2 lg:top-full lg:mt-3 lg:w-56 lg:-translate-x-1/2">
                  <Link
                    className="rounded-md px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                    to="/work"
                    onClick={() => setIsGigsMenuOpen(false)}
                  >
                    Browse gigs
                  </Link>
                  <Link
                    className="rounded-md px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                    to="/job-application-status"
                    onClick={() => setIsGigsMenuOpen(false)}
                  >
                    Application tracker
                  </Link>
                </div>
              )}
            </li>
            <li><Link className="rounded-lg px-3 py-2 text-slate-700 transition hover:bg-white hover:text-blue-700" to="/pricing">Pricing</Link></li>
            <li><Link className="rounded-lg px-3 py-2 text-slate-700 transition hover:bg-white hover:text-blue-700" to="/contact">Contact</Link></li>
          </ul>
          <div className="my-4 flex items-center gap-4 lg:my-0 lg:ml-auto">
            {isAuthenticated ? (
              <div className="flex items-center justify-center gap-4">
                <Link to="/profile" className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <img src="./image.png" alt="User Profile" className="h-10 w-10 rounded-full object-cover transition-all duration-300 ease-in-out hover:scale-105" />
                </Link>
                <button onClick={handleLogout} className="whitespace-nowrap rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800">Logout</button>
              </div>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="whitespace-nowrap rounded-lg border border-slate-200 bg-white/85 px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="whitespace-nowrap rounded-lg bg-gradient-to-r from-blue-700 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-700/25"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
