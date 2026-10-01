import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 112,
          background: "#d92d28",
          color: "white",
          fontSize: 238,
          fontWeight: 800,
          letterSpacing: "-0.08em",
          paddingRight: 22,
        }}
      >
        A
      </div>
    ),
    size,
  );
}
