/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Footer from "../../components/Footer/Footer";
import Navbar from "../../components/Navbar/Navbar";

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
    portfolio.education ? `Education: ${portfolio.education}` : "",
    portfolio.workExperience ? `Work experience: ${portfolio.workExperience}` : "",
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
  const [user, setUser] = useState(null);
  const [portfolio, setPortfolio] = useState({
    bio: "",
    education: "",
    workExperience: "",
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
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const skills = useMemo(() => user?.gigPreferences?.skills || [], [user]);
  const applicationText = useMemo(
    () => buildApplicationText({ user, portfolio, projects, skills }),
    [user, portfolio, projects, skills],
  );
  const uploadedResume = portfolio.uploadedResume;
  const generatedResume = portfolio.generatedResume;

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const fetchPortfolio = async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError("");

    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/portfolio/me`, {
        headers: getAuthHeaders(),
      });
      const nextPortfolio = response.data?.portfolio || {};

      setUser(response.data?.user || null);
      setPortfolio({
        ...nextPortfolio,
        links: normalizeLinks(nextPortfolio.links || []),
      });
      setProjects(nextPortfolio.projects || []);
    } catch (requestError) {
      console.error("Error fetching portfolio:", requestError);
      setError("Portfolio could not be loaded right now.");
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handlePortfolioChange = (field, value) => {
    setPortfolio((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleLinkChange = (index, field, value) => {
    setPortfolio((current) => ({
      ...current,
      links: current.links.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [field]: value } : link,
      ),
    }));
  };

  const handleSavePortfolio = async (event) => {
    event.preventDefault();
    setIsSavingPortfolio(true);
    setError("");

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/portfolio/me`,
        {
          bio: portfolio.bio,
          education: portfolio.education,
          workExperience: portfolio.workExperience,
          links: portfolio.links,
        },
        { headers: getAuthHeaders() },
      );
      const nextPortfolio = response.data?.portfolio || {};

      setPortfolio({
        ...nextPortfolio,
        links: normalizeLinks(nextPortfolio.links || []),
      });
      setProjects(nextPortfolio.projects || []);
      showToast("Portfolio details saved.");
    } catch (requestError) {
      console.error("Error saving portfolio:", requestError);
      setError("Portfolio details could not be saved.");
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
        await axios.put(`${API_BASE_URL}/api/v1/projects/${editingProjectId}`, payload, {
          headers: getAuthHeaders(),
        });
        showToast("Project updated.");
      } else {
        await axios.post(`${API_BASE_URL}/api/v1/projects/create`, payload, {
          headers: getAuthHeaders(),
        });
        showToast("Project added.");
      }

      setProjectForm(emptyProjectForm);
      setEditingProjectId("");
      await fetchPortfolio({ showLoading: false });
    } catch (requestError) {
      console.error("Error saving project:", requestError);
      setError("Project could not be saved.");
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleEditProject = (project) => {
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
      showToast("Project deleted.");
      await fetchPortfolio({ showLoading: false });
    } catch (requestError) {
      console.error("Error deleting project:", requestError);
      setError("Project could not be deleted.");
    }
  };

  const handleResumeUpload = async (event) => {
    event.preventDefault();

    if (!resumeFile) {
      setError("Choose a PDF, DOC, or DOCX resume first.");
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

      setPortfolio({
        ...nextPortfolio,
        links: normalizeLinks(nextPortfolio.links || []),
      });
      setProjects(nextPortfolio.projects || []);
      setResumeFile(null);
      showToast("Resume uploaded.");
    } catch (requestError) {
      console.error("Error uploading resume:", requestError);
      setError(requestError.response?.data?.message || "Resume could not be uploaded.");
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

      setPortfolio({
        ...nextPortfolio,
        links: normalizeLinks(nextPortfolio.links || []),
      });
      setProjects(nextPortfolio.projects || []);
      showToast("Resume generated.");
    } catch (requestError) {
      console.error("Error generating resume:", requestError);
      setError(requestError.response?.data?.message || "Resume generation is not available right now.");
    } finally {
      setIsGeneratingResume(false);
    }
  };

  const copyToClipboard = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value || "");
      showToast(`${label} copied.`);
    } catch (copyError) {
      console.error("Copy failed:", copyError);
      setError(`${label} could not be copied.`);
    }
  };

  if (isLoading) {
    return <PortfolioPageShimmer />;
  }

  return (
    <div className="min-h-screen bg-[#f7fafc] text-slate-950">
      <Navbar />

      {toast && (
        <div className="fixed right-5 top-24 z-[60] rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 shadow-xl shadow-emerald-950/10">
          {toast}
        </div>
      )}

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

                  <div className="grid gap-5 lg:grid-cols-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="portfolio-education" className="text-sm font-black uppercase text-slate-700">Education / qualification</label>
                        <CopyIconButton label="Copy education" onClick={() => copyToClipboard("Education", portfolio.education)} />
                      </div>
                      <textarea
                        id="portfolio-education"
                        value={portfolio.education || ""}
                        onChange={(event) => handlePortfolioChange("education", event.target.value)}
                        className="mt-2 min-h-28 w-full rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                        placeholder="Degree, certification, bootcamp, or relevant learning."
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="portfolio-work-experience" className="text-sm font-black uppercase text-slate-700">Work experience</label>
                        <CopyIconButton
                          label="Copy work experience"
                          onClick={() => copyToClipboard("Work experience", portfolio.workExperience)}
                        />
                      </div>
                      <textarea
                        id="portfolio-work-experience"
                        value={portfolio.workExperience || ""}
                        onChange={(event) => handlePortfolioChange("workExperience", event.target.value)}
                        className="mt-2 min-h-28 w-full rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                        placeholder="Past roles, freelance work, outcomes, or relevant experience."
                      />
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
                        <div key={`${link.label}-${index}`} className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                          <input
                            type="text"
                            value={link.label || ""}
                            onChange={(event) => handleLinkChange(index, "label", event.target.value)}
                            className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                            placeholder="Label"
                          />
                          <input
                            type="url"
                            value={link.url || ""}
                            onChange={(event) => handleLinkChange(index, "url", event.target.value)}
                            className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                            placeholder="https://..."
                          />
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
                    onChange={(event) => setProjectForm((current) => ({ ...current, title: event.target.value }))}
                    className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                    placeholder="Project title"
                    required
                  />
                  <textarea
                    value={projectForm.description}
                    onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))}
                    className="min-h-28 rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                    placeholder="What did you build or deliver?"
                    required
                  />
                  <div className="grid gap-4 lg:grid-cols-2">
                    <input
                      type="text"
                      value={projectForm.technologies}
                      onChange={(event) => setProjectForm((current) => ({ ...current, technologies: event.target.value }))}
                      className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
                      placeholder="Skills used, comma-separated"
                    />
                    <input
                      type="url"
                      value={projectForm.projectLink}
                      onChange={(event) => setProjectForm((current) => ({ ...current, projectLink: event.target.value }))}
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
