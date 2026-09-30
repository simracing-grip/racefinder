import { renderBrandIcon } from "@/lib/brandIcon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS rounds the corners itself, so this one is square.
export default function AppleIcon() {
  return renderBrandIcon(180, { rounded: false });
}
