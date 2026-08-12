import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#070b08",
          border: "10px solid #55e814",
          borderRadius: 38,
          color: "white",
        }}
      >
        <div style={{ display: "flex", fontSize: 74, fontWeight: 900, letterSpacing: -6 }}>
          D<span style={{ color: "#55e814" }}>F</span>
        </div>
        <div style={{ marginTop: 4, color: "#55e814", fontSize: 15, fontWeight: 800, letterSpacing: 3 }}>
          DIA DOS PAIS
        </div>
        <div style={{ marginTop: 5, color: "white", fontSize: 8, fontWeight: 800, letterSpacing: 1.4 }}>
          PAI FORTE • FAMÍLIA FORTE
        </div>
      </div>
    ),
    size,
  );
}
