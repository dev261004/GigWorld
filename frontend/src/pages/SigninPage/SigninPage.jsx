import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "../../components/BrandLogo/BrandLogo";
import { EyeIcon, EyeOffIcon } from "../../components/Icons/PasswordIcons";

const inputClass =
  "mt-2 block w-full rounded-md border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";
const inputErrorClass = "border-red-300 focus:border-red-500 focus:ring-red-500/20";
const emailPattern = /^[a-z0-9._%+-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

const stats = [
  { value: "10+", label: "Gig sources" },
  { value: "24/7", label: "Fresh listings" },
  { value: "1", label: "Focused job feed" },
];

const normalizeEmail = (value) => value.replace(/\s/g, "").toLowerCase();

const isValidEmail = (value) => {
  if (!emailPattern.test(value)) {
    return false;
  }

  const [localPart] = value.split("@");
  return !localPart.startsWith(".") && !localPart.endsWith(".") && !localPart.includes("..");
};

const getSigninErrors = ({ email, password }) => ({
  email: !email
    ? "Email is required."
    : !isValidEmail(email)
      ? "Enter a valid email address."
      : "",
  password: !password ? "Password is required." : "",
});

const SigninPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const fieldErrors = getSigninErrors({ email, password });
  const isFormValid = !fieldErrors.email && !fieldErrors.password;
  const forgotPasswordEmail = normalizeEmail(email).trim();
  const shouldPrefillForgotPasswordEmail = forgotPasswordEmail && isValidEmail(forgotPasswordEmail);

  const markTouched = (field) => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  };

  const getInputClass = (field) =>
    `${inputClass} ${touched[field] && fieldErrors[field] ? inputErrorClass : ""}`;

  const handleSignin = async (e) => {
    e.preventDefault();
    setError("");

    if (!isFormValid) {
      setTouched({
        email: true,
        password: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:2610/api/v1/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizeEmail(email).trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "We couldn't sign you in. Check your email and password.");
        return;
      }

      const token = data?.data?.accessToken || data?.accessToken || data?.token;

      if (token) {
        localStorage.setItem("authToken", token);
        if (data?.data?.user) {
          localStorage.setItem("user", JSON.stringify(data.data.user));
        }
        const onboardingIsComplete = Boolean(data?.data?.user?.gigPreferences?.onboardingCompleted);
        navigate(onboardingIsComplete ? "/work" : "/gig-preferences");
      } else {
        setError("Sign in succeeded, but no access token was returned.");
      }
    } catch (error) {
      console.log("An error occurred", error);
      setError("The server could not be reached. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fafc] text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:gap-14 lg:px-8">
        <aside className="hidden flex-col justify-center lg:flex">
          <Link to="/" className="mb-12 flex items-center gap-3 text-2xl font-black text-slate-950">
            <BrandLogo />
          </Link>

          <div className="max-w-xl">
            <p className="mb-3 text-sm font-semibold uppercase text-emerald-700">
              Freelance work, organized
            </p>
            <h2 className="text-5xl font-bold leading-tight text-slate-950">
              Pick up right where your next gig search left off.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600">
              Sign in to manage searches, review opportunities, and keep your project pipeline moving from a cleaner workspace.
            </p>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-bold text-slate-950">{item.value}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>

        </aside>

        <main className="flex items-center justify-center py-6">
          <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
            <div className="mb-8 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3 font-black text-slate-950 lg:hidden">
                <BrandLogo />
              </Link>
              <Link to="/" className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-bold text-blue-700 transition hover:bg-blue-50 hover:text-blue-900">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back home
              </Link>
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-700">Welcome back</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">Sign in to your account</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Use the email and password connected to your GigWorld workspace.
              </p>
            </div>

            <form onSubmit={handleSignin} className="mt-8 space-y-5">
              {error && (
                <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
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
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(normalizeEmail(e.target.value));
                    markTouched("email");
                  }}
                  onBlur={() => markTouched("email")}
                  className={getInputClass("email")}
                  placeholder="you@example.com"
                  aria-invalid={touched.email && Boolean(fieldErrors.email)}
                  aria-describedby={touched.email && fieldErrors.email ? "signin-email-error" : undefined}
                />
                {touched.email && fieldErrors.email && (
                  <p id="signin-email-error" className="mt-2 text-xs font-medium text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <Link
                    to={
                      shouldPrefillForgotPasswordEmail
                        ? `/forgot-password?email=${encodeURIComponent(forgotPasswordEmail)}`
                        : "/forgot-password"
                    }
                    state={
                      shouldPrefillForgotPasswordEmail
                        ? { email: forgotPasswordEmail, locked: true }
                        : undefined
                    }
                    className="text-sm font-medium text-blue-700 transition hover:text-blue-900"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value.trim());
                      markTouched("password");
                    }}
                    onBlur={() => markTouched("password")}
                    className={`${getInputClass("password")} pr-16`}
                    placeholder="Enter your password"
                    aria-invalid={touched.password && Boolean(fieldErrors.password)}
                    aria-describedby={
                      touched.password && fieldErrors.password ? "signin-password-error" : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-blue-700 transition hover:text-blue-900"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {touched.password && fieldErrors.password && (
                  <p id="signin-password-error" className="mt-2 text-xs font-medium text-red-600">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="flex w-full items-center justify-center rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              New to GigWorld?{" "}
              <Link to="/signup" className="font-semibold text-blue-700 transition hover:text-blue-900">
                Create an account
              </Link>
            </p>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SigninPage;
