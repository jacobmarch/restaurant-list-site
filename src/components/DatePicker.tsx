"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const VIEWPORT_PAD = 12;
const TRIGGER_GAP = 8;

type DatePickerProps = {
  id?: string;
  name: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
};

type Placement = "below" | "above";

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return "Select a date";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCalendarDays(month: Date): (Date | null)[] {
  const firstDay = startOfMonth(month);
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const leadingEmpty = firstDay.getDay();
  const cells: (Date | null)[] = Array.from({ length: leadingEmpty }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DatePicker({
  id,
  name,
  value,
  required,
  onChange,
}: DatePickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const calendarId = `${inputId}-calendar`;
  const rootRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const selectedDate = parseIsoDate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(selectedDate ?? new Date()),
  );

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    const nextSelected = parseIsoDate(value);
    if (nextSelected) {
      setVisibleMonth(startOfMonth(nextSelected));
    }
  }, [value]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    function applyPlacement(next: Placement) {
      const calendar = calendarRef.current;
      if (!calendar) return;

      if (next === "above") {
        calendar.style.top = "auto";
        calendar.style.bottom = "100%";
        calendar.style.marginTop = "0";
        calendar.style.marginBottom = `${TRIGGER_GAP}px`;
      } else {
        calendar.style.bottom = "auto";
        calendar.style.top = "100%";
        calendar.style.marginBottom = "0";
        calendar.style.marginTop = `${TRIGGER_GAP}px`;
      }
    }

    function stickyHeaderOffset() {
      const header = document.querySelector("header");
      if (!header) return VIEWPORT_PAD;
      const style = window.getComputedStyle(header);
      if (style.position !== "sticky" && style.position !== "fixed") {
        return VIEWPORT_PAD;
      }
      return header.getBoundingClientRect().bottom + VIEWPORT_PAD;
    }

    function ensureFullyVisible() {
      const calendar = calendarRef.current;
      if (!calendar) return;

      const rect = calendar.getBoundingClientRect();
      const topLimit = stickyHeaderOffset();
      const bottomLimit = window.innerHeight - VIEWPORT_PAD;

      if (rect.bottom > bottomLimit) {
        window.scrollBy({ top: rect.bottom - bottomLimit, behavior: "smooth" });
      } else if (rect.top < topLimit) {
        window.scrollBy({ top: rect.top - topLimit, behavior: "smooth" });
      }
    }

    function choosePlacement(): Placement {
      const root = rootRef.current;
      const calendar = calendarRef.current;
      if (!root || !calendar) return "below";

      applyPlacement("below");

      const trigger = root.getBoundingClientRect();
      const calendarHeight = calendar.offsetHeight;
      const topLimit = stickyHeaderOffset();
      const spaceBelow =
        window.innerHeight - trigger.bottom - TRIGGER_GAP - VIEWPORT_PAD;
      const spaceAbove = trigger.top - TRIGGER_GAP - topLimit;

      if (spaceBelow >= calendarHeight) return "below";
      if (spaceAbove >= calendarHeight) return "above";
      return spaceAbove > spaceBelow ? "above" : "below";
    }

    function positionCalendar(shouldScrollIntoView: boolean) {
      applyPlacement(choosePlacement());
      if (shouldScrollIntoView) {
        ensureFullyVisible();
      }
    }

    positionCalendar(true);
    const onResize = () => positionCalendar(true);
    const onScroll = () => positionCalendar(false);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [isOpen, visibleMonth]);

  const today = new Date();
  const days = buildCalendarDays(visibleMonth);
  const monthLabel = visibleMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  function selectDay(date: Date) {
    onChange(toIsoDate(date));
    setIsOpen(false);
  }

  function shiftMonth(delta: number) {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={value} required={required} />

      <button
        id={inputId}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={calendarId}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-left text-base text-stone-800 shadow-sm outline-none transition hover:border-rose-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
      >
        <span className={selectedDate ? "text-stone-800" : "text-stone-400"}>
          {formatDisplayDate(value)}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="h-5 w-5 shrink-0 text-rose-400"
        >
          <rect
            x="2.5"
            y="3.5"
            width="15"
            height="14"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M2.5 7.5h15M6.5 2v3M13.5 2v3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {isOpen ? (
        <div
          ref={calendarRef}
          id={calendarId}
          role="dialog"
          aria-label="Choose visit date"
          className="absolute top-full left-0 right-0 z-20 mt-2 w-full rounded-xl border border-rose-100 bg-white p-2.5 shadow-lg shadow-rose-100/40 ring-1 ring-rose-100/60"
        >
          <div className="mb-1.5 flex items-center justify-between gap-1">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-stone-500 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="h-3.5 w-3.5"
              >
                <path
                  d="M12 4.5 6.5 10 12 15.5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <p className="font-display text-sm font-semibold text-stone-800">
              {monthLabel}
            </p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-stone-500 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="h-3.5 w-3.5"
              >
                <path
                  d="M8 4.5 13.5 10 8 15.5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="mb-0.5 grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-0.5 text-center text-[0.65rem] font-medium uppercase tracking-wide text-stone-400"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="h-8" />;
              }

              const iso = toIsoDate(day);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isToday = isSameDay(day, today);

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => selectDay(day)}
                  aria-pressed={isSelected}
                  className={[
                    "h-8 rounded-md text-xs font-medium transition",
                    isSelected
                      ? "bg-rose-500 text-white shadow-sm hover:bg-rose-600"
                      : isToday
                        ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100"
                        : "text-stone-700 hover:bg-stone-100",
                  ].join(" ")}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
