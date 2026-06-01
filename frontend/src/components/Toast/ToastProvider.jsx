/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

const toastStyles = {
  success: {
    icon: "bx-check-circle",
    title: "Done",
    tone: "border-emerald-200 text-emerald-700",
    iconBg: "bg-emerald-50 text-emerald-700",
  },
  error: {
    icon: "bx-error-circle",
    title: "Needs attention",
    tone: "border-red-200 text-red-700",
    iconBg: "bg-red-50 text-red-700",
  },
  info: {
    icon: "bx-info-circle",
    title: "Heads up",
    tone: "border-blue-200 text-blue-700",
    iconBg: "bg-blue-50 text-blue-700",
  },
  warning: {
    icon: "bx-bell",
    title: "Reminder",
    tone: "border-amber-200 text-amber-700",
    iconBg: "bg-amber-50 text-amber-700",
  },
};

const getToastStyle = (type) => toastStyles[type] || toastStyles.info;

const createToastId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getReadableErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  if (typeof error === "string") {
    return error;
  }

  const serverMessage = error?.response?.data?.message || error?.message;

  if (!serverMessage) {
    return fallback;
  }

  const normalizedMessage = String(serverMessage).trim();

  if (/network|failed to fetch|ecconnrefused|server could not be reached/i.test(normalizedMessage)) {
    return "GigWorld could not reach the server. Please check your connection and try again.";
  }

  if (/unauthorized|jwt|token|session/i.test(normalizedMessage)) {
    return "Your session has expired. Please sign in again.";
  }

  if (/duplicate|already exists/i.test(normalizedMessage)) {
    return "This information is already in use. Please try a different value.";
  }

  if (/cast to objectid|validation failed|schema|mongoose|undefined|null/i.test(normalizedMessage)) {
    return fallback;
  }

  return normalizedMessage;
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  useEffect(() => {
    const activeTimers = timersRef.current;

    return () => {
      Object.values(activeTimers).forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  const dismissToast = useCallback((toastId) => {
    if (timersRef.current[toastId]) {
      window.clearTimeout(timersRef.current[toastId]);
      delete timersRef.current[toastId];
    }

    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const showToast = useCallback(
    ({ type = "info", title, message, duration = 4200, action } = {}) => {
      const toastId = createToastId();
      const style = getToastStyle(type);
      const nextToast = {
        id: toastId,
        type,
        title: title || style.title,
        message: message || "Action completed.",
        action,
      };

      setToasts((current) => [...current, nextToast].slice(-4));

      timersRef.current[toastId] = window.setTimeout(() => {
        dismissToast(toastId);
      }, duration);

      return toastId;
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({
      showToast,
      showSuccess: (message, options = {}) => showToast({ ...options, type: "success", message }),
      showError: (message, options = {}) => showToast({ ...options, type: "error", message }),
      showInfo: (message, options = {}) => showToast({ ...options, type: "info", message }),
      showWarning: (message, options = {}) => showToast({ ...options, type: "warning", message }),
      dismissToast,
    }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed left-1/2 top-5 z-[100] grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 gap-3 sm:top-6">
        {toasts.map((toast) => {
          const style = getToastStyle(toast.type);

          return (
            <div
              key={toast.id}
              className={`rounded-2xl border bg-white/95 p-4 text-slate-950 shadow-2xl shadow-slate-950/15 backdrop-blur-xl ring-1 ring-white/70 ${style.tone}`}
              role="status"
              aria-live={toast.type === "error" ? "assertive" : "polite"}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.iconBg}`}>
                  <i className={`bx ${style.icon} text-xl`} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-950">{toast.title}</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{toast.message}</p>
                  {toast.action && (
                    <button
                      type="button"
                      onClick={() => {
                        toast.action.onClick?.();
                        dismissToast(toast.id);
                      }}
                      className="mt-3 text-sm font-black text-blue-700 underline underline-offset-4 transition hover:text-blue-900"
                    >
                      {toast.action.label}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close notification"
                >
                  <i className="bx bx-x text-xl" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
};

export { getReadableErrorMessage, ToastProvider, useToast };
