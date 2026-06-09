import { Link } from "react-router-dom";
import Footer from "../../components/Footer/Footer";
import Navbar from "../../components/Navbar/Navbar";

const sourceSites = [
  { name: "Freelancer", domain: "freelancer.com" },
  { name: "Twine", domain: "twine.net" },
  { name: "RemoteOK", domain: "remoteok.com" },
  { name: "We Work Remotely", domain: "weworkremotely.com" },
  { name: "Remotive", domain: "remotive.com" },
  { name: "Truelancer", domain: "truelancer.com" },
  { name: "Hubstaff Talent", domain: "talent.hubstaff.com" },
  { name: "Guru", domain: "guru.com" },
];

const stats = [
  { value: "8+", label: "source platforms" },
  { value: "1", label: "organized gig feed" },
  { value: "24/7", label: "freelance discovery flow" },
];

const workflow = [
  {
    title: "Discover work faster",
    text: "Browse fresh freelance opportunities from multiple sources without opening every platform manually.",
    icon: "bx-search-alt-2",
  },
  {
    title: "Compare with context",
    text: "See source, skills, budget, location, dates, and requirements in one consistent view.",
    icon: "bx-git-compare",
  },
  {
    title: "Track your pipeline",
    text: "Save promising gigs, mark applications, and keep your follow-up work in one workspace.",
    icon: "bx-list-check",
  },
];

const values = [
  "Freelancer-first browsing",
  "Clear source transparency",
  "Less tab switching",
  "Reusable application profile",
  "Resume and portfolio toolkit",
  "Application tracking",
];

const AboutPage = () => (
  <div className="min-h-screen bg-[#f7fafc] text-slate-950">
    <Navbar />

    <main>
      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-blue-400 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 text-white shadow-xl shadow-blue-950/20 sm:p-8 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-sky-300">About GigWorld</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight text-white sm:text-6xl">
                Freelance opportunities, organized into one calmer workspace.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
                GigWorld helps freelancers discover, compare, save, and track gigs from trusted freelance sources without losing time across scattered tabs.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/work"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-black text-blue-800 transition hover:bg-sky-100"
                >
                  Browse gigs
                </Link>
                <Link
                  to="/portfolio"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-sky-300/60 px-6 text-sm font-black text-sky-100 transition hover:border-white hover:text-white"
                >
                  Open portfolio
                </Link>
              </div>
            </div>

            <div className="border-t border-sky-300/40 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="text-xs font-black uppercase text-sky-300">Built around the freelancer journey</p>
              <div className="mt-5 grid gap-4">
                {stats.map((item) => (
                  <div key={item.label} className="border-b border-sky-300/30 pb-4 last:border-b-0 last:pb-0">
                    <p className="text-4xl font-black text-white">{item.value}</p>
                    <p className="mt-1 text-sm font-bold uppercase text-slate-300">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase text-blue-700">Why GigWorld exists</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              Finding freelance work should feel focused, not fragmented.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Freelancers often search across many platforms, compare incomplete details, save links in different places, and then forget where each application stands. GigWorld brings that process into a cleaner flow.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {values.map((value) => (
              <div key={value} className="rounded-lg border border-blue-300 bg-white px-4 py-4 shadow-sm shadow-blue-950/5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
                    <i className="bx bx-check text-lg" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-black text-slate-900">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-blue-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-blue-700">How it helps</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">A simpler workflow for gig workers.</h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-slate-600">
              GigWorld keeps the important parts of freelance discovery visible, comparable, and ready to act on.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {workflow.map((item) => (
              <article key={item.title} className="rounded-lg border border-blue-300 bg-[#f7fafc] p-5 shadow-sm shadow-blue-950/5">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-xl text-blue-700">
                  <i className={`bx ${item.icon}`} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-xl font-black text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-blue-300 bg-white p-6 shadow-sm shadow-blue-950/5 sm:p-8">
          <div className="flex flex-col gap-3 border-b border-blue-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-blue-700">Scraped sources</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">Freelance platforms GigWorld organizes.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-600">
              Every gig keeps its source visible so freelancers know exactly where each opportunity comes from.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sourceSites.map((site) => (
              <div key={site.domain} className="flex items-center gap-3 border-b border-blue-100 pb-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=64`}
                    alt=""
                    className="h-6 w-6 object-contain"
                  />
                </span>
                <div>
                  <p className="text-sm font-black text-slate-950">{site.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">{site.domain}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-blue-400 bg-slate-950 p-6 text-white shadow-xl shadow-blue-950/20 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase text-sky-300">The goal</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Help freelancers spend less time searching and more time choosing the right work.
              </h2>
            </div>
            <Link
              to="/signup"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-black text-blue-800 transition hover:bg-sky-100"
            >
              Start with GigWorld
            </Link>
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);

export default AboutPage;
