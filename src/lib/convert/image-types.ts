export type CropBox = { x: number; y: number; w: number; h: number };

export const DEFAULT_CROP: CropBox = { x: 0.12, y: 0.12, w: 0.76, h: 0.76 };

export type ImageTurn = "90" | "180" | "270" | "flip-h" | "flip-v";
