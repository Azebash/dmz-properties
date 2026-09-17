import { ImageResponse } from "next/og";

export const alt = "DMZ Properties - Property, properly considered";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: "#173f32",
        color: "#eaf1ed",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "26px" }}>
        <div
          style={{
            display: "flex",
            fontSize: "55px",
            fontWeight: 800,
            letterSpacing: "-5px",
          }}
        >
          DM<span style={{ color: "#c9ef57" }}>Z</span>
        </div>
        <div
          style={{
            display: "flex",
            paddingLeft: "26px",
            borderLeft: "1px solid #547064",
            fontSize: "18px",
            letterSpacing: "4px",
          }}
        >
          PROPERTIES
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            maxWidth: "900px",
            fontSize: "82px",
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: "-5px",
          }}
        >
          Property, properly considered.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "30px",
            color: "#bdccc5",
            fontSize: "23px",
          }}
        >
          Verified opportunities. Clear information. Firsthand guidance.
        </div>
      </div>
    </div>,
    size,
  );
}
