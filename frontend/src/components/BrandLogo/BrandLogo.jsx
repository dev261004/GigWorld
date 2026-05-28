const BrandLogo = () => (
  <span className="inline-flex items-center gap-3">
    <svg
      aria-hidden="true"
      className="h-11 w-11 shrink-0"
      fill="none"
      focusable="false"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gigworld-bg" x1="7" x2="42" y1="5" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F172A" />
          <stop offset="0.62" stopColor="#1D4ED8" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
        <linearGradient id="gigworld-glow" x1="14" x2="36" y1="12" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E0F2FE" />
          <stop offset="1" stopColor="#BFDBFE" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#gigworld-bg)" />
      <path
        d="M7.8 31.1C13.6 17.6 25.1 10.1 40.3 11.5"
        opacity="0.95"
        stroke="#7DD3FC"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
      <path
        d="M8.9 33.1C15.8 39.5 30.8 41.2 40 31.5"
        opacity="0.92"
        stroke="#34D399"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
      <circle cx="24" cy="24" r="13.5" fill="url(#gigworld-glow)" opacity="0.16" />
      <circle cx="24" cy="24" r="13.5" stroke="#DBEAFE" strokeWidth="1.8" />
      <path
        d="M10.5 24H37.5M14.2 17.6H33.8M14.2 30.4H33.8"
        opacity="0.66"
        stroke="#BFDBFE"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M24 10.8C27.9 14.6 30 19.1 30 24C30 28.9 27.9 33.4 24 37.2C20.1 33.4 18 28.9 18 24C18 19.1 20.1 14.6 24 10.8Z"
        opacity="0.66"
        stroke="#BFDBFE"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M31.2 18.4C29.6 16.6 27.2 15.6 24.4 15.6C19.4 15.6 16 19.1 16 24C16 28.9 19.5 32.4 24.6 32.4C28.8 32.4 31.5 30.1 32.4 26.6H25.5"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.8"
      />
      <circle cx="39.4" cy="11.6" r="3.4" fill="#A7F3D0" />
      <circle cx="8.9" cy="33.2" r="2.4" fill="#60A5FA" />
    </svg>
    <span className="whitespace-nowrap font-black tracking-normal">
      <span className="text-slate-950">Gig</span>
      <span className="text-blue-700">World</span>
    </span>
  </span>
);

export default BrandLogo;
