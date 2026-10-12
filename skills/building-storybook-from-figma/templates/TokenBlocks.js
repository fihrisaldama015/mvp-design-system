import PropTypes from "prop-types";

// Display blocks for the generated Foundations pages (src/foundations/*.mdx).
// Every preview reads the CSS variable itself, so the Storybook Theme switch
// (Light / Dark) updates it live. Text in these blocks has fixed colours: the docs
// page stays white in Dark mode, so inherited (token) text colour would vanish.
// Not for use in the app.

const INK = "#111827";
const MUTED = "#6b7280";
const ACCENT = "#6366f1";
const ACCENT_SOFT = "#c7d2fe";
const cell = { padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 13, verticalAlign: "middle", textAlign: "left", color: INK };
const mono = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 };
const chip = { ...mono, display: "inline-block", background: "#f3f4f6", borderRadius: 4, padding: "1px 6px", margin: "1px 4px 1px 0", color: INK };
const SAMPLE = "The quick brown fox";

function PreviewInner({ kind, cssVar, className }) {
  const v = `var(${cssVar})`;
  switch (kind) {
    case "color":
      return <span style={{ display: "inline-block", width: 40, height: 24, borderRadius: 6, border: "1px solid rgb(0 0 0 / 0.1)", background: `rgb(${v})` }} />;
    case "radius":
      return <span style={{ display: "inline-block", width: 40, height: 28, border: `2px solid ${ACCENT}`, borderRadius: v }} />;
    case "border":
      return <span style={{ display: "inline-block", width: 40, height: 28, border: `${v} solid ${INK}` }} />;
    case "padding": // shaded area = the padding around the content
      return (
        <span style={{ display: "inline-block", padding: v, background: ACCENT_SOFT, borderRadius: 4 }}>
          <span style={{ display: "block", width: 24, height: 16, background: ACCENT, borderRadius: 2 }} />
        </span>
      );
    case "gap": // the space between two items
      return (
        <span style={{ display: "inline-flex", gap: v }}>
          <span style={{ width: 24, height: 24, background: ACCENT, borderRadius: 2 }} />
          <span style={{ width: 24, height: 24, background: ACCENT, borderRadius: 2 }} />
        </span>
      );
    case "height": // a control of this height
      return <span style={{ display: "inline-flex", alignItems: "center", height: v, padding: "0 12px", border: `1px solid ${ACCENT}`, borderRadius: 6, color: INK, fontSize: 12 }}>Control</span>;
    case "width": // panel width at 1/4 scale
      return <span style={{ display: "inline-block", width: `calc(${v} / 4)`, height: 20, background: ACCENT_SOFT, border: `1px solid ${ACCENT}`, borderRadius: 3 }} title="1/4 scale" />;
    case "breakpoint": // screen width at 1/10 scale
      return <span style={{ display: "inline-block", width: `calc(${v} / 10)`, height: 16, border: `2px solid ${INK}`, borderRadius: 3 }} title="1/10 scale" />;
    case "shadow":
      return <span style={{ display: "inline-block", width: 56, height: 32, borderRadius: 6, background: "#fff", boxShadow: v }} />;
    case "blur":
      return (
        <span style={{ display: "inline-flex", gap: 4, filter: `blur(${v})` }}>
          <span style={{ width: 18, height: 18, borderRadius: 9, background: "#ef4444" }} />
          <span style={{ width: 18, height: 18, borderRadius: 3, background: "#22c55e" }} />
          <span style={{ width: 18, height: 18, borderRadius: 9, background: ACCENT }} />
        </span>
      );
    case "backdrop": // a glass panel over colourful content
      return (
        <span style={{ position: "relative", display: "inline-block", width: 72, height: 36, borderRadius: 6, overflow: "hidden", background: "repeating-linear-gradient(90deg, #111827 0 3px, #fff 3px 7px), linear-gradient(90deg, #ef4444, #6366f1)", backgroundBlendMode: "screen" }}>
          <span style={{ position: "absolute", inset: 6, borderRadius: 4, background: "rgb(255 255 255 / 0.2)", backdropFilter: `blur(${v})`, WebkitBackdropFilter: `blur(${v})` }} />
        </span>
      );
    case "opacity":
      return <span style={{ display: "inline-block", width: 40, height: 24, borderRadius: 6, background: INK, opacity: v }} />;
    case "fontSize":
      // Capped width: the large sizes (up to 128px) would push the table off the page.
      return <span style={{ display: "block", maxWidth: 260, overflow: "hidden", color: INK, fontSize: v, lineHeight: `var(${cssVar.replace("font-size", "line-height")})`, whiteSpace: "nowrap" }}>Aa {SAMPLE}</span>;
    case "lineHeight": // two lines; the shaded block is the line box
      return <span style={{ display: "inline-block", width: 150, color: INK, fontSize: 14, lineHeight: v, background: "repeating-linear-gradient(#eef2ff 0 50%, #fff 50% 100%)" }}>Two lines of text with this line height</span>;
    case "fontWeight":
      return <span style={{ color: INK, fontSize: 16, fontWeight: v }}>{SAMPLE}</span>;
    case "fontFamily":
      return <span style={{ color: INK, fontSize: 16, fontFamily: v }}>{SAMPLE} 0123</span>;
    case "text":
      return <span className={className} style={{ color: INK }}>{SAMPLE}</span>;
    default:
      return null;
  }
}

// Storybook's docs styles override font size and family inside tables; "sb-unstyled"
// opts the preview out, so the sample renders exactly like in the app.
function Preview(props) {
  return (
    <div className="sb-unstyled">
      <PreviewInner {...props} />
    </div>
  );
}

const KINDS = ["color", "radius", "border", "padding", "gap", "height", "width", "breakpoint", "shadow", "blur", "backdrop", "opacity", "fontSize", "lineHeight", "fontWeight", "fontFamily", "text"];

/**
 * TokenTable — one row per token: preview, Figma name, utility classes, CSS variable
 * and the value in each mode (Light / Dark when the token has modes). A row can set
 * its own `kind` to override the table's preview.
 */
export function TokenTable({ kind, rows, modes }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", margin: "8px 0 24px" }}>
      <thead>
        <tr>
          <th style={cell}>Preview</th>
          <th style={cell}>Figma</th>
          <th style={cell}>Tailwind</th>
          <th style={cell}>CSS variable</th>
          {modes ? modes.map((m) => <th key={m} style={cell}>{m}</th>) : <th style={cell}>Value</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.cssVar || r.className}>
            <td style={cell}><Preview kind={r.kind || kind} cssVar={r.cssVar} className={r.className} /></td>
            <td style={{ ...cell, ...mono }}>{r.figma}</td>
            <td style={cell}>{(r.classes || []).map((c) => <code key={c} style={chip}>{c}</code>)}</td>
            <td style={{ ...cell, ...mono }}>{r.cssVar}</td>
            {modes ? (
              modes.map((m) => (
                <td key={m} style={{ ...cell, ...mono }}>
                  {r.value?.[m]}
                  {r.aliasByMode?.[m] && <div style={{ color: MUTED }}>{r.aliasByMode[m]}</div>}
                </td>
              ))
            ) : (
              <td style={{ ...cell, ...mono }}>
                {r.value}
                {r.alias && <div style={{ color: MUTED }}>{r.alias}</div>}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

TokenTable.propTypes = {
  /** Default preview for the rows: one of the preview kinds (color, padding, gap, fontSize ...). */
  kind: PropTypes.oneOf(KINDS).isRequired,
  /** Rows from src/tokens/tokens.index.json: { figma, classes, cssVar, value, alias?, aliasByMode?, kind? }. */
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  /** Mode names when the rows have a value per mode, e.g. ["Light", "Dark"]. */
  modes: PropTypes.arrayOf(PropTypes.string),
};

/**
 * ColorRamps — primitive or brand colour ramps as rows of swatches with their class
 * and hex value. These colours have one value only: Dark mode changes the semantic
 * colours, which point to other shades of these ramps.
 */
export function ColorRamps({ ramps }) {
  return (
    <div style={{ display: "grid", gap: 12, margin: "8px 0 24px", color: INK }}>
      {ramps.map((ramp) => (
        <div key={ramp.name}>
          <div style={{ ...mono, fontWeight: 600, marginBottom: 4, color: INK }}>{ramp.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${ramp.shades.length}, minmax(0, 1fr))`, gap: 4 }}>
            {ramp.shades.map((s) => (
              <div key={s.cssVar} title={`${s.className} · ${s.cssVar}`}>
                <div style={{ height: 36, borderRadius: 6, border: "1px solid rgb(0 0 0 / 0.08)", background: `rgb(var(${s.cssVar}))` }} />
                <div style={{ ...mono, fontSize: 10, marginTop: 2, color: INK }}>{s.shade}</div>
                <div style={{ ...mono, fontSize: 10, color: MUTED }}>{s.hex}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

ColorRamps.propTypes = {
  /** [{ name, shades: [{ shade, className, cssVar, hex }] }] */
  ramps: PropTypes.arrayOf(PropTypes.object).isRequired,
};
