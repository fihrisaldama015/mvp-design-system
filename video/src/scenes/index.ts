import React from "react";
import { Scene1 } from "./Scene1";
import { Scene2 } from "./Scene2";
import { Scene3 } from "./Scene3";
import { Scene4 } from "./Scene4";
import { Scene5 } from "./Scene5";
import { Scene6 } from "./Scene6";
import { Scene7 } from "./Scene7";
import { Scene8 } from "./Scene8";
import { Scene9 } from "./Scene9";
import { Scene10 } from "./Scene10";

// Durations follow docs/shield/video-script.md.
export const SCENES: { id: string; seconds: number; Component: React.FC }[] = [
  { id: "Scene1", seconds: 25, Component: Scene1 },
  { id: "Scene2", seconds: 30, Component: Scene2 },
  { id: "Scene3", seconds: 60, Component: Scene3 },
  { id: "Scene4", seconds: 60, Component: Scene4 },
  { id: "Scene5", seconds: 45, Component: Scene5 },
  { id: "Scene6", seconds: 85, Component: Scene6 },
  { id: "Scene7", seconds: 15, Component: Scene7 },
  { id: "Scene8", seconds: 30, Component: Scene8 },
  { id: "Scene9", seconds: 30, Component: Scene9 },
  { id: "Scene10", seconds: 30, Component: Scene10 },
];
