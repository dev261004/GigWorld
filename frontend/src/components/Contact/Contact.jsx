import { useMemo, useState } from "react";
import { useToast } from "../Toast/ToastProvider";
import { TOAST_FAILURE, TOAST_SUCCESS } from "../../constants/toastMessages";

const contactMethods = [
  {
    label: "Support",
    value: "Help with your account or saved gigs",
  },
  {
    label: "Sources",
    value: "Suggest a freelance platform to track",
  },
  {
    label: "Partnerships",
    value: "Talk about posting or surfacing opportunities",
  },
];

const initialFormData = {
  name: "",
  email: "",
  question: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const Contact = () => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState(initialFormData);
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("success");

  const fieldErrors = useMemo(() => {
    const errors = {};
    const name = formData.name.trim();
    const email = formData.email.trim();
    const question = formData.question.trim();

    if (!name) {
      errors.name = "Name is required.";
    }

    if (!email) {
      errors.email = "Email is required.";
    } else if (!emailPattern.test(email)) {
      errors.email = "Enter a valid email address.";
    }

    if (!question) {
      errors.question = "Message is required.";
    } else if (question.length < 10) {
      errors.question = "Message should be at least 10 characters.";
    }

    return errors;
  }, [formData]);

  const isFormValid = Object.keys(fieldErrors).length === 0;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: name === "email" ? value.trim().toLowerCase() : value,
    }));
    setStatusMessage("");
  };

  const handleBlur = (field) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ name: true, email: true, question: true });

    if (!isFormValid) {
      showToast({ type: "error", message: TOAST_FAILURE.CONTACT_FORM_INVALID });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");

    try {
      const response = await fetch("http://localhost:2610/api/v1/contact/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          question: formData.question.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to submit contact request");
      }

      setFormData(initialFormData);
      setTouched({});
      setStatusType("success");
      setStatusMessage(TOAST_SUCCESS.CONTACT_SENT);
      showToast({ type: "success", message: TOAST_SUCCESS.CONTACT_SENT });
    } catch (error) {
      console.error(error);
      setStatusType("error");
      setStatusMessage(TOAST_FAILURE.CONTACT_SEND_FAILED);
      showToast({ type: "error", message: TOAST_FAILURE.CONTACT_SEND_FAILED });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClass = (field) => {
    const hasError = touched[field] && fieldErrors[field];

    return `mt-2 block w-full rounded-lg border px-4 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-2 ${
      hasError
        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
        : "border-blue-200 bg-white focus:border-blue-600 focus:ring-blue-600/20"
    }`;
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-lg border border-blue-300 bg-white shadow-2xl shadow-blue-100/70 lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-6 text-white sm:p-8 lg:p-10">
          <p className="text-sm font-black uppercase text-sky-300">Contact GigWorld</p>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
            Tell us what would make your gig search smoother.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Questions, platform requests, feedback, or support needs are welcome. Share the context and we will route it to the right place.
          </p>

          <div className="mt-8 grid gap-4">
            {contactMethods.map((method) => (
              <div key={method.label} className="border-t border-sky-300/30 pt-4">
                <p className="text-sm font-black text-white">{method.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{method.value}</p>
              </div>
            ))}
          </div>
        </aside>

        <div className="p-6 sm:p-8 lg:p-10">
          <p className="text-sm font-black uppercase text-blue-700">Send a message</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">How can we help?</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Keep it short or detailed. We will use your email only to reply to this request.
          </p>

          {statusMessage && (
            <div
              className={`mt-6 rounded-lg border px-4 py-3 text-sm font-bold ${
                statusType === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
              role="status"
            >
              {statusMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Name</span>
                <input
                  className={getInputClass("name")}
                  type="text"
                  placeholder="Dev Agrawal"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur("name")}
                  aria-invalid={touched.name && Boolean(fieldErrors.name)}
                />
                {touched.name && fieldErrors.name && (
                  <p className="mt-2 text-xs font-semibold text-red-600">{fieldErrors.name}</p>
                )}
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Email</span>
                <input
                  className={getInputClass("email")}
                  type="email"
                  placeholder="you@example.com"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email")}
                  aria-invalid={touched.email && Boolean(fieldErrors.email)}
                />
                {touched.email && fieldErrors.email && (
                  <p className="mt-2 text-xs font-semibold text-red-600">{fieldErrors.email}</p>
                )}
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">Message</span>
              <textarea
                className={`${getInputClass("question")} min-h-40 resize-y`}
                rows={6}
                placeholder="Tell us what you need help with..."
                name="question"
                value={formData.question}
                onChange={handleChange}
                onBlur={() => handleBlur("question")}
                aria-invalid={touched.question && Boolean(fieldErrors.question)}
              />
              {touched.question && fieldErrors.question && (
                <p className="mt-2 text-xs font-semibold text-red-600">{fieldErrors.question}</p>
              )}
            </label>

            <div className="flex flex-col gap-3 border-t border-blue-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-500">
                Average response: 1-2 business days.
              </p>
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isSubmitting ? "Sending..." : "Send message"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
