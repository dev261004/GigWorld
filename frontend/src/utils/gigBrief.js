const sectionTitleMap = new Map([
  ["job description", "Job description"],
  ["key responsibilities", "Key responsibilities"],
  ["responsibilities", "Responsibilities"],
  ["requirements", "Requirements"],
  ["preferred qualifications", "Preferred qualifications"],
  ["additional information", "Additional information"],
  ["general information", "General information"],
]);

const metadataLabels = new Set(["client", "location", "contract"]);

const normalizeHeading = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[:\-\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeBriefText = (value = "") =>
  String(value || "")
    .replace(/\r/g, "\n")
    .replace(/\s+(Client|Location|Contract):/gi, "\n$1:")
    .replace(/\s+(Job Description|Key Responsibilities|Responsibilities|Requirements|Preferred Qualifications|Additional Information|General Information)\s*-{2,}/gi, "\n$1\n")
    .replace(/\s+(Job Description|Key Responsibilities|Responsibilities|Requirements|Preferred Qualifications|Additional Information|General Information)(?=\s|$)/gi, "\n$1\n")
    .replace(/\s+\*\s+/g, "\n* ")
    .replace(/\n?[-]{3,}\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const parseGigBriefText = (value = "") => {
  const normalized = normalizeBriefText(value);

  if (!normalized) {
    return {
      meta: [],
      sections: [],
    };
  }

  const meta = [];
  const sections = [];
  let currentSection = {
    title: "Overview",
    items: [],
  };

  const pushCurrentSection = () => {
    if (currentSection.items.length > 0) {
      sections.push(currentSection);
    }
  };

  normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const headingKey = normalizeHeading(line);

      if (sectionTitleMap.has(headingKey)) {
        pushCurrentSection();
        currentSection = {
          title: sectionTitleMap.get(headingKey),
          items: [],
        };
        return;
      }

      const metadataMatch = line.match(/^([A-Za-z ]+):\s*(.+)$/);
      const metadataLabel = normalizeHeading(metadataMatch?.[1] || "");

      if (metadataMatch && metadataLabels.has(metadataLabel)) {
        meta.push({
          label: metadataMatch[1].trim(),
          value: metadataMatch[2].trim(),
        });
        return;
      }

      if (/^[*•-]\s+/.test(line)) {
        currentSection.items.push({
          type: "bullet",
          text: line.replace(/^[*•-]\s+/, "").trim(),
        });
        return;
      }

      currentSection.items.push({
        type: "paragraph",
        text: line,
      });
    });

  pushCurrentSection();

  return {
    meta,
    sections,
  };
};

export const getGigBriefPreview = (value = "") => {
  const { sections } = parseGigBriefText(value);
  const firstReadableItem = sections
    .flatMap((section) => section.items)
    .find((item) => item.text && item.text.length > 24);

  return firstReadableItem?.text || "";
};
