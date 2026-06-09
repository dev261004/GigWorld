import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar/Navbar";
import { getReadableErrorMessage, useToast } from "../../components/Toast/ToastProvider";
import { TOAST_FAILURE, TOAST_INFO, TOAST_SUCCESS } from "../../constants/toastMessages";
import { getGigBriefPreview } from "../../utils/gigBrief";

const jobsPerPage = 10;

const emptyFilters = {
  sources: [],
  skills: [],
  locations: [],
  experienceLevels: [],
  budgetRange: "",
  budgetType: "any",
  postedWithin: "",
  projectStatuses: [],
  min_requirements: "",
  location: "",
  experience: "",
  techStack: "",
  rating: "",
};

const sourceCatalog = [
  { name: "Freelancer", domain: "freelancer.com" },
  { name: "Twine", domain: "twine.net" },
  { name: "RemoteOK", domain: "remoteok.com" },
  { name: "We Work Remotely", domain: "weworkremotely.com" },
  { name: "Remotive", domain: "remotive.com" },
  { name: "Truelancer", domain: "truelancer.com" },
  { name: "Hubstaff Talent", domain: "talent.hubstaff.com" },
  { name: "Guru", domain: "guru.com" },
];

const defaultSkills = ["React", "Node.js", "Python", "AI", "MongoDB", "AWS"];
const priorityLocations = ["Remote", "India", "USA", "Europe", "Worldwide"];

const experienceOptions = [
  { label: "Any experience", value: "" },
  { label: "Entry", value: "entry" },
  { label: "Junior", value: "junior" },
  { label: "Mid Level", value: "mid" },
  { label: "Senior", value: "senior" },
  { label: "Expert", value: "expert" },
];

const budgetRangeOptions = [
  { label: "Any budget", value: "" },
  { label: "Under $100", value: "<100" },
  { label: "$100 - $500", value: "100-500" },
  { label: "$500 - $1,000", value: "500-1000" },
  { label: "$1,000 - $5,000", value: "1000-5000" },
  { label: "$5,000+", value: "5000+" },
];

const budgetTypeOptions = [
  { label: "Any", value: "any" },
  { label: "Fixed", value: "fixed" },
  { label: "Hourly", value: "hourly" },
];

const postedWithinOptions = [
  { label: "Any time", value: "" },
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 3 days", value: "3d" },
  { label: "Last week", value: "7d" },
  { label: "Last month", value: "30d" },
];

const sortOptions = [
  { label: "New gigs first", value: "new" },
  { label: "Recently discovered", value: "discovered" },
  { label: "Recently posted", value: "posted" },
  { label: "Budget: high to low", value: "budgetHigh" },
  { label: "Budget: low to high", value: "budgetLow" },
];

const fallbackProjectStatuses = ["Open", "Urgent", "Actively Hiring", "Long Term", "Short Term"];
const preferenceNoticeStorageKey = "gigworld:preference-notice-dismissed";

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

const getTechStack = (job) => (Array.isArray(job?.tech_stack) ? job.tech_stack : []);

const getPreferenceTagClass = (tag) => {
  if (tag === "Your profile matches") {
    return "recommended-pill-motion border-transparent bg-emerald-50 text-emerald-700";
  }

  if (tag === "Recommended for you") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (tag === "Skill match" || tag === "Category match" || tag === "Work type match") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
};

const formatDate = (value) => {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

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
    };
  }

  return {
    name: matchedSource.name,
    logo: `https://www.google.com/s2/favicons?domain=${matchedSource.domain}&sz=64`,
  };
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

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pageSet = new Set([
    1,
    2,
    3,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    totalPages - 2,
    totalPages - 1,
    totalPages,
  ]);

  const visiblePages = Array.from(pageSet)
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((firstPage, secondPage) => firstPage - secondPage);

  return visiblePages.reduce((items, pageNumber, index) => {
    const previousPage = visiblePages[index - 1];

    if (previousPage && pageNumber - previousPage > 1) {
      items.push(`ellipsis-${previousPage}-${pageNumber}`);
    }

    items.push(pageNumber);
    return items;
  }, []);
};

const uniqueOptions = (values) => (
  values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value, index, list) => list.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index)
);

const prioritizeLocations = (values) => {
  const uniqueValues = uniqueOptions(values);
  const priorityMatches = priorityLocations.filter((priority) =>
    uniqueValues.some((value) => value.toLowerCase().includes(priority.toLowerCase()))
  );
  const remaining = uniqueValues.filter((value) =>
    !priorityMatches.some((priority) => value.toLowerCase().includes(priority.toLowerCase()))
  );

  return uniqueOptions([...priorityMatches, ...remaining]).slice(0, 8);
};

const GigCardSkeleton = () => (
  <article className="rounded-lg border border-blue-300 bg-white p-5 shadow-sm ring-1 ring-blue-100/80" aria-hidden="true">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="w-full max-w-2xl">
        <div className="flex gap-2">
          <div className="shimmer-block h-7 w-24 rounded-full" />
          <div className="shimmer-block h-7 w-32 rounded-full" />
        </div>
        <div className="shimmer-block mt-4 h-7 w-4/5 rounded-md" />
        <div className="shimmer-block mt-3 h-4 w-56 rounded-md" />
      </div>
      <div className="shimmer-block h-5 w-28 rounded-md" />
    </div>

    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <div className="shimmer-block h-4 rounded-md" />
      <div className="shimmer-block h-4 rounded-md" />
      <div className="shimmer-block h-4 rounded-md" />
    </div>

    <div className="mt-5 flex flex-wrap gap-2">
      <div className="shimmer-block h-8 w-24 rounded-md" />
      <div className="shimmer-block h-8 w-28 rounded-md" />
      <div className="shimmer-block h-8 w-20 rounded-md" />
      <div className="shimmer-block h-8 w-24 rounded-md" />
    </div>

    <div className="mt-5 flex flex-col gap-3 border-t border-blue-300 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="w-full">
        <div className="shimmer-block h-4 w-full rounded-md" />
        <div className="shimmer-block mt-2 h-4 w-2/3 rounded-md" />
      </div>
      <div className="flex shrink-0 gap-2">
        <div className="shimmer-block h-11 w-28 rounded-lg" />
        <div className="shimmer-block h-11 w-24 rounded-lg" />
      </div>
    </div>
  </article>
);

const WorkSearchPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [filters, setFilters] = useState(emptyFilters);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortBy, setSortBy] = useState("new");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [trackingMessage, setTrackingMessage] = useState("");
  const [trackingPromptJob, setTrackingPromptJob] = useState(null);
  const [savingJobIds, setSavingJobIds] = useState([]);
  const [preferencesIncomplete, setPreferencesIncomplete] = useState(false);
  const [isPreferenceNoticeDismissed, setIsPreferenceNoticeDismissed] = useState(
    () => localStorage.getItem(preferenceNoticeStorageKey) === "true",
  );

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const res = await axios.get("http://localhost:2610/api/v1/jobs/filter-options");
        setFilterOptions(res.data?.data || {});
      } catch (requestError) {
        console.error(requestError);
        setFilterOptions({});
      }
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.post(
          "http://localhost:2610/api/v1/jobs/",
          {
            searchKeyword,
            filters,
            sortBy,
            page: currentPage,
            perPage: jobsPerPage,
          },
          token
            ? {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            : undefined,
        );

        const nextJobs = res.data?.data || [];
        setJobs(nextJobs);
        setTotalJobs(res.data?.totalJobs || nextJobs.length);
        setPreferencesIncomplete(Boolean(res.data?.preferencesIncomplete));
      } catch (requestError) {
        console.error(requestError);
        const readableMessage = getReadableErrorMessage(
          requestError,
          TOAST_FAILURE.GIGS_LOAD_FAILED,
        );
        setError(readableMessage);
        showToast({ type: "error", message: readableMessage });
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [currentPage, filters, searchKeyword, showToast, sortBy]);

  const sourceOptions = (
    filterOptions.sourceWebsites?.length
      ? filterOptions.sourceWebsites
      : sourceCatalog.map((source) => source.domain)
  ).map((value) => ({
    value,
    ...getSourceMeta(value),
  }));

  const skillOptions = uniqueOptions(filterOptions.skills?.length ? filterOptions.skills : defaultSkills).slice(0, 14);
  const locationOptions = prioritizeLocations(filterOptions.locations?.length ? filterOptions.locations : priorityLocations);
  const statusOptions = uniqueOptions(
    filterOptions.projectStatuses?.length ? filterOptions.projectStatuses : fallbackProjectStatuses
  ).slice(0, 8);
  const totalPages = Math.max(Math.ceil(totalJobs / jobsPerPage), 1);
  const paginationItems = getPaginationItems(currentPage, totalPages);

  const updateSearch = (value) => {
    setSearchKeyword(value);
    setCurrentPage(1);
  };

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setCurrentPage(1);
  };

  const updateSort = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const toggleArrayFilter = (name, value) => {
    setFilters((current) => {
      const currentValues = current[name] || [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return { ...current, [name]: nextValues };
    });
    setCurrentPage(1);
  };

  const addArrayFilter = (name, value) => {
    if (!value) {
      return;
    }

    setFilters((current) => {
      const currentValues = current[name] || [];

      if (currentValues.includes(value)) {
        return current;
      }

      return { ...current, [name]: [...currentValues, value] };
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setSearchKeyword("");
    setCurrentPage(1);
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setIsSourceDropdownOpen(false);
    setCurrentPage(1);
  };

  const dismissPreferenceNotice = () => {
    localStorage.setItem(preferenceNoticeStorageKey, "true");
    setIsPreferenceNoticeDismissed(true);
  };

  const trackGig = async (job, status = "Viewed source", sourceOpened = false) => {
    const token = localStorage.getItem("authToken");

    if (!job?._id) {
      const message = TOAST_FAILURE.GIG_TRACKER_SAVE_FAILED;
      setTrackingMessage(message);
      showToast({ type: "error", message });
      return false;
    }

    if (!token) {
      const message = TOAST_FAILURE.SIGNIN_TO_TRACK;
      setTrackingMessage(message);
      showToast({
        type: "error",
        message,
        action: { label: "Sign in", onClick: () => navigate("/signin") },
      });
      return false;
    }

    setSavingJobIds((current) => (current.includes(job._id) ? current : [...current, job._id]));

    try {
      const response = await axios.post(
        `http://localhost:2610/api/v1/applications/track/${job._id}`,
        {
          status,
          sourceOpened,
          sourceWebsite: job.source_website,
          sourceUrl: job.source_url,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const message = response.data?.message || (
        status === "Applied"
          ? TOAST_SUCCESS.GIG_MARKED_APPLIED(job.job_title || "Gig")
          : TOAST_SUCCESS.GIG_SAVED_TO_TRACKER(job.job_title || "Gig")
      );
      const toastType = response.data?.alreadyTracked ? "info" : "success";

      setTrackingMessage(message);
      showToast({
        type: toastType,
        title: toastType === "info" ? TOAST_INFO.ALREADY_TRACKED_TITLE : TOAST_INFO.SAVED_TITLE,
        message,
        action: { label: "Open tracker", onClick: () => navigate("/job-application-status") },
      });
      return true;
    } catch (requestError) {
      console.error(requestError);
      const message = getReadableErrorMessage(requestError, TOAST_FAILURE.GIG_TRACKER_SAVE_FAILED);
      setTrackingMessage(message);
      showToast({ type: "error", message });
      return false;
    } finally {
      setSavingJobIds((current) => current.filter((jobId) => jobId !== job._id));
    }
  };

  const openSourcePrompt = (job) => {
    setTrackingPromptJob(job);
    setTrackingMessage("");
  };

  const handleDetailsClick = (jobId) => {
    navigate(`/gigs/${jobId}`);
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(Math.min(Math.max(pageNumber, 1), totalPages));
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const activeFilterChips = [
    searchKeyword && {
      key: "search",
      label: `Search: ${searchKeyword}`,
      onRemove: () => updateSearch(""),
    },
    ...filters.sources.map((source) => ({
      key: `source-${source}`,
      label: getSourceMeta(source).name,
      onRemove: () => toggleArrayFilter("sources", source),
    })),
    ...filters.skills.map((skill) => ({
      key: `skill-${skill}`,
      label: skill,
      onRemove: () => toggleArrayFilter("skills", skill),
    })),
    ...filters.locations.map((location) => ({
      key: `location-${location}`,
      label: location,
      onRemove: () => toggleArrayFilter("locations", location),
    })),
    filters.experienceLevels[0] && {
      key: "experience",
      label: experienceOptions.find((option) => option.value === filters.experienceLevels[0])?.label,
      onRemove: () => updateFilter("experienceLevels", []),
    },
    filters.budgetRange && {
      key: "budgetRange",
      label: budgetRangeOptions.find((option) => option.value === filters.budgetRange)?.label,
      onRemove: () => updateFilter("budgetRange", ""),
    },
    filters.budgetType !== "any" && {
      key: "budgetType",
      label: budgetTypeOptions.find((option) => option.value === filters.budgetType)?.label,
      onRemove: () => updateFilter("budgetType", "any"),
    },
    filters.postedWithin && {
      key: "postedWithin",
      label: postedWithinOptions.find((option) => option.value === filters.postedWithin)?.label,
      onRemove: () => updateFilter("postedWithin", ""),
    },
    ...filters.projectStatuses.map((status) => ({
      key: `status-${status}`,
      label: status,
      onRemove: () => toggleArrayFilter("projectStatuses", status),
    })),
    filters.min_requirements && {
      key: "requirements",
      label: `Requirement: ${filters.min_requirements}`,
      onRemove: () => updateFilter("min_requirements", ""),
    },
  ].filter(Boolean);

  const activeFilters = activeFilterChips.length;

  return (
    <div className="min-h-screen bg-[#f7fafc] text-slate-950">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-blue-900/20 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 text-white shadow-xl shadow-blue-950/20 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-sky-300">Find freelance work</p>
              <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
                Fresh opportunities
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
                Compare gigs from multiple freelance sources and apply when the fit is right.
              </p>
            </div>
            <div className="grid gap-3 sm:w-[520px] sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/10 px-5 py-5">
                <p className="text-3xl font-black text-white">{totalJobs}</p>
                <p className="mt-2 text-xs font-black uppercase text-sky-300">gigs</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 px-5 py-5">
                <p className="text-3xl font-black text-white">8+</p>
                <p className="mt-2 text-xs font-black uppercase text-emerald-300">sources</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 px-5 py-5">
                <p className="text-3xl font-black text-white">{activeFilters}</p>
                <p className="mt-2 text-xs font-black uppercase text-slate-300">filters</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-[320px_minmax(0,1fr)]">
          <aside>
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain rounded-lg border border-blue-400 bg-white p-5 shadow-xl shadow-blue-100/80 ring-1 ring-blue-200/70">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase text-blue-700">Search & filters</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">Refine gigs</h2>
                </div>
                {activeFilters > 0 && (
                  <span className="inline-flex h-8 min-w-[4rem] shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-blue-50 px-3 text-xs font-black text-blue-700">
                    {activeFilters} on
                  </span>
                )}
              </div>

              <form onSubmit={handleFilterSubmit} className="mt-5 grid gap-5">
                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-500">Search</span>
                  <input
                    type="search"
                    value={searchKeyword}
                    onChange={(event) => updateSearch(event.target.value)}
                    placeholder="Role, skill, or keyword"
                    className="mt-2 block w-full rounded-lg border-blue-100 bg-blue-50/40 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20"
                  />
                </label>

                <div
                  className="relative"
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setIsSourceDropdownOpen(false);
                    }
                  }}
                >
                  <p className="text-xs font-bold uppercase text-slate-500">Source websites</p>
                  <button
                    type="button"
                    onClick={() => setIsSourceDropdownOpen((current) => !current)}
                    className="mt-2 flex w-full items-center justify-between rounded-lg border border-blue-100 bg-blue-50/40 px-4 py-3 text-left text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-blue-50 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    aria-expanded={isSourceDropdownOpen}
                  >
                    <span>Choose source</span>
                    <svg className="h-4 w-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isSourceDropdownOpen && (
                    <div className="absolute left-0 right-0 z-20 mt-2 max-h-56 overflow-y-auto rounded-lg border border-blue-100 bg-white p-2 shadow-xl shadow-slate-200/80">
                      {sourceOptions.slice(0, 8).map((source) => {
                        const isSelected = filters.sources.includes(source.value);

                        return (
                          <button
                            key={source.value}
                            type="button"
                            disabled={isSelected}
                            onClick={() => {
                              addArrayFilter("sources", source.value);
                              setIsSourceDropdownOpen(false);
                            }}
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-bold text-slate-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <img src={source.logo} alt={`${source.name} logo`} className="h-5 w-5 rounded-sm" />
                            <span>{source.name}</span>
                            {isSelected && <span className="ml-auto text-xs text-blue-700">Added</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {filters.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.sources.map((sourceValue) => {
                        const source = getSourceMeta(sourceValue);

                        return (
                          <button
                            key={sourceValue}
                            type="button"
                            onClick={() => toggleArrayFilter("sources", sourceValue)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                          >
                            <img src={source.logo} alt={`${source.name} logo`} className="h-4 w-4 rounded-sm" />
                            {source.name} x
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-500">Skills</span>
                    <select
                      value=""
                      onChange={(event) => addArrayFilter("skills", event.target.value)}
                      className="mt-2 block w-full rounded-lg border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">Choose skill</option>
                      {skillOptions.map((skill) => (
                        <option key={skill} value={skill} disabled={filters.skills.includes(skill)}>
                          {skill}
                        </option>
                      ))}
                    </select>
                  </label>
                  {filters.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.skills.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleArrayFilter("skills", skill)}
                          className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                        >
                          {skill} x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-500">Location</span>
                    <select
                      value=""
                      onChange={(event) => addArrayFilter("locations", event.target.value)}
                      className="mt-2 block w-full rounded-lg border-blue-100 bg-blue-50/40 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20"
                    >
                      <option value="">Choose location</option>
                      {locationOptions.map((location) => (
                        <option key={location} value={location} disabled={filters.locations.includes(location)}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </label>
                  {filters.locations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.locations.map((location) => (
                        <button
                          key={location}
                          type="button"
                          onClick={() => toggleArrayFilter("locations", location)}
                          className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                        >
                          {location} x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-500">Experience</span>
                  <select
                    value={filters.experienceLevels[0] || ""}
                    onChange={(event) => updateFilter("experienceLevels", event.target.value ? [event.target.value] : [])}
                    className="mt-2 block w-full rounded-lg border-blue-100 bg-blue-50/40 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20"
                  >
                    {experienceOptions.map((option) => (
                      <option key={option.value || "any"} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-500">Budget</span>
                  <select
                    value={filters.budgetRange}
                    onChange={(event) => updateFilter("budgetRange", event.target.value)}
                    className="mt-2 block w-full rounded-lg border-blue-100 bg-blue-50/40 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20"
                  >
                    {budgetRangeOptions.map((option) => (
                      <option key={option.value || "any"} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Work type</p>
                  <div className="mt-2 grid grid-cols-3 overflow-hidden rounded-lg border border-blue-200 bg-white">
                    {budgetTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateFilter("budgetType", option.value)}
                        className={`px-3 py-2 text-xs font-black transition ${
                          filters.budgetType === option.value
                            ? "bg-blue-700 text-white"
                            : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-500">Posted time</span>
                  <select
                    value={filters.postedWithin}
                    onChange={(event) => updateFilter("postedWithin", event.target.value)}
                    className="mt-2 block w-full rounded-lg border-blue-100 bg-blue-50/40 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20"
                  >
                    {postedWithinOptions.map((option) => (
                      <option key={option.value || "any"} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <details className="rounded-lg border border-blue-100 bg-slate-50 p-4">
                  <summary className="cursor-pointer text-sm font-black text-slate-950">Advanced filters</summary>
                  <div className="mt-4 grid gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">Project status</p>
                      <div className="mt-2 grid gap-2">
                        {statusOptions.map((status) => (
                          <label key={status} className="flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-700">
                            <input
                              type="checkbox"
                              checked={filters.projectStatuses.includes(status)}
                              onChange={() => toggleArrayFilter("projectStatuses", status)}
                              className="h-4 w-4 rounded border-blue-300 text-blue-700 focus:ring-blue-600"
                            />
                            {status}
                          </label>
                        ))}
                      </div>
                    </div>
                    <label className="block">
                      <span className="text-xs font-bold uppercase text-slate-500">Requirements contain</span>
                      <input
                        type="text"
                        value={filters.min_requirements}
                        onChange={(event) => updateFilter("min_requirements", event.target.value)}
                        placeholder="Portfolio, English, Figma"
                        className="mt-2 block w-full rounded-lg border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                      />
                    </label>
                  </div>
                </details>
              </form>

              {activeFilterChips.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-blue-100 pt-4">
                  {activeFilterChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={chip.onRemove}
                      className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                      title="Remove filter"
                    >
                      {chip.label} x
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 w-full rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
              >
                Clear all filters
              </button>
            </div>
          </aside>

          <div>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-blue-700">Gig posts</p>
                <h2 className="text-2xl font-black text-slate-950">Browse matching gigs</h2>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  <span className="text-xs uppercase tracking-wide text-blue-700">Sort</span>
                  <span className="relative inline-flex">
                    <select
                      value={sortBy}
                      onChange={(event) => updateSort(event.target.value)}
                      className="min-w-[210px] appearance-none rounded-full border border-blue-300 bg-gradient-to-r from-white to-blue-50 py-3 pl-5 pr-12 text-sm font-bold leading-5 text-slate-950 shadow-sm shadow-blue-100/80 transition hover:border-blue-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </label>
                <p className="text-sm font-semibold text-slate-500">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
            </div>

            {trackingMessage && (
              <div className="mb-4 flex flex-col gap-3 rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800 sm:flex-row sm:items-center sm:justify-between">
                <span>{trackingMessage}</span>
                <button
                  type="button"
                  onClick={() => navigate("/job-application-status")}
                  className="text-left text-blue-700 underline underline-offset-4 hover:text-blue-900"
                >
                  Open tracker
                </button>
              </div>
            )}

            {preferencesIncomplete && !isPreferenceNoticeDismissed && (
              <div className="mb-4 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
                <span>Complete your gig preferences to get better recommendations.</span>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/gig-preferences")}
                    className="text-left text-emerald-800 underline underline-offset-4 hover:text-emerald-950"
                  >
                    Complete preferences
                  </button>
                  <button
                    type="button"
                    onClick={dismissPreferenceNotice}
                    className="text-left text-slate-600 underline underline-offset-4 hover:text-slate-900"
                  >
                    Not now
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {isLoading && (
                <>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <GigCardSkeleton key={index} />
                  ))}
                </>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              {!isLoading && !error && jobs.length === 0 && (
                <div className="rounded-lg border border-blue-200 bg-white p-8 text-center shadow-sm">
                  <h2 className="text-xl font-black text-slate-950">No gigs match this search</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Try removing a filter or searching for a broader skill.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-5 rounded-lg bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
                  >
                    Reset search
                  </button>
                </div>
              )}

              {jobs.map((job) => {
                const techStack = getTechStack(job);
                const source = getSourceMeta(job.source_website);
                const isSavingGig = savingJobIds.includes(job._id);
                const preferenceTags = Array.isArray(job.preferenceTags) ? job.preferenceTags : [];
                const primaryPreferenceTags = preferenceTags.filter((tag) =>
                  ["Your profile matches", "Recommended for you", "Skill match", "Category match"].includes(tag)
                );
                const secondaryPreferenceTags = preferenceTags.filter((tag) => !primaryPreferenceTags.includes(tag));
                const briefPreview = getGigBriefPreview(job.min_requirements);

                return (
                  <article
                    key={job._id}
                    className="rounded-lg border border-blue-300 bg-white p-5 shadow-sm ring-1 ring-blue-100/80 transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-100/80"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {job.is_new && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                              New gig
                            </span>
                          )}
                          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                            <img src={source.logo} alt={`${source.name} logo`} className="h-4 w-4 rounded-sm" />
                            {source.name}
                          </span>
                          {primaryPreferenceTags.map((tag) => (
                            <span
                              key={tag}
                              className={`rounded-full border px-3 py-1 text-xs font-black ${getPreferenceTagClass(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        {secondaryPreferenceTags.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {secondaryPreferenceTags.map((tag) => (
                              <span
                                key={tag}
                                className={`rounded-full border px-3 py-1 text-xs font-black ${getPreferenceTagClass(tag)}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <h2 className="mt-3 text-xl font-black leading-snug text-slate-950">
                          {job.job_title}
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {job.company_name || "Client listed on source platform"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 whitespace-nowrap text-left sm:min-w-[170px] sm:justify-end sm:text-right">
                        <span className="text-xs font-black uppercase tracking-wide text-blue-700">Budget</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-base font-black text-slate-950">{formatBudget(job)}</span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                      <p><span className="font-bold text-slate-950">Location:</span> {job.location || "Remote"}</p>
                      <p><span className="font-bold text-slate-950">Experience:</span> {job.experience || "Flexible"}</p>
                      <p><span className="font-bold text-slate-950">Posted:</span> {formatDate(job.postedAt || job.first_seen_at)}</p>
                    </div>

                    <div className="mt-4 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap gap-2">
                        {techStack.length > 0 && (
                          <>
                            {techStack.slice(0, 5).map((tech) => (
                              <span key={tech} className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                {tech}
                              </span>
                            ))}
                            {techStack.length > 5 && (
                              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                +{techStack.length - 5} more
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => trackGig(job, "Planning to apply")}
                        disabled={isSavingGig}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:border-blue-400 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-wait disabled:opacity-60"
                        aria-label={`Save ${job.job_title} to tracker`}
                        title={isSavingGig ? "Saving gig" : "Save gig"}
                      >
                        <SaveIcon />
                      </button>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-blue-300 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="line-clamp-2 text-sm leading-6 text-slate-500">
                        {briefPreview || "Review the gig details and apply when it matches your skills."}
                      </p>
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => handleDetailsClick(job._id)}
                          className="rounded-lg border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
                        >
                          View details
                        </button>
                        {job.source_url ? (
                          <a
                            href={job.source_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => openSourcePrompt(job)}
                            className="rounded-lg bg-blue-700 px-5 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
                          >
                            Apply now
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => trackGig(job, "Planning to apply")}
                            className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
                          >
                            Track gig
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}

              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className="h-10 rounded-lg border border-blue-200 bg-white px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white"
                  >
                    Prev
                  </button>

                  {paginationItems.map((item) => (
                    typeof item === "number" ? (
                      <button
                        key={item}
                        type="button"
                        onClick={() => goToPage(item)}
                        disabled={isLoading}
                        className={`h-10 min-w-10 rounded-lg px-3 text-sm font-bold transition disabled:cursor-not-allowed ${
                          currentPage === item
                            ? "bg-blue-700 text-white"
                            : "border border-blue-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        {item}
                      </button>
                    ) : (
                      <span key={item} className="flex h-10 min-w-8 items-center justify-center text-sm font-black text-slate-400">
                        ...
                      </span>
                    )
                  ))}

                  <button
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    className="h-10 rounded-lg border border-blue-200 bg-white px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {trackingPromptJob && (
        <div className="fixed bottom-5 right-5 z-50 w-[calc(100%-2.5rem)] max-w-sm rounded-lg border border-blue-300/80 bg-white/75 p-5 shadow-2xl shadow-blue-950/20 backdrop-blur-xl ring-1 ring-white/70">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase text-blue-700">Application tracker</p>
              <h3 className="mt-1 text-lg font-black text-slate-950">Track this application?</h3>
            </div>
            <button
              type="button"
              onClick={() => setTrackingPromptJob(null)}
              className="rounded-md px-2 py-1 text-sm font-black text-slate-400 transition hover:bg-white/70 hover:text-slate-700"
              aria-label="Close tracking prompt"
            >
              x
            </button>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Keep <span className="font-bold text-slate-950">{trackingPromptJob.job_title}</span> in your GigWorld tracker after visiting the source site.
          </p>
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={async () => {
                await trackGig(trackingPromptJob, "Applied", true);
                setTrackingPromptJob(null);
              }}
              className="rounded-lg bg-blue-700 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-800"
            >
              Mark as applied
            </button>
            <button
              type="button"
              onClick={async () => {
                await trackGig(trackingPromptJob, "Planning to apply", true);
                setTrackingPromptJob(null);
              }}
              className="rounded-lg border border-blue-200 bg-white/60 px-4 py-3 text-sm font-black text-blue-700 backdrop-blur transition hover:bg-blue-50/90"
            >
              Save for later
            </button>
            <button
              type="button"
              onClick={() => setTrackingPromptJob(null)}
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

export default WorkSearchPage;
