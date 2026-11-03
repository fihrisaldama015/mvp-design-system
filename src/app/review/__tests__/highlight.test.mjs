import test from "node:test";
import assert from "node:assert/strict";
import { componentTypes, findComponentNodes, hostNodes } from "../highlightCore.js";

// Fake fibers: tag 5 is a DOM element, 0 a function component, 11 a forwardRef, 6 a text node, 7 a fragment.
const fiber = (tag, type, { child = null, sibling = null, stateNode = null, elementType } = {}) => ({ tag, type, elementType: elementType ?? type, child, sibling, stateNode });
const dom = (name, opts = {}) => fiber(5, name, { stateNode: { name }, ...opts });
const Alert = () => null;
const Select = () => null;

test("findComponentNodes finds the DOM nodes of every instance, nested and sibling ones included", () => {
  const second = fiber(0, Alert, { child: dom("div#2") });
  const first = fiber(0, Alert, { child: dom("div#1"), sibling: second });
  const root = fiber(3, null, { child: dom("main", { child: fiber(0, Select, { child: dom("select"), sibling: first }) }) });
  const found = [...findComponentNodes(root, new Set([Alert]))].map((n) => n.name);
  assert.deepEqual(found.sort(), ["div#1", "div#2"]);
});

test("a component that renders a fragment gives all its top-level elements, and only those", () => {
  const inner = dom("span", { child: null });
  const a = dom("p", { child: inner, sibling: dom("footer") });
  const comp = fiber(0, Alert, { child: fiber(7, null, { child: a }) });
  assert.deepEqual(hostNodes(comp).map((n) => n.name).sort(), ["footer", "p"]);
});

test("text nodes are skipped and the search goes through wrappers to the first elements", () => {
  const comp = fiber(0, Alert, { child: fiber(0, () => null, { child: fiber(6, null, { sibling: dom("section") }) }) });
  assert.deepEqual(hostNodes(comp).map((n) => n.name), ["section"]);
});

test("a memo or forwardRef component is matched by its element type; other components are ignored", () => {
  const Forward = { $$typeof: Symbol.for("react.forward_ref"), render() {} };
  const root = fiber(3, null, { child: fiber(11, () => null, { elementType: Forward, child: dom("input", { sibling: null }), sibling: fiber(0, Select, { child: dom("select") }) }) });
  assert.deepEqual([...findComponentNodes(root, new Set([Forward]))].map((n) => n.name), ["input"]);
});

test("an empty or missing tree finds nothing, and an empty type set matches nothing", () => {
  assert.equal(findComponentNodes(null, new Set([Alert])).size, 0);
  assert.equal(findComponentNodes(fiber(3, null), new Set([Alert])).size, 0);
  assert.equal(findComponentNodes(fiber(3, null, { child: fiber(0, Alert, { child: dom("div") }) }), new Set()).size, 0);
  assert.deepEqual(hostNodes(null), []);
});

test("componentTypes keeps functions and forwardRef-like objects, and skips plain values", () => {
  const Forward = { $$typeof: Symbol.for("react.forward_ref"), render() {} };
  const types = componentTypes({ Alert, Forward, STATUSES: ["a"], label: "x", nothing: null, config: { a: 1 } });
  assert.ok(types.has(Alert) && types.has(Forward));
  assert.equal(types.size, 2);
  assert.equal(componentTypes(null).size, 0);
});

test("a very deep tree does not overflow the stack", () => {
  let leaf = dom("div");
  let node = fiber(0, Alert, { child: leaf });
  for (let i = 0; i < 20000; i++) node = fiber(0, () => null, { child: node });
  assert.equal(findComponentNodes(fiber(3, null, { child: node }), new Set([Alert])).size, 1);
});
