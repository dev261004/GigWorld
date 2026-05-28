const iconClass = "h-5 w-5";

const EyeIcon = () => (
  <svg
    aria-hidden="true"
    className={iconClass}
    fill="none"
    focusable="false"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.25 12s3.5-6.25 9.75-6.25S21.75 12 21.75 12s-3.5 6.25-9.75 6.25S2.25 12 2.25 12Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    aria-hidden="true"
    className={iconClass}
    fill="none"
    focusable="false"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 3l18 18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="M9.9 5.95A9.5 9.5 0 0112 5.75C18.25 5.75 21.75 12 21.75 12a18.06 18.06 0 01-3.02 3.88M6.48 7.42C3.72 9.1 2.25 12 2.25 12s3.5 6.25 9.75 6.25a9.62 9.62 0 004.03-.88"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="M9.7 9.7a3.25 3.25 0 004.6 4.6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

export { EyeIcon, EyeOffIcon };
