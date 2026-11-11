import type { Category } from "@/lib/types";

export const CATEGORY_LABEL: Record<Category, string> = {
  sim_racing: "Sim Racing",
  track_day: "Track Day",
  karting: "Karting",
  f1: "F1",
  club_only: "Members Only",
};

// "<name> is a …" wording for descriptions and share text.
export const CATEGORY_NOUN: Record<Category, string> = {
  sim_racing: "sim racing center",
  track_day: "track day circuit",
  karting: "karting track",
  f1: "Formula 1 circuit",
  club_only: "members-only motorsport venue",
};

export const CATEGORY_COLOR: Record<Category, string> = {
  sim_racing: "#7c3aed", // violet
  track_day: "#dc2626", // red
  karting: "#16a34a", // green
  f1: "#eab308", // gold
  club_only: "#64748b", // slate
};

// The same hues, light enough for text on the site's dark backgrounds
// (at least 4.5:1, WCAG AA). CATEGORY_COLOR stays for map pins, bars and
// fills, where the darker shade reads better.
export const CATEGORY_TEXT_COLOR: Record<Category, string> = {
  sim_racing: "#a78bfa", // violet-400
  track_day: "#f87171", // red-400
  karting: "#22c55e", // green-500
  f1: "#eab308", // gold
  club_only: "#94a3b8", // slate-400
};

export const CATEGORY_BADGE_CLASS: Record<Category, string> = {
  sim_racing: "bg-violet-500/15 text-violet-300",
  track_day: "bg-red-500/15 text-red-300",
  karting: "bg-green-500/15 text-green-300",
  f1: "bg-amber-500/15 text-amber-300",
  club_only: "bg-slate-500/15 text-slate-300",
};
