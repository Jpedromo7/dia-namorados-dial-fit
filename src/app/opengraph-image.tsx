import { ImageResponse } from "next/og";

export const alt = "Black Friday de Arrepiar 2026 — Dial Fit";
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
          background: "#070b08",
          color: "white",
          padding: "62px 72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: 520,
            right: -120,
            top: -150,
            background: "#194c19",
            opacity: 0.72,
          }}
        />
        <div style={{ display: "flex", position: "absolute", left: 880, top: 135, fontSize: 42, color: "#55e814", opacity: 0.7 }}>●</div>
        <div style={{ display: "flex", position: "absolute", left: 960, top: 225, fontSize: 28, color: "#55e814", opacity: 0.35 }}>●</div>
        <div style={{ display: "flex", position: "absolute", left: 780, top: 450, fontSize: 34, color: "#55e814", opacity: 0.24 }}>●</div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            border: "2px solid rgba(85,232,20,0.24)",
          }}
        />

        <div style={{ display: "flex", width: "100%", flexDirection: "column", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", color: "#55e814", fontSize: 24, fontWeight: 800, letterSpacing: 5 }}>
              CAMPANHA OFICIAL
            </div>
            <div style={{ display: "flex", alignItems: "center", fontSize: 39, fontWeight: 900, letterSpacing: -2 }}>
              DIAL <span style={{ color: "#55e814", marginLeft: 9 }}>FIT</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 58 }}>
            <div style={{ display: "flex", fontSize: 108, lineHeight: 0.88, fontWeight: 900, letterSpacing: -5 }}>
              BLACK
            </div>
            <div style={{ display: "flex", marginTop: 18, color: "#55e814", fontSize: 142, lineHeight: 0.78, fontWeight: 900, letterSpacing: -7 }}>
              FRIDAY
            </div>
          </div>

          <div style={{ display: "flex", marginTop: 48, alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 29, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
              DE ARREPIAR
            </div>
            <div style={{ display: "flex", border: "2px solid #55e814", borderRadius: 14, padding: "15px 22px", color: "#55e814", fontSize: 21, fontWeight: 800 }}>
              PRÉ-LISTA 2026
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
