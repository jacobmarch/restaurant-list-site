import { ImageResponse } from "next/og";
import { SiteIconMarkup } from "@/lib/site-icon-markup";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<SiteIconMarkup size={32} />, {
    ...size,
  });
}
