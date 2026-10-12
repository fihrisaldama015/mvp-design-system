import { MemoryRouter } from "react-router-dom";
import { addons } from "storybook/preview-api";
import "../src/index.css";

// Toolbar switch for the Figma modes (+Theme Light / Dark). Tokens change through
// [data-theme] on <html>, the same attribute the app uses.
export const globalTypes = {
  theme: {
    description: "Design token mode",
    toolbar: { title: "Theme", icon: "mirror", items: [{ value: "light", title: "Light" }, { value: "dark", title: "Dark" }], dynamicTitle: true },
  },
};
export const initialGlobals = { theme: "light" };

const applyTheme = (theme = "light") => {
  if (theme === "light") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
};
// Docs pages without stories (Foundations) never run a decorator, so follow the
// toolbar through the channel too.
const channel = addons.getChannel();
channel.on("setGlobals", ({ globals }) => applyTheme(globals?.theme));
channel.on("globalsUpdated", ({ globals }) => applyTheme(globals?.theme));

// Components use <Link> and useNavigate, so every story runs inside a router.
export const decorators = [
  (Story, context) => {
    applyTheme(context.globals.theme);
    return (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    );
  },
];

export const parameters = {
  layout: "centered",
  // The canvas follows the token background, so Dark mode shows on a dark surface.
  backgrounds: { disable: true },
  controls: { expanded: true, sort: "requiredFirst" },
  docs: { toc: true },
  options: {
    storySort: {
      order: ["Guide", ["Introduction", "Component choices"], "Foundations", ["Overview", "Colors", "Typography", "Spacing and Sizing", "Radius and Borders", "Effects"], "Actions", "Forms", "Data", "Feedback", "Overlays", "Navigation", "*"],
    },
  },
};

export const tags = ["autodocs"];
