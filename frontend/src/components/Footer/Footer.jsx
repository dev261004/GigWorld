import { Link } from "react-router-dom";

const footerLinks = [
  { label: "Home", to: "/" },
  { label: "Browse Jobs", to: "/work" },
  { label: "Pricing", to: "/pricing" },
  { label: "Contact", to: "/contact" },
];

const Footer = () => (
  <footer className="bg-slate-950 text-white">
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/gigworld.svg" alt="GigWorld logo" className="h-11 w-11" />
            <span className="text-2xl font-black">
              Gig<span className="text-sky-300">World</span>
            </span>
          </Link>
          <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
            One modern workspace for discovering freelance jobs from the platforms freelancers already trust.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/signup" className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-sky-100">
              Create account
            </Link>
            <Link to="/work" className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:border-sky-300 hover:text-sky-200">
              View jobs
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase text-slate-400">Navigation</h3>
          <nav className="mt-4 grid gap-3">
            {footerLinks.map((link) => (
              <Link key={link.to} to={link.to} className="text-sm font-semibold text-slate-200 transition hover:text-sky-300">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase text-slate-400">Built for</h3>
          <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-200">
            <span>Freelancers</span>
            <span>Remote teams</span>
            <span>Project hunters</span>
            <span>Growing companies</span>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>(c) 2026 GigWorld. All rights reserved.</p>
        <p>Freelance opportunities, organized beautifully.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
