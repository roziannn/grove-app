import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Polygon } from 'react-native-svg';
import { TreeGraphic } from './Tree';
import { getSpecies } from './species';
import { DEFAULT_SEASON, Season } from './seasons';
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

// Posisi hiasan di dalam satu petak (relatif ke pusat petak).
const SPOTS = [
  [-14, -2], [8, 3], [-4, 6], [14, -4], [0, -6], [-18, 4],
];

function decorAt(season: Season, x: number, y: number, seed: number) {
  const color = season.decorColors[seed % season.decorColors.length];
  switch (season.decor) {
    case 'flowers':
      return <Circle key={`${x}-${y}`} cx={x} cy={y} r={2.2} fill={color} />;
    case 'leaves':
      return (
        <Ellipse
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          rx={3.2}
          ry={1.5}
          fill={color}
          transform={`rotate(${(seed * 47) % 180} ${x} ${y})`}
        />
      );
    case 'snow':
      return <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.8} fill={color} />;
    default:
      return (
        <Path
          key={`${x}-${y}`}
          d={`M${x - 2.5} ${y} L${x} ${y - 3.5} L${x + 2.5} ${y}`}
          stroke={color}
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      );
  }
}

type Props = { sessions: Session[]; width?: number; season?: Season };

export default function IsoForest({ sessions, width = 300, season = DEFAULT_SEASON }: Props) {
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
      {/* sisi tanah: tepi atas (rumput/salju) lalu tanah */}
      <Polygon
        points={`${left.x},${left.y} ${bottom.x},${bottom.y} ${bottom.x},${bottom.y + DEPTH} ${left.x},${left.y + DEPTH}`}
        fill={season.sideL}
      />
      <Polygon
        points={`${bottom.x},${bottom.y} ${right.x},${right.y} ${right.x},${right.y + DEPTH} ${bottom.x},${bottom.y + DEPTH}`}
        fill={season.sideR}
      />
      <Polygon
        points={`${left.x},${left.y} ${bottom.x},${bottom.y} ${bottom.x},${bottom.y + season.lipH} ${left.x},${left.y + season.lipH}`}
        fill={season.lip}
      />
      <Polygon
        points={`${bottom.x},${bottom.y} ${right.x},${right.y} ${right.x},${right.y + season.lipH} ${bottom.x},${bottom.y + season.lipH}`}
        fill={season.lip}
        opacity={0.85}
      />
      {/* permukaan tanah, berpola papan catur */}
      <Polygon
        points={`${topPt.x},${topPt.y} ${right.x},${right.y} ${bottom.x},${bottom.y} ${left.x},${left.y}`}
        fill={season.top}
      />
      {Array.from({ length: CAP }, (_, k) => ({ i: Math.floor(k / N), j: k % N }))
        .filter(({ i, j }) => (i + j) % 2 === 0)
        .map(({ i, j }) => {
          const c = cell(i, j);
          return <Polygon key={`${i}-${j}`} points={diamond(c.x, c.y)} fill={season.topAlt} />;
        })}
      {/* hiasan musim: rumput, bunga, daun gugur, atau salju */}
      {Array.from({ length: CAP }, (_, k) => ({ i: Math.floor(k / N), j: k % N })).flatMap(({ i, j }) => {
        const c = cell(i, j);
        return SPOTS.map(([dx, dy], k) =>
          (i * 3 + j * 5 + k * 2) % 4 === 0 ? decorAt(season, c.x + dx, c.y + dy, i + j + k) : null,
        );
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
