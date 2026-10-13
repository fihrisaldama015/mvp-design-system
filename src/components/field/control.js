import { cloneElement, isValidElement } from "react";

// Look shared by the SHIELD form controls (Input, Select): size, border per status, focus ring.
// Every class is a Graphene token; the per-state values are in docs/shield/input.md and select.md.
export const SIZE = {
  sm: { box: "h-component-sm px-3 gap-2 rounded-form-sm", text: "typo-regular-text-sm", radius: "rounded-form-sm" },
  md: { box: "h-component-md px-3 gap-2.5 rounded-form-md", text: "typo-regular-text-sm", radius: "rounded-form-md" },
  lg: { box: "h-component-lg px-4 gap-3 rounded-form-lg", text: "typo-regular-text-base", radius: "rounded-form-lg" },
};
// Figma uses 22px icons in every size.
export const ICON_PX = 22;

// Border per status. Only `default` turns primary on hover and focus; the other
// statuses keep their colour in every state.
export const BORDER = {
  default: "border-invert-default group-hover/control:border-primary group-focus-within/control:border-primary",
  info: "border-info",
  success: "border-success",
  warning: "border-warning",
  danger: "border-danger",
};
// Focus ring (Figma "Focus Area", 3px outside stroke).
export const FOCUS_RING = {
  default: "bg-primary-invert-focused",
  info: "bg-info-invert-focused",
  success: "bg-success-invert-focused",
  warning: "bg-warning-invert-focused",
  danger: "bg-danger-invert-focused",
};

export const sized = (icon) => (isValidElement(icon) ? cloneElement(icon, { size: ICON_PX, "aria-hidden": true }) : icon);
