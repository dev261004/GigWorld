/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar/Navbar";
import { parseGigBriefText } from "../../utils/gigBrief";

const sourceCatalog = [
  { name: "Freelancer", domain: "freelancer.com" },
  { name: "Twine", domain: "twine.net" },
  { name: "RemoteOK", domain: "remoteok.com" },
  { name: "We Work Remotely", domain: "weworkremotely.com" },
  { name: "Remotive", domain: "remotive.com" },
  { name: "Truelancer", domain: "truelancer.com" },
  { name: "Hubstaff Talent", domain: "talent.hubstaff.com" },
  { name: "DesignCrowd", domain: "designcrowd.com" },
];

const SaveIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.4"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 5.75C6.5 4.78 7.28 4 8.25 4h7.5c.97 0 1.75.78 1.75 1.75V20l-5.5-3.25L6.5 20V5.75Z" />
  </svg>
);

const normalizeSource = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");

const getSourceMeta = (source) => {
  const normalizedSource = normalizeSource(source);

  if (!normalizedSource || normalizedSource === "unknown") {
    return {
      name: "GigWorld Source",
      logo: "/gigworld-mark-transparent.png",
      domain: "",
    };
  }

  const matchedSource = sourceCatalog.find((item) => {
    const normalizedDomain = normalizeSource(item.domain);
    const normalizedName = item.name.toLowerCase().replace(/\s/g, "");

    return (
      normalizedSource.includes(normalizedDomain) ||
      normalizedSource.replace(/\s/g, "").includes(normalizedName) ||
      normalizedDomain.includes(normalizedSource)
    );
  });

  if (!matchedSource) {
    return {
      name: "GigWorld Source",
      logo: "/gigworld-mark-transparent.png",
      domain: normalizedSource,
    };
  }

  return {
    name: matchedSource.name,
    logo: `https://www.google.com/s2/favicons?domain=${matchedSource.domain}&sz=64`,
    domain: matchedSource.domain,
  };
};

const formatDate = (value) => {
  if (!value) {
    return "Not listed";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not listed";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatBudget = (job) => {
  const budget = job?.budget;

  if (budget?.raw) {
    return budget.raw;
  }

  if (budget?.min || budget?.max) {
    const currency = budget.currency || "$";
    const range = [budget.min, budget.max].filter(Boolean).join(" - ");
    return `${currency}${range}${budget.is_hourly ? "/hr" : ""}`;
  }

  if (job?.salary_range?.min || job?.salary_range?.max) {
    return [job.salary_range.min, job.salary_range.max].filter(Boolean).join(" - ");
  }

  return "Not listed";
};

const formatBudgetType = (job) => {
  if (job?.budget?.is_hourly === true) {
    return "Hourly";
  }

  if (job?.budget?.is_hourly === false) {
    return "Fixed";
  }

  return "Not listed";
};

const formatValue = (value, fallback = "Not listed") => {
  if (value === 0) {
    return "0";
  }

  if (!value) {
    return fallback;
  }

  return String(value);
};

const getTechStack = (job) => (Array.isArray(job?.tech_stack) ? job.tech_stack.filter(Boolean) : []);
const minimumDetailShimmerMs = 550;

const GigBriefContent = ({ text }) => {
  const { meta, sections } = parseGigBriefText(text);

  if (sections.length === 0 && meta.length === 0) {
    return (
      <p className="mt-5 text-base leading-8 text-slate-600">
        The source did not provide a detailed description for this gig.
      </p>
    );
  }

  return (
    <div className="mt-5 grid gap-5">
      {meta.length > 0 && (
        <div className="grid gap-3 border-y border-blue-200 py-4 sm:grid-cols-3">
          {meta.map((item) => (
            <div key={`${item.label}-${item.value}`}>
              <p className="text-xs font-black uppercase text-blue-700">{item.label}</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {sections.map((section) => (
        <article key={section.title} className="border-b border-blue-200 pb-5 last:border-b-0 last:pb-0">
          <h3 className="text-lg font-black text-slate-950">{section.title}</h3>
          <div className="mt-4 grid gap-3">
            {section.items.map((item, index) => (
              item.type === "bullet" ? (
                <div key={`${section.title}-${index}`} className="flex gap-3 text-sm leading-7 text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  <span>{item.text}</span>
                </div>
              ) : (
                <p key={`${section.title}-${index}`} className="text-sm leading-7 text-slate-600">
                  {item.text}
                </p>
              )
            ))}
          </div>
        </article>
      ))}
    </div>
  );
};

const renderDetailRow = (label, value) => (
  <div className="grid gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-5">
    <p className="text-xs font-black uppercase text-slate-500">{label}</p>
    <p className="break-words text-sm font-bold text-slate-950">{value}</p>
  </div>
);

const renderSummaryItem = (label, value) => (
  <div className="border-t border-blue-300 py-5 sm:border-l sm:border-t-0 sm:px-5 first:sm:border-l-0">
    <p className="text-xs font-black uppercase text-blue-700">{label}</p>
    <p className="mt-2 break-words text-base font-black text-slate-950">{value}</p>
  </div>
);

const renderStatusValue = (status) => {
  const label = formatValue(status);
  const isOpen = String(status || "").toLowerCase().includes("open");

  return (
    <span className="inline-flex items-center gap-2">
      {isOpen && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
      )}
      <span>{label}</span>
    </span>
  );
};

const GigDetailsSkeleton = () => (
  <div aria-label="Loading gig details">
    <section className="border-y border-blue-400 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900">
      <div className="grid gap-8 p-6 text-white sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-10">
        <div>
          <div className="shimmer-block-dark h-5 w-28 rounded-md" />
          <div className="mt-6 flex flex-wrap gap-2">
            <div className="shimmer-block-dark h-7 w-24 rounded-full" />
            <div className="shimmer-block-dark h-7 w-32 rounded-full" />
            <div className="shimmer-block-dark h-7 w-20 rounded-full" />
          </div>
          <div className="shimmer-block-dark mt-6 h-12 w-11/12 rounded-md" />
          <div className="shimmer-block-dark mt-3 h-12 w-2/3 rounded-md" />
          <div className="shimmer-block-dark mt-5 h-5 w-72 rounded-md" />
        </div>

        <div className="border-t border-sky-300/45 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div className="flex items-center justify-between gap-4">
            <div className="shimmer-block-dark h-4 w-16 rounded-md" />
            <div className="shimmer-block-dark h-4 w-28 rounded-md" />
          </div>
          <div className="shimmer-block-dark mt-4 h-11 w-40 rounded-md" />
          <div className="shimmer-block-dark mt-3 h-4 w-28 rounded-md" />
          <div className="shimmer-block-dark mt-8 h-5 w-24 rounded-md" />
        </div>
      </div>
    </section>

    <section className="border-b border-blue-300 bg-white px-6 sm:px-8 lg:px-10">
      <div className="grid sm:grid-cols-2 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="border-t border-blue-300 py-5 sm:border-l sm:border-t-0 sm:px-5 first:sm:border-l-0">
            <div className="shimmer-block h-3 w-20 rounded-md" />
            <div className="shimmer-block mt-3 h-5 w-24 rounded-md" />
          </div>
        ))}
      </div>
    </section>

    <section className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <section className="border-b border-blue-300 pb-10">
          <div className="shimmer-block h-4 w-28 rounded-md" />
          <div className="shimmer-block mt-4 h-9 w-72 rounded-md" />
          <div className="mt-6 grid gap-3">
            <div className="shimmer-block h-4 w-full rounded-md" />
            <div className="shimmer-block h-4 w-11/12 rounded-md" />
            <div className="shimmer-block h-4 w-4/5 rounded-md" />
            <div className="shimmer-block h-4 w-2/3 rounded-md" />
          </div>
        </section>

        <section className="border-b border-blue-300 py-10">
          <div className="shimmer-block h-4 w-16 rounded-md" />
          <div className="shimmer-block mt-4 h-7 w-64 rounded-md" />
          <div className="mt-5 flex flex-wrap gap-2">
            <div className="shimmer-block h-9 w-28 rounded-md" />
            <div className="shimmer-block h-9 w-24 rounded-md" />
            <div className="shimmer-block h-9 w-32 rounded-md" />
          </div>
        </section>
      </div>

      <aside className="border-t border-blue-300 pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
        <div className="shimmer-block h-6 w-32 rounded-md" />
        <div className="mt-5 grid gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid gap-2">
              <div className="shimmer-block h-3 w-20 rounded-md" />
              <div className="shimmer-block h-4 w-40 rounded-md" />
            </div>
          ))}
        </div>
      </aside>
    </section>

    <section className="mt-10 border-y border-blue-300 bg-white px-6 py-8 sm:px-8 lg:px-10">
      <div className="grid gap-8 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, sectionIndex) => (
          <div key={sectionIndex} className={sectionIndex === 1 ? "border-t border-blue-300 pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0" : ""}>
            <div className="shimmer-block h-6 w-36 rounded-md" />
            <div className="mt-5 grid gap-4">
              {Array.from({ length: 5 }).map((__, rowIndex) => (
                <div key={rowIndex} className="grid gap-2">
                  <div className="shimmer-block h-3 w-24 rounded-md" />
                  <div className="shimmer-block h-4 w-36 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  </div>
);

const GigDetailsPage = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [tracker, setTracker] = useState(null);
  const [trackerMessage, setTrackerMessage] = useState("");
  const [trackerToast, setTrackerToast] = useState(null);
  const [showTrackingPrompt, setShowTrackingPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGig = async () => {
      const loadStartedAt = Date.now();
      setIsLoading(true);
      setError("");

      try {
        const response = await axios.get(`http://localhost:2610/api/v1/jobs/id/${jobId}`);
        setJob(response.data?.data || null);
      } catch (requestError) {
        console.error(requestError);
        setError(
          requestError.response?.status === 410
            ? requestError.response.data?.message || "This gig is no longer available."
            : "Unable to load this gig right now.",
        );
      } finally {
        const elapsedTime = Date.now() - loadStartedAt;
        const remainingDelay = Math.max(minimumDetailShimmerMs - elapsedTime, 0);

        if (remainingDelay > 0) {
          await new Promise((resolve) => {
            setTimeout(resolve, remainingDelay);
          });
        }

        setIsLoading(false);
      }
    };

    fetchGig();
  }, [jobId]);

  useEffect(() => {
    const fetchTracker = async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        return;
      }

      try {
        const response = await axios.get(`http://localhost:2610/api/v1/applications/job/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTracker(response.data?.data || null);
      } catch (requestError) {
        console.error(requestError);
      }
    };

    fetchTracker();
  }, [jobId]);

  useEffect(() => {
    if (!trackerToast) {
      return undefined;
    }

    const toastTimer = window.setTimeout(() => {
      setTrackerToast(null);
    }, 3600);

    return () => window.clearTimeout(toastTimer);
  }, [trackerToast]);

  const showTrackerToast = (message, type = "success") => {
    setTrackerToast({ message, type });
  };

  const trackGig = async (status = "Viewed source", sourceOpened = false) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      const message = "Sign in to track this gig.";
      setTrackerMessage(message);
      showTrackerToast(message, "error");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:2610/api/v1/applications/track/${jobId}`,
        {
          status,
          sourceOpened,
          sourceWebsite: job?.source_website,
          sourceUrl: job?.source_url,
          keepAppliedAt: Boolean(tracker?.appliedAt),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setTracker(response.data?.data || null);
      const message = response.data?.message || (
        status === "Applied"
          ? "Gig marked as applied in your tracker."
          : "Gig saved to your application tracker."
      );
      const toastType = response.data?.alreadyTracked ? "info" : "success";

      setTrackerMessage(message);
      showTrackerToast(message, toastType);
    } catch (requestError) {
      console.error(requestError);
      const message = "Unable to update your tracker right now.";
      setTrackerMessage(message);
      showTrackerToast(message, "error");
    }
  };

  const source = getSourceMeta(job?.source_website);
  const skills = getTechStack(job);
  const hasCompanyDetails = Boolean(
    job?.companyDetails?.description || job?.companyDetails?.website || job?.companyDetails?.contactEmail,
  );

  return (
    <div className="min-h-screen bg-[#f7fafc] text-slate-950">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {isLoading && (
          <GigDetailsSkeleton />
        )}

        {!isLoading && error && (
          <section className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <h1 className="text-2xl font-black text-red-700">Gig unavailable</h1>
            <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>
            <Link
              to="/work"
              className="mt-5 inline-flex rounded-lg bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Browse other gigs
            </Link>
          </section>
        )}

        {!isLoading && !error && job && (
          <>
            <section className="relative border-y border-blue-400 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900">
              <button
                type="button"
                onClick={() => navigate("/work")}
                className="absolute left-6 top-2 inline-flex items-center gap-1 text-sm font-black text-sky-200 transition hover:text-white sm:left-8 lg:left-10"
              >
                <span>&lt;-</span>
                <span>Back to gigs</span>
              </button>
              <div className="grid gap-8 p-6 pt-12 text-white sm:p-8 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-10 lg:pt-12">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {job.is_new && (
                      <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-200">
                        New gig
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-sky-100">
                      <img src={source.logo} alt={`${source.name} logo`} className="h-4 w-4 rounded-sm bg-white" />
                      {source.name}
                    </span>
                    {job.project_status && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">
                        {String(job.project_status).toLowerCase().includes("open") && (
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                          </span>
                        )}
                        <span>{job.project_status}</span>
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight text-white sm:text-5xl">
                    {job.job_title}
                  </h1>
                  <p className="mt-4 text-lg font-semibold text-slate-300">
                    {job.company_name || "Client listed on source platform"}
                  </p>
                </div>

                <div className="border-t border-sky-300/45 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-black uppercase text-sky-300">Budget</p>
                  </div>
                  <p className="mt-2 text-4xl font-black text-white">{formatBudget(job)}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-300">{formatBudgetType(job)} project</p>
                  <div className="mt-6 flex flex-col items-start gap-3">
                    {job.source_url ? (
                      <a
                        href={job.source_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          setShowTrackingPrompt(true);
                          setTrackerMessage("");
                        }}
                        className="inline-flex items-center gap-1 text-sm font-black text-sky-200 transition hover:text-white"
                      >
                        <span className="underline decoration-sky-300 underline-offset-8">Apply now</span>
                        <span>-&gt;</span>
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-slate-300">Source link not listed</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="border-b border-blue-300 bg-white px-6 sm:px-8 lg:px-10">
              <div className="grid sm:grid-cols-2 lg:grid-cols-6">
                {renderSummaryItem("Location", formatValue(job.location, "Remote or not listed"))}
                {renderSummaryItem("Experience", formatValue(job.experience))}
                {renderSummaryItem("Posted", formatDate(job.postedAt))}
                {renderSummaryItem("Bids", formatValue(job.bids_count))}
                {renderSummaryItem("Status", renderStatusValue(job.project_status))}
                {renderSummaryItem("Source", source.name)}
              </div>
            </section>

            <section className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <section className="border-b border-blue-300 pb-10">
                  <p className="text-sm font-black uppercase text-blue-700">Full gig brief</p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">Requirements and scope</h2>
                  <GigBriefContent text={job.min_requirements} />
                </section>

                <section className="border-b border-blue-300 py-10">
                  <p className="text-sm font-black uppercase text-blue-700">Skills</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">What this gig asks for</h2>
                  {skills.length > 0 ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-5 text-sm font-semibold text-slate-500">No specific skills were listed by the source.</p>
                  )}
                </section>

                {hasCompanyDetails && (
                  <section className="py-10">
                    <p className="text-sm font-black uppercase text-blue-700">Client details</p>
                    <h2 className="mt-2 text-3xl font-black text-slate-950">{job.company_name}</h2>
                    {job.companyDetails?.description && (
                      <p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-600">
                        {job.companyDetails.description}
                      </p>
                    )}
                    <div className="mt-5">
                      {job.companyDetails?.website && renderDetailRow("Website", job.companyDetails.website)}
                      {job.companyDetails?.contactEmail && renderDetailRow("Contact email", job.companyDetails.contactEmail)}
                    </div>
                  </section>
                )}
              </div>

              <aside className="border-t border-blue-300 pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <p className="inline-flex border-b-2 border-blue-500 pb-2 text-sm font-black uppercase text-blue-700">Application actions</p>
                <div className="mt-5 border-y border-blue-300 py-4">
                  <p className="text-xs font-black uppercase text-slate-500">Tracking status</p>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {tracker?.status || "Not saved yet"}
                  </p>
                  {trackerMessage && (
                    <p className="mt-3 text-sm font-semibold leading-6 text-blue-700">{trackerMessage}</p>
                  )}
                </div>

                <div className="mt-5 grid gap-3">
                  <button
                    type="button"
                    onClick={() => trackGig("Planning to apply")}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
                  >
                    <SaveIcon />
                    <span>Save gig</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => trackGig("Applied")}
                    className="inline-flex items-center justify-center rounded-lg border border-emerald-300 bg-emerald-100 px-5 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-200"
                  >
                    Mark as applied
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/job-application-status")}
                    className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-50"
                  >
                    Open tracker
                  </button>
                </div>
              </aside>
            </section>

            <section className="mt-10 border-y border-blue-300 bg-white px-6 py-8 sm:px-8 lg:px-10">
              <div className="grid gap-8 lg:grid-cols-3">
                <div>
                  <p className="inline-flex border-b-2 border-blue-500 pb-2 text-sm font-black uppercase text-blue-700">Budget details</p>
                  <div className="mt-4">
                    {renderDetailRow("Displayed budget", formatBudget(job))}
                    {renderDetailRow("Type", formatBudgetType(job))}
                    {renderDetailRow("Minimum", formatValue(job.budget?.min))}
                    {renderDetailRow("Maximum", formatValue(job.budget?.max))}
                    {renderDetailRow("Currency", formatValue(job.budget?.currency))}
                    {renderDetailRow(
                      "Salary range",
                      job.salary_range?.min || job.salary_range?.max
                        ? [job.salary_range.min, job.salary_range.max].filter(Boolean).join(" - ")
                        : "Not listed",
                    )}
                  </div>
                </div>

                <div className="border-t border-blue-300 pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                  <p className="inline-flex border-b-2 border-blue-500 pb-2 text-sm font-black uppercase text-blue-700">Quick details</p>
                  <div className="mt-4">
                    {renderDetailRow("Rating", formatValue(job.rating))}
                    {renderDetailRow("Source ID", formatValue(job.external_id))}
                    {renderDetailRow("Domain", formatValue(source.domain || job.source_website))}
                    {renderDetailRow("First found", formatDate(job.first_seen_at))}
                    {renderDetailRow("Last seen", formatDate(job.last_seen_at))}
                  </div>
                </div>

                <div className="border-t border-blue-300 pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                  <p className="inline-flex border-b-2 border-blue-500 pb-2 text-sm font-black uppercase text-blue-700">Dates</p>
                  <div className="mt-4">
                    {renderDetailRow("Posted", formatDate(job.postedAt))}
                    {renderDetailRow("First found", formatDate(job.first_seen_at))}
                    {renderDetailRow("Last seen", formatDate(job.last_seen_at))}
                    {renderDetailRow("Last refreshed", formatDate(job.scraped_at || job.updatedAt))}
                    {renderDetailRow("Application deadline", formatDate(job.application_deadline))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {trackerToast && (
        <div
          className={`fixed right-5 top-24 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm font-black shadow-2xl backdrop-blur-xl ${
            trackerToast.type === "error"
              ? "border-red-200 bg-red-50/95 text-red-700 shadow-red-950/10"
              : trackerToast.type === "info"
                ? "border-amber-200 bg-amber-50/95 text-amber-800 shadow-amber-950/10"
                : "border-blue-300 bg-white/95 text-blue-800 shadow-blue-950/15"
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                trackerToast.type === "error"
                  ? "bg-red-500"
                  : trackerToast.type === "info"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
            />
            <span>{trackerToast.message}</span>
            <button
              type="button"
              onClick={() => setTrackerToast(null)}
              className="ml-2 rounded-md px-1.5 text-sm font-black text-slate-400 transition hover:bg-white hover:text-slate-700"
              aria-label="Close tracker notification"
            >
              x
            </button>
          </div>
        </div>
      )}

      {showTrackingPrompt && job && (
        <div className="fixed bottom-5 right-5 z-50 w-[calc(100%-2.5rem)] max-w-sm rounded-lg border border-blue-300/80 bg-white/75 p-5 shadow-2xl shadow-blue-950/20 backdrop-blur-xl ring-1 ring-white/70">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase text-blue-700">Application tracker</p>
              <h3 className="mt-1 text-lg font-black text-slate-950">Track this application?</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowTrackingPrompt(false)}
              className="rounded-md px-2 py-1 text-sm font-black text-slate-400 transition hover:bg-white/70 hover:text-slate-700"
              aria-label="Close tracking prompt"
            >
              x
            </button>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Keep <span className="font-bold text-slate-950">{job.job_title}</span> in your GigWorld tracker after visiting the source site.
          </p>
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={async () => {
                await trackGig("Applied", true);
                setShowTrackingPrompt(false);
              }}
              className="rounded-lg bg-blue-700 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-800"
            >
              Mark as applied
            </button>
            <button
              type="button"
              onClick={async () => {
                await trackGig("Planning to apply", true);
                setShowTrackingPrompt(false);
              }}
              className="rounded-lg border border-blue-200 bg-white/60 px-4 py-3 text-sm font-black text-blue-700 backdrop-blur transition hover:bg-blue-50/90"
            >
              Save for later
            </button>
            <button
              type="button"
              onClick={() => setShowTrackingPrompt(false)}
              className="px-4 py-2 text-sm font-black text-slate-500 transition hover:text-slate-800"
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GigDetailsPage;
