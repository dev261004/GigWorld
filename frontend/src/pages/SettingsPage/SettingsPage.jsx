import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../../components/Footer/Footer";
import Navbar from "../../components/Navbar/Navbar";
import { EyeIcon, EyeOffIcon } from "../../components/Icons/PasswordIcons";

const emptyUser = {
  fullName: "",
  username: "",
  email: "",
  authProvider: "password",
};

const passwordRequirements = [
  { id: "length", label: "8 to 16 characters", isMet: (value) => value.length >= 8 && value.length <= 16 },
  { id: "uppercase", label: "One uppercase letter", isMet: (value) => /[A-Z]/.test(value) },
  { id: "number", label: "One number", isMet: (value) => /\d/.test(value) },
  { id: "special", label: "One special character", isMet: (value) => /[^A-Za-z0-9\s]/.test(value) },
];

const getProviderLabel = (provider) => {
  if (provider === "google") {
    return "Google sign in";
  }

  if (provider === "password_google") {
    return "Password + Google";
  }

  return "Password sign in";
};

const getMessageClass = (message) =>
  message.type === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-red-200 bg-red-50 text-red-700";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(emptyUser);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const isGoogleOnly = user.authProvider === "google";
  const passwordStatus = passwordRequirements.map((requirement) => ({
    ...requirement,
    isValid: requirement.isMet(passwordForm.newPassword),
  }));
  const passwordRulesAreMet = passwordStatus.every((requirement) => requirement.isValid);
  const passwordsMatch = passwordForm.newPassword && passwordForm.newPassword === passwordForm.confirmPassword;
  const passwordFormIsValid = Boolean(passwordForm.oldPassword && passwordRulesAreMet && passwordsMatch);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setMessage(null);

      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get("http://localhost:2610/api/v1/users/current-user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const currentUser = response.data?.data || {};

        setUser({
          fullName: currentUser.fullName || "",
          username: currentUser.username || "",
          email: currentUser.email || "",
          authProvider: currentUser.authProvider || "password",
        });
        localStorage.setItem("user", JSON.stringify(currentUser));
      } catch (error) {
        console.error("Unable to load settings:", error);
        setMessage({ type: "error", text: error.response?.data?.message || "Settings could not be loaded." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updatePasswordField = (field, value) => {
    setPasswordForm((current) => ({
      ...current,
      [field]: value.trim(),
    }));
    setMessage(null);
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!passwordFormIsValid) {
      setMessage({ type: "error", text: "Please complete the password fields and match all password rules." });
      return;
    }

    setIsSavingPassword(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        "http://localhost:2610/api/v1/users/change-password",
        {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage({ type: "success", text: response.data?.message || "Password changed successfully." });
    } catch (error) {
      console.error("Unable to change password:", error);
      setMessage({ type: "error", text: error.response?.data?.message || "Password could not be changed." });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f7fafc] text-slate-950">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-blue-400 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 text-white shadow-xl shadow-blue-950/20 sm:p-8">
          <Link to="/profile" className="inline-flex items-center gap-2 text-sm font-black text-sky-200 transition hover:text-white">
            <span aria-hidden="true">&lt;-</span>
            Back to profile
          </Link>
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-sky-300">Settings</p>
              <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Manage account access safely.</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                Review your sign-in method, update your password when available, and manage your active session.
              </p>
            </div>
            <div className="border-t border-sky-300/40 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="text-xs font-black uppercase text-sky-300">Current method</p>
              <p className="mt-4 text-2xl font-black text-white">{getProviderLabel(user.authProvider)}</p>
              <p className="mt-2 break-words text-sm font-bold text-slate-300">{user.email || "Email not loaded"}</p>
            </div>
          </div>
        </section>

        <section className="py-10">
          {message && (
            <div className={`mb-5 rounded-lg border px-4 py-3 text-sm font-bold ${getMessageClass(message)}`}>
              {message.text}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-lg border border-blue-300 bg-white p-6 shadow-sm shadow-blue-950/5">
              <div className="shimmer-block h-8 w-64 rounded-md" />
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="rounded-lg border border-blue-200 p-5">
                    <div className="shimmer-block h-4 w-36 rounded-md" />
                    <div className="shimmer-block mt-4 h-6 w-56 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="rounded-lg border border-blue-300 bg-white p-6 shadow-sm shadow-blue-950/5">
                <div className="border-b border-blue-200 pb-6">
                  <p className="text-sm font-black uppercase text-blue-700">Login & security</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Password access</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    {isGoogleOnly
                      ? "This account was created with Google, so it does not use a GigWorld password."
                      : "Change your password using the same security rules as account signup."}
                  </p>
                </div>

                {isGoogleOnly ? (
                  <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                    <p className="text-sm font-black uppercase text-emerald-700">Google enabled</p>
                    <p className="mt-2 text-sm leading-6 text-emerald-800">
                      Continue using Google to sign in. Password controls are hidden because this account has no local password.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordSubmit} className="mt-6 grid gap-5">
                    <div>
                      <label htmlFor="oldPassword" className="text-sm font-black uppercase text-slate-700">Current password</label>
                      <div className="relative">
                        <input
                          id="oldPassword"
                          type={showPasswords ? "text" : "password"}
                          value={passwordForm.oldPassword}
                          onChange={(event) => updatePasswordField("oldPassword", event.target.value)}
                          className="mt-2 w-full rounded-lg border-blue-200 pr-12 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords((current) => !current)}
                          className="absolute inset-y-0 right-0 mt-2 flex w-12 items-center justify-center text-blue-700 transition hover:text-blue-900"
                          aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                        >
                          {showPasswords ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label htmlFor="newPassword" className="text-sm font-black uppercase text-slate-700">New password</label>
                        <input
                          id="newPassword"
                          type={showPasswords ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(event) => updatePasswordField("newPassword", event.target.value)}
                          className="mt-2 w-full rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                          placeholder="Create new password"
                        />
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="text-sm font-black uppercase text-slate-700">Confirm password</label>
                        <input
                          id="confirmPassword"
                          type={showPasswords ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(event) => updatePasswordField("confirmPassword", event.target.value)}
                          className="mt-2 w-full rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                          placeholder="Repeat new password"
                        />
                        {passwordForm.confirmPassword && !passwordsMatch && (
                          <p className="mt-2 text-xs font-bold text-red-600">Passwords do not match.</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-4">
                      {passwordStatus.map((requirement) => (
                        <p
                          key={requirement.id}
                          className={`rounded-md px-3 py-2 text-xs font-bold ${
                            requirement.isValid ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {requirement.label}
                        </p>
                      ))}
                    </div>

                    <div className="flex justify-end border-t border-blue-200 pt-5">
                      <button
                        type="submit"
                        disabled={isSavingPassword || !passwordFormIsValid}
                        className="rounded-lg bg-blue-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
                      >
                        {isSavingPassword ? "Changing..." : "Change password"}
                      </button>
                    </div>
                  </form>
                )}
              </section>

              <aside className="grid gap-6">
                <section className="rounded-lg border border-blue-300 bg-white p-6 shadow-sm shadow-blue-950/5">
                  <p className="text-sm font-black uppercase text-blue-700">Account summary</p>
                  <div className="mt-5 grid gap-4 text-sm">
                    <div>
                      <p className="font-black uppercase text-slate-500">Name</p>
                      <p className="mt-1 break-words font-bold text-slate-950">{user.fullName || "Not set"}</p>
                    </div>
                    <div>
                      <p className="font-black uppercase text-slate-500">Username</p>
                      <p className="mt-1 break-words font-bold text-slate-950">{user.username || "Not set"}</p>
                    </div>
                    <div>
                      <p className="font-black uppercase text-slate-500">Email</p>
                      <p className="mt-1 break-words font-bold text-slate-950">{user.email || "Not set"}</p>
                    </div>
                  </div>
                  <Link
                    to="/update-account"
                    className="mt-6 inline-flex w-full justify-center rounded-lg border border-blue-300 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 transition hover:border-blue-500 hover:bg-blue-100"
                  >
                    Edit account details
                  </Link>
                </section>

                <section className="rounded-lg border border-blue-300 bg-white p-6 shadow-sm shadow-blue-950/5">
                  <p className="text-sm font-black uppercase text-blue-700">Session</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Sign out on this browser when you finish using GigWorld on a shared device.
                  </p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-100 px-5 py-3 text-sm font-black text-red-800 transition hover:border-red-400 hover:bg-red-200"
                  >
                    <i className="bx bx-log-out text-base" aria-hidden="true" />
                    Logout
                  </button>
                </section>
              </aside>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SettingsPage;
