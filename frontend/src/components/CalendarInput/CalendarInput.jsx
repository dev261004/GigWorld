/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const toDate = (value) => {
  if (!value) {
    return null;
  }

  if (/^\d{4}$/.test(value)) {
    return new Date(Number(value), 0, 1);
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const padNumber = (value) => String(value).padStart(2, "0");

const formatDateValue = (date) =>
  `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;

const formatMonthValue = (date) => `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}`;

const formatDisplayValue = (date, mode) => {
  if (!date) {
    return "";
  }

  if (mode === "year") {
    return String(date.getFullYear());
  }

  if (mode === "month") {
    return date.toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const CalendarInput = ({ value, onChange, mode = "date", placeholder = "Select date", ariaLabel = "Select date" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedDate = toDate(value);
  const maxDetail = mode === "year" ? "decade" : mode === "month" ? "year" : "month";
  const defaultView = mode === "month" ? "year" : undefined;

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const handleSelect = (nextDate) => {
    const pickedDate = Array.isArray(nextDate) ? nextDate[0] : nextDate;

    if (!pickedDate) {
      return;
    }

    if (mode === "year") {
      onChange(String(pickedDate.getFullYear()));
    } else if (mode === "month") {
      onChange(formatMonthValue(pickedDate));
    } else {
      onChange(formatDateValue(pickedDate));
    }

    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-lg border border-blue-200 bg-blue-50/40 px-4 py-3 text-left text-sm font-bold text-slate-900 shadow-sm transition hover:border-blue-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
      >
        <span className={selectedDate ? "text-slate-900" : "text-slate-400"}>
          {formatDisplayValue(selectedDate, mode) || placeholder}
        </span>
        <i className="bx bx-calendar text-lg text-blue-700" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-[280px] rounded-lg border border-blue-300 bg-white p-3 shadow-2xl shadow-blue-950/15">
          <Calendar
            value={selectedDate}
            onChange={handleSelect}
            maxDetail={maxDetail}
            defaultView={defaultView}
            selectRange={false}
            className="gigworld-calendar"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="mt-3 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarInput;
