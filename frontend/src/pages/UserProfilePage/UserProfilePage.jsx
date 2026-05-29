import { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Link } from "react-router-dom";
import Footer from "../../components/Footer/Footer";
import GigPreferencesForm from "../../components/GigPreferences/GigPreferencesForm";
import Navbar from "../../components/Navbar/Navbar";

const getProfileFromUser = (user = {}) => {
  const displayName = user.name || user.fullName || user.username || "GigWorld member";
  const email = user.email || "Email not available";
  const username = user.username || user.userName || "Username not set";

  return {
    displayName,
    email,
    username,
    role: user.role || "Freelancer",
    initial: String(displayName).trim().charAt(0).toUpperCase() || "U",
    gigPreferences: user.gigPreferences || {},
  };
};

const getStoredUser = () => {
  try {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null") || {};
    const token = localStorage.getItem("authToken");
    const decodedUser = token ? jwtDecode(token) : {};
    return { ...decodedUser, ...savedUser };
  } catch {
    return {};
  }
};

const profileActions = [
  {
    title: "Application tracker",
    description: "Review saved gigs, applied opportunities, notes, and follow-up status.",
    to: "/job-application-status",
    icon: "bx-list-check",
    accent: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    title: "Update account details",
    description: "Edit your name, email, and core account information whenever it changes.",
    to: "/update-account",
    icon: "bx-user-pin",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    title: "Portfolio",
    description: "Keep your public work samples and profile story ready for clients.",
    to: "/portfolio",
    icon: "bx-briefcase-alt-2",
    accent: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    title: "Projects",
    description: "Organize project links and previous work you may want to reuse.",
    to: "/projects",
    icon: "bx-folder-open",
    accent: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
];

const accountLinks = [
  { label: "Update account details", to: "/update-account", icon: "bx-user-pin" },
  { label: "Contact support", to: "/contact", icon: "bx-message-square-detail" },
];

const UserProfilePage = () => {
  const [profileUser, setProfileUser] = useState(() => getStoredUser());
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState("");
  const profile = getProfileFromUser(profileUser);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("authToken");

        if (!token) {
          return;
        }

        const response = await axios.get("http://localhost:2610/api/v1/users/current-user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.data) {
          setProfileUser(response.data.data);
          localStorage.setItem("user", JSON.stringify(response.data.data));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleSavePreferences = async (preferences) => {
    setIsSavingPreferences(true);
    setPreferenceMessage("");

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.put("http://localhost:2610/api/v1/users/gig-preferences", preferences, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.data) {
        setProfileUser(response.data.data);
        localStorage.setItem("user", JSON.stringify(response.data.data));
      }

      setPreferenceMessage("Gig preferences saved successfully.");
    } catch (error) {
      console.error("Error saving gig preferences:", error);
      setPreferenceMessage(error.response?.data?.message || "Could not save gig preferences.");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fafc] text-slate-950">
      <Navbar />

      <main>
        <section className="border-b border-blue-300 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-black text-sky-200 transition hover:text-white"
            >
              <span aria-hidden="true">&lt;-</span>
              Back to homepage
            </Link>
          </div>
          <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-10 text-white sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8 lg:pb-14">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-sky-300/40 bg-white/10 text-5xl font-black text-white shadow-2xl shadow-blue-950/40">
                {profile.initial}
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-sky-300">Profile workspace</p>
                <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
                  Welcome, {profile.displayName}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                  Manage your account, portfolio, saved gigs, and application progress from one clean workspace.
                </p>
              </div>
            </div>

            <div className="border-t border-sky-300/40 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="text-xs font-black uppercase text-sky-300">Account snapshot</p>
              <div className="mt-5 grid gap-4 text-sm">
                <div>
                  <p className="font-black uppercase text-slate-400">Email</p>
                  <p className="mt-1 break-words font-bold text-white">{profile.email}</p>
                </div>
                <div>
                  <p className="font-black uppercase text-slate-400">Username</p>
                  <p className="mt-1 break-words font-bold text-white">{profile.username}</p>
                </div>
                <div>
                  <p className="font-black uppercase text-slate-400">Role</p>
                  <p className="mt-1 font-bold capitalize text-white">{profile.role}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {profileActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="group rounded-lg border border-blue-300 bg-white p-5 shadow-sm shadow-blue-950/5 transition hover:-translate-y-1 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-950/10"
              >
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-lg border text-xl ${action.accent}`}>
                  <i className={`bx ${action.icon}`} aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-xl font-black text-slate-950">{action.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{action.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-700 transition group-hover:gap-3">
                  Open section <span aria-hidden="true">-&gt;</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          {preferenceMessage && (
            <div
              className={`mb-5 rounded-lg border px-4 py-3 text-sm font-bold ${
                preferenceMessage.includes("success")
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {preferenceMessage}
            </div>
          )}
          <GigPreferencesForm
            initialPreferences={profile.gigPreferences}
            isSaving={isSavingPreferences}
            onSave={handleSavePreferences}
            submitLabel="Save profile preferences"
          />
        </section>

        <section className="border-y border-blue-300 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <aside className="rounded-lg border border-blue-300 bg-slate-50 p-6">
              <p className="text-sm font-black uppercase text-blue-700">Account actions</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {accountLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    <span className="inline-flex items-center gap-3">
                      <i className={`bx ${link.icon} text-lg text-blue-700`} aria-hidden="true" />
                      {link.label}
                    </span>
                    <span aria-hidden="true">-&gt;</span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default UserProfilePage;
