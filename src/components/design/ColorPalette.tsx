interface ColorSwatch {
  hex: string;
  name: string;
}

interface ColorPaletteProps {
  colors: ColorSwatch[];
  textColor: string;
}

export default function ColorPalette({ colors, textColor }: ColorPaletteProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "8px" }}>
      {colors.map((c) => (
        <div key={c.hex + c.name} style={{ textAlign: "center" }}>
          <div
            style={{
              width: "100%",
              aspectRatio: "1",
              backgroundColor: c.hex,
              borderRadius: "8px",
              border: "1px solid rgba(128,128,128,0.3)",
            }}
          />
          <div style={{ marginTop: "4px", fontSize: "10px", fontFamily: "monospace", color: textColor, opacity: 0.8 }}>
            {c.hex}
          </div>
          <div style={{ fontSize: "11px", color: textColor, fontWeight: 600 }}>
            {c.name}
          </div>
        </div>
      ))}
    </div>
  );
}
