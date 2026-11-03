import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { StoreProvider } from "data/store";
import { ToastProvider } from "components/toast";
import { installHighlight } from "app/review/embedHighlight";
import "./index.css";

installHighlight(); // inside a review preview frame the review page can ask to outline a component

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </StoreProvider>
    </BrowserRouter>
  </StrictMode>,
);
