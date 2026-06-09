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

const SourceSites = () => {
  const carouselSites = [...sourceSites, ...sourceSites];

  return (
    <section className="relative overflow-hidden border-y border-sky-100 bg-white py-7">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" aria-hidden="true" />
      <div className="relative">

        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" aria-hidden="true" />
        <div className="overflow-hidden">
          <div className="source-logo-slider flex w-max items-center gap-10 pr-10">
            {carouselSites.map((site, index) => (
              <span
                key={`${site.domain}-${index}`}
                className="inline-flex shrink-0 items-center gap-3 text-slate-900"
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=64`}
                  alt={`${site.name} logo`}
                  className="h-9 w-9 opacity-100"
                />
                <span className="whitespace-nowrap text-lg font-black text-slate-950">{site.name}</span>
                <span className="ml-7 h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SourceSites;
