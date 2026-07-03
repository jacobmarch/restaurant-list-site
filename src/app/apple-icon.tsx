import { ImageResponse } from "next/og";
import { SiteIconMarkup } from "@/lib/site-icon-markup";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<SiteIconMarkup size={180} />, {
    ...size,
  });
}
