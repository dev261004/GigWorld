import { Link } from "react-router-dom";

const footerLinks = [
  { label: "Home", to: "/" },
  { label: "Browse gig", to: "/work" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const Footer = () => (
  <footer className="bg-slate-950 text-white">
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-3 transition hover:-translate-y-0.5">
            <img src="/gigworld-mark-transparent.png" alt="" aria-hidden="true" className="h-16 w-28 object-contain" />
            <span className="text-3xl font-black">
              Gig<span className="text-sky-300">World</span>
            </span>
          </Link>
          <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
            One modern workspace for discovering freelance jobs from the platforms freelancers already trust.
          </p>
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
