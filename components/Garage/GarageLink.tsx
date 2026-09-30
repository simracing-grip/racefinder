"use client";

import Link from "next/link";
import { useGarage } from "@/lib/garage";
import { StarIcon } from "./SaveButton";

// Header link to /garage with a count of saved venues.
export default function GarageLink() {
  const { items } = useGarage();
  return (
    <Link
      href="/garage"
      aria-label={items.length > 0 ? `My garage, ${items.length} saved venues` : "My garage"}
      className="relative flex items-center gap-2 border border-white/10 px-2.5 py-2 text-sm text-gray-400 transition hover:border-white/30 hover:text-white"
    >
      <StarIcon filled={items.length > 0} className={`h-4 w-4 ${items.length > 0 ? "text-timing" : ""}`} />
      <span className="hidden xl:inline">Garage</span>
      {items.length > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center bg-timing px-1 font-mono text-[10px] font-bold text-ink">
          {items.length}
        </span>
      )}
    </Link>
  );
}
