import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BrandLogo from "../../components/BrandLogo/BrandLogo";
import { EyeIcon, EyeOffIcon } from "../../components/Icons/PasswordIcons";
import { getReadableErrorMessage, useToast } from "../../components/Toast/ToastProvider";
import { TOAST_FAILURE, TOAST_SUCCESS } from "../../constants/toastMessages";

const inputClass =
  "mt-2 block w-full rounded-md border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";
const inputErrorClass = "border-red-300 focus:border-red-500 focus:ring-red-500/20";

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

const getResetErrors = ({ newPassword, confirmPassword }) => {
  const passwordIsInvalid = passwordRequirements.some((requirement) => !requirement.isMet(newPassword));

  return {
    newPassword: !newPassword
      ? "New password is required."
      : passwordIsInvalid
        ? "Password must meet all rules below."
        : "",
    confirmPassword: !confirmPassword
      ? "Please confirm your password."
      : newPassword !== confirmPassword
        ? "Passwords do not match."
        : "",
  };
};

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState("checking");
  const [touched, setTouched] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  const cleanedPasswords = {
    newPassword: newPassword.trim(),
    confirmPassword: confirmPassword.trim(),
  };
  const fieldErrors = getResetErrors(cleanedPasswords);
  const canUseResetLink = tokenStatus === "valid";
  const isCheckingToken = tokenStatus === "checking";
  const isFormValid = canUseResetLink && !fieldErrors.newPassword && !fieldErrors.confirmPassword;
  const showPasswordRules = newPassword.length > 0;
  const passwordStatus = passwordRequirements.map((requirement) => ({
    ...requirement,
    isValid: requirement.isMet(cleanedPasswords.newPassword),
  }));

  useEffect(() => {
    let isMounted = true;

    const verifyResetLink = async () => {
      if (!token) {
        const text = TOAST_FAILURE.RESET_LINK_INVALID;
        setTokenStatus("invalid");
        setMessage(text);
        setMessageType("error");
        showToast({ type: "error", message: text });
        return;
      }

      setTokenStatus("checking");
      setMessage("");
      setMessageType("info");

      try {
        const response = await fetch(`http://localhost:2610/api/v1/users/reset-password/${token}`);
        const data = await response.json().catch(() => ({}));

        if (!isMounted) {
          return;
        }

        if (response.ok) {
          setTokenStatus("valid");
          return;
        }

        setTokenStatus(response.status === 410 ? "expired" : "invalid");
        const text = getReadableErrorMessage(
          data.message,
          TOAST_FAILURE.RESET_LINK_INVALID_OR_EXPIRED,
        );
        setMessage(text);
        setMessageType("error");
        showToast({ type: "error", message: text });
      } catch (error) {
        console.error("Could not verify reset link:", error);
        if (!isMounted) {
          return;
        }
        setTokenStatus("error");
        const text = TOAST_FAILURE.RESET_LINK_VERIFY_FAILED;
        setMessage(text);
        setMessageType("error");
        showToast({ type: "error", message: text });
      }
    };

    verifyResetLink();

    return () => {
      isMounted = false;
    };
  }, [showToast, token]);

  const markTouched = (field) => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  };

  const getInputClass = (field) =>
    `${inputClass} ${touched[field] && fieldErrors[field] ? inputErrorClass : ""}`;

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("info");

    if (!canUseResetLink) {
      const text =
        tokenStatus === "expired"
          ? TOAST_FAILURE.RESET_LINK_EXPIRED
          : TOAST_FAILURE.RESET_LINK_INVALID;
      setMessage(text);
      setMessageType("error");
      showToast({ type: "error", message: text });
      return;
    }

    if (!isFormValid) {
      setTouched({
        newPassword: true,
        confirmPassword: true,
      });
      showToast({ type: "error", message: TOAST_FAILURE.PASSWORD_FIELDS_INVALID });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`http://localhost:2610/api/v1/users/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: cleanedPasswords.newPassword }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const text = TOAST_SUCCESS.PASSWORD_RESET;
        setMessage(text);
        setMessageType("success");
        showToast({ type: "success", message: text });
        setTimeout(() => navigate("/signin"), 3000);
      } else {
        if (response.status === 410) {
          setTokenStatus("expired");
        } else if (response.status === 400) {
          setTokenStatus("invalid");
        }
        const text = getReadableErrorMessage(
          data.message,
          TOAST_FAILURE.RESET_PASSWORD_FAILED,
        );
        setMessage(text);
        setMessageType("error");
        showToast({ type: "error", message: text });
      }
    } catch (error) {
      console.error("An error occurred:", error);
      const text = TOAST_FAILURE.SERVER_UNREACHABLE;
      setMessage(text);
      setMessageType("error");
      showToast({ type: "error", message: text });
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
              Secure reset
            </p>
            <h2 className="text-5xl font-bold leading-tight text-slate-950">
              Create a stronger password for your GigWorld account.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600">
              Use a password that is memorable for you, hard to guess, and different from passwords used elsewhere.
            </p>
          </div>

          <div className="mt-10 max-w-xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">Password checklist</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {passwordRequirements.map((requirement) => (
                <div key={requirement.id} className="rounded-md bg-slate-50 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-700">{requirement.label}</p>
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
              <Link to="/signin" className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-bold text-blue-700 transition hover:bg-blue-50 hover:text-blue-900">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to sign in
              </Link>
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-700">Reset password</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">Choose a new password</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter and confirm your new password to recover access to your workspace.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
              {isCheckingToken && (
                <div role="status" className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                  Checking your reset link...
                </div>
              )}

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

              {isCheckingToken ? null : !canUseResetLink ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    Need a new reset link?
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Password reset links expire after 10 minutes for your account security.
                  </p>
                  <Link
                    to="/forgot-password"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                  >
                    Request new reset link
                  </Link>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="new-password" className="text-sm font-semibold text-slate-700">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        name="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value.trim());
                          markTouched("newPassword");
                        }}
                        onBlur={() => markTouched("newPassword")}
                        className={`${getInputClass("newPassword")} pr-16`}
                        placeholder="Create a new password"
                        aria-invalid={touched.newPassword && Boolean(fieldErrors.newPassword)}
                        aria-describedby={
                          touched.newPassword && fieldErrors.newPassword
                            ? "reset-new-password-error"
                            : showPasswordRules
                              ? "reset-password-rules"
                              : undefined
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((current) => !current)}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-blue-700 transition hover:text-blue-900"
                        aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                        title={showNewPassword ? "Hide new password" : "Show new password"}
                      >
                        {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    {touched.newPassword && fieldErrors.newPassword && (
                      <p id="reset-new-password-error" className="mt-2 text-xs font-medium text-red-600">
                        {fieldErrors.newPassword}
                      </p>
                    )}
                    {showPasswordRules && (
                      <div id="reset-password-rules" className="mt-2 grid gap-1.5 text-[11px] sm:grid-cols-2">
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

                  <div>
                    <label htmlFor="confirm-password" className="text-sm font-semibold text-slate-700">
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value.trim());
                          markTouched("confirmPassword");
                        }}
                        onBlur={() => markTouched("confirmPassword")}
                        className={`${getInputClass("confirmPassword")} pr-16`}
                        placeholder="Confirm new password"
                        aria-invalid={touched.confirmPassword && Boolean(fieldErrors.confirmPassword)}
                        aria-describedby={
                          touched.confirmPassword && fieldErrors.confirmPassword
                            ? "reset-confirm-password-error"
                            : undefined
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-blue-700 transition hover:text-blue-900"
                        aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                        title={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                      >
                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    {touched.confirmPassword && fieldErrors.confirmPassword && (
                      <p id="reset-confirm-password-error" className="mt-2 text-xs font-medium text-red-600">
                        {fieldErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
                    disabled={loading || !isFormValid}
                  >
                    {loading ? "Resetting password..." : "Reset password"}
                  </button>
                </>
              )}
            </form>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
