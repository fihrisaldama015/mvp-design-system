import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const inter = loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] }).fontFamily;
export const mono = loadMono("normal", { weights: ["400", "600"], subsets: ["latin"] }).fontFamily;

export const FPS = 30;
export const W = 1920;
export const H = 1080;

// Graphene's primary (rose) as the accent; neutral dark surface so the white screenshots read as cards.
export const c = {
  bg: "#0d1017",
  panel: "#161a23",
  panel2: "#1d222d",
  line: "#2a303d",
  text: "#f2f4f8",
  dim: "#98a2b3",
  faint: "#5c6678",
  rose: "#fb7185",
  roseDeep: "#8b0836",
  green: "#4ade80",
  amber: "#fbbf24",
  blue: "#60a5fa",
};
