import { Link } from "react-router-dom";

const features = [
  {
    title: "Multi-source gig discovery",
    text: "Find freelance opportunities from multiple platforms in one organized feed.",
    result: "Less tab switching",
    icon: "bx-search-alt-2",
  },
  {
    title: "Powerful filters",
    text: "Refine by skills, source, budget, work type, location, project status, and posted time.",
    result: "Faster shortlists",
    icon: "bx-slider-alt",
  },
  {
    title: "Detailed gig pages",
    text: "Review requirements, skills, budget, source, dates, and the original application link.",
    result: "Better decisions",
    icon: "bx-detail",
  },
  {
    title: "Saved gigs and tracking",
    text: "Save strong opportunities, mark them as applied, update status, and add notes.",
    result: "Clear pipeline",
    icon: "bx-bookmark",
  },
  {
    title: "Portfolio toolkit",
    text: "Keep resume, education, work experience, project samples, and links ready to reuse.",
    result: "Ready profile",
    icon: "bx-briefcase-alt-2",
  },
  {
    title: "Gig preferences",
    text: "Tell GigWorld what kind of work fits you so the experience can stay more relevant.",
    result: "Relevant feed",
    icon: "bx-target-lock",
  },
];

const getAnimationDelay = (index) => ({
  animationDelay: `${index * 110}ms`,
});

const HomeFeatures = () => (
  <section className="bg-[#f7fafc] pb-10 pt-20 sm:pb-12 sm:pt-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-black uppercase tracking-wide text-blue-700">GigWorld features</p>
        <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
          Built to move from search to application faster.
        </h2>
        <p className="mt-5 text-base leading-8 text-slate-600">
          GigWorld keeps discovery, comparison, tracking, and your application profile connected without making freelancers manage another messy workspace.
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl grid-cols-3 border-y border-blue-200 py-5 text-center">
        <div>
          <p className="text-2xl font-black text-slate-950">8+</p>
          <p className="mt-1 text-xs font-black uppercase text-slate-500">Sources</p>
        </div>
        <div>
          <p className="text-2xl font-black text-slate-950">1</p>
          <p className="mt-1 text-xs font-black uppercase text-slate-500">Workspace</p>
        </div>
        <div>
          <p className="text-2xl font-black text-slate-950">Ready</p>
          <p className="mt-1 text-xs font-black uppercase text-slate-500">Toolkit</p>
        </div>
      </div>

      <div className="feature-set-card relative mt-12 overflow-hidden rounded-lg border border-blue-300 bg-white shadow-xl shadow-blue-950/10">
        <div className="feature-card-sheen" aria-hidden="true" />

        <div className="relative grid gap-6 border-b border-blue-200 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div className="flex items-start gap-4">
            <span className="feature-icon-float flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-2xl text-blue-700">
              <i className="bx bx-layer" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">Feature set</p>
              <h3 className="mt-1 text-2xl font-black text-slate-950">What GigWorld brings together</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                One connected toolkit for finding better gigs, checking fit faster, and staying ready to apply.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-[#f7fafc] p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-black uppercase text-blue-700">Freelance flow</p>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                Organized
              </span>
            </div>
            <div className="feature-flow-line mt-5 grid grid-cols-6 gap-2" aria-hidden="true">
              {features.map((feature, index) => (
                <span
                  key={feature.title}
                  className={`feature-flow-dot ${index < 3 ? "bg-blue-600" : "bg-emerald-500"}`}
                  style={getAnimationDelay(index)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative grid gap-4 p-4 sm:p-5 lg:grid-cols-3">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="feature-tile animate-[feature-rise_700ms_ease-out_both] rounded-lg border border-blue-200 bg-white p-5 transition"
              style={getAnimationDelay(index)}
            >
              <div className="flex items-start justify-between gap-4">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-xl ${
                    index < 3
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <i className={`bx ${feature.icon}`} aria-hidden="true" />
                </span>
                <span className={`text-xs font-black uppercase ${index < 3 ? "text-blue-700" : "text-emerald-700"}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <h4 className="mt-5 text-lg font-black text-slate-950">{feature.title}</h4>
              <p className="mt-3 text-sm leading-6 text-slate-600">{feature.text}</p>

              <div className="mt-5 border-t border-blue-100 pt-4">
                <span
                  className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black uppercase ${
                    index < 3
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {feature.result}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          to="/work"
          className="inline-flex h-12 items-center justify-center rounded-full bg-blue-700 px-6 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
        >
          Explore gigs
        </Link>
      </div>
    </div>
  </section>
);

export default HomeFeatures;
