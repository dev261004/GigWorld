import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const heroStats = [
  { value: "8+", label: "freelance sources" },
  { value: "Live", label: "fresh gig discovery" },
  { value: "One", label: "organized workspace" },
];

const Hero = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(Boolean(localStorage.getItem("authToken")));
  }, []);

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-50 via-white to-white" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4.75rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase text-emerald-700">
            Freelance job discovery
          </p>
          <h1 className="mt-5 text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Find the right freelance gig before it gets buried.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            GigWorld brings opportunities from the top freelance platforms into one clean workspace, so you can compare work faster and apply with confidence.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to={isAuthenticated ? "/work" : "/signup"}
              className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
            >
              Start exploring gigs
            </Link>
            <Link
              to="/work"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              Browse jobs
            </Link>
          </div>

          <div className="mt-10 grid max-w-lg grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {heroStats.map((stat) => (
              <div key={stat.label} className="border-r border-slate-200 px-4 py-4 last:border-r-0">
                <p className="text-xl font-black text-slate-950">{stat.value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:justify-self-end">
          <div className="overflow-hidden rounded-lg border border-white bg-white shadow-2xl shadow-slate-950/15">
            <img
              src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1100&q=85"
              alt="Freelancer reviewing project opportunities on a laptop"
              className="h-[360px] w-full object-cover sm:h-[460px] lg:h-[540px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
