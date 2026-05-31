const workflowSteps = [
  {
    title: "Find fresh gigs",
    text: "Check new opportunities from trusted freelance platforms in one place.",
  },
  {
    title: "Spot the best fit",
    text: "Compare source, skills, location, and role details before you spend time applying.",
  },
  {
    title: "Shortlist with clarity",
    text: "Keep promising gigs moving so you can focus on stronger pitches and better work.",
  },
];

const focusPoints = [
  { value: "8+", label: "sources in one feed" },
  { value: "Less", label: "manual checking" },
  { value: "More", label: "time to pitch" },
  { value: "Clear", label: "gig comparison" },
];

const HomeWorkflow = () => (
  <section className="bg-slate-50 pb-20 pt-10 sm:pb-24 sm:pt-12">
    <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8">
      <div className="max-w-xl">
        <p className="text-sm font-bold uppercase text-blue-700">Built for freelancers</p>
        <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
          Turn scattered job boards into a focused shortlist.
        </h2>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          GigWorld helps you discover real freelance opportunities faster, compare them cleanly, and spend more energy on the gigs worth applying for.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3">
          {focusPoints.map((point) => (
            <div key={point.label} className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-2xl font-black text-slate-950">{point.value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">{point.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative grid gap-5">
        <div className="absolute bottom-8 left-6 top-8 hidden w-px bg-blue-200 sm:block" aria-hidden="true" />
        {workflowSteps.map((step, index) => (
          <article key={step.title} className="relative rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-950/10">
            <div className="flex gap-5 sm:items-start">
              <div className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-black text-white shadow-lg shadow-blue-700/25">
                {index + 1}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-950">{step.title}</h3>
                <p className="mt-2 max-w-xl text-base leading-7 text-slate-600">{step.text}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default HomeWorkflow;
