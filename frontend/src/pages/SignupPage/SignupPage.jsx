import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "../../components/BrandLogo/BrandLogo";
import { EyeIcon, EyeOffIcon } from "../../components/Icons/PasswordIcons";

const inputClass =
  "mt-2 block w-full rounded-md border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";
const inputErrorClass = "border-red-300 focus:border-red-500 focus:ring-red-500/20";
const emailPattern = /^[a-z0-9._%+-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;
const usernamePattern = /^[A-Za-z0-9]+$/;

const sourceSites = [
  { name: "Freelancer", domain: "freelancer.com" },
  { name: "Twine", domain: "twine.net" },
  { name: "RemoteOK", domain: "remoteok.com" },
  { name: "We Work Remotely", domain: "weworkremotely.com" },
  { name: "Remotive", domain: "remotive.com" },
  { name: "Truelancer", domain: "truelancer.com" },
  { name: "Hubstaff", domain: "hubstafftalent.net" },
  { name: "DesignCrowd", domain: "designcrowd.com" },
];

const passwordRequirements = [
  {
    id: "length",
    label: "8 to 16 characters",
    isMet: (value) => value.length >= 8 && value.length <= 16,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    isMet: (value) => /[A-Z]/.test(value),
  },
  {
    id: "number",
    label: "One number",
    isMet: (value) => /\d/.test(value),
  },
  {
    id: "special",
    label: "One special character",
    isMet: (value) => /[^A-Za-z0-9\s]/.test(value),
  },
];

const normalizeEmail = (value) => value.replace(/\s/g, "").toLowerCase();
const normalizeUsername = (value) => value.trim();
const formatFullName = (value) =>
  value.replace(/(^|\s)([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`);

const isValidEmail = (value) => {
  if (!emailPattern.test(value)) {
    return false;
  }

  const [localPart] = value.split("@");
  return !localPart.startsWith(".") && !localPart.endsWith(".") && !localPart.includes("..");
};

const getSignupErrors = ({ fullName, username, email, password }) => {
  const passwordIsInvalid = passwordRequirements.some((requirement) => !requirement.isMet(password));

  return {
    fullName: !fullName.trim() ? "Full name is required." : "",
    username: !username
      ? "Username is required."
      : !usernamePattern.test(username)
        ? "Username can use only letters and numbers."
        : "",
    email: !email
      ? "Email is required."
      : !isValidEmail(email)
        ? "Enter a valid email address."
        : "",
    password: !password
      ? "Password is required."
      : passwordIsInvalid
        ? "Password must meet all rules below."
        : "",
  };
};

const SignupPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({
    fullName: false,
    username: false,
    email: false,
    password: false,
  });

  const navigate = useNavigate();

  const cleanedFormData = {
    fullName: formatFullName(formData.fullName).trim(),
    username: normalizeUsername(formData.username),
    email: normalizeEmail(formData.email).trim(),
    password: formData.password.trim(),
  };
  const fieldErrors = getSignupErrors(cleanedFormData);
  const isFormValid = Object.values(fieldErrors).every((message) => !message);
  const passwordStatus = passwordRequirements.map((requirement) => ({
    ...requirement,
    isValid: requirement.isMet(cleanedFormData.password),
  }));
  const showPasswordRules = formData.password.length > 0;
  const sourceSliderSites = [...sourceSites, ...sourceSites];

  const markTouched = (field) => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  };

  const getInputClass = (field) =>
    `${inputClass} ${touched[field] && fieldErrors[field] ? inputErrorClass : ""}`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValueByField = {
      email: normalizeEmail(value),
      username: normalizeUsername(value),
      password: value.trim(),
      fullName: formatFullName(value),
    };
    const nextValue = nextValueByField[name] ?? value;

    setFormData((prevState) => ({
      ...prevState,
      [name]: nextValue,
    }));
    markTouched(name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const submitErrors = getSignupErrors(cleanedFormData);

    if (Object.values(submitErrors).some(Boolean)) {
      setTouched({
        fullName: true,
        username: true,
        email: true,
        password: true,
      });
      setFormData(cleanedFormData);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:2610/api/v1/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedFormData),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        navigate("/signin");
      } else {
        setError(
          response.status === 409
            ? "A user with this email or username already exists."
            : data.message || "We couldn't create your account. Please review the details and try again."
        );
      }
    } catch (error) {
      console.error("Error:", error);
      setError("The server could not be reached. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fafc] text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl items-start px-4 py-6 sm:px-6 lg:grid-cols-[0.95fr_1fr] lg:gap-14 lg:px-8">
        <main className="flex min-h-[calc(100vh-3rem)] items-center justify-center py-6">
          <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
            <div className="mb-8 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3 font-black text-slate-950">
                <BrandLogo />
              </Link>
              <Link to="/" className="text-sm font-medium text-slate-500 transition hover:text-blue-700">
                Back home
              </Link>
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-700">Start your workspace</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">Create your account</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Set up your GigWorld login and start organizing freelance opportunities faster.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error && (
                <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="fullName" className="text-sm font-semibold text-slate-700">
                    Full name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    id="fullName"
                    autoComplete="name"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={() => markTouched("fullName")}
                    className={getInputClass("fullName")}
                    placeholder="Jane Doe"
                    aria-invalid={touched.fullName && Boolean(fieldErrors.fullName)}
                    aria-describedby={
                      touched.fullName && fieldErrors.fullName ? "signup-full-name-error" : undefined
                    }
                  />
                  {touched.fullName && fieldErrors.fullName && (
                    <p id="signup-full-name-error" className="mt-2 text-xs font-medium text-red-600">
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="username" className="text-sm font-semibold text-slate-700">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    autoComplete="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={() => markTouched("username")}
                    className={getInputClass("username")}
                    placeholder="janedoe"
                    aria-invalid={touched.username && Boolean(fieldErrors.username)}
                    aria-describedby={
                      touched.username && fieldErrors.username ? "signup-username-error" : undefined
                    }
                  />
                  {touched.username && fieldErrors.username && (
                    <p id="signup-username-error" className="mt-2 text-xs font-medium text-red-600">
                      {fieldErrors.username}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => markTouched("email")}
                  className={getInputClass("email")}
                  placeholder="you@example.com"
                  aria-invalid={touched.email && Boolean(fieldErrors.email)}
                  aria-describedby={touched.email && fieldErrors.email ? "signup-email-error" : undefined}
                />
                {touched.email && fieldErrors.email && (
                  <p id="signup-email-error" className="mt-2 text-xs font-medium text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => markTouched("password")}
                    className={`${getInputClass("password")} pr-16`}
                    placeholder="Create a password"
                    aria-invalid={touched.password && Boolean(fieldErrors.password)}
                    aria-describedby={
                      touched.password && fieldErrors.password
                        ? "signup-password-error"
                        : showPasswordRules
                          ? "signup-password-rules"
                          : undefined
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
                  <p id="signup-password-error" className="mt-2 text-xs font-medium text-red-600">
                    {fieldErrors.password}
                  </p>
                )}
                {showPasswordRules && (
                  <div id="signup-password-rules" className="mt-2 grid gap-1.5 text-[11px] sm:grid-cols-4">
                    {passwordStatus.map((requirement) => (
                      <p
                        key={requirement.id}
                        className={`rounded-md px-2 py-1.5 font-medium ${
                          requirement.isValid
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-50 text-slate-500"
                        }`}
                      >
                        {requirement.isValid ? "Met: " : "Need: "}
                        {requirement.label}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="flex w-full items-center justify-center rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/signin" className="font-semibold text-blue-700 transition hover:text-blue-900">
                Sign in
              </Link>
            </p>
          </section>
        </main>

        <aside className="hidden lg:sticky lg:top-6 lg:flex lg:h-[calc(100vh-3rem)] lg:flex-col lg:justify-center">
          <div className="max-w-xl">
            <p className="mb-3 text-sm font-semibold uppercase text-blue-700">
              Built for independent work
            </p>
            <h2 className="text-5xl font-bold leading-tight text-slate-950">
              Turn scattered gig hunting into a repeatable workflow.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600">
              GigWorld helps freelancers keep discovery, applications, and profile details moving together.
            </p>
          </div>

          <div className="mt-10 max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">Sources GigWorld scans</p>
                <p className="mt-1 text-xs text-slate-500">One account, many freelance feeds</p>
              </div>
              <span className="rounded-md bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Live
              </span>
            </div>

            <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="overflow-hidden">
                <div className="source-logo-slider flex w-max gap-3">
                  {sourceSliderSites.map((site, index) => (
                    <div
                      key={`${site.domain}-${index}`}
                      className="flex min-w-52 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 shadow-sm"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-100 bg-white shadow-sm">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=64`}
                          alt=""
                          className="h-7 w-7 object-contain"
                        />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{site.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{site.domain}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SignupPage;
