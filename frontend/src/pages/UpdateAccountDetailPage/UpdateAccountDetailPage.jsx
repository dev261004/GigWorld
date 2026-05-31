import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Footer from "../../components/Footer/Footer";
import Navbar from "../../components/Navbar/Navbar";

const emptyAccount = {
  fullName: "",
  username: "",
  email: "",
  phone: "",
  city: "",
  country: "",
  authProvider: "password",
};

const usernamePattern = /^[a-z0-9]+$/;

const cleanName = (value) =>
  value.replace(/(^|\s)([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`);

const getMessageClass = (message) =>
  message.type === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-red-200 bg-red-50 text-red-700";

const getProviderLabel = (provider) => (provider === "google" ? "Google account" : "Password account");

const getDisplayValue = (value) => value || "Not set";

const UpdateAccountDetailsPage = () => {
  const [formData, setFormData] = useState(emptyAccount);
  const [savedAccount, setSavedAccount] = useState(emptyAccount);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const canEditUsername = formData.authProvider === "google";
  const usernameError =
    canEditUsername && formData.username && !usernamePattern.test(formData.username)
      ? "Username can use only lowercase letters and numbers."
      : "";
  const fullNameError = !formData.fullName.trim() ? "Full name is required." : "";
  const formIsValid = !fullNameError && !usernameError;

  useEffect(() => {
    const fetchAccount = async () => {
      setIsLoading(true);
      setMessage(null);

      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get("http://localhost:2610/api/v1/users/current-user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = response.data?.data || {};

        const nextAccount = {
          fullName: user.fullName || user.name || "",
          username: user.username || "",
          email: user.email || "",
          phone: user.phone || "",
          city: user.city || "",
          country: user.country || "",
          authProvider: user.authProvider || "password",
        };

        setFormData(nextAccount);
        setSavedAccount(nextAccount);
        localStorage.setItem("user", JSON.stringify(user));
      } catch (error) {
        console.error("Unable to load account details:", error);
        setMessage({ type: "error", text: error.response?.data?.message || "Account details could not be loaded." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccount();
  }, []);

  const updateField = (field, value) => {
    const nextValueByField = {
      fullName: cleanName(value),
      username: value.trim().toLowerCase().replace(/\s/g, ""),
    };

    setFormData((current) => ({
      ...current,
      [field]: nextValueByField[field] ?? value,
    }));
    setMessage(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formIsValid) {
      setMessage({ type: "error", text: fullNameError || usernameError });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("authToken");
      const payload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
      };

      if (canEditUsername) {
        payload.username = formData.username.trim();
      }

      const response = await axios.put("http://localhost:2610/api/v1/users/update-account", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUser = response.data?.data;

      if (updatedUser) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setFormData((current) => ({
          ...current,
          fullName: updatedUser.fullName || "",
          username: updatedUser.username || "",
          email: updatedUser.email || "",
          phone: updatedUser.phone || "",
          city: updatedUser.city || "",
          country: updatedUser.country || "",
          authProvider: updatedUser.authProvider || current.authProvider,
        }));
        setSavedAccount((current) => ({
          ...current,
          fullName: updatedUser.fullName || "",
          username: updatedUser.username || "",
          email: updatedUser.email || "",
          phone: updatedUser.phone || "",
          city: updatedUser.city || "",
          country: updatedUser.country || "",
          authProvider: updatedUser.authProvider || current.authProvider,
        }));
      }

      setMessage({ type: "success", text: "Account details updated successfully." });
      setIsEditing(false);
    } catch (error) {
      console.error("Unable to update account details:", error);
      setMessage({ type: "error", text: error.response?.data?.message || "Account details could not be updated." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData(savedAccount);
    setMessage(null);
    setIsEditing(false);
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
              <p className="text-sm font-black uppercase tracking-wide text-sky-300">Account details</p>
              <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Keep your identity details current.</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                Update the personal information GigWorld uses across your profile, portfolio, and application toolkit.
              </p>
            </div>
            <div className="border-t border-sky-300/40 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="text-xs font-black uppercase text-sky-300">Sign-in identity</p>
              <p className="mt-4 break-words text-sm font-bold text-white">{formData.email || "Email not loaded"}</p>
              <p className="mt-2 text-xs font-bold uppercase text-slate-400">{getProviderLabel(formData.authProvider)}</p>
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
              <div className="shimmer-block h-7 w-56 rounded-md" />
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item}>
                    <div className="shimmer-block h-4 w-28 rounded-md" />
                    <div className="shimmer-block mt-3 h-12 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          ) : isEditing ? (
            <form onSubmit={handleSubmit} className="rounded-lg border border-blue-300 bg-white p-6 shadow-sm shadow-blue-950/5">
              <div className="flex flex-col gap-3 border-b border-blue-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase text-blue-700">Personal information</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Update account details</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Email stays locked for account safety. Google-created accounts can edit their auto-generated username.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-blue-300 bg-blue-50 px-5 text-sm font-black text-blue-700 transition hover:border-blue-500 hover:bg-blue-100"
                >
                  Cancel edit
                </button>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="fullName" className="text-sm font-black uppercase text-slate-700">Name</label>
                  <input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    className="mt-2 w-full rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                    placeholder="Dev Agrawal"
                  />
                  {fullNameError && <p className="mt-2 text-xs font-bold text-red-600">{fullNameError}</p>}
                </div>

                <div>
                  <label htmlFor="username" className="text-sm font-black uppercase text-slate-700">Username</label>
                  <input
                    id="username"
                    value={formData.username}
                    onChange={(event) => updateField("username", event.target.value)}
                    disabled={!canEditUsername}
                    className="mt-2 w-full rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="dev123"
                  />
                  {(usernameError || !canEditUsername) && (
                    <p className={`mt-2 text-xs font-bold ${usernameError ? "text-red-600" : "text-slate-500"}`}>
                      {usernameError || "Locked for password-created accounts."}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="text-sm font-black uppercase text-slate-700">Email address</label>
                  <input
                    id="email"
                    value={formData.email}
                    disabled
                    className="mt-2 w-full cursor-not-allowed rounded-lg border-blue-200 bg-slate-100 text-sm text-slate-500 shadow-sm"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="text-sm font-black uppercase text-slate-700">Phone number</label>
                  <input
                    id="phone"
                    value={formData.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    className="mt-2 w-full rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="text-sm font-black uppercase text-slate-700">City</label>
                  <input
                    id="city"
                    value={formData.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    className="mt-2 w-full rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                    placeholder="Ahmedabad"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="text-sm font-black uppercase text-slate-700">Country</label>
                  <input
                    id="country"
                    value={formData.country}
                    onChange={(event) => updateField("country", event.target.value)}
                    className="mt-2 w-full rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                    placeholder="India"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-blue-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-500">These details help keep your profile and application toolkit consistent.</p>
                <button
                  type="submit"
                  disabled={isSaving || !formIsValid}
                  className="rounded-lg bg-blue-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isSaving ? "Saving..." : "Save details"}
                </button>
              </div>
            </form>
          ) : (
            <section className="rounded-lg border border-blue-300 bg-white p-6 shadow-sm shadow-blue-950/5">
              <div className="flex flex-col gap-5 border-b border-blue-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-black uppercase text-blue-700">Personal information</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Account preview</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Review the core details GigWorld uses across your profile, portfolio, and application toolkit.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    to="/settings"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-5 text-sm font-black text-blue-700 transition hover:border-blue-500 hover:bg-blue-100"
                  >
                    <i className="bx bx-cog text-base" aria-hidden="true" />
                    Open settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMessage(null);
                      setIsEditing(true);
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-blue-300 bg-blue-700 px-5 text-sm font-black text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800"
                  >
                    Edit details
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: "Name", value: getDisplayValue(savedAccount.fullName) },
                  { label: "Username", value: getDisplayValue(savedAccount.username) },
                  { label: "Email", value: getDisplayValue(savedAccount.email) },
                  { label: "Phone", value: getDisplayValue(savedAccount.phone) },
                  { label: "City", value: getDisplayValue(savedAccount.city) },
                  { label: "Country", value: getDisplayValue(savedAccount.country) },
                ].map((item) => (
                  <div key={item.label} className="border-b border-blue-200 pb-4">
                    <p className="text-xs font-black uppercase text-blue-700">{item.label}</p>
                    <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default UpdateAccountDetailsPage;
