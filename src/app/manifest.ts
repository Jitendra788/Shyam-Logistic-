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
        src: "/brand/shyam-peacock-mark.png",
        sizes: "400x400",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/shyam-brand-logo.png",
        sizes: "826x933",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
