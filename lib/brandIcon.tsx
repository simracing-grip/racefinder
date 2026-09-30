import { ImageResponse } from "next/og";

// The logo mark (a red and a white slanted bar, as in components/Brand/Logo)
// on the site's ink background, for the favicon and the iOS home-screen icon.
export function renderBrandIcon(size: number, { rounded }: { rounded: boolean }) {
  const bar = { width: size * 0.2, height: size * 0.58, transform: "skewX(-22deg)" };
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: size * 0.07,
          background: "#07080b",
          borderRadius: rounded ? size * 0.2 : 0,
        }}
      >
        <div style={{ ...bar, background: "#ff2a2a" }} />
        <div style={{ ...bar, background: "#f4f4f5" }} />
      </div>
    ),
    { width: size, height: size }
  );
}
