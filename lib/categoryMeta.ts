import type { Category } from "@/lib/types";

export const CATEGORY_LABEL: Record<Category, string> = {
  sim_racing: "Sim Racing",
  track_day: "Track Day",
  karting: "Karting",
  f1: "F1",
};

export const CATEGORY_COLOR: Record<Category, string> = {
  sim_racing: "#7c3aed", // violet
  track_day: "#dc2626", // red
  karting: "#16a34a", // green
  f1: "#eab308", // gold
};

export const CATEGORY_BADGE_CLASS: Record<Category, string> = {
  sim_racing: "bg-violet-500/15 text-violet-300",
  track_day: "bg-red-500/15 text-red-300",
  karting: "bg-green-500/15 text-green-300",
  f1: "bg-amber-500/15 text-amber-300",
};
