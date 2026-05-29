/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";

const emptyPreferences = {
  currentStatus: "",
  categories: [],
  skills: [],
  experienceLevel: "",
  workTypes: [],
  education: "",
  currentRole: "",
  workExperience: "",
  preferredBudget: "",
  languages: [],
  location: "",
  gender: "",
  age: "",
  onboardingCompleted: false,
};

const currentStatusOptions = ["Student", "Working professional", "Freelancer", "Homemaker", "Unemployed", "Business owner"];
const categoryOptions = ["Tech", "Design", "Writing", "Marketing", "Data entry", "Customer support", "Video editing", "Tutoring", "Translation"];
const popularSkills = ["React", "Python", "Logo Design", "Figma", "Content Writing", "Excel", "SEO", "Video Editing", "Data Entry", "Communication"];
const experienceOptions = ["Beginner", "Intermediate", "Experienced", "Expert"];
const workTypeOptions = ["Remote", "Part-time", "Full-time", "Fixed-price", "Hourly", "Short-term", "Long-term"];
const budgetOptions = ["Any budget", "Under $100", "$100 - $500", "$500 - $1000", "$1000+"];
const genderOptions = ["Prefer not to say", "Female", "Male", "Non-binary", "Other"];

const mergePreferences = (preferences = {}) => ({
  ...emptyPreferences,
  ...preferences,
  categories: Array.isArray(preferences.categories) ? preferences.categories : [],
  skills: Array.isArray(preferences.skills) ? preferences.skills : [],
  workTypes: Array.isArray(preferences.workTypes) ? preferences.workTypes : [],
  languages: Array.isArray(preferences.languages) ? preferences.languages : [],
  age: preferences.age || "",
});

const toggleValue = (list, value) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

const ChipButton = ({ isSelected, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-4 py-2 text-sm font-black transition ${
      isSelected
        ? "border-blue-600 bg-blue-700 text-white shadow-sm shadow-blue-700/20"
        : "border-blue-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700"
    }`}
  >
    {label}
  </button>
);

const FieldLabel = ({ children, optional }) => (
  <label className="text-sm font-black uppercase text-slate-700">
    {children}
    {optional && <span className="ml-2 text-xs font-bold normal-case text-slate-400">Optional</span>}
  </label>
);

const GigPreferencesForm = ({ initialPreferences, isSaving = false, onSave, submitLabel = "Save preferences", showOptional = true }) => {
  const [preferences, setPreferences] = useState(() => mergePreferences(initialPreferences));
  const [customSkill, setCustomSkill] = useState("");
  const [customLanguage, setCustomLanguage] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setPreferences(mergePreferences(initialPreferences));
  }, [initialPreferences]);

  const completion = useMemo(() => {
    const fields = [
      preferences.currentStatus,
      preferences.categories.length,
      preferences.skills.length,
      preferences.experienceLevel,
      preferences.workTypes.length,
      preferences.education,
      preferences.currentRole,
      preferences.workExperience,
      preferences.preferredBudget,
      preferences.languages.length,
      preferences.location,
    ];
    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  }, [preferences]);

  const coreIsValid =
    preferences.currentStatus &&
    preferences.categories.length > 0 &&
    preferences.skills.length > 0 &&
    preferences.experienceLevel &&
    preferences.workTypes.length > 0;

  const updateField = (field, value) => {
    setPreferences((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const addListValue = (field, value) => {
    const cleanedValue = value.trim();

    if (!cleanedValue) {
      return;
    }

    setPreferences((current) => ({
      ...current,
      [field]: current[field].includes(cleanedValue) ? current[field] : [...current[field], cleanedValue],
    }));
  };

  const removeListValue = (field, value) => {
    setPreferences((current) => ({
      ...current,
      [field]: current[field].filter((item) => item !== value),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched(true);

    if (!coreIsValid) {
      return;
    }

    onSave({
      ...preferences,
      onboardingCompleted: true,
      age: preferences.age === "" ? "" : Number(preferences.age),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="rounded-lg border border-blue-300 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-blue-700">Gig preferences</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Help GigWorld understand your best-fit work.</h2>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
            <p className="text-2xl font-black text-emerald-700">{completion}%</p>
            <p className="text-xs font-black uppercase text-emerald-700">Complete</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          These answers help match tech and non-tech gigs to your interests, skills, and preferred work style.
        </p>
      </div>

      {touched && !coreIsValid && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          Please complete current status, category, skills, experience, and work type.
        </div>
      )}

      <section className="rounded-lg border border-blue-300 bg-white p-5">
        <FieldLabel>Current status</FieldLabel>
        <div className="mt-3 flex flex-wrap gap-2">
          {currentStatusOptions.map((option) => (
            <ChipButton
              key={option}
              label={option}
              isSelected={preferences.currentStatus === option}
              onClick={() => updateField("currentStatus", option)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-blue-300 bg-white p-5">
        <FieldLabel>Interested gig categories</FieldLabel>
        <div className="mt-3 flex flex-wrap gap-2">
          {categoryOptions.map((option) => (
            <ChipButton
              key={option}
              label={option}
              isSelected={preferences.categories.includes(option)}
              onClick={() => updateField("categories", toggleValue(preferences.categories, option))}
            />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-blue-300 bg-white p-5">
        <FieldLabel>Skills</FieldLabel>
        <div className="mt-3 flex flex-wrap gap-2">
          {popularSkills.map((skill) => (
            <ChipButton
              key={skill}
              label={skill}
              isSelected={preferences.skills.includes(skill)}
              onClick={() => updateField("skills", toggleValue(preferences.skills, skill))}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={customSkill}
            onChange={(event) => setCustomSkill(event.target.value)}
            className="w-full rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
            placeholder="Add your own skill"
          />
          <button
            type="button"
            onClick={() => {
              addListValue("skills", customSkill);
              setCustomSkill("");
            }}
            className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-800"
          >
            Add
          </button>
        </div>
        {preferences.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {preferences.skills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => removeListValue("skills", skill)}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700"
              >
                {skill} x
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-5 rounded-lg border border-blue-300 bg-white p-5 lg:grid-cols-2">
        <div>
          <FieldLabel>Experience level</FieldLabel>
          <select
            value={preferences.experienceLevel}
            onChange={(event) => updateField("experienceLevel", event.target.value)}
            className="mt-2 w-full rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
          >
            <option value="">Select experience</option>
            {experienceOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Preferred budget</FieldLabel>
          <select
            value={preferences.preferredBudget}
            onChange={(event) => updateField("preferredBudget", event.target.value)}
            className="mt-2 w-full rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
          >
            <option value="">Select budget</option>
            {budgetOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-2">
          <FieldLabel>Preferred work type</FieldLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {workTypeOptions.map((option) => (
              <ChipButton
                key={option}
                label={option}
                isSelected={preferences.workTypes.includes(option)}
                onClick={() => updateField("workTypes", toggleValue(preferences.workTypes, option))}
              />
            ))}
          </div>
        </div>
      </section>

      {showOptional && (
        <section className="rounded-lg border border-blue-300 bg-white p-5">
          <FieldLabel optional>Additional profile details</FieldLabel>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <input
              type="text"
              value={preferences.education}
              onChange={(event) => updateField("education", event.target.value)}
              className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
              placeholder="Education details"
            />
            <input
              type="text"
              value={preferences.currentRole}
              onChange={(event) => updateField("currentRole", event.target.value)}
              className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
              placeholder="Current job role"
            />
            <input
              type="text"
              value={preferences.workExperience}
              onChange={(event) => updateField("workExperience", event.target.value)}
              className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
              placeholder="Work experience"
            />
            <input
              type="text"
              value={preferences.location}
              onChange={(event) => updateField("location", event.target.value)}
              className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
              placeholder="Location or time zone"
            />
            <select
              value={preferences.gender}
              onChange={(event) => updateField("gender", event.target.value)}
              className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
            >
              <option value="">Gender, optional</option>
              {genderOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <input
              type="number"
              min="13"
              max="100"
              value={preferences.age}
              onChange={(event) => updateField("age", event.target.value)}
              className="rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
              placeholder="Age, optional"
            />
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={customLanguage}
              onChange={(event) => setCustomLanguage(event.target.value)}
              className="w-full rounded-lg border-blue-200 text-sm shadow-sm focus:border-blue-600 focus:ring-blue-600/20"
              placeholder="Add a language"
            />
            <button
              type="button"
              onClick={() => {
                addListValue("languages", customLanguage);
                setCustomLanguage("");
              }}
              className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-800"
            >
              Add
            </button>
          </div>
          {preferences.languages.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {preferences.languages.map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => removeListValue("languages", language)}
                  className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700"
                >
                  {language} x
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-500">
          You can edit these answers anytime from your profile.
        </p>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-blue-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isSaving ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default GigPreferencesForm;
