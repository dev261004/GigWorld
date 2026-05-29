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
    const education = portfolio.education || user?.gigPreferences?.education || "Not listed";
    const workExperience = portfolio.workExperience || user?.gigPreferences?.workExperience || "Not listed";
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
      <div class="one-column-entry">${renderParagraphs(education)}</div>
    </section>

    <section class="section">
      <h2 class="section-title">Experience</h2>
      <div class="one-column-entry">${renderParagraphs(workExperience)}</div>
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
