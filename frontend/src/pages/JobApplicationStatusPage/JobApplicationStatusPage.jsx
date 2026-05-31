import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar/Navbar";
import CalendarInput from "../../components/CalendarInput/CalendarInput";

const fallbackStatuses = [
  "Viewed source",
  "Planning to apply",
  "Applied",
  "Interviewing",
  "Rejected",
  "Won",
  "Archived",
];

const reminderFilterOptions = [
  { label: "All reminders", value: "all" },
  { label: "With reminder", value: "withReminder" },
  { label: "No reminder", value: "noReminder" },
  { label: "Due today", value: "dueToday" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Overdue", value: "overdue" },
];

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

const trackersPerPage = 10;

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
      name: normalizedSource,
      logo: `https://www.google.com/s2/favicons?domain=${normalizedSource}&sz=64`,
    };
  }

  return {
    name: matchedSource.name,
    logo: `https://www.google.com/s2/favicons?domain=${matchedSource.domain}&sz=64`,
  };
};

const formatDate = (value) => {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const formatDateInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

const getTrackerSourceMeta = (tracker) => {
  const source = tracker.sourceWebsite || tracker.jobId?.source_website || "";
  return getSourceMeta(source);
};

const getDraftFromTracker = (tracker) => ({
  status: tracker.status || "Viewed source",
  notes: tracker.notes || "",
  reminderAt: formatDateInput(tracker.reminderAt),
});

const getPaginationItems = (currentPage, totalPages) => {
  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const normalizedPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((firstPage, secondPage) => firstPage - secondPage);

  return normalizedPages.reduce((items, page, index) => {
    if (index > 0 && page - normalizedPages[index - 1] > 1) {
      items.push(`ellipsis-${page}`);
    }

    items.push(page);
    return items;
  }, []);
};

const JobApplicationStatusPage = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [statusOptions, setStatusOptions] = useState(fallbackStatuses);
  const [sourceOptions, setSourceOptions] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [trackerSearch, setTrackerSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [reminderFilter, setReminderFilter] = useState("all");
  const [isSourceFilterOpen, setIsSourceFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchApplications = useCallback(async ({ clearMessage = true } = {}) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/signin");
      return;
    }

    setLoading(true);
    if (clearMessage) {
      setMessage("");
    }

    try {
      const response = await axios.get("http://localhost:2610/api/v1/applications/status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: currentPage,
          perPage: trackersPerPage,
          search: trackerSearch,
          status: statusFilter,
          source: sourceFilter,
          reminder: reminderFilter,
        },
      });
      const nextApplications = response.data?.data || [];
      const nextSourceOptions = (response.data?.sourceOptions || [])
        .map((source) => ({
          value: source,
          ...getSourceMeta(source),
        }))
        .sort((firstSource, secondSource) => firstSource.name.localeCompare(secondSource.name));

      setApplications(nextApplications);
      setStatusOptions(response.data?.statuses?.length ? response.data.statuses : fallbackStatuses);
      setSourceOptions(nextSourceOptions);
      setTotalApplications(response.data?.totalApplications || 0);
      setTotalPages(response.data?.totalPages || 1);
      setDrafts(
        nextApplications.reduce((nextDrafts, tracker) => ({
          ...nextDrafts,
          [tracker._id]: getDraftFromTracker(tracker),
        }), {}),
      );
    } catch (error) {
      console.error("Failed to fetch tracked gigs:", error);
      setMessage("Unable to load your tracker right now.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, navigate, reminderFilter, sourceFilter, statusFilter, trackerSearch]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const updateDraft = (trackerId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [trackerId]: {
        ...current[trackerId],
        [field]: value,
      },
    }));
  };

  const saveTracker = async (trackerId) => {
    const token = localStorage.getItem("authToken");
    const draft = drafts[trackerId];

    if (!token || !draft) {
      return;
    }

    try {
      const response = await axios.patch(
        `http://localhost:2610/api/v1/applications/${trackerId}`,
        draft,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setApplications((current) =>
        current.map((tracker) => (tracker._id === trackerId ? response.data.data : tracker)),
      );
      await fetchApplications({ clearMessage: false });
      setMessage("Tracker updated.");
    } catch (error) {
      console.error("Failed to update tracked gig:", error);
      setMessage("Unable to update this tracked gig.");
    }
  };

  const removeTracker = async (trackerId) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      return;
    }

    try {
      await axios.delete(`http://localhost:2610/api/v1/applications/${trackerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setApplications((current) => current.filter((tracker) => tracker._id !== trackerId));
      await fetchApplications({ clearMessage: false });
      setMessage("Tracked gig removed.");
    } catch (error) {
      console.error("Failed to remove tracked gig:", error);
      setMessage("Unable to remove this tracked gig.");
    }
  };

  const selectedSourceMeta = sourceOptions.find((source) => source.value === sourceFilter);
  const hasTrackerFilters = Boolean(
    trackerSearch.trim() || statusFilter || sourceFilter || reminderFilter !== "all",
  );
  const shouldShowTrackerFilters = applications.length > 0 || hasTrackerFilters || sourceOptions.length > 0 || totalApplications > 0;

  const clearTrackerFilters = () => {
    setTrackerSearch("");
    setStatusFilter("");
    setSourceFilter("");
    setReminderFilter("all");
    setIsSourceFilterOpen(false);
    setCurrentPage(1);
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(Math.min(Math.max(pageNumber, 1), totalPages));
  };
  const paginationItems = getPaginationItems(currentPage, totalPages);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-slate-950">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-blue-400 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 text-white shadow-xl shadow-blue-950/20 sm:p-8">
          <p className="text-sm font-bold uppercase text-sky-300">Application tracker</p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
            Keep every gig follow-up in one place.
          </h1>
          <p className="mt-4 max-w-5xl text-lg leading-8 text-slate-300">
            Track source applications, update status, add notes, and remember when to follow up.
          </p>
        </section>

        {message && (
          <div className="mt-5 rounded-lg border border-blue-300/80 bg-white/75 px-4 py-3 text-sm font-bold text-blue-800 shadow-sm shadow-blue-100/70 backdrop-blur-xl ring-1 ring-white/70">
            {message}
          </div>
        )}

        {loading && (
          <div className="mt-6 grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-blue-300 bg-white p-5 shadow-sm ring-1 ring-blue-100/80"
              >
                <div className="shimmer-block h-6 w-2/3 rounded-md" />
                <div className="shimmer-block mt-3 h-4 w-48 rounded-md" />
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="shimmer-block h-12 rounded-lg" />
                  <div className="shimmer-block h-12 rounded-lg" />
                  <div className="shimmer-block h-12 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !shouldShowTrackerFilters && (
          <section className="mt-6 rounded-lg border border-blue-300 bg-white p-8 text-center shadow-sm ring-1 ring-blue-100/80">
            <h2 className="text-2xl font-black text-slate-950">No tracked gigs yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Open a source listing or save a gig to start tracking your applications.
            </p>
            <Link
              to="/work"
              className="mt-5 inline-flex rounded-lg bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Browse gigs
            </Link>
          </section>
        )}

        {!loading && shouldShowTrackerFilters && (
          <>
            <section className="mt-6 rounded-lg border border-blue-300 bg-white p-5 shadow-sm ring-1 ring-blue-100/80">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase text-blue-700">Search & filters</p>
                  <h2 className="text-2xl font-black text-slate-950">Find tracked gigs faster</h2>
                </div>
                <p className="text-sm font-bold text-slate-500">
                  Showing {applications.length} of {totalApplications}
                </p>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-500">Search</span>
                  <input
                    type="search"
                    value={trackerSearch}
                    onChange={(event) => {
                      setTrackerSearch(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Gig title, client, source, notes..."
                    className="mt-2 block w-full rounded-lg border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-500">Status</span>
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="mt-2 block w-full rounded-lg border-blue-200 bg-blue-50/40 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  >
                    <option value="">All statuses</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <div className="relative">
                  <span className="text-xs font-bold uppercase text-slate-500">Source</span>
                  <button
                    type="button"
                    onClick={() => setIsSourceFilterOpen((current) => !current)}
                    className="mt-2 flex h-[46px] w-full items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50/40 px-4 text-left text-sm font-bold text-slate-900 transition hover:bg-blue-50 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      {selectedSourceMeta ? (
                        <>
                          <img src={selectedSourceMeta.logo} alt={`${selectedSourceMeta.name} logo`} className="h-5 w-5 shrink-0 rounded-sm bg-white" />
                          <span className="truncate">{selectedSourceMeta.name}</span>
                        </>
                      ) : (
                        <span>All sources</span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400">v</span>
                  </button>

                  {isSourceFilterOpen && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-lg border border-blue-200 bg-white p-2 shadow-xl shadow-blue-950/10">
                      <button
                        type="button"
                        onClick={() => {
                          setSourceFilter("");
                          setCurrentPage(1);
                          setIsSourceFilterOpen(false);
                        }}
                        className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-bold transition ${
                          !sourceFilter ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-blue-50"
                        }`}
                      >
                        All sources
                      </button>
                      {sourceOptions.map((source) => (
                        <button
                          type="button"
                          key={source.value}
                          onClick={() => {
                            setSourceFilter(source.value);
                            setCurrentPage(1);
                            setIsSourceFilterOpen(false);
                          }}
                          className={`mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold transition ${
                            sourceFilter === source.value ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-blue-50"
                          }`}
                        >
                          <img src={source.logo} alt={`${source.name} logo`} className="h-5 w-5 shrink-0 rounded-sm bg-white" />
                          <span className="truncate">{source.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-500">Reminder</span>
                  <select
                    value={reminderFilter}
                    onChange={(event) => {
                      setReminderFilter(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="mt-2 block w-full rounded-lg border-blue-200 bg-blue-50/40 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  >
                    {reminderFilterOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              {hasTrackerFilters && (
                <button
                  type="button"
                  onClick={clearTrackerFilters}
                  className="mt-4 rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
                >
                  Clear tracker filters
                </button>
              )}
            </section>

            {applications.length === 0 && (
              <section className="mt-4 rounded-lg border border-blue-200 bg-white p-8 text-center shadow-sm">
                <h2 className="text-xl font-black text-slate-950">No tracked gigs match</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Try a different keyword, status, source, or reminder filter.
                </p>
                <button
                  type="button"
                  onClick={clearTrackerFilters}
                  className="mt-5 rounded-lg bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
                >
                  Clear filters
                </button>
              </section>
            )}

            <div className="mt-6 grid gap-4">
            {applications.map((tracker) => {
              const job = tracker.jobId || {};
              const draft = drafts[tracker._id] || getDraftFromTracker(tracker);
              const sourceUrl = tracker.sourceUrl || job.source_url;
              const sourceMeta = getTrackerSourceMeta(tracker);

              return (
                <article
                  key={tracker._id}
                  className="rounded-lg border border-blue-300 bg-white p-5 shadow-sm ring-1 ring-blue-100/80"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                          <img src={sourceMeta.logo} alt={`${sourceMeta.name} logo`} className="h-4 w-4 rounded-sm bg-white" />
                          {sourceMeta.name}
                        </span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                          {draft.status}
                        </span>
                      </div>
                      <h2 className="mt-3 text-2xl font-black leading-snug text-slate-950">
                        {job.job_title || "Tracked gig"}
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {job.company_name || "Source client"} - {job.location || "Remote"}
                      </p>
                    </div>

                    <div className="text-sm font-bold text-slate-500 lg:text-right">
                      <p>Last updated</p>
                      <p className="mt-1 text-slate-950">{formatDate(tracker.updatedAt || tracker.createdAt)}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <label className="block">
                      <span className="text-xs font-bold uppercase text-slate-500">Status</span>
                      <select
                        value={draft.status}
                        onChange={(event) => updateDraft(tracker._id, "status", event.target.value)}
                        className="mt-2 block w-full rounded-lg border-blue-200 bg-blue-50/40 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold uppercase text-slate-500">Reminder</span>
                      <div className="mt-2">
                        <CalendarInput
                          value={draft.reminderAt}
                          onChange={(value) => updateDraft(tracker._id, "reminderAt", value)}
                          placeholder="Select reminder date"
                          ariaLabel="Select reminder date"
                        />
                      </div>
                    </label>

                    <div>
                      <span className="text-xs font-bold uppercase text-slate-500">Source</span>
                      {sourceUrl ? (
                        <a
                          href={sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 flex h-[46px] items-center rounded-lg border border-blue-200 px-4 text-sm font-black text-blue-700 transition hover:bg-blue-50"
                        >
                          Open source listing
                        </a>
                      ) : (
                        <p className="mt-2 flex h-[46px] items-center rounded-lg border border-blue-200 px-4 text-sm font-bold text-slate-500">
                          No source link
                        </p>
                      )}
                    </div>
                  </div>

                  <label className="mt-5 block">
                    <span className="text-xs font-bold uppercase text-slate-500">Notes</span>
                    <textarea
                      value={draft.notes}
                      onChange={(event) => updateDraft(tracker._id, "notes", event.target.value)}
                      rows="3"
                      placeholder="Add follow-up notes, client response, next step, or deadline..."
                      className="mt-2 block w-full rounded-lg border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    />
                  </label>

                  <div className="mt-5 flex flex-col gap-3 border-t border-blue-300 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-slate-500">
                      Applied date: {formatDate(tracker.appliedAt)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => removeTracker(tracker._id)}
                        className="rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => saveTracker(tracker._id)}
                        className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
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
                      disabled={loading}
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
                  disabled={currentPage === totalPages || loading}
                  className="h-10 rounded-lg border border-blue-200 bg-white px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default JobApplicationStatusPage;
