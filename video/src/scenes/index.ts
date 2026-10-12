import React from "react";
import { sec } from "../timing";
import { Scene1 } from "./Scene1";
import { Scene2 } from "./Scene2";

// Durations follow docs/shield/video-script.md.
export const SCENES: { id: string; seconds: number; Component: React.FC }[] = [
  { id: "Scene1", seconds: 25, Component: Scene1 },
  { id: "Scene2", seconds: 30, Component: Scene2 },
];
export const TOTAL_FRAMES = SCENES.reduce((n, s) => n + sec(s.seconds), 0);
