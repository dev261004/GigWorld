import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "../../components/BrandLogo/BrandLogo";

const inputClass =
  "mt-2 block w-full rounded-md border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
const inputErrorClass = "border-red-300 focus:border-red-500 focus:ring-red-500/20";
const emailPattern = /^[a-z0-9._%+-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

const normalizeEmail = (value) => value.replace(/\s/g, "").toLowerCase();

const isValidEmail = (value) => {
  if (!emailPattern.test(value)) {
    return false;
  }

  const [localPart] = value.split("@");
  return !localPart.startsWith(".") && !localPart.endsWith(".") && !localPart.includes("..");
};

const getEmailError = (email) => {
  if (!email) {
    return "Email is required.";
  }

  if (!isValidEmail(email)) {
    return "Enter a valid email address.";
  }

  return "";
};

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryEmail = new URLSearchParams(location.search).get("email") || "";
  const incomingEmail = normalizeEmail(location.state?.email || queryEmail);
  const emailIsLocked = Boolean(incomingEmail && isValidEmail(incomingEmail));

  const [email, setEmail] = useState(incomingEmail);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [touched, setTouched] = useState(emailIsLocked);
  const [loading, setLoading] = useState(false);

  const emailError = getEmailError(email);
  const isFormValid = !emailError;

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("info");

    if (!isFormValid) {
      setTouched(true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:2610/api/v1/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizeEmail(email).trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setMessage("Password reset link sent successfully. Please check your email.");
        setMessageType("success");
        setTimeout(() => navigate("/signin"), 3000);
      } else if (response.status === 404) {
        setMessage("No GigWorld account was found with this email.");
        setMessageType("error");
      } else {
        setMessage(data.message || "Failed to send password reset link. Please try again.");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("The server could not be reached. Please try again in a moment.");
      setMessageType("error");
      console.error("An error occurred", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fafc] text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:gap-14 lg:px-8">
        <aside className="hidden flex-col justify-center lg:flex">
          <Link to="/" className="mb-12 flex items-center text-2xl">
            <BrandLogo />
          </Link>

          <div className="max-w-xl">
            <p className="mb-3 text-sm font-semibold uppercase text-emerald-700">
              Account recovery
            </p>
            <h2 className="text-5xl font-bold leading-tight text-slate-950">
              Get back to your GigWorld workspace quickly.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600">
              We will verify the email belongs to an existing account before sending a secure reset link.
            </p>
          </div>

          <div className="mt-10 max-w-xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">How reset works</p>
            <div className="mt-4 space-y-4">
              {[
                "Enter the email connected to your account",
                "GigWorld checks that the account exists",
                "A time-limited reset link is sent to your inbox",
              ].map((item, index) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-sm font-bold text-blue-700">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center py-6">
          <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
            <div className="mb-8 flex items-center justify-between">
              <Link to="/" className="flex items-center font-black text-slate-950 lg:hidden">
                <BrandLogo />
              </Link>
              <Link to="/signin" className="ml-auto text-sm font-medium text-slate-500 transition hover:text-blue-700">
                Back to sign in
              </Link>
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-700">Forgot password</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">Reset your password</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your account email and we will send a reset link if it exists in GigWorld.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="mt-8 space-y-5">
              {message && (
                <div
                  role="alert"
                  className={`rounded-md border px-4 py-3 text-sm ${
                    messageType === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {message}
                </div>
              )}

              <div>
                <label htmlFor="email-address" className="text-sm font-semibold text-slate-700">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  required
                  disabled={emailIsLocked || loading}
                  value={email}
                  onChange={(e) => {
                    setEmail(normalizeEmail(e.target.value));
                    setTouched(true);
                  }}
                  onBlur={() => setTouched(true)}
                  className={`${inputClass} ${touched && emailError ? inputErrorClass : ""}`}
                  placeholder="you@example.com"
                  aria-invalid={touched && Boolean(emailError)}
                  aria-describedby={
                    touched && emailError
                      ? "forgot-email-error"
                      : emailIsLocked
                        ? "forgot-email-locked"
                        : undefined
                  }
                />
                {emailIsLocked && (
                  <p id="forgot-email-locked" className="mt-2 text-xs font-medium text-emerald-700">
                    Email was carried over from sign in, so it cannot be edited here.
                  </p>
                )}
                {touched && emailError && (
                  <p id="forgot-email-error" className="mt-2 text-xs font-medium text-red-600">
                    {emailError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
                disabled={loading || !isFormValid}
              >
                {loading ? "Sending reset link..." : "Send reset link"}
              </button>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
