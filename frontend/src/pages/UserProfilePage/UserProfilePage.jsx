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
    description: "Edit your name, phone, location, and Google-created username.",
    to: "/update-account",
    icon: "bx-user-pin",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    title: "Settings",
    description: "Manage password access, sign-in method, and your current session.",
    to: "/settings",
    icon: "bx-cog",
    accent: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    title: "Portfolio",
    description: "Keep your public work samples and profile story ready for clients.",
    to: "/portfolio",
    icon: "bx-briefcase-alt-2",
    accent: "bg-sky-50 text-sky-700 border-sky-200",
  },
];

const formatPreferenceList = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "Not set";
  }

  return items.join(", ");
};

const getPreferenceCompletion = (preferences = {}) => {
  const fields = [
    preferences.currentStatus,
    preferences.categories?.length,
    preferences.skills?.length,
    preferences.experienceLevel,
    preferences.workTypes?.length,
    preferences.preferredBudget,
  ];

  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
};

const ProfilePageShimmer = () => (
  <div className="min-h-screen bg-[#f7fafc] text-slate-950">
    <Navbar />

    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-blue-400 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-4 text-white shadow-xl shadow-blue-950/20 sm:p-5 lg:p-6">
        <div className="shimmer-block-dark h-5 w-40 rounded-md" />
        <div className="mt-4 grid gap-8 sm:mt-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="shimmer-block-dark h-24 w-24 shrink-0 rounded-2xl" />
            <div className="w-full">
              <div className="shimmer-block-dark h-4 w-40 rounded-md" />
              <div className="shimmer-block-dark mt-5 h-12 w-11/12 max-w-3xl rounded-md" />
              <div className="shimmer-block-dark mt-3 h-12 w-3/5 max-w-xl rounded-md" />
              <div className="shimmer-block-dark mt-5 h-4 w-full max-w-2xl rounded-md" />
              <div className="shimmer-block-dark mt-3 h-4 w-2/3 max-w-xl rounded-md" />
            </div>
          </div>

          <div className="border-t border-sky-300/40 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div className="shimmer-block-dark h-4 w-36 rounded-md" />
            <div className="mt-5 grid gap-4">
              {[1, 2, 3].map((item) => (
                <div key={item}>
                  <div className="shimmer-block-dark h-4 w-24 rounded-md" />
                  <div className="shimmer-block-dark mt-2 h-5 w-48 max-w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-lg border border-blue-300 bg-white p-5 shadow-sm shadow-blue-950/5">
              <div className="shimmer-block h-11 w-11 rounded-lg" />
              <div className="shimmer-block mt-5 h-6 w-48 max-w-full rounded-md" />
              <div className="shimmer-block mt-4 h-4 w-full rounded-md" />
              <div className="shimmer-block mt-3 h-4 w-4/5 rounded-md" />
              <div className="shimmer-block mt-5 h-4 w-28 rounded-md" />
            </div>
          ))}
        </div>
      </section>

      <section className="pb-10">
        <div className="grid gap-6">
          <div className="rounded-lg border border-blue-300 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full max-w-2xl">
                <div className="shimmer-block h-4 w-32 rounded-md" />
                <div className="shimmer-block mt-3 h-8 w-80 max-w-full rounded-md" />
                <div className="shimmer-block mt-4 h-4 w-full rounded-md" />
              </div>
              <div className="shimmer-block h-16 w-24 rounded-lg" />
            </div>
          </div>

          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="rounded-lg border border-blue-300 bg-white p-5">
              <div className="shimmer-block h-4 w-44 rounded-md" />
              <div className="mt-4 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((chip) => (
                  <div key={chip} className="shimmer-block h-10 w-28 rounded-full" />
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <div className="shimmer-block h-12 w-52 rounded-lg" />
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);

const UserProfilePage = () => {
  const [profileUser, setProfileUser] = useState(() => getStoredUser());
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState("");
  const profile = getProfileFromUser(profileUser);
  const preferences = profile.gigPreferences || {};
  const preferenceCompletion = getPreferenceCompletion(preferences);
  const preferenceSummary = [
    { label: "Current status", value: preferences.currentStatus || "Not set" },
    { label: "Categories", value: formatPreferenceList(preferences.categories) },
    { label: "Skills", value: formatPreferenceList(preferences.skills) },
    { label: "Experience", value: preferences.experienceLevel || "Not set" },
    { label: "Work type", value: formatPreferenceList(preferences.workTypes) },
    { label: "Budget", value: preferences.preferredBudget || "Not set" },
  ];

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("authToken");

        if (!token) {
          setIsLoadingProfile(false);
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
      } finally {
        setIsLoadingProfile(false);
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
      setIsEditingPreferences(false);
    } catch (error) {
      console.error("Error saving gig preferences:", error);
      setPreferenceMessage(error.response?.data?.message || "Could not save gig preferences.");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  if (isLoadingProfile) {
    return <ProfilePageShimmer />;
  }

  return (
    <div className="min-h-screen bg-[#f7fafc] text-slate-950">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-blue-400 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-4 text-white shadow-xl shadow-blue-950/20 sm:p-5 lg:p-6">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-black text-sky-200 transition hover:text-white"
            >
              <span aria-hidden="true">&lt;-</span>
              Back to homepage
            </Link>
          </div>
          <div className="mt-4 grid gap-8 sm:mt-5 lg:grid-cols-[minmax(0,1fr)_340px]">
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

        <section className="py-10">
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

        <section className="pb-10">
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
          {isEditingPreferences ? (
            <div>
              <GigPreferencesForm
                initialPreferences={profile.gigPreferences}
                isSaving={isSavingPreferences}
                onCancel={() => {
                  setPreferenceMessage("");
                  setIsEditingPreferences(false);
                }}
                onSave={handleSavePreferences}
                submitLabel="Save profile preferences"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-blue-300 bg-white p-5 shadow-sm shadow-blue-950/5 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-blue-700">Gig preferences</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Your matching profile</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    A quick summary of the work style, skills, and gig types GigWorld uses to personalize your feed.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
                  <div className="inline-flex h-12 min-w-[150px] items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 text-sm font-black text-emerald-700">
                    <span>{preferenceCompletion}%</span>
                    <span>Complete</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPreferenceMessage("");
                      setIsEditingPreferences(true);
                    }}
                    className="inline-flex h-12 min-w-[150px] items-center justify-center rounded-full border border-blue-300 bg-blue-700 px-5 text-sm font-black text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800"
                  >
                    Edit preferences
                  </button>
                </div>
              </div>

              <div className="mt-6 grid border-t border-blue-200 md:grid-cols-2 xl:grid-cols-3">
                {preferenceSummary.map((item) => (
                  <div key={item.label} className="border-b border-blue-200 py-4 md:px-4 md:first:pl-0 xl:[&:nth-child(3n+1)]:pl-0">
                    <p className="text-xs font-black uppercase text-blue-700">{item.label}</p>
                    <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default UserProfilePage;
