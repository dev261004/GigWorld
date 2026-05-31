import { useEffect, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "../BrandLogo/BrandLogo";

const getProfileInitial = (token) => {
  try {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    const decodedUser = token ? jwtDecode(token) : {};
    const displayName =
      savedUser?.name ||
      savedUser?.fullName ||
      savedUser?.username ||
      decodedUser?.name ||
      decodedUser?.fullName ||
      decodedUser?.username ||
      decodedUser?.email ||
      "U";

    return String(displayName).trim().charAt(0).toUpperCase() || "U";
  } catch {
    return "U";
  }
};

const getProfileName = (token) => {
  try {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    const decodedUser = token ? jwtDecode(token) : {};
    return (
      savedUser?.name ||
      savedUser?.fullName ||
      savedUser?.username ||
      decodedUser?.name ||
      decodedUser?.fullName ||
      decodedUser?.username ||
      "GigWorld member"
    );
  } catch {
    return "GigWorld member";
  }
};

const profileMenuItems = [
  { label: "Profile", to: "/profile", icon: "bx-user" },
  { label: "Portfolio", to: "/portfolio", icon: "bx-briefcase-alt-2" },
  { label: "Account details", to: "/update-account", icon: "bx-user-pin" },
  { label: "Settings", to: "/settings", icon: "bx-cog" },
  { label: "Application tracker", to: "/job-application-status", icon: "bx-list-check" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGigsMenuOpen, setIsGigsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profileInitial, setProfileInitial] = useState("U");
  const [profileName, setProfileName] = useState("GigWorld member");
  const gigsMenuCloseTimerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsAuthenticated(true);
      setProfileInitial(getProfileInitial(token));
      setProfileName(getProfileName(token));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (gigsMenuCloseTimerRef.current) {
        window.clearTimeout(gigsMenuCloseTimerRef.current);
      }
    };
  }, []);

  const clearGigsMenuCloseTimer = () => {
    if (gigsMenuCloseTimerRef.current) {
      window.clearTimeout(gigsMenuCloseTimerRef.current);
      gigsMenuCloseTimerRef.current = null;
    }
  };

  const openGigsMenu = () => {
    clearGigsMenuCloseTimer();
    setIsGigsMenuOpen(true);
  };

  const closeGigsMenu = () => {
    clearGigsMenuCloseTimer();
    setIsGigsMenuOpen(false);
  };

  const scheduleGigsMenuClose = () => {
    clearGigsMenuCloseTimer();
    gigsMenuCloseTimerRef.current = window.setTimeout(() => {
      setIsGigsMenuOpen(false);
      gigsMenuCloseTimerRef.current = null;
    }, 180);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setProfileInitial("U");
    setProfileName("GigWorld member");
    setIsProfileMenuOpen(false);
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
        <nav aria-label="Header Navigation" className="peer-checked:max-h-[38rem] peer-checked:pt-6 flex max-h-0 w-full flex-col items-center overflow-hidden transition-all duration-300 lg:ml-16 lg:max-h-full lg:flex-row lg:overflow-visible lg:pt-0">
          <ul className="flex w-full flex-col items-center gap-2 text-sm font-semibold lg:flex-row lg:justify-center lg:gap-8">
            <li><Link className="rounded-lg px-3 py-2 text-slate-700 transition hover:bg-white hover:text-blue-700" to="/">Home</Link></li>
            <li
              className="relative w-full text-center lg:w-auto"
              onMouseEnter={openGigsMenu}
              onMouseLeave={scheduleGigsMenuClose}
            >
              <button
                type="button"
                onClick={() => {
                  clearGigsMenuCloseTimer();
                  setIsGigsMenuOpen((current) => !current);
                }}
                className={`inline-flex items-center justify-center border-b-2 px-3 py-2 text-slate-700 transition hover:border-blue-700 hover:text-blue-700 ${
                  isGigsMenuOpen ? "border-blue-700 text-blue-700" : "border-transparent"
                }`}
                aria-expanded={isGigsMenuOpen}
                aria-haspopup="true"
              >
                Gigs
              </button>
              {isGigsMenuOpen && (
                <div
                  className="mt-2 w-full lg:absolute lg:left-1/2 lg:top-full lg:mt-0 lg:w-56 lg:-translate-x-1/2 lg:pt-3"
                  onMouseEnter={openGigsMenu}
                  onMouseLeave={scheduleGigsMenuClose}
                >
                  <div className="grid gap-1 rounded-lg border border-blue-100 bg-white p-2 text-left shadow-xl shadow-blue-950/10">
                    <Link
                      className="rounded-md px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                      to="/work"
                      onClick={closeGigsMenu}
                    >
                      Browse gigs
                    </Link>
                    <Link
                      className="rounded-md px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                      to="/job-application-status"
                      onClick={closeGigsMenu}
                    >
                      Application tracker
                    </Link>
                  </div>
                </div>
              )}
            </li>
            <li><Link className="rounded-lg px-3 py-2 text-slate-700 transition hover:bg-white hover:text-blue-700" to="/about">About</Link></li>
            <li><Link className="rounded-lg px-3 py-2 text-slate-700 transition hover:bg-white hover:text-blue-700" to="/contact">Contact</Link></li>
          </ul>
          <div className="my-4 flex items-center gap-4 lg:my-0 lg:ml-auto">
            {isAuthenticated ? (
              <div
                className="relative w-full text-center lg:w-auto"
                onMouseEnter={() => setIsProfileMenuOpen(true)}
                onMouseLeave={() => setIsProfileMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((current) => !current)}
                  className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-emerald-600 text-sm font-black uppercase text-white shadow-lg shadow-blue-700/20 transition-all duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 lg:mx-0"
                  aria-label="Open profile menu"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="true"
                >
                  {profileInitial}
                </button>

                {isProfileMenuOpen && (
                  <div className="mt-3 grid w-64 gap-1 rounded-lg border border-blue-100 bg-white p-2 text-left shadow-xl shadow-blue-950/10 lg:absolute lg:right-0 lg:top-full">
                    <div className="border-b border-blue-100 px-3 py-3">
                      <p className="text-xs font-black uppercase text-blue-700">Account menu</p>
                      <p className="mt-1 break-words text-sm font-black text-slate-950">{profileName}</p>
                    </div>

                    {profileMenuItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="inline-flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <i className={`bx ${item.icon} text-base`} aria-hidden="true" />
                        {item.label}
                      </Link>
                    ))}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-1 inline-flex items-center gap-3 rounded-md border-t border-red-100 px-3 py-2.5 text-left text-sm font-black text-red-700 transition hover:bg-red-50"
                    >
                      <i className="bx bx-log-out text-base" aria-hidden="true" />
                      Logout
                    </button>
                  </div>
                )}
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
