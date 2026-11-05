import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { findBlocks, isUiProp, kindOf, readBlock, reexportTarget, resolveCode, signatureDefaults } from "../codeProps.mjs";

const tmp = (files) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "codeprops-"));
  for (const [name, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), text);
  }
  return dir;
};

test("kindOf: options and switches are looks, the rest is data, content or behaviour", () => {
  assert.equal(kindOf("kind", 'PropTypes.oneOf(["filled", "outlined"]),'), "enum");
  assert.equal(kindOf("searchable", "PropTypes.bool,"), "bool");
  assert.equal(kindOf("label", "PropTypes.string,"), "text");
  assert.equal(kindOf("size", "PropTypes.number,"), "text");
  assert.equal(kindOf("prefixIcon", "PropTypes.node,"), "node");
  assert.equal(kindOf("as", "PropTypes.elementType,"), "node");
  assert.equal(kindOf("columns", "PropTypes.arrayOf(PropTypes.shape({})),"), "data");
  assert.equal(kindOf("rows", "PropTypes.array.isRequired,"), "data");
  assert.equal(kindOf("error", "PropTypes.oneOfType([PropTypes.bool, PropTypes.node]),"), "data");
  assert.equal(kindOf("onClear", "PropTypes.func,"), "handler");
  assert.equal(kindOf("onRowClick", "PropTypes.bool,"), "handler"); // the name says handler, whatever the type
  assert.equal(kindOf("weird", "somethingElse"), "other");
});

test("isUiProp: only enums and switches are compared; the project can move a prop either way", () => {
  assert.equal(isUiProp("kind", "enum"), true);
  assert.equal(isUiProp("searchable", "bool"), true);
  for (const k of ["text", "node", "data", "handler", "other"]) assert.equal(isUiProp("thing", k), false, k);
  assert.equal(isUiProp("className", "text"), false);
  assert.equal(isUiProp("value", "enum"), false); // value is always behaviour
  assert.equal(isUiProp("type", "enum", { behavior: ["type"] }), false); // the project says: not looks
  assert.equal(isUiProp("badge", "text", { ui: ["badge"] }), true); // the project says: looks
  assert.equal(isUiProp("type", "enum", { behavior: ["type"], ui: ["type"] }), false); // behaviour wins
});

test("readBlock reads kind, options, descriptions (one line and several), @deprecated and the wrapper file", () => {
  const text = [
    "Button.propTypes = {",
    "  /** Look of the button. */",
    '  kind: PropTypes.oneOf(["filled", "outlined", "dashed"]),',
    "  /**",
    "   * @deprecated not in Figma.",
    "   * Shows a search box.",
    "   */",
    "  searchable: PropTypes.bool,",
    "  columns: PropTypes.arrayOf(PropTypes.object),",
    "  onClick: PropTypes.func,",
    "};",
    "",
  ].join("\n");
  const [b] = findBlocks(text);
  const p = readBlock(text, b.at, { file: "x.js" });
  assert.deepEqual(p.kind.options, ["filled", "outlined", "dashed"]);
  assert.equal(p.kind.kind, "enum");
  assert.equal(p.kind.description, "Look of the button.");
  assert.equal(p.kind.via, undefined);
  assert.equal(p.searchable.kind, "bool");
  assert.equal(p.searchable.deprecated, true);
  assert.match(p.searchable.description, /Shows a search box\./);
  assert.equal(readBlock("X.propTypes = {\n  /** Old. @deprecated */\n  a: PropTypes.bool,\n};", 0, { file: "x" }).a.deprecated, false); // only a description that STARTS with @deprecated counts
  assert.equal(p.columns.kind, "data");
  assert.equal(p.onClick.kind, "handler");
  assert.equal(readBlock(text, b.at, { file: "wrapper.js", via: true }).kind.via, "wrapper.js");
});

test("signatureDefaults reads the defaults of the named component, exported or not", () => {
  const text = [
    'const InputCustom = ({ className, size = "sm", ...props }) => null;',
    'export const Input = ({ status = "default", clearable = false, ...rest }) => null;',
  ].join("\n");
  assert.deepEqual(signatureDefaults(text, "Input"), { status: "default", clearable: "false" });
  assert.deepEqual(signatureDefaults(text, "InputCustom"), { size: "sm" });
  assert.deepEqual(signatureDefaults("export function B({ kind = \"filled\" }) {}", "B"), { kind: "filled" });
});

test("signatureDefaults reads a forwardRef component, and never takes anything from the body (mvp Input)", () => {
  const text = [
    "export const Input = forwardRef(function Input(",
    "  {",
    '    size = "md",',
    "    status: statusProp,",
    "    required = false,",
    "    options = [],",
    "    onClear = () => {},",
    '    className = "a, b {c}",',
    "    ...props",
    "  },",
    "  ref,",
    ") {",
    "  const status = statusProp ?? error;",
    "  const field = useFieldControl();",
    "  const ownId = useId();",
    "  return null;",
    "});",
  ].join("\n");
  assert.deepEqual(signatureDefaults(text, "Input"), { size: "md", required: "false", className: "a, b {c}" }); // a comma or brace inside a string does not split or end anything
});

test("signatureDefaults is empty when the component takes no destructured props", () => {
  assert.deepEqual(signatureDefaults("export const X = (props) => props.a;", "X"), {});
  assert.deepEqual(signatureDefaults("nothing here", "X"), {});
});

test("resolveCode: one component per file, found by the folder name", () => {
  const dir = tmp({ "select/index.js": "export const Select = () => null;\nSelect.propTypes = {\n  size: PropTypes.oneOf([\"sm\"]),\n};\n" });
  const r = resolveCode({ codeFile: path.join(dir, "select/index.js"), figmaName: "Input - Single Select/Base" });
  assert.equal(r.component, "Select");
  assert.deepEqual(r.notes, []);
});

test("resolveCode: a file with several components gives the one that matches the name", () => {
  const dir = tmp({ "input/Input.js": "const A = () => null;\nA.propTypes = {\n  a: PropTypes.bool,\n};\nInput.propTypes = {\n  size: PropTypes.oneOf([\"sm\"]),\n};\n" });
  const r = resolveCode({ codeFile: path.join(dir, "input/Input.js"), figmaName: "Input" });
  assert.equal(r.component, "Input");
});

test("resolveCode: index.js that only re-exports the component sends the review to the real file (swt-fe input)", () => {
  const dir = tmp({
    "input/index.js": 'const InputCustom = () => null;\nexport default InputCustom;\nexport { Input } from "./Input";\nInputCustom.propTypes = {\n  className: PropTypes.string,\n};\n',
    "input/Input.js": 'export const Input = () => null;\nInput.propTypes = {\n  size: PropTypes.oneOf(["sm", "md"]),\n};\n',
  });
  const r = resolveCode({ codeFile: path.join(dir, "input/index.js"), figmaName: "Input" });
  assert.equal(path.basename(r.file), "Input.js");
  assert.equal(r.component, "Input");
  assert.deepEqual(Object.keys(readBlock(r.text, r.at, { file: r.file })), ["size"]);
});

test("resolveCode: --component names the block, or the re-export of it", () => {
  const dir = tmp({
    "x/index.js": 'export { Real as Wanted } from "./Real";\nOther.propTypes = {\n  a: PropTypes.bool,\n};\n',
    "x/Real.js": "Wanted.propTypes = {\n  b: PropTypes.bool,\n};\n",
  });
  assert.equal(path.basename(resolveCode({ codeFile: path.join(dir, "x/index.js"), component: "Wanted" }).file), "Real.js");
  assert.equal(resolveCode({ codeFile: path.join(dir, "x/index.js"), component: "Other" }).component, "Other");
  assert.throws(() => resolveCode({ codeFile: path.join(dir, "x/index.js"), component: "Missing" }), /no propTypes block for "Missing"/);
});

test("resolveCode: several blocks and no match is an error that lists them, not a silent guess", () => {
  const dir = tmp({ "card/index.js": "Header.propTypes = {\n  a: PropTypes.bool,\n};\nFooter.propTypes = {\n  b: PropTypes.bool,\n};\n" });
  assert.throws(() => resolveCode({ codeFile: path.join(dir, "card/index.js"), figmaName: "Card" }), (e) => /2 propTypes blocks \(Header, Footer\)/.test(e.message) && /--component/.test(e.message));
});

test("resolveCode: one block that does not match the name is used but flagged", () => {
  const dir = tmp({ "input/index.js": "InputCustom.propTypes = {\n  a: PropTypes.bool,\n};\n" });
  const r = resolveCode({ codeFile: path.join(dir, "input/index.js"), figmaName: "Input" });
  assert.equal(r.component, "InputCustom");
  assert.equal(r.notes.length, 1);
  assert.match(r.notes[0], /InputCustom/);
  assert.match(r.notes[0], /--component/);
});

test("resolveCode: no propTypes block at all is an error", () => {
  const dir = tmp({ "x/index.js": "export const X = () => null;\n" });
  assert.throws(() => resolveCode({ codeFile: path.join(dir, "x/index.js"), figmaName: "X" }), /No Component\.propTypes block/);
});

test("reexportTarget ignores packages and understands the three forms", () => {
  const dir = tmp({ "a/index.js": "", "a/B.js": "", "a/C.js": "" });
  const from = path.join(dir, "a/index.js");
  assert.equal(path.basename(reexportTarget('export { B } from "./B";', "B", from)), "B.js");
  assert.equal(path.basename(reexportTarget('export { default as C } from "./C";', "C", from)), "C.js");
  assert.equal(path.basename(reexportTarget('export { X as D } from "./C";', "D", from)), "C.js");
  assert.equal(reexportTarget('export { B } from "some-package";', "B", from), null);
});
