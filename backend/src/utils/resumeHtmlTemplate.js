const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const normalizeUrl = (url = "") => {
    const trimmedUrl = String(url).trim();

    if (!trimmedUrl) {
        return "";
    }

    if (/^https?:\/\//i.test(trimmedUrl) || /^mailto:/i.test(trimmedUrl)) {
        return trimmedUrl;
    }

    return `https://${trimmedUrl}`;
};

const renderInlineList = (items = []) => {
    const cleanItems = items.map((item) => String(item).trim()).filter(Boolean);

    if (!cleanItems.length) {
        return "<span>Not listed</span>";
    }

    return cleanItems.map((item) => `<span>${escapeHtml(item)}</span>`).join(", ");
};

const renderParagraphs = (value = "Not listed") => {
    const paragraphs = String(value || "Not listed")
        .split(/\n+/)
        .map((item) => item.trim())
        .filter(Boolean);

    if (!paragraphs.length) {
        return "<p>Not listed</p>";
    }

    return paragraphs.map((item) => `<p>${escapeHtml(item)}</p>`).join("");
};

const formatMonthYear = (value = "") => {
    const cleanedValue = String(value || "").trim();

    if (!cleanedValue) {
        return "";
    }

    if (/^\d{4}-\d{2}$/.test(cleanedValue)) {
        const [year, month] = cleanedValue.split("-").map(Number);
        return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
        });
    }

    return cleanedValue;
};

const cleanMarksValue = (value = "") => String(value || "").replace(/\s*(%|cgpa)$/i, "").trim();

const formatMarks = (marks = "", marksType = "percentage") => {
    const cleanedMarks = cleanMarksValue(marks);

    if (!cleanedMarks) {
        return "";
    }

    if (marksType === "cgpa") {
        return cleanedMarks.includes("/") ? `CGPA: ${cleanedMarks}` : `CGPA: ${cleanedMarks}/10`;
    }

    return `Percentage: ${cleanedMarks}%`;
};

const cleanBulletText = (value = "") =>
    String(value || "")
        .replace(/^\s*[•*-]\s*/, "")
        .trim();

const splitHighlights = (value = "") =>
    String(value || "")
        .split(/\n+/)
        .map(cleanBulletText)
        .filter(Boolean);

const splitTitleLine = (value = "") => {
    const parts = String(value || "").split(/\s+-\s+/);
    return {
        primary: String(parts.shift() || "").trim(),
        secondary: parts.join(" - ").trim(),
    };
};

const extractMetaValue = (value = "", label = "") => {
    const match = String(value || "").match(new RegExp(`${label}:\\s*([^,]+)`, "i"));
    return match ? match[1].trim() : "";
};

const formatLegacyMarks = (value = "") => {
    const cleanedValue = String(value || "").trim();

    if (!cleanedValue) {
        return "";
    }

    if (/cgpa/i.test(cleanedValue)) {
        const cgpa = cleanedValue.replace(/cgpa/i, "").trim();
        return cgpa.includes("/") ? `CGPA: ${cgpa}` : `CGPA: ${cgpa}/10`;
    }

    if (/%/.test(cleanedValue)) {
        return `Percentage: ${cleanedValue}`;
    }

    return `Marks: ${cleanedValue}`;
};

const renderLegacyEducation = (value = "") => {
    const lines = String(value || "")
        .split(/\n+/)
        .map((item) => item.trim())
        .filter(Boolean);

    if (!lines.length || lines[0].toLowerCase() === "not listed") {
        return "";
    }

    const entries = [];

    for (let index = 0; index < lines.length; index += 1) {
        const titleLine = lines[index];
        const metaLine = /^year:/i.test(lines[index + 1] || "") ? lines[index + 1] : "";

        if (metaLine) {
            index += 1;
        }

        const { primary, secondary } = splitTitleLine(titleLine);
        const date = extractMetaValue(metaLine, "Year");
        const marks = formatLegacyMarks(extractMetaValue(metaLine, "Marks"));
        const location = extractMetaValue(metaLine, "Location");
        const secondaryLine = [
            secondary ? ` at ${secondary}` : "",
            location ? ` — ${location}` : "",
        ].join("");

        entries.push(`
            <div class="two-column-entry education-entry">
                <div>
                    <p><strong>${escapeHtml(primary || titleLine)}</strong>${escapeHtml(secondaryLine)}</p>
                    ${marks ? `<p><em>${escapeHtml(marks)}</em></p>` : ""}
                </div>
                <div class="entry-meta">${escapeHtml(date)}</div>
            </div>
        `);
    }

    return entries.join("");
};

const renderLegacyExperience = (value = "") => {
    const groups = String(value || "")
        .split(/\n{2,}/)
        .map((group) => group.trim())
        .filter(Boolean);

    if (!groups.length || groups[0].toLowerCase() === "not listed") {
        return "";
    }

    return groups
        .map((group) => {
            const lines = group.split(/\n+/).map((line) => line.trim()).filter(Boolean);
            const titleLine = lines.shift() || "";
            const metaLineIndex = lines.findIndex((line) => /^duration:/i.test(line));
            const metaLine = metaLineIndex >= 0 ? lines.splice(metaLineIndex, 1)[0] : "";
            const learnedLineIndex = lines.findIndex((line) => /^what learned:/i.test(line));
            const learnedLine = learnedLineIndex >= 0 ? lines.splice(learnedLineIndex, 1)[0] : "";
            const { primary, secondary } = splitTitleLine(titleLine);
            const duration = extractMetaValue(metaLine, "Duration").replace(/\s+to\s+/i, " – ");
            const location = extractMetaValue(metaLine, "Location");
            const secondaryLine = [
                secondary ? `, ${secondary}` : "",
                location ? ` — ${location}` : "",
            ].join("");
            const highlights = [
                cleanBulletText(learnedLine.replace(/^what learned:\s*/i, "")),
                ...lines.map(cleanBulletText),
            ].filter(Boolean);

            return `
                <div class="two-column-entry experience-entry">
                    <div>
                        <p><strong>${escapeHtml(primary || titleLine)}</strong>${escapeHtml(secondaryLine)}</p>
                    </div>
                    <div class="entry-meta">${escapeHtml(duration)}</div>
                </div>
                ${highlights.length ? `
                    <ul class="highlights">
                        ${highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join("")}
                    </ul>
                ` : ""}
            `;
        })
        .join("");
};

const renderEducation = (portfolio) => {
    const educationDetails = Array.isArray(portfolio.educationDetails) ? portfolio.educationDetails : [];
    const filledEducation = educationDetails.filter((entry) =>
        entry?.institutionName || entry?.degreeName || entry?.year || entry?.marks || entry?.location
    );

    if (!filledEducation.length) {
        const legacyEducation = renderLegacyEducation(portfolio.education);
        return legacyEducation || `<div class="one-column-entry">${renderParagraphs(portfolio.education || "Not listed")}</div>`;
    }

    return filledEducation
        .map((entry) => {
            const degree = entry.degreeName || "Education";
            const institutionLine = [
                entry.institutionName ? ` at ${entry.institutionName}` : "",
                entry.location ? ` — ${entry.location}` : "",
            ].join("");
            const marksLine = formatMarks(entry.marks, entry.marksType);

            return `
                <div class="two-column-entry education-entry">
                    <div>
                        <p><strong>${escapeHtml(degree)}</strong>${escapeHtml(institutionLine)}</p>
                        ${marksLine ? `<p><em>${escapeHtml(marksLine)}</em></p>` : ""}
                    </div>
                    <div class="entry-meta">${escapeHtml(formatMonthYear(entry.year))}</div>
                </div>
            `;
        })
        .join("");
};

const renderExperience = (portfolio) => {
    const experienceDetails = Array.isArray(portfolio.workExperienceDetails) ? portfolio.workExperienceDetails : [];
    const filledExperience = experienceDetails.filter((entry) =>
        entry?.companyName || entry?.designation || entry?.startDate || entry?.endDate || entry?.location || entry?.isRemote || entry?.whatLearned
    );

    if (!filledExperience.length) {
        const legacyExperience = renderLegacyExperience(portfolio.workExperience);
        return legacyExperience || `<div class="one-column-entry">${renderParagraphs(portfolio.workExperience || "Not listed")}</div>`;
    }

    return filledExperience
        .map((entry) => {
            const title = entry.designation || "Role";
            const location = entry.isRemote ? "Remote" : entry.location;
            const companyLine = [
                entry.companyName ? `, ${entry.companyName}` : "",
                location ? ` — ${location}` : "",
            ].join("");
            const duration = [
                formatMonthYear(entry.startDate),
                formatMonthYear(entry.endDate) || (entry.startDate ? "Present" : ""),
            ].filter(Boolean).join(" – ");
            const highlights = splitHighlights(entry.whatLearned);

            return `
                <div class="two-column-entry experience-entry">
                    <div>
                        <p><strong>${escapeHtml(title)}</strong>${escapeHtml(companyLine)}</p>
                    </div>
                    <div class="entry-meta">${escapeHtml(duration)}</div>
                </div>
                ${highlights.length ? `
                    <ul class="highlights">
                        ${highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join("")}
                    </ul>
                ` : ""}
            `;
        })
        .join("");
};

const renderLinks = (links = []) => {
    const cleanLinks = links
        .map((link) => ({
            label: String(link.label || "Link").trim(),
            url: String(link.url || "").trim(),
        }))
        .filter((link) => link.url);

    if (!cleanLinks.length) {
        return "<p>No links listed.</p>";
    }

    return cleanLinks
        .map((link) => {
            const href = normalizeUrl(link.url);
            return `<p><strong>${escapeHtml(link.label)}:</strong> <a href="${escapeHtml(href)}">${escapeHtml(link.url)}</a></p>`;
        })
        .join("");
};

const renderContactLine = ({ user, portfolio }) => {
    const location = user?.gigPreferences?.location || "";
    const links = (portfolio.links || []).filter((link) => link.url).slice(0, 3);
    const contactItems = [
        location && `<span>${escapeHtml(location)}</span>`,
        user?.email && `<a href="mailto:${escapeHtml(user.email)}">${escapeHtml(user.email)}</a>`,
        ...links.map((link) => `<a href="${escapeHtml(normalizeUrl(link.url))}">${escapeHtml(link.url.replace(/^https?:\/\//i, ""))}</a>`),
    ].filter(Boolean);

    return contactItems.join('<span class="contact-separator">|</span>');
};

const renderProjects = (projects = []) => {
    if (!projects.length) {
        return "<p>No project samples listed yet.</p>";
    }

    return projects
        .map((project) => {
            const skills = Array.isArray(project.technologies) ? project.technologies.filter(Boolean) : [];
            const link = project.projectLink ? normalizeUrl(project.projectLink) : "";

            return `
                <div class="two-column-entry">
                    <div>
                        <h3>${escapeHtml(project.title || "Project sample")}</h3>
                    </div>
                    <div class="entry-meta">
                        ${link ? `<a href="${escapeHtml(link)}">Project link</a>` : ""}
                    </div>
                </div>
                <ul class="highlights">
                    <li>${escapeHtml(project.description || "No project description listed.")}</li>
                    ${skills.length ? `<li><strong>Skills:</strong> ${renderInlineList(skills)}</li>` : ""}
                </ul>
            `;
        })
        .join("");
};

export const buildResumeHtml = ({ user, portfolio, projects }) => {
    const fullName = user?.fullName || user?.username || "GigWorld Freelancer";
    const skills = user?.gigPreferences?.skills || [];
    const portfolioForResume = {
        ...portfolio,
        education: portfolio.education || user?.gigPreferences?.education || "Not listed",
        workExperience: portfolio.workExperience || user?.gigPreferences?.workExperience || "Not listed",
    };
    const contactLine = renderContactLine({ user, portfolio });

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(fullName)} Resume</title>
  <style>
    @page {
      size: Letter;
      margin: 2cm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: #000;
      background: #fff;
      font-family: Charter, Georgia, "Times New Roman", serif;
      font-size: 10pt;
      line-height: 1.38;
    }

    a {
      color: #000;
      text-decoration: none;
    }

    p {
      margin: 0 0 0.1cm;
    }

    .resume-page {
      width: 100%;
    }

    .resume-header {
      text-align: center;
      line-height: 1.5;
      margin-bottom: 0.25cm;
    }

    .resume-name {
      margin: 0;
      font-size: 25pt;
      line-height: 25pt;
      font-weight: 400;
    }

    .contact-line {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 0.16cm;
      margin-top: 5pt;
      font-size: 10pt;
    }

    .contact-separator {
      margin: 0 0.08cm;
    }

    .section {
      margin-top: 0.3cm;
      margin-bottom: 0.2cm;
      break-inside: avoid;
    }

    .section-title {
      margin: 0 0 0.2cm -1pt;
      padding-bottom: 1pt;
      border-bottom: 1px solid #000;
      font-size: 12pt;
      line-height: 1.2;
      font-weight: 700;
    }

    .one-column-entry {
      margin: 0;
    }

    .two-column-entry {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 4.5cm;
      column-gap: 0.15cm;
      align-items: start;
      margin-bottom: 0.1cm;
      break-inside: avoid;
    }

    .two-column-entry p {
      margin: 0 0 0.05cm;
    }

    .two-column-entry h3 {
      margin: 0;
      font-size: 10pt;
      font-weight: 700;
    }

    .entry-meta {
      text-align: right;
      font-size: 10pt;
    }

    .highlights {
      margin: 0.1cm 0 0.2cm;
      padding-left: 10pt;
      break-inside: avoid;
    }

    .highlights li {
      margin: 0;
      padding-left: 0;
    }

    .compact-line {
      margin-bottom: 0.1cm;
    }

    .education-entry {
      margin-bottom: 0.12cm;
    }

    .experience-entry {
      margin-bottom: 0.04cm;
    }
  </style>
</head>
<body>
  <main class="resume-page">
    <header class="resume-header">
      <h1 class="resume-name">${escapeHtml(fullName)}</h1>
      <div class="contact-line">
        ${contactLine || `<a href="mailto:${escapeHtml(user?.email || "")}">${escapeHtml(user?.email || "")}</a>`}
      </div>
    </header>

    <section class="section">
      <h2 class="section-title">Summary</h2>
      <div class="one-column-entry">${renderParagraphs(portfolio.bio || "No bio listed yet.")}</div>
    </section>

    <section class="section">
      <h2 class="section-title">Education</h2>
      ${renderEducation(portfolioForResume)}
    </section>

    <section class="section">
      <h2 class="section-title">Experience</h2>
      ${renderExperience(portfolioForResume)}
    </section>

    <section class="section">
      <h2 class="section-title">Skills</h2>
      <div class="one-column-entry compact-line">${renderInlineList(skills)}</div>
    </section>

    <section class="section">
      <h2 class="section-title">Projects</h2>
      <div class="one-column-entry">${renderProjects(projects)}</div>
    </section>

    <section class="section">
      <h2 class="section-title">Links</h2>
      <div class="one-column-entry">${renderLinks(portfolio.links || [])}</div>
    </section>
  </main>
</body>
</html>`;
};
