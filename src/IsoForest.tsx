import React from 'react';
import Svg, { G, Polygon } from 'react-native-svg';
import { TreeGraphic } from './Tree';
import { getSpecies } from './species';
import type { Session } from './storage';

const N = 5; // petak N x N
const CAP = N * N;
const CX = 150;
const TOP = 50;
const HW = 28; // setengah lebar petak
const HH = 14; // setengah tinggi petak
const DEPTH = 16; // tebal tanah

// Urutan petak yang terisi, diacak tetap supaya hutan terlihat alami.
const ORDER = [12, 6, 18, 8, 16, 2, 22, 10, 14, 0, 24, 4, 20, 7, 17, 11, 13, 1, 23, 3, 21, 5, 19, 9, 15];

const cell = (i: number, j: number) => ({ x: CX + (i - j) * HW, y: TOP + (i + j) * HH });
const diamond = (cx: number, cy: number) =>
  `${cx},${cy - HH} ${cx + HW},${cy} ${cx},${cy + HH} ${cx - HW},${cy}`;

export const FOREST_CAPACITY = CAP;

export default function IsoForest({ sessions, width = 300 }: { sessions: Session[]; width?: number }) {
  // Tampilkan sesi terbaru dulu bila melebihi kapasitas petak.
  const shown = sessions.slice(0, CAP);
  const placed = shown
    .map((s, n) => {
      const idx = ORDER[n];
      return { s, i: Math.floor(idx / N), j: idx % N };
    })
    .sort((a, b) => a.i + a.j - (b.i + b.j));

  const left = { x: CX - N * HW, y: TOP + (N - 1) * HH };
  const right = { x: CX + N * HW, y: TOP + (N - 1) * HH };
  const bottom = { x: CX, y: TOP + (2 * N - 1) * HH + HH };
  const topPt = { x: CX, y: TOP - HH };
  const scale = 0.3;

  return (
    <Svg width={width} height={width * (215 / 300)} viewBox="0 0 300 215">
      {/* sisi tanah */}
      <Polygon
        points={`${left.x},${left.y} ${bottom.x},${bottom.y} ${bottom.x},${bottom.y + DEPTH} ${left.x},${left.y + DEPTH}`}
        fill="#6d4c2f"
      />
      <Polygon
        points={`${bottom.x},${bottom.y} ${right.x},${right.y} ${right.x},${right.y + DEPTH} ${bottom.x},${bottom.y + DEPTH}`}
        fill="#5a3d25"
      />
      {/* permukaan rumput, berpola papan catur */}
      <Polygon
        points={`${topPt.x},${topPt.y} ${right.x},${right.y} ${bottom.x},${bottom.y} ${left.x},${left.y}`}
        fill="#8bc34a"
      />
      {Array.from({ length: CAP }, (_, k) => ({ i: Math.floor(k / N), j: k % N }))
        .filter(({ i, j }) => (i + j) % 2 === 0)
        .map(({ i, j }) => {
          const c = cell(i, j);
          return <Polygon key={`${i}-${j}`} points={diamond(c.x, c.y)} fill="#9ccc65" />;
        })}

      {placed.map(({ s, i, j }) => {
        const c = cell(i, j);
        return (
          <G key={s.id} transform={`translate(${c.x - 100 * scale} ${c.y + 4 - 170 * scale}) scale(${scale})`}>
            <TreeGraphic progress={1} withered={!s.ok} species={getSpecies(s.species)} />
          </G>
        );
      })}
    </Svg>
  );
}
