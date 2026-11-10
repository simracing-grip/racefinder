// Branded full-page "Red flag" screen for the two error pages that render
// outside the root layout, so without globals.css, fonts or Tailwind:
// pages/500.tsx (the static 500.html) and app/global-error.tsx. Inline
// styles only, and plain <a> links (full page loads), since neither can rely
// on the app's router or styles being available. app/error.tsx is the
// in-layout equivalent.
const INK = "#07080b";
const SIGNAL = "#ff2a2a";
const TIMING = "#ffd400";
const DISPLAY = '"Barlow Condensed", "Arial Narrow", "Roboto Condensed", system-ui, sans-serif';

export default function ServerErrorScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        margin: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 16px",
        boxSizing: "border-box",
        background: INK,
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        textAlign: "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/"
        aria-label="RaceFinder home"
        style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 800, fontStyle: "italic", textTransform: "uppercase", color: "#fff", textDecoration: "none" }}
      >
        Race<span style={{ color: SIGNAL }}>Finder</span>
      </a>
      <p style={{ marginTop: 48, fontFamily: DISPLAY, fontSize: 14, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: TIMING }}>
        Red flag
      </p>
      <div
        aria-hidden
        style={{
          marginTop: 12,
          height: 8,
          width: 160,
          transform: "skewX(-12deg)",
          background: `repeating-linear-gradient(90deg, ${SIGNAL} 0 22px, #fff 22px 44px)`,
        }}
      />
      <h1
        style={{
          margin: "24px 0 0",
          fontFamily: DISPLAY,
          fontSize: "clamp(2.25rem, 7vw, 3rem)",
          fontWeight: 900,
          fontStyle: "italic",
          lineHeight: 1,
          textTransform: "uppercase",
          color: "#fff",
        }}
      >
        Something went wrong
      </h1>
      <p style={{ maxWidth: 440, marginTop: 16, lineHeight: 1.6, color: "#9ca3af" }}>
        That&apos;s on us, not you. It&apos;s usually brief &mdash; try again in a minute, or head back to the
        homepage.
      </p>
      <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
        {/* A plain GET form reloads the current URL, like the built-in page's button. */}
        <form method="get" style={{ margin: 0 }}>
          <button
            type="submit"
            style={{
              cursor: "pointer",
              border: 0,
              background: SIGNAL,
              color: "#fff",
              padding: "12px 24px",
              fontFamily: DISPLAY,
              fontSize: 18,
              fontWeight: 900,
              fontStyle: "italic",
              textTransform: "uppercase",
            }}
          >
            Try again
          </button>
        </form>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          style={{
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            padding: "11px 20px",
            fontFamily: DISPLAY,
            fontSize: 18,
            fontWeight: 700,
            fontStyle: "italic",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          Go home
        </a>
      </div>
    </div>
  );
}
