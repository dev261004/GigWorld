import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import BrandLogo from "../../components/BrandLogo/BrandLogo";
import GigPreferencesForm from "../../components/GigPreferences/GigPreferencesForm";
import { getReadableErrorMessage, useToast } from "../../components/Toast/ToastProvider";
import { TOAST_FAILURE } from "../../constants/toastMessages";

const GigPreferencesPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const savePreferences = async (preferences) => {
    setIsSaving(true);
    setMessage("");

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.put("http://localhost:2610/api/v1/users/gig-preferences", preferences, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.data) {
        localStorage.setItem("user", JSON.stringify(response.data.data));
      }

      navigate("/work");
    } catch (error) {
      console.error("Error saving gig preferences:", error);
      const readableMessage = getReadableErrorMessage(error, TOAST_FAILURE.GIG_PREFERENCES_SAVE_FAILED);
      setMessage(readableMessage);
      showToast({ type: "error", message: readableMessage });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fafc] text-slate-950">
      <main className="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:px-8">
        <aside className="rounded-lg border border-blue-300 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-6 text-white lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:p-8">
          <Link to="/" className="inline-flex items-center">
            <BrandLogo />
          </Link>

          <div className="mt-10">
            <p className="text-sm font-black uppercase text-sky-300">Personalize your gigs</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-white">
              Tell GigWorld what kind of work fits you.
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-300">
              A few answers help your feed focus on the gigs that match your skills, interest, and work style.
            </p>
          </div>

          <div className="mt-10 grid gap-4">
            {["Better matched gigs", "Cleaner filters", "Editable from profile"].map((item) => (
              <div key={item} className="border-l-2 border-sky-300 pl-4">
                <p className="text-sm font-black text-white">{item}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigate("/work")}
            className="mt-10 text-sm font-black text-sky-200 underline decoration-sky-300 underline-offset-8 transition hover:text-white"
          >
            Do this later -&gt;
          </button>
        </aside>

        <section className="py-2 lg:py-6">
          {message && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {message}
            </div>
          )}
          <GigPreferencesForm
            isSaving={isSaving}
            onSave={savePreferences}
            submitLabel="Show my gigs"
          />
        </section>
      </main>
    </div>
  );
};

export default GigPreferencesPage;
