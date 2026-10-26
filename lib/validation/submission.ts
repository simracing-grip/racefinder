import { z } from "zod";
import { categorySchema } from "@/lib/validation/listing";

export const SUBMISSION_KINDS = ["new_venue", "correction", "owner"] as const;
export type SubmissionKind = (typeof SUBMISSION_KINDS)[number];

// Empty fields arrive as "", and fields not on the form (e.g. city when
// fixing a listing) as null — treat both as not given.
const blank = (v: unknown) => (v == null || (typeof v === "string" && v.trim() === "") ? undefined : v);
const optionalText = (max: number) => z.preprocess(blank, z.string().trim().max(max).optional());

export const submissionSchema = z.object({
  kind: z.enum(SUBMISSION_KINDS),
  venueSlug: optionalText(200),
  venueName: z.string().trim().min(2, "Enter the venue's name.").max(200),
  categories: z.array(categorySchema).max(5).default([]),
  city: optionalText(120),
  country: optionalText(120),
  websiteUrl: z.preprocess(
    blank,
    z.string().trim().url("Enter a full web address, starting with https://").max(500).optional(),
  ),
  message: z.string().trim().min(10, "Tell us a bit more (at least 10 characters).").max(4000),
  contactName: optionalText(120),
  contactEmail: z.string().trim().email("Enter a valid email so we can reply.").max(254),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
