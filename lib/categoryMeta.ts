import type { Category } from "@/lib/types";

export const CATEGORY_LABEL: Record<Category, string> = {
  sim_racing: "Sim Racing",
  track_day: "Track Day",
  karting: "Karting",
};

export const CATEGORY_COLOR: Record<Category, string> = {
  sim_racing: "#7c3aed", // violet
  track_day: "#dc2626", // red
  karting: "#16a34a", // green
};

export const CATEGORY_BADGE_CLASS: Record<Category, string> = {
  sim_racing: "bg-violet-100 text-violet-800",
  track_day: "bg-red-100 text-red-800",
  karting: "bg-green-100 text-green-800",
};
