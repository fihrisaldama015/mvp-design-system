import PropTypes from "prop-types";

// Display blocks for the generated Foundations pages (src/foundations/*.mdx).
// Every preview reads the CSS variable itself, so the Storybook Theme switch
// (Light / Dark) updates the swatches live. Not for use in the app.

const cell = { padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 13, verticalAlign: "middle", textAlign: "left" };
const mono = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 };
const chip = { ...mono, display: "inline-block", background: "#f3f4f6", borderRadius: 4, padding: "1px 6px", margin: "1px 4px 1px 0", color: "#111827" };

// Storybook's docs styles override font size and family inside tables; "sb-unstyled"
// opts the preview out, so the sample renders exactly like in the app.
function Preview(props) {
  return (
    <div className="sb-unstyled">
      <PreviewInner {...props} />
    </div>
  );
}

function PreviewInner({ kind, cssVar, className }) {
  const v = `var(${cssVar})`;
  if (kind === "color") return <span style={{ display: "inline-block", width: 40, height: 24, borderRadius: 6, border: "1px solid rgb(0 0 0 / 0.1)", background: `rgb(${v})` }} />;
  if (kind === "radius") return <span style={{ display: "inline-block", width: 40, height: 28, border: "2px solid #6366f1", borderRadius: v }} />;
  if (kind === "border") return <span style={{ display: "inline-block", width: 40, height: 28, border: `${v} solid #111827` }} />;
  if (kind === "space") return <span style={{ display: "inline-block", height: 10, width: v, maxWidth: 240, background: "#6366f1", borderRadius: 2 }} />;
  if (kind === "shadow") return <span style={{ display: "inline-block", width: 56, height: 32, borderRadius: 6, background: "#fff", boxShadow: v }} />;
  if (kind === "opacity") return <span style={{ display: "inline-block", width: 40, height: 24, borderRadius: 6, background: "#111827", opacity: v }} />;
  if (kind === "text") return <span className={className}>The quick brown fox</span>;
  return null;
}

/**
 * TokenTable — one row per token: preview, Figma name, utility classes, CSS variable
 * and the value in each mode (Light / Dark when the token has modes).
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
            <td style={cell}><Preview kind={kind} cssVar={r.cssVar} className={r.className} /></td>
            <td style={{ ...cell, ...mono }}>{r.figma}</td>
            <td style={cell}>{(r.classes || []).map((c) => <code key={c} style={chip}>{c}</code>)}</td>
            <td style={{ ...cell, ...mono }}>{r.cssVar}</td>
            {modes ? (
              modes.map((m) => (
                <td key={m} style={{ ...cell, ...mono }}>
                  {r.value?.[m]}
                  {r.aliasByMode?.[m] && <div style={{ color: "#6b7280" }}>{r.aliasByMode[m]}</div>}
                </td>
              ))
            ) : (
              <td style={{ ...cell, ...mono }}>
                {typeof r.value === "object" ? JSON.stringify(r.value) : r.value}
                {r.alias && <div style={{ color: "#6b7280" }}>{r.alias}</div>}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

TokenTable.propTypes = {
  /** Which preview to draw: color, radius, border, space, shadow, opacity or text. */
  kind: PropTypes.oneOf(["color", "radius", "border", "space", "shadow", "opacity", "text"]).isRequired,
  /** Rows from src/tokens/tokens.index.json. */
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  /** Mode names when the rows have a value per mode, e.g. ["Light", "Dark"]. */
  modes: PropTypes.arrayOf(PropTypes.string),
};

/**
 * ColorRamps — primitive or brand colour ramps as rows of swatches with their class
 * and hex value.
 */
export function ColorRamps({ ramps }) {
  return (
    <div style={{ display: "grid", gap: 12, margin: "8px 0 24px" }}>
      {ramps.map((ramp) => (
        <div key={ramp.name}>
          <div style={{ ...mono, fontWeight: 600, marginBottom: 4 }}>{ramp.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${ramp.shades.length}, minmax(0, 1fr))`, gap: 4 }}>
            {ramp.shades.map((s) => (
              <div key={s.cssVar} title={`${s.className} · ${s.cssVar}`}>
                <div style={{ height: 36, borderRadius: 6, border: "1px solid rgb(0 0 0 / 0.08)", background: `rgb(var(${s.cssVar}))` }} />
                <div style={{ ...mono, fontSize: 10, marginTop: 2 }}>{s.shade}</div>
                <div style={{ ...mono, fontSize: 10, color: "#6b7280" }}>{s.hex}</div>
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
