"use client";

import { useMemo } from "react";
import { ASCII_RAMP, pixelsToAscii, useReveal } from "./ascii-image";

/* ASCII text: renders a word as large ASCII art by drawing it on an offscreen canvas and sampling brightness, with a built-in 3x5 pixel font when canvas is unavailable. */

const GLYPHS: Record<string, string> = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111", F: "111100110100100",
  G: "011100101101011", H: "101101111101101", I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111",
  M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100", Q: "010101101111011", R: "110101110101101",
  S: "011100010001110", T: "111010010010010", U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101",
  Y: "101101010010010", Z: "111001010100111", "0": "111101101101111", "1": "010110010010111", "2": "110001010100111", "3": "110001010001110",
  "4": "101101111001001", "5": "111100110001110", "6": "011100111101111", "7": "111001010010010", "8": "111101111101111", "9": "111101111001110",
  "!": "010010010000010", ".": "000000000000010", "-": "000000111000000", "?": "110001010000010", " ": "000000000000000",
};

/** Brightness grid (0 or 255) of `text` in the built-in font, one pixel per glyph cell, scaled by `sy` rows and `sy * 2` columns. */
export function fallbackBitmap(text: string, sy = 1): { data: Uint8ClampedArray; width: number; height: number } {
  const chars = [...text.toUpperCase()];
  const sx = sy * 2;
  const width = Math.max(chars.length * 4 - 1, 0) * sx;
  const height = 5 * sy;
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  chars.forEach((ch, ci) => {
    const glyph = GLYPHS[ch] ?? GLYPHS["?"] ?? "";
    for (let gy = 0; gy < 5; gy++)
      for (let gx = 0; gx < 3; gx++) {
        const on = glyph[gy * 3 + gx] === "1";
        for (let y = 0; y < sy; y++)
          for (let x = 0; x < sx; x++) {
            const i = ((gy * sy + y) * width + (ci * 4 + gx) * sx + x) * 4;
            data[i] = data[i + 1] = data[i + 2] = on ? 255 : 0;
          }
      }
  });
  return { data, width, height };
}

function canvasLines(text: string, rows: number, ramp: string): string[] | null {
  if (typeof document === "undefined") return null;
  const big = document.createElement("canvas");
  const bigCtx = big.getContext("2d");
  if (!bigCtx) return null;
  const height = rows * 4;
  const font = `bold ${Math.round(height * 0.8)}px sans-serif`;
  bigCtx.font = font;
  big.width = Math.ceil(bigCtx.measureText(text).width) + 4;
  big.height = height;
  bigCtx.font = font;
  bigCtx.fillStyle = "#000";
  bigCtx.fillRect(0, 0, big.width, big.height);
  bigCtx.fillStyle = "#fff";
  bigCtx.textBaseline = "middle";
  bigCtx.fillText(text, 2, height / 2 + height * 0.04);
  const cols = Math.max(1, Math.ceil(big.width / 2));
  const small = document.createElement("canvas");
  small.width = cols;
  small.height = rows;
  const smallCtx = small.getContext("2d", { willReadFrequently: true });
  if (!smallCtx) return null;
  smallCtx.drawImage(big, 0, 0, cols, rows);
  return pixelsToAscii(smallCtx.getImageData(0, 0, cols, rows).data, cols, rows, { ramp });
}

/** ASCII art lines for `text`; `rows` is the height in characters. */
export function renderAsciiText(text: string, rows = 14, ramp = ASCII_RAMP): string[] {
  const fromCanvas = text ? canvasLines(text, rows, ramp) : null;
  if (fromCanvas) return fromCanvas;
  const bitmap = fallbackBitmap(text, Math.max(1, Math.round(rows / 5)));
  return pixelsToAscii(bitmap.data, bitmap.width, bitmap.height, { ramp: " #" });
}

export interface AsciiTextProps {
  text: string;
  /** Height in text rows. */
  rows?: number;
  ramp?: string;
  /** Font size in px. */
  fontSize?: number;
  className?: string;
}

export function AsciiText({ text, rows = 14, ramp = ASCII_RAMP, fontSize = 8, className = "" }: AsciiTextProps) {
  const lines = useMemo(() => renderAsciiText(text, rows, ramp), [text, rows, ramp]);
  const { shown, replay } = useReveal(lines);
  return (
    <pre role="img" aria-label={text} onPointerEnter={replay} className={`m-0 max-w-full overflow-hidden whitespace-pre font-mono text-fg ${className}`} style={{ fontSize, lineHeight: 1 }}>
      {shown.join("\n")}
    </pre>
  );
}
