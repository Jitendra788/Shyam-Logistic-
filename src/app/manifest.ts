import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "shyamlogistic | SHYAM LOGISTIC",
    short_name: "shyamlogistic",
    description:
      "Official website of shyamlogistic (SHYAM LOGISTIC) — FTL, PTL and pan-India logistics from Sangli.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a1f3d",
    lang: "en-IN",
    icons: [
      {
        src: "/brand/shyam-mark.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/shyam-logo.png",
        sizes: "670x469",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
