import { MemoryRouter } from "react-router-dom";
import "../src/index.css";

// Components use <Link> and useNavigate, so every story runs inside a router.
export const decorators = [
  (Story) => (
    <MemoryRouter>
      <Story />
    </MemoryRouter>
  ),
];

export const parameters = {
  layout: "centered",
  controls: { expanded: true, sort: "requiredFirst" },
  docs: { toc: true },
  options: {
    storySort: {
      order: ["Guide", ["Introduction", "Component choices"], "Actions", "Forms", "Data", "Feedback", "Overlays", "Navigation", "*"],
    },
  },
};

export const tags = ["autodocs"];
