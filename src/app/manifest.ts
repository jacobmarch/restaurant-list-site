import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Our Restaurant Visits",
    short_name: "Restaurant Visits",
    description: "A shared diary of every restaurant we've visited together.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#fff1f2",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
