export const metadata = { title: "FAQ" };

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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Frequently asked questions</h1>
      <dl className="divide-y divide-gray-800">
        {faqs.map((faq) => (
          <div key={faq.question} className="py-5">
            <dt className="font-semibold text-gray-100">{faq.question}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-gray-400">
              {faq.answer}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
