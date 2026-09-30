"use client";

import { useEffect, useRef, useState } from "react";
import CountryFlag from "@/components/CountryFlag";

export interface CountrySelectOption {
  value: string;
  label: string;
  code?: string;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
    >
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Custom listbox standing in for a native <select> so options can show a
// colored flag (flag-icons SVG sprite) instead of a country name/code —
// browsers won't apply a CSS background-image to a plain <option>, and
// Unicode flag emoji render as two-letter codes on Windows (no flag glyphs
// in Segoe UI Emoji), so neither approach works inside a real <select>.
export default function CountrySelect({
  id,
  options,
  value,
  onChange,
  ariaLabel,
  buttonClassName = "",
  menuClassName = "",
  placeholder = "",
}: {
  id?: string;
  options: CountrySelectOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  buttonClassName?: string;
  menuClassName?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    // Only scroll when the menu opens — later moves are scrolled by the
    // arrow-key handler itself, right when it changes activeIndex.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function openMenu() {
    setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function choose(v: string) {
    onChange(v);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onButtonKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openMenu();
    }
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => {
        const next = Math.min(i + 1, options.length - 1);
        optionRefs.current[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => {
        const next = Math.max(i - 1, 0);
        optionRefs.current[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt) choose(opt.value);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onButtonKeyDown}
        className={buttonClassName}
      >
        {selected?.code && <CountryFlag countryCode={selected.code} />}
        <span className={selected ? "" : "text-gray-400"}>{selected ? selected.label : placeholder}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          ref={(el) => el?.focus()}
          className={`absolute z-30 mt-1 max-h-72 w-max min-w-full overflow-y-auto border border-white/10 bg-panel py-1 shadow-2xl shadow-black/60 ${menuClassName}`}
        >
          {options.map((o, i) => (
            <li key={o.value || "__placeholder__"}>
              <button
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                type="button"
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => choose(o.value)}
                className={`flex w-full items-center gap-2 whitespace-nowrap px-3 py-1.5 text-left text-sm ${
                  i === activeIndex ? "bg-white/5" : ""
                } ${o.value === value ? "text-white" : "text-gray-200"}`}
              >
                {o.code && <CountryFlag countryCode={o.code} />}
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
