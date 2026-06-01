/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import CalendarInput from "../../components/CalendarInput/CalendarInput";
import Footer from "../../components/Footer/Footer";
import Navbar from "../../components/Navbar/Navbar";
import { getReadableErrorMessage, useToast } from "../../components/Toast/ToastProvider";
import { TOAST_FAILURE, TOAST_SUCCESS } from "../../constants/toastMessages";

const API_BASE_URL = "http://localhost:2610";

const defaultLinks = [
  { label: "LinkedIn", url: "" },
  { label: "GitHub", url: "" },
  { label: "Portfolio website", url: "" },
  { label: "Behance / Dribbble", url: "" },
];

const emptyProjectForm = {
  title: "",
  description: "",
  technologies: "",
  projectLink: "",
};

const emptyEducationEntry = {
  institutionName: "",
  degreeName: "",
  year: "",
  marks: "",
  marksType: "percentage",
  location: "",
};

const emptyWorkExperienceEntry = {
  companyName: "",
  designation: "",
  startDate: "",
  endDate: "",
  location: "",
  isRemote: false,
  whatLearned: "",
};

const marksTypeOptions = [
  { value: "percentage", label: "Percentage", suffix: "%" },
  { value: "cgpa", label: "CGPA", suffix: "CGPA" },
];

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
});

const normalizeLinks = (links = []) => {
  const mergedLinks = defaultLinks.map((defaultLink) => {
    const matchedLink = links.find((link) => link.label === defaultLink.label);
    return matchedLink || defaultLink;
  });
  const customLinks = links.filter((link) => !defaultLinks.some((defaultLink) => defaultLink.label === link.label));
  return [...mergedLinks, ...customLinks];
};

const getLinkUrlError = (link = {}) => {
  const url = String(link.url || "").trim();

  if (!url || /^https:\/\//i.test(url)) {
    return "";
  }

  return "URL must start with https://";
};

const getFirstLinkError = (links = []) => {
  const invalidLink = links.find((link) => getLinkUrlError(link));

  if (!invalidLink) {
    return "";
  }

  return `${invalidLink.label || "Link"} URL must start with https://`;
};

const hasEducationEntryValue = (entry = {}) =>
  Boolean(entry.institutionName || entry.degreeName || entry.year || entry.marks || entry.location);

const hasWorkExperienceEntryValue = (entry = {}) =>
  Boolean(
    entry.companyName ||
      entry.designation ||
      entry.startDate ||
      entry.endDate ||
      entry.location ||
      entry.isRemote ||
      entry.whatLearned,
  );

const cleanMarksValue = (value = "") => value.replace(/\s*(%|cgpa)$/i, "").trim();

const normalizeMarksType = (value = "", marks = "") => {
  if (value === "cgpa" || /cgpa/i.test(marks)) {
    return "cgpa";
  }

  return "percentage";
};

const getMarksSuffix = (marksType = "percentage") =>
  marksTypeOptions.find((option) => option.value === marksType)?.suffix || "%";

const formatMarks = (marks = "", marksType = "percentage") => {
  const cleanedMarks = cleanMarksValue(marks);

  if (!cleanedMarks) {
    return "";
  }

  return `${cleanedMarks}${marksType === "cgpa" ? " CGPA" : "%"}`;
};

const normalizeEducationDetails = (educationDetails = [], fallbackEducation = "") => {
  if (Array.isArray(educationDetails) && educationDetails.length > 0) {
    const normalizedEntries = educationDetails.map((entry) => ({
      ...emptyEducationEntry,
      ...entry,
      marks: cleanMarksValue(entry.marks || ""),
      marksType: normalizeMarksType(entry.marksType, entry.marks),
    }));

    return normalizedEntries.length ? normalizedEntries : [emptyEducationEntry];
  }

  if (fallbackEducation) {
    return [{ ...emptyEducationEntry, degreeName: fallbackEducation }];
  }

  return [emptyEducationEntry];
};

const normalizeWorkExperienceDetails = (workExperienceDetails = [], fallbackWorkExperience = "") => {
  if (Array.isArray(workExperienceDetails) && workExperienceDetails.length > 0) {
    const normalizedEntries = workExperienceDetails.map((entry) => ({
      ...emptyWorkExperienceEntry,
      ...entry,
      isRemote: Boolean(entry.isRemote),
    }));

    return normalizedEntries.length ? normalizedEntries : [emptyWorkExperienceEntry];
  }

  if (fallbackWorkExperience) {
    return [{ ...emptyWorkExperienceEntry, whatLearned: fallbackWorkExperience }];
  }

  return [emptyWorkExperienceEntry];
};

const getFilledEducationDetails = (educationDetails = []) =>
  educationDetails
    .map((entry) => ({
      institutionName: (entry.institutionName || "").trim(),
      degreeName: (entry.degreeName || "").trim(),
      year: (entry.year || "").trim(),
      marks: cleanMarksValue(entry.marks || ""),
      marksType: normalizeMarksType(entry.marksType, entry.marks),
      location: (entry.location || "").trim(),
    }))
    .filter(hasEducationEntryValue);

const getFilledWorkExperienceDetails = (workExperienceDetails = []) =>
  workExperienceDetails
    .map((entry) => ({
      companyName: (entry.companyName || "").trim(),
      designation: (entry.designation || "").trim(),
      startDate: (entry.startDate || "").trim(),
      endDate: (entry.endDate || "").trim(),
      location: (entry.location || "").trim(),
      isRemote: Boolean(entry.isRemote),
      whatLearned: (entry.whatLearned || "").trim(),
    }))
    .filter(hasWorkExperienceEntryValue);

const formatMonthYear = (value = "") => {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  }

  return value;
};

const formatEducationEntry = (entry) => {
  const title = [entry.degreeName, entry.institutionName].filter(Boolean).join(" - ");
  const meta = [
    entry.year ? `Year: ${formatMonthYear(entry.year)}` : "",
    entry.marks ? `Marks: ${formatMarks(entry.marks, entry.marksType)}` : "",
    entry.location ? `Location: ${entry.location}` : "",
  ].filter(Boolean);

  return [title, meta.join(", ")].filter(Boolean).join("\n");
};

const buildEducationText = (portfolio = {}) => {
  const educationDetails = getFilledEducationDetails(portfolio.educationDetails || []);

  if (educationDetails.length) {
    return educationDetails.map(formatEducationEntry).join("\n\n");
  }

  return portfolio.education || "";
};

const formatWorkExperienceEntry = (entry) => {
  const title = [entry.designation, entry.companyName].filter(Boolean).join(" - ");
  const duration = [formatMonthYear(entry.startDate), formatMonthYear(entry.endDate) || (entry.startDate ? "Present" : "")]
    .filter(Boolean)
    .join(" to ");
  const location = entry.isRemote ? "Remote" : entry.location;
  const meta = [
    duration ? `Duration: ${duration}` : "",
    location ? `Location: ${location}` : "",
  ].filter(Boolean);

  return [title, meta.join(", "), entry.whatLearned ? `What learned: ${entry.whatLearned}` : ""]
    .filter(Boolean)
    .join("\n");
};

const buildWorkExperienceText = (portfolio = {}) => {
  const workExperienceDetails = getFilledWorkExperienceDetails(portfolio.workExperienceDetails || []);

  if (workExperienceDetails.length) {
    return workExperienceDetails.map(formatWorkExperienceEntry).join("\n\n");
  }

  return portfolio.workExperience || "";
};

const normalizePortfolio = (portfolio = {}) => ({
  ...portfolio,
  links: normalizeLinks(portfolio.links || []),
  educationDetails: normalizeEducationDetails(portfolio.educationDetails, portfolio.education),
  workExperienceDetails: normalizeWorkExperienceDetails(portfolio.workExperienceDetails, portfolio.workExperience),
});

const getPortfolioDraftKey = (userId) => `gigworld:portfolio-draft:${userId}`;

const pickPortfolioDraft = (portfolio = {}) => ({
  bio: portfolio.bio || "",
  education: portfolio.education || "",
  educationDetails: portfolio.educationDetails || [emptyEducationEntry],
  workExperience: portfolio.workExperience || "",
  workExperienceDetails: portfolio.workExperienceDetails || [emptyWorkExperienceEntry],
  links: portfolio.links || defaultLinks,
});

const isProjectFormEmpty = (projectForm = emptyProjectForm, editingProjectId = "") =>
  !editingProjectId && !Object.values(projectForm).some((value) => String(value || "").trim());

const readPortfolioDraft = (userId) => {
  if (!userId) {
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem(getPortfolioDraftKey(userId)) || "null");
  } catch {
    return null;
  }
};

const writePortfolioDraft = (userId, draft) => {
  if (!userId) {
    return;
  }

  localStorage.setItem(getPortfolioDraftKey(userId), JSON.stringify(draft));
};

const clearPortfolioDraft = (userId) => {
  if (!userId) {
    return;
  }

  localStorage.removeItem(getPortfolioDraftKey(userId));
};

const getFileUrl = (resume) => (resume?.url ? `${API_BASE_URL}${resume.url}` : "");

const formatFileSize = (size = 0) => {
  if (!size) {
    return "File size not listed";
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getInitial = (user) => {
  const name = user?.fullName || user?.username || "GigWorld member";
  return name.trim().charAt(0).toUpperCase() || "U";
};

const buildApplicationText = ({ user, portfolio, projects, skills }) => {
  const educationText = buildEducationText(portfolio);
  const workExperienceText = buildWorkExperienceText(portfolio);
  const links = (portfolio.links || [])
    .filter((link) => link.label || link.url)
    .map((link) => `${link.label}: ${link.url}`)
    .join("\n");

  const projectText = projects
    .map((project) => {
      const technologies = Array.isArray(project.technologies) ? project.technologies.join(", ") : "";
      return `${project.title}\n${project.description}\nSkills used: ${technologies}${project.projectLink ? `\nLink: ${project.projectLink}` : ""}`;
    })
    .join("\n\n");

  return [
    user?.fullName || user?.username,
    user?.email,
    portfolio.bio,
    skills.length ? `Skills: ${skills.join(", ")}` : "",
    educationText ? `Education:\n${educationText}` : "",
    workExperienceText ? `Work experience:\n${workExperienceText}` : "",
    links ? `Links:\n${links}` : "",
    projectText ? `Projects:\n${projectText}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
};

const CopyIconButton = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="inline-flex items-center justify-center text-blue-700 transition hover:text-blue-900"
  >
    <i className="bx bx-copy text-lg" aria-hidden="true" />
  </button>
);

const PortfolioPageShimmer = () => (
  <div className="min-h-screen bg-[#f7fafc]">
    <Navbar />
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-blue-400 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 text-white shadow-xl shadow-blue-950/20 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="shimmer-block-dark h-4 w-36 rounded-md" />
            <div className="shimmer-block-dark mt-4 h-12 w-11/12 max-w-3xl rounded-md" />
            <div className="shimmer-block-dark mt-3 h-12 w-3/4 max-w-2xl rounded-md" />
            <div className="shimmer-block-dark mt-6 h-4 w-full max-w-2xl rounded-md" />
            <div className="shimmer-block-dark mt-3 h-4 w-4/5 max-w-xl rounded-md" />
          </div>

          <div className="border-t border-sky-300/40 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div className="flex items-center gap-4">
              <div className="shimmer-block-dark h-16 w-16 rounded-2xl" />
              <div className="flex-1">
                <div className="shimmer-block-dark h-5 w-40 rounded-md" />
                <div className="shimmer-block-dark mt-3 h-4 w-56 rounded-md" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="border-l border-sky-300/35 px-3 first:border-l-0">
                  <div className="shimmer-block-dark mx-auto h-7 w-10 rounded-md" />
                  <div className="shimmer-block-dark mx-auto mt-2 h-3 w-14 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-6">
            <section className="rounded-lg border border-blue-300 bg-white p-6 shadow-sm shadow-blue-950/5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="w-full max-w-md">
                  <div className="shimmer-block h-4 w-36 rounded-md" />
                  <div className="shimmer-block mt-3 h-8 w-56 rounded-md" />
                  <div className="shimmer-block mt-4 h-4 w-full rounded-md" />
                </div>
                <div className="shimmer-block h-10 w-36 rounded-lg" />
              </div>

              <div className="mt-7 grid gap-5">
                <div>
                  <div className="shimmer-block h-4 w-24 rounded-md" />
                  <div className="shimmer-block mt-2 h-32 w-full rounded-lg" />
                </div>
                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <div className="shimmer-block h-4 w-40 rounded-md" />
                    <div className="shimmer-block mt-2 h-28 w-full rounded-lg" />
                  </div>
                  <div>
                    <div className="shimmer-block h-4 w-36 rounded-md" />
                    <div className="shimmer-block mt-2 h-28 w-full rounded-lg" />
                  </div>
                </div>
                <div className="grid gap-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                      <div className="shimmer-block h-11 rounded-lg" />
                      <div className="shimmer-block h-11 rounded-lg" />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end border-t border-blue-200 pt-5">
                  <div className="shimmer-block h-11 w-44 rounded-lg" />
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-blue-300 bg-white p-6 shadow-sm shadow-blue-950/5">
              <div className="shimmer-block h-4 w-24 rounded-md" />
              <div className="shimmer-block mt-3 h-8 w-44 rounded-md" />
              <div className="shimmer-block mt-4 h-4 w-72 max-w-full rounded-md" />
              <div className="mt-6 grid gap-4">
                <div className="shimmer-block h-11 rounded-lg" />
                <div className="shimmer-block h-28 rounded-lg" />
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="shimmer-block h-11 rounded-lg" />
                  <div className="shimmer-block h-11 rounded-lg" />
                </div>
                <div className="shimmer-block h-11 w-32 rounded-lg" />
              </div>
              <div className="mt-8 grid gap-4">
                {[1, 2].map((item) => (
                  <div key={item} className="rounded-lg border border-blue-300 bg-blue-50/40 p-5">
                    <div className="shimmer-block h-6 w-64 max-w-full rounded-md" />
                    <div className="shimmer-block mt-4 h-4 w-full rounded-md" />
                    <div className="shimmer-block mt-3 h-4 w-4/5 rounded-md" />
                    <div className="mt-4 flex flex-wrap gap-2">
                      <div className="shimmer-block h-8 w-24 rounded-md" />
                      <div className="shimmer-block h-8 w-28 rounded-md" />
                      <div className="shimmer-block h-8 w-20 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="grid gap-6 self-start lg:sticky lg:top-24">
            {[1, 2, 3].map((item) => (
              <section key={item} className="rounded-lg border border-blue-300 bg-white p-6 shadow-sm shadow-blue-950/5">
                <div className="shimmer-block h-4 w-28 rounded-md" />
                <div className="shimmer-block mt-3 h-8 w-48 rounded-md" />
                <div className="shimmer-block mt-4 h-4 w-full rounded-md" />
                <div className="shimmer-block mt-3 h-4 w-3/4 rounded-md" />
                <div className="mt-5 grid gap-3">
                  <div className="shimmer-block h-11 rounded-lg" />
                  <div className="shimmer-block h-11 rounded-lg" />
                </div>
              </section>
            ))}
          </aside>
        </div>
      </section>
    </main>
  </div>
);

const PortfolioPage = () => {
  const { showToast: pushToast } = useToast();
  const [user, setUser] = useState(null);
  const [portfolio, setPortfolio] = useState({
    bio: "",
    education: "",
    educationDetails: [emptyEducationEntry],
    workExperience: "",
    workExperienceDetails: [emptyWorkExperienceEntry],
    links: defaultLinks,
  });
  const [projects, setProjects] = useState([]);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [editingProjectId, setEditingProjectId] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPortfolio, setIsSavingPortfolio] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [error, setError] = useState("");
  const [draftUserId, setDraftUserId] = useState("");
  const [isDraftReady, setIsDraftReady] = useState(false);
  const [hasPortfolioDraft, setHasPortfolioDraft] = useState(false);
  const [hasProjectDraft, setHasProjectDraft] = useState(false);

  const skills = useMemo(() => user?.gigPreferences?.skills || [], [user]);
  const applicationText = useMemo(
    () => buildApplicationText({ user, portfolio, projects, skills }),
    [user, portfolio, projects, skills],
  );
  const uploadedResume = portfolio.uploadedResume;
  const generatedResume = portfolio.generatedResume;
  const educationText = useMemo(() => buildEducationText(portfolio), [portfolio]);
  const workExperienceText = useMemo(() => buildWorkExperienceText(portfolio), [portfolio]);

  const showSuccessToast = useCallback((message) => {
    pushToast({ type: "success", message });
  }, [pushToast]);

  const fetchPortfolio = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError("");
    const token = localStorage.getItem("authToken");

    if (!token) {
      const message = TOAST_FAILURE.SIGNIN_TO_LOAD_PORTFOLIO;
      setError(message);
      pushToast({ type: "error", message });
      if (showLoading) {
        setIsLoading(false);
      }
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/portfolio/me`, {
        headers: getAuthHeaders(),
      });
      const nextPortfolio = response.data?.portfolio || {};
      const nextUser = response.data?.user || null;
      const savedDraft = readPortfolioDraft(nextUser?._id);
      const draftProjectForm = savedDraft?.projectForm ? { ...emptyProjectForm, ...savedDraft.projectForm } : emptyProjectForm;
      const draftEditingProjectId = savedDraft?.editingProjectId || "";

      setUser(nextUser);
      setDraftUserId(nextUser?._id || "");
      setPortfolio(savedDraft?.portfolio ? normalizePortfolio({ ...nextPortfolio, ...savedDraft.portfolio }) : normalizePortfolio(nextPortfolio));
      setProjectForm(draftProjectForm);
      setEditingProjectId(draftEditingProjectId);
      setHasPortfolioDraft(Boolean(savedDraft?.portfolio));
      setHasProjectDraft(!isProjectFormEmpty(draftProjectForm, draftEditingProjectId));
      setIsDraftReady(true);
      setProjects(nextPortfolio.projects || []);
      if (savedDraft?.portfolio || !isProjectFormEmpty(draftProjectForm, draftEditingProjectId)) {
        showSuccessToast(TOAST_SUCCESS.PORTFOLIO_DRAFT_RESTORED);
      }
    } catch (requestError) {
      console.error("Error fetching portfolio:", requestError);
      const message =
        requestError.response?.status === 401
          ? TOAST_FAILURE.SESSION_EXPIRED_PORTFOLIO
          : getReadableErrorMessage(requestError, TOAST_FAILURE.PORTFOLIO_LOAD_FAILED);

      setError(message);
      pushToast({ type: "error", message });
      setIsDraftReady(true);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [pushToast, showSuccessToast]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  useEffect(() => {
    if (!isDraftReady || !draftUserId || isLoading) {
      return;
    }

    if (!hasPortfolioDraft && !hasProjectDraft) {
      clearPortfolioDraft(draftUserId);
      return;
    }

    const nextDraft = {
      updatedAt: new Date().toISOString(),
    };

    if (hasPortfolioDraft) {
      nextDraft.portfolio = pickPortfolioDraft(portfolio);
    }

    if (hasProjectDraft) {
      nextDraft.projectForm = projectForm;
      nextDraft.editingProjectId = editingProjectId;
    }

    writePortfolioDraft(draftUserId, nextDraft);
  }, [
    draftUserId,
    editingProjectId,
    hasPortfolioDraft,
    hasProjectDraft,
    isDraftReady,
    isLoading,
    portfolio,
    projectForm,
  ]);

  const handlePortfolioChange = (field, value) => {
    setHasPortfolioDraft(true);
    setPortfolio((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleEducationChange = (index, field, value) => {
    setHasPortfolioDraft(true);
    setPortfolio((current) => ({
      ...current,
      educationDetails: (current.educationDetails || [emptyEducationEntry]).map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
  };

  const addEducationEntry = () => {
    setHasPortfolioDraft(true);
    setPortfolio((current) => ({
      ...current,
      educationDetails: [...(current.educationDetails || []), emptyEducationEntry],
    }));
  };

  const removeEducationEntry = (index) => {
    setHasPortfolioDraft(true);
    setPortfolio((current) => {
      const nextEntries = (current.educationDetails || []).filter((_, entryIndex) => entryIndex !== index);

      return {
        ...current,
        educationDetails: nextEntries.length ? nextEntries : [emptyEducationEntry],
      };
    });
  };

  const handleWorkExperienceChange = (index, field, value) => {
    setHasPortfolioDraft(true);
    setPortfolio((current) => ({
      ...current,
      workExperienceDetails: (current.workExperienceDetails || [emptyWorkExperienceEntry]).map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
  };

  const addWorkExperienceEntry = () => {
    setHasPortfolioDraft(true);
    setPortfolio((current) => ({
      ...current,
      workExperienceDetails: [...(current.workExperienceDetails || []), emptyWorkExperienceEntry],
    }));
  };

  const removeWorkExperienceEntry = (index) => {
    setHasPortfolioDraft(true);
    setPortfolio((current) => {
      const nextEntries = (current.workExperienceDetails || []).filter((_, entryIndex) => entryIndex !== index);

      return {
        ...current,
        workExperienceDetails: nextEntries.length ? nextEntries : [emptyWorkExperienceEntry],
      };
    });
  };

  const handleLinkChange = (index, field, value) => {
    setHasPortfolioDraft(true);
    setPortfolio((current) => ({
      ...current,
      links: current.links.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [field]: value } : link,
      ),
    }));
  };

  const removeLink = (index) => {
    setHasPortfolioDraft(true);
    setPortfolio((current) => ({
      ...current,
      links: current.links.filter((_, linkIndex) => linkIndex !== index),
    }));
  };

  const handleProjectFormChange = (field, value) => {
    setHasProjectDraft(true);
    setProjectForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSavePortfolio = async (event) => {
    event.preventDefault();
    setError("");

    const linkError = getFirstLinkError(portfolio.links);

    if (linkError) {
      const message = TOAST_FAILURE.PORTFOLIO_LINK_INVALID(linkError);
      setError(message);
      pushToast({ type: "error", message });
      return;
    }

    setIsSavingPortfolio(true);

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/portfolio/me`,
        {
          bio: portfolio.bio,
          education: educationText,
          educationDetails: getFilledEducationDetails(portfolio.educationDetails),
          workExperience: workExperienceText,
          workExperienceDetails: getFilledWorkExperienceDetails(portfolio.workExperienceDetails),
          links: portfolio.links,
        },
        { headers: getAuthHeaders() },
      );
      const nextPortfolio = response.data?.portfolio || {};

      setPortfolio(normalizePortfolio(nextPortfolio));
      setProjects(nextPortfolio.projects || []);
      setHasPortfolioDraft(false);
      showSuccessToast(TOAST_SUCCESS.PORTFOLIO_SAVED);
    } catch (requestError) {
      console.error("Error saving portfolio:", requestError);
      const message = getReadableErrorMessage(requestError, TOAST_FAILURE.PORTFOLIO_SAVE_FAILED);
      setError(message);
      pushToast({ type: "error", message });
    } finally {
      setIsSavingPortfolio(false);
    }
  };

  const handleProjectSubmit = async (event) => {
    event.preventDefault();
    setIsSavingProject(true);
    setError("");

    const payload = {
      ...projectForm,
      technologies: projectForm.technologies
        .split(",")
        .map((technology) => technology.trim())
        .filter(Boolean),
    };

    try {
      if (editingProjectId) {
        const response = await axios.put(`${API_BASE_URL}/api/v1/projects/${editingProjectId}`, payload, {
          headers: getAuthHeaders(),
        });
        const updatedProject = response.data?.project;

        if (updatedProject) {
          setProjects((current) =>
            current.map((project) => (project._id === updatedProject._id ? updatedProject : project)),
          );
        }
        showSuccessToast(TOAST_SUCCESS.PROJECT_UPDATED);
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/v1/projects/create`, payload, {
          headers: getAuthHeaders(),
        });
        const createdProject = response.data?.project;

        if (createdProject) {
          setProjects((current) => [createdProject, ...current]);
        }
        showSuccessToast(TOAST_SUCCESS.PROJECT_ADDED);
      }

      setProjectForm(emptyProjectForm);
      setEditingProjectId("");
      setHasProjectDraft(false);
    } catch (requestError) {
      console.error("Error saving project:", requestError);
      const message = getReadableErrorMessage(requestError, TOAST_FAILURE.PROJECT_SAVE_FAILED);
      setError(message);
      pushToast({ type: "error", message });
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleEditProject = (project) => {
    setHasProjectDraft(true);
    setEditingProjectId(project._id);
    setProjectForm({
      title: project.title || "",
      description: project.description || "",
      technologies: Array.isArray(project.technologies) ? project.technologies.join(", ") : "",
      projectLink: project.projectLink || "",
    });
  };

  const handleDeleteProject = async (projectId) => {
    setError("");

    try {
      await axios.delete(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
        headers: getAuthHeaders(),
      });
      showSuccessToast(TOAST_SUCCESS.PROJECT_DELETED);
      setProjects((current) => current.filter((project) => project._id !== projectId));
    } catch (requestError) {
      console.error("Error deleting project:", requestError);
      const message = getReadableErrorMessage(requestError, TOAST_FAILURE.PROJECT_DELETE_FAILED);
      setError(message);
      pushToast({ type: "error", message });
    }
  };

  const handleResumeUpload = async (event) => {
    event.preventDefault();

    if (!resumeFile) {
      const message = TOAST_FAILURE.RESUME_FILE_REQUIRED;
      setError(message);
      pushToast({ type: "error", message });
      return;
    }

    setIsUploadingResume(true);
    setError("");

    const formData = new FormData();
    formData.append("resume", resumeFile);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/portfolio/resume/upload`, formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });
      const nextPortfolio = response.data?.portfolio || {};

      setPortfolio(normalizePortfolio(nextPortfolio));
      setProjects(nextPortfolio.projects || []);
      setResumeFile(null);
      showSuccessToast(TOAST_SUCCESS.RESUME_UPLOADED);
    } catch (requestError) {
      console.error("Error uploading resume:", requestError);
      const message = getReadableErrorMessage(requestError, TOAST_FAILURE.RESUME_UPLOAD_FAILED);
      setError(message);
      pushToast({ type: "error", message });
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleGenerateResume = async () => {
    setIsGeneratingResume(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/portfolio/resume/generate`, {}, {
        headers: getAuthHeaders(),
      });
      const nextPortfolio = response.data?.portfolio || {};

      setPortfolio(normalizePortfolio(nextPortfolio));
      setProjects(nextPortfolio.projects || []);
      showSuccessToast(TOAST_SUCCESS.RESUME_GENERATED);
    } catch (requestError) {
      console.error("Error generating resume:", requestError);
      const message = getReadableErrorMessage(requestError, TOAST_FAILURE.RESUME_GENERATE_FAILED);
      setError(message);
      pushToast({ type: "error", message });
    } finally {
      setIsGeneratingResume(false);
    }
  };

  const copyToClipboard = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value || "");
      showSuccessToast(TOAST_SUCCESS.COPIED(label));
    } catch (copyError) {
      console.error("Copy failed:", copyError);
      const message = TOAST_FAILURE.COPY_FAILED(label);
      setError(message);
      pushToast({ type: "error", message });
    }
  };

  if (isLoading) {
    return <PortfolioPageShimmer />;
  }

  return (
    <div className="min-h-screen bg-[#f7fafc] text-slate-950">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-blue-400 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 text-white shadow-xl shadow-blue-950/20 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <p className="text-sm font-black uppercase text-sky-300">Portfolio toolkit</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl">
                Build reusable proof for every freelance application.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
                Keep your resume, profile details, links, and projects ready to copy or download when source websites ask for them.
              </p>
            </div>

            <div className="border-t border-sky-300/40 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-300/40 bg-white/10 text-3xl font-black text-white">
                  {getInitial(user)}
                </div>
                <div>
                  <p className="text-xl font-black text-white">{user?.fullName || user?.username || "GigWorld member"}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-300">{user?.email}</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="border-l border-sky-300/35 px-3 first:border-l-0">
                  <p className="text-2xl font-black text-white">{skills.length}</p>
                  <p className="text-xs font-black uppercase text-sky-300">Skills</p>
                </div>
                <div className="border-l border-sky-300/35 px-3 first:border-l-0">
                  <p className="text-2xl font-black text-white">{projects.length}</p>
                  <p className="text-xs font-black uppercase text-sky-300">Projects</p>
                </div>
                <div className="border-l border-sky-300/35 px-3 first:border-l-0">
                  <p className="text-2xl font-black text-white">{uploadedResume || generatedResume ? "Yes" : "No"}</p>
                  <p className="text-xs font-black uppercase text-sky-300">Resume</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="grid gap-6">
              <form onSubmit={handleSavePortfolio} className="rounded-lg border border-blue-300 bg-white p-6 shadow-sm shadow-blue-950/5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase text-blue-700">Application profile</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">Reusable details</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Save the details you often retype on freelance source websites.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard("Full application profile", applicationText)}
                    className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 transition hover:border-blue-500 hover:bg-blue-100"
                  >
                    Copy full profile
                  </button>
                </div>

                <div className="mt-6 grid gap-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="portfolio-bio" className="text-sm font-black uppercase text-slate-700">Bio</label>
                      <CopyIconButton label="Copy bio" onClick={() => copyToClipboard("Bio", portfolio.bio)} />
                    </div>
                    <textarea
                      id="portfolio-bio"
                      value={portfolio.bio || ""}
                      onChange={(event) => handlePortfolioChange("bio", event.target.value)}
                      className="mt-2 min-h-32 w-full rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                      placeholder="Write a short freelancer bio clients can understand quickly."
                    />
                  </div>

                  <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black uppercase text-slate-700">Education / qualification</p>
                        <CopyIconButton label="Copy education" onClick={() => copyToClipboard("Education", educationText)} />
                      </div>
                      <button
                        type="button"
                        onClick={addEducationEntry}
                        className="self-start text-sm font-black text-blue-700 underline decoration-blue-300 underline-offset-8 sm:self-auto"
                      >
                        Add education -&gt;
                      </button>
                    </div>

                    <div className="mt-3 grid gap-4">
                      {(portfolio.educationDetails || [emptyEducationEntry]).map((entry, index) => (
                        <div key={`education-${index}`} className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-xs font-black uppercase text-blue-700">Education {index + 1}</p>
                            {(portfolio.educationDetails || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeEducationEntry(index)}
                                className="text-xs font-black text-red-600"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="grid gap-3 lg:grid-cols-2">
                            <input
                              type="text"
                              value={entry.institutionName || ""}
                              onChange={(event) => handleEducationChange(index, "institutionName", event.target.value)}
                              className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                              placeholder="School / college name"
                            />
                            <input
                              type="text"
                              value={entry.degreeName || ""}
                              onChange={(event) => handleEducationChange(index, "degreeName", event.target.value)}
                              className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                              placeholder="Degree / 10th / 12th"
                            />
                            <CalendarInput
                              value={entry.year || ""}
                              onChange={(value) => handleEducationChange(index, "year", value)}
                              mode="month"
                              placeholder="Completion month"
                              ariaLabel="Select completion month"
                            />
                            <div className="grid gap-2 sm:grid-cols-2">
                              <select
                                value={entry.marksType || "percentage"}
                                onChange={(event) => handleEducationChange(index, "marksType", event.target.value)}
                                className="h-11 w-full rounded-lg border-blue-200 bg-white text-sm font-bold text-slate-900 shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                                aria-label="Marks type"
                              >
                                {marksTypeOptions.map((option) => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={entry.marks || ""}
                                  onChange={(event) =>
                                    handleEducationChange(index, "marks", cleanMarksValue(event.target.value))
                                  }
                                  className="h-11 w-full rounded-lg border-blue-200 pr-16 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                                  placeholder={entry.marksType === "cgpa" ? "Enter CGPA" : "Enter percentage"}
                                />
                                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-black uppercase text-blue-700">
                                  {getMarksSuffix(entry.marksType)}
                                </span>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={entry.location || ""}
                              onChange={(event) => handleEducationChange(index, "location", event.target.value)}
                              className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20 lg:col-span-2"
                              placeholder="Location"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black uppercase text-slate-700">Work experience</p>
                        <CopyIconButton
                          label="Copy work experience"
                          onClick={() => copyToClipboard("Work experience", workExperienceText)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addWorkExperienceEntry}
                        className="self-start text-sm font-black text-blue-700 underline decoration-blue-300 underline-offset-8 sm:self-auto"
                      >
                        Add experience -&gt;
                      </button>
                    </div>

                    <div className="mt-3 grid gap-4">
                      {(portfolio.workExperienceDetails || [emptyWorkExperienceEntry]).map((entry, index) => (
                        <div key={`work-experience-${index}`} className="rounded-lg border border-blue-200 bg-white p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-xs font-black uppercase text-blue-700">Experience {index + 1}</p>
                            {(portfolio.workExperienceDetails || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeWorkExperienceEntry(index)}
                                className="text-xs font-black text-red-600"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="grid gap-3 lg:grid-cols-2">
                            <input
                              type="text"
                              value={entry.companyName || ""}
                              onChange={(event) => handleWorkExperienceChange(index, "companyName", event.target.value)}
                              className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                              placeholder="Company name"
                            />
                            <input
                              type="text"
                              value={entry.designation || ""}
                              onChange={(event) => handleWorkExperienceChange(index, "designation", event.target.value)}
                              className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                              placeholder="Role / designation"
                            />
                            <CalendarInput
                              value={entry.startDate || ""}
                              onChange={(value) => handleWorkExperienceChange(index, "startDate", value)}
                              mode="month"
                              placeholder="Start month"
                              ariaLabel="Select start month"
                            />
                            <CalendarInput
                              value={entry.endDate || ""}
                              onChange={(value) => handleWorkExperienceChange(index, "endDate", value)}
                              mode="month"
                              placeholder="End month"
                              ariaLabel="Select end month"
                            />
                            <label className="flex h-11 items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/40 px-4 text-sm font-bold text-slate-800">
                              <input
                                type="checkbox"
                                checked={Boolean(entry.isRemote)}
                                onChange={(event) => handleWorkExperienceChange(index, "isRemote", event.target.checked)}
                                className="rounded border-blue-300 text-blue-700 focus:ring-blue-600/20"
                              />
                              Remote
                            </label>
                            <input
                              type="text"
                              value={entry.isRemote ? "Remote" : entry.location || ""}
                              onChange={(event) => handleWorkExperienceChange(index, "location", event.target.value)}
                              disabled={Boolean(entry.isRemote)}
                              className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20 disabled:bg-slate-100 disabled:text-slate-500"
                              placeholder="Location"
                            />
                            <textarea
                              value={entry.whatLearned || ""}
                              onChange={(event) => handleWorkExperienceChange(index, "whatLearned", event.target.value)}
                              className="min-h-24 rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20 lg:col-span-2"
                              placeholder="What did you learn, build, or improve in this role?"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-sm font-black uppercase text-slate-700">Links</label>
                      <button
                        type="button"
                        onClick={() =>
                          handlePortfolioChange("links", [...portfolio.links, { label: "Custom link", url: "" }])
                        }
                        className="text-sm font-black text-blue-700 underline decoration-blue-300 underline-offset-8"
                      >
                        Add link -&gt;
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3">
                      {(portfolio.links || []).map((link, index) => (
                        <div key={`${link.label}-${index}`} className="grid gap-2">
                          <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)_auto]">
                            <input
                              type="text"
                              value={link.label || ""}
                              onChange={(event) => handleLinkChange(index, "label", event.target.value)}
                              className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                              placeholder="Label"
                            />
                            <input
                              type="text"
                              value={link.url || ""}
                              onChange={(event) => handleLinkChange(index, "url", event.target.value)}
                              className={`rounded-lg text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20 ${
                                getLinkUrlError(link) ? "border-red-300 bg-red-50" : "border-blue-200"
                              }`}
                              placeholder="https://example.com"
                            />
                            {index >= defaultLinks.length && (
                              <button
                                type="button"
                                onClick={() => removeLink(index)}
                                className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-black text-red-600 transition hover:bg-red-50"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          {getLinkUrlError(link) && (
                            <p className="text-xs font-bold text-red-600">
                              {getLinkUrlError(link)}. Example: https://example.com
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-blue-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-slate-500">Skills are managed in Gig Preferences and reused here.</p>
                    <button
                      type="submit"
                      disabled={isSavingPortfolio}
                      className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                      {isSavingPortfolio ? "Saving..." : "Save portfolio details"}
                    </button>
                  </div>
                </div>
              </form>

              <section className="rounded-lg border border-blue-300 bg-white p-6 shadow-sm shadow-blue-950/5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase text-blue-700">Projects</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">Proof of work</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Add examples you can copy into external application forms.
                    </p>
                  </div>
                  {editingProjectId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProjectId("");
                        setProjectForm(emptyProjectForm);
                        setHasProjectDraft(false);
                      }}
                      className="text-sm font-black text-blue-700 underline decoration-blue-300 underline-offset-8"
                    >
                      Cancel edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleProjectSubmit} className="mt-6 grid gap-4">
                  <input
                    type="text"
                    value={projectForm.title}
                    onChange={(event) => handleProjectFormChange("title", event.target.value)}
                    className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                    placeholder="Project title"
                    required
                  />
                  <textarea
                    value={projectForm.description}
                    onChange={(event) => handleProjectFormChange("description", event.target.value)}
                    className="min-h-28 rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                    placeholder="What did you build or deliver?"
                    required
                  />
                  <div className="grid gap-4 lg:grid-cols-2">
                    <input
                      type="text"
                      value={projectForm.technologies}
                      onChange={(event) => handleProjectFormChange("technologies", event.target.value)}
                      className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                      placeholder="Skills used, comma-separated"
                    />
                    <input
                      type="url"
                      value={projectForm.projectLink}
                      onChange={(event) => handleProjectFormChange("projectLink", event.target.value)}
                      className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                      placeholder="Project link"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingProject}
                    className="justify-self-start rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isSavingProject ? "Saving..." : editingProjectId ? "Update project" : "Add project"}
                  </button>
                </form>

                <div className="mt-8 grid gap-4">
                  {projects.length > 0 ? (
                    projects.map((project) => {
                      const projectText = `${project.title}\n${project.description}\nSkills used: ${(project.technologies || []).join(", ")}${project.projectLink ? `\nLink: ${project.projectLink}` : ""}`;
                      return (
                        <article key={project._id} className="rounded-lg border border-blue-300 bg-blue-50/40 p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-xl font-black text-slate-950">{project.title}</h3>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{project.description}</p>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                              <CopyIconButton
                                label="Copy project"
                                onClick={() => copyToClipboard("Project", projectText)}
                              />
                              <button
                                type="button"
                                onClick={() => handleEditProject(project)}
                                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProject(project._id)}
                                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {project.technologies?.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {project.technologies.map((technology) => (
                                <span key={technology} className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                                  {technology}
                                </span>
                              ))}
                            </div>
                          )}
                          {project.projectLink && (
                            <a
                              href={project.projectLink}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 inline-flex text-sm font-black text-blue-700 underline decoration-blue-300 underline-offset-8"
                            >
                              Open project -&gt;
                            </a>
                          )}
                        </article>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-6 text-sm font-semibold text-slate-600">
                      No projects yet. Add your strongest proof of work first.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside className="grid gap-6 self-start lg:sticky lg:top-24">
              <section className="rounded-lg border border-blue-300 bg-white p-6 shadow-sm shadow-blue-950/5">
                <p className="text-sm font-black uppercase text-blue-700">Resume hub</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Upload or generate</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Keep one resume ready for source websites. PDF can be viewed here; every file can be downloaded.
                </p>

                <form onSubmit={handleResumeUpload} className="mt-5 grid gap-3">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                    className="block w-full rounded-lg border border-blue-200 bg-white text-sm text-slate-700 file:mr-4 file:border-0 file:bg-blue-700 file:px-4 file:py-3 file:text-sm file:font-black file:text-white"
                  />
                  <button
                    type="submit"
                    disabled={isUploadingResume}
                    className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {isUploadingResume ? "Uploading..." : "Upload resume"}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={handleGenerateResume}
                  disabled={isGeneratingResume}
                  className="mt-3 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGeneratingResume ? "Generating..." : "Generate from profile"}
                </button>

                <div className="mt-6 grid gap-3">
                  {[uploadedResume, generatedResume].filter(Boolean).map((resume) => {
                    const resumeUrl = getFileUrl(resume);
                    const isPdf = resume.mimeType === "application/pdf" || resume.fileName?.toLowerCase().endsWith(".pdf");

                    return (
                      <div key={resume.url} className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
                        <p className="text-sm font-black text-slate-950">{resume.originalName}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{formatFileSize(resume.size)}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {isPdf && (
                            <a
                              href={resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border border-blue-300 bg-white px-3 py-2 text-xs font-black text-blue-700"
                            >
                              View
                            </a>
                          )}
                          <a
                            href={resumeUrl}
                            download
                            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    );
                  })}
                  {!uploadedResume && !generatedResume && (
                    <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-4 text-sm font-semibold text-slate-600">
                      No resume saved yet.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-blue-300 bg-white p-6 shadow-sm shadow-blue-950/5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black uppercase text-blue-700">Skills</p>
                      <CopyIconButton label="Copy skills" onClick={() => copyToClipboard("Skills", skills.join(", "))} />
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-500">From Gig Preferences</p>
                  </div>
                  <Link
                    to="/profile"
                    className="text-sm font-black text-blue-700 underline decoration-blue-300 underline-offset-8"
                  >
                    Edit
                  </Link>
                </div>
                {skills.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span key={skill} className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-sm font-semibold text-slate-500">
                    Add skills in Gig Preferences to reuse them here.
                  </p>
                )}
              </section>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PortfolioPage;
