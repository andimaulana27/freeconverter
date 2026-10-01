import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} — free browser-based file converter`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#fbfaf9",
          color: "#111111",
          padding: "72px 80px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: 999,
            right: -90,
            top: -110,
            background: "#d92d28",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 210,
            height: 210,
            borderRadius: 48,
            right: 210,
            bottom: -95,
            background: "#ffd74a",
            transform: "rotate(12deg)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, fontWeight: 800 }}>
            <div
              style={{
                display: "flex",
                width: 52,
                height: 52,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                background: "#d92d28",
                color: "white",
              }}
            >
              A
            </div>
            {SITE_NAME}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexWrap: "wrap", fontSize: 76, lineHeight: 0.98, fontWeight: 800, letterSpacing: "-0.055em", maxWidth: 840 }}>
              Make every file
              <span style={{ color: "#d92d28" }}> work harder.</span>
            </div>
            <div style={{ marginTop: 30, fontSize: 25, color: "#6b625e" }}>
              Convert images, PDFs, documents, and fonts—free in your browser.
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
