// Decorative circuit for the hero: a fictional layout (deliberately not a
// real track, so nobody reads it as a map). The red racing line draws itself
// in once, then a glowing "car" laps it forever via SVG animateMotion.
const TRACK =
  "M90 320 L380 320 C440 320 478 300 488 258 L518 128 C528 86 498 58 456 68 L346 100 C312 110 300 142 322 164 C344 186 342 214 310 224 L208 246 C166 254 152 214 174 188 L236 118 C258 92 238 56 202 60 L120 74 C78 82 58 116 62 158 L66 262 C68 298 76 320 90 320 Z";

export default function HeroTrack({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 580 380" className={className} aria-hidden>
      <defs>
        <filter id="car-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="line-fade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff2a2a" />
          <stop offset="1" stopColor="#ff7a2a" />
        </linearGradient>
        <pattern id="hero-checker" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#f4f4f5" />
          <rect width="4" height="4" fill="#07080b" />
          <rect x="4" y="4" width="4" height="4" fill="#07080b" />
        </pattern>
      </defs>

      {/* asphalt + run-off */}
      <path d={TRACK} fill="none" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="44" strokeLinejoin="round" />
      <path d={TRACK} fill="none" stroke="#1a1e28" strokeWidth="26" strokeLinejoin="round" />
      <path
        d={TRACK}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.14"
        strokeWidth="1"
        strokeDasharray="10 12"
      />

      {/* racing line */}
      <path
        d={TRACK}
        pathLength={1}
        fill="none"
        stroke="url(#line-fade)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="track-draw"
      />

      {/* start / finish */}
      <rect x="230" y="306" width="10" height="28" fill="url(#hero-checker)" />

      {/* sector markers */}
      <g fontFamily="var(--font-geist-mono)" fontSize="10" fill="#8b93a7">
        <text x="290" y="352">S1</text>
        <text x="530" y="200">S2</text>
        <text x="20" y="210">S3</text>
      </g>

      {/* hidden until the line finishes drawing, so it doesn't sit at 0,0 */}
      <g className="track-car" filter="url(#car-glow)" opacity="0">
        <circle r="6" fill="#ffd400" />
        <set attributeName="opacity" to="1" begin="2.4s" />
        <animateMotion dur="9s" begin="2.4s" repeatCount="indefinite" rotate="auto" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
          <mpath href="#hero-track-path" />
        </animateMotion>
      </g>
      <path id="hero-track-path" d={TRACK} fill="none" stroke="none" />
    </svg>
  );
}
