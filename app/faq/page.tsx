import PageHeader from "@/components/UI/PageHeader";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "FAQ",
  description: "What RaceFinder covers, how listings are checked, and how to add or correct a venue.",
  path: "/faq",
});

const faqs = [
  {
    question: "What is RaceFinder?",
    answer:
      "RaceFinder is a free directory of sim racing centers, track day circuits, karting tracks, and F1 circuits, so you can find a place to race near you.",
  },
  {
    question: "Is RaceFinder free to use?",
    answer:
      "Yes. Browsing the directory and map is completely free, with no account required.",
  },
  {
    question: "What categories of venues are listed?",
    answer:
      "Four categories: Sim Racing centers, Track Day circuits, Karting tracks, and F1 circuits. You can browse each from the navigation bar or filter by category on the map.",
  },
  {
    question: "Which countries are covered?",
    answer:
      "Sim racing, track day, and karting listings currently focus on Europe, with coverage growing over time. F1 circuits are covered worldwide, following the full Grand Prix calendar. Choose your country from the homepage to jump straight there, or browse the world map to see everything at once — and if a venue near you is missing, let us know.",
  },
  {
    question: "How do I find venues near me?",
    answer:
      "Pick your country from the dropdown on the homepage to jump straight there, or use the Map to see all locations at once and filter by category and country.",
  },
  {
    question: "How accurate is the listing information?",
    answer:
      "Listings are compiled from public sources and reviewed before publishing, but details like pricing and hours can change. Always confirm with the venue directly before visiting.",
  },
  {
    question: "How do I add or update a listing?",
    answer:
      "We're working on a submission form. In the meantime, reach out with the venue details and we'll add it to the directory.",
  },
];

export default function FaqPage() {
  return (
    <div>
      <PageHeader
        kicker="FAQ"
        title="Questions, answered"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/faq", label: "FAQ" },
        ]}
      />
      <div className="mx-auto max-w-3xl px-4 pt-10">
        {/* Native <details> accordions: no JS, keyboard-accessible, first one open. */}
        <div className="divide-y divide-white/10 border-y border-white/10">
          {faqs.map((faq, i) => (
            <details key={faq.question} open={i === 0} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                <span className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-signal">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-xl font-bold uppercase italic text-white">{faq.question}</span>
                </span>
                <span className="text-2xl leading-none text-gray-500 transition group-open:rotate-45 group-open:text-signal" aria-hidden>
                  +
                </span>
              </summary>
              <p className="pb-5 pl-8 leading-relaxed text-gray-400">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
