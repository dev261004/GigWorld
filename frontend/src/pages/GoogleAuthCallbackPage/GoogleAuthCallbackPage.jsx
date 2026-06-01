import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "../../components/BrandLogo/BrandLogo";
import { getReadableErrorMessage, useToast } from "../../components/Toast/ToastProvider";
import { TOAST_FAILURE } from "../../constants/toastMessages";

const GoogleAuthCallbackPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [error, setError] = useState("");

  useEffect(() => {
    const finishGoogleAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const authError = params.get("error");
      const accessToken = params.get("accessToken");
      const refreshToken = params.get("refreshToken");

      if (authError) {
        const message = TOAST_FAILURE.GOOGLE_AUTH_FAILED;
        setError(message);
        showToast({ type: "error", message });
        return;
      }

      if (!accessToken) {
        const message = TOAST_FAILURE.GOOGLE_ACCESS_TOKEN_MISSING;
        setError(message);
        showToast({ type: "error", message });
        return;
      }

      localStorage.setItem("authToken", accessToken);

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      try {
        const response = await fetch("http://localhost:2610/api/v1/users/current-user", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data?.data) {
          const message = getReadableErrorMessage(
            data.message,
            TOAST_FAILURE.GOOGLE_PROFILE_LOAD_FAILED,
          );
          setError(message);
          showToast({ type: "error", message });
          return;
        }

        localStorage.setItem("user", JSON.stringify(data.data));
        navigate(data.data?.gigPreferences?.onboardingCompleted ? "/work" : "/gig-preferences", { replace: true });
      } catch (requestError) {
        console.error("Google auth profile load failed:", requestError);
        const message = TOAST_FAILURE.GOOGLE_SERVER_PROFILE_LOAD_FAILED;
        setError(message);
        showToast({ type: "error", message });
      }
    };

    finishGoogleAuth();
  }, [navigate, showToast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7fafc] px-4 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-blue-300 bg-white p-6 text-center shadow-xl shadow-blue-950/10 sm:p-8">
        <div className="mx-auto mb-6 flex w-fit items-center justify-center">
          <BrandLogo />
        </div>

        {error ? (
          <>
            <p className="text-sm font-black uppercase text-red-600">Google sign in failed</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">We could not finish signing you in.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
            <Link
              to="/signin"
              className="mt-6 inline-flex rounded-md bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm font-black uppercase text-blue-700">Google sign in</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">Finishing your GigWorld login...</h1>
            <div className="mx-auto mt-6 h-2 w-40 overflow-hidden rounded-full bg-blue-100">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-700" />
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default GoogleAuthCallbackPage;
