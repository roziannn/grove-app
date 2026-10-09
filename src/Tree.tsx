import React, { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { DEFAULT_SPECIES, Head, Species, glowColor } from './species';
import { DEFAULT_SEASON, Season } from './seasons';

const clamp = (v: number) => Math.min(1, Math.max(0, v));
// Bagian pohon tumbuh bertahap: fase mulai di `from`, selesai di `to`.
const phase = (p: number, from: number, to: number) => clamp((p - from) / (to - from));

const BASE_Y = 170;

// Posisi buah/bunga kecil di tajuk (x absolut, y relatif ke puncak batang).
const DOT_SPOTS: [number, number][] = [
  [84, -4], [116, 6], [102, -24], [88, 14], [112, -14], [96, -32], [120, -2],
];
const DEFAULT_DOTS = ['#ef5350', '#ef5350', '#ffca28'];

type GraphicProps = {
  progress: number; // 0..1
  withered?: boolean;
  species?: Species;
};

// Gambar pohon di kotak 200x200, dasar batang di (100, 170).
// Dipakai oleh <Tree> (satu pohon besar) dan <IsoForest> (pohon-pohon kecil).
export function TreeGraphic({ progress, withered = false, species = DEFAULT_SPECIES }: GraphicProps) {
  const p = clamp(progress);
  const dark = withered ? '#a39a7a' : species.dark;
  const mid = withered ? '#b5ab8a' : species.mid;
  const light = withered ? '#c7bd9c' : species.light;
  const trunkColor = withered ? '#7a6a58' : species.trunk;

  if (p < 0.06) {
    return <Ellipse cx={100} cy={BASE_Y + 1} rx={5} ry={3.5} fill="#5d4037" />;
  }

  const bloom = withered ? '#c7bd9c' : (species.bloom ?? species.light);
  const center = withered ? '#b5ab8a' : (species.center ?? species.mid);
  const rad = (deg: number) => (deg * Math.PI) / 180;

  // Kepala bunga di titik (x, y) dengan skala s (0..1 saat mekar).
  const flowerHead = (head: Head | undefined, x: number, y: number, s: number, key: string) => {
    if (s <= 0) return null;
    if (head === 'bell') {
      return (
        <G key={key}>
          <Ellipse cx={x} cy={y + 9 * s} rx={6.5 * s} ry={9 * s} fill={bloom} stroke="#b0bec5" strokeWidth={1} />
          <Ellipse cx={x} cy={y + 1 * s} rx={3 * s} ry={2 * s} fill={mid} />
          <Circle cx={x} cy={y + 17 * s} r={2 * s} fill={center} />
        </G>
      );
    }
    if (head === 'trumpet') {
      return (
        <G key={key}>
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <Circle
              key={k}
              cx={x + Math.cos(rad(k * 60)) * 7 * s}
              cy={y + Math.sin(rad(k * 60)) * 7 * s}
              r={5.5 * s}
              fill={bloom}
            />
          ))}
          <Circle cx={x} cy={y} r={5 * s} fill={center} />
        </G>
      );
    }
    if (head === 'tulip') {
      // tiga kelopak runcing membentuk cawan: dua di belakang (lebih gelap) dan satu di depan
      const petal = (w: number, tilt: number, fill: string, k: string) => (
        <Path
          key={k}
          d={`M${x - w * s} ${y} C${x - (w + 2) * s} ${y - 14 * s} ${x - 3 * s} ${y - 24 * s} ${x} ${y - 28 * s}
              C${x + 3 * s} ${y - 24 * s} ${x + (w + 2) * s} ${y - 14 * s} ${x + w * s} ${y}
              Q${x} ${y + 7 * s} ${x - w * s} ${y} Z`}
          fill={fill}
          transform={`rotate(${tilt} ${x} ${y})`}
        />
      );
      return (
        <G key={key}>
          {petal(6, -24, center, 'l')}
          {petal(6, 24, center, 'r')}
          {petal(7.5, 0, bloom, 'f')}
          <Path
            d={`M${x - 3.5 * s} ${y - 3 * s} C${x - 5.5 * s} ${y - 12 * s} ${x - 2.5 * s} ${y - 19 * s} ${x - 1 * s} ${y - 23 * s}`}
            stroke="#ffffff"
            strokeOpacity={withered ? 0 : 0.45}
            strokeWidth={2.2 * s}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      );
    }
    if (head === 'glow') {
      return (
        <G key={key}>
          <Circle cx={x} cy={y} r={22 * s} fill="#fff59d" opacity={withered ? 0 : 0.35} />
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <Ellipse
              key={k}
              cx={x}
              cy={y - 9 * s}
              rx={4.5 * s}
              ry={10 * s}
              fill={k % 2 ? light : bloom}
              transform={`rotate(${k * 60} ${x} ${y})`}
            />
          ))}
          <Circle cx={x} cy={y} r={5 * s} fill={center} />
        </G>
      );
    }
    // 'star' (bunga lonceng): lima kelopak
    return (
      <G key={key}>
        {[0, 1, 2, 3, 4].map((k) => (
          <Ellipse
            key={k}
            cx={x}
            cy={y - 8 * s}
            rx={5 * s}
            ry={9 * s}
            fill={bloom}
            transform={`rotate(${k * 72} ${x} ${y})`}
          />
        ))}
        <Circle cx={x} cy={y} r={3.5 * s} fill={center} />
      </G>
    );
  };

  if (species.kind === 'reed') {
    const g = phase(p, 0.05, 0.85);
    const plume = phase(p, 0.6, 1);
    const stalks: [number, number][] = [[-18, 62], [-9, 84], [0, 98], [9, 78], [18, 58]];
    return (
      <G>
        {stalks.map(([dx, h], i) => {
          const x = 100 + dx;
          const hh = h * g;
          const lean = dx * 0.25 * g;
          return (
            <G key={i}>
              <Path
                d={`M${x} ${BASE_Y} Q${x + lean * 0.3} ${BASE_Y - hh * 0.5} ${x + lean} ${BASE_Y - hh}`}
                stroke={dark}
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
              />
              {plume > 0 && (
                <Ellipse
                  cx={x + lean}
                  cy={BASE_Y - hh - 10 * plume}
                  rx={4.5 * plume}
                  ry={12 * plume}
                  fill={bloom}
                  transform={`rotate(${dx * 0.8} ${x + lean} ${BASE_Y - hh})`}
                />
              )}
            </G>
          );
        })}
        <Path
          d={`M92 ${BASE_Y} Q${80 - 6 * g} ${BASE_Y - 30 * g} ${70 - 10 * g} ${BASE_Y - 38 * g}
              M108 ${BASE_Y} Q${120 + 6 * g} ${BASE_Y - 30 * g} ${130 + 10 * g} ${BASE_Y - 38 * g}`}
          stroke={mid}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
      </G>
    );
  }

  if (species.kind === 'flower') {
    const g = phase(p, 0.05, 0.7);
    const open = phase(p, 0.55, 1);
    const stems: [number, number][] =
      species.head === 'glow' ? [[0, 96], [-22, 52], [22, 60]] : [[-18, 66], [0, 88], [18, 60]];
    return (
      <G>
        <Path
          d={`M96 ${BASE_Y} Q${80 - 8 * g} ${BASE_Y - 26 * g} ${66 - 6 * g} ${BASE_Y - 30 * g}
              M104 ${BASE_Y} Q${120 + 8 * g} ${BASE_Y - 26 * g} ${134 + 6 * g} ${BASE_Y - 30 * g}`}
          stroke={mid}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
        {stems.map(([dx, h], i) => {
          const hx = 100 + dx * 0.9;
          const hy = BASE_Y - h * g;
          return (
            <G key={i}>
              <Path
                d={`M${100 + dx * 0.3} ${BASE_Y} Q${100 + dx * 0.3} ${BASE_Y - h * g * 0.6} ${hx} ${hy}`}
                stroke={dark}
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
              />
              {flowerHead(species.head, hx, hy, open, `h${i}`)}
            </G>
          );
        })}
      </G>
    );
  }

  if (species.kind === 'bush') {
    const g = phase(p, 0.05, 0.7);
    const open = phase(p, 0.5, 1);
    const blooms: [number, number][] = [
      [-20, -24], [-6, -36], [10, -32], [22, -22], [-12, -14], [4, -22], [16, -10], [-26, -8], [0, -6],
    ];
    return (
      <G>
        <Circle cx={100} cy={BASE_Y - 18 * g} r={28 * g} fill={dark} />
        <Circle cx={78} cy={BASE_Y - 10 * g} r={20 * g} fill={mid} />
        <Circle cx={122} cy={BASE_Y - 10 * g} r={20 * g} fill={mid} />
        {open > 0 &&
          blooms.map(([dx, dy], i) => (
            <G key={i}>
              <Circle cx={100 + dx} cy={BASE_Y + dy * g} r={6.5 * open} fill={bloom} />
              <Circle cx={100 + dx} cy={BASE_Y + dy * g} r={2.2 * open} fill={light} />
            </G>
          ))}
      </G>
    );
  }

  if (species.kind === 'fern') {
    const g = phase(p, 0.05, 0.85);
    const fronds: [number, number][] = [[-62, 52], [-38, 66], [-14, 78], [14, 78], [38, 66], [62, 52]];
    const bx = 100;
    const by = BASE_Y - 8;
    return (
      <G>
        <Rect x={80} y={BASE_Y - 12} width={40} height={14} rx={4} fill={withered ? '#7a6a58' : species.trunk} />
        {fronds.map(([a, len], i) => {
          const L = len * g;
          const tx = bx + Math.sin(rad(a)) * L;
          const ty = by - Math.cos(rad(a)) * L;
          const fork = (da: number) => {
            const fa = a + da;
            return `M${tx} ${ty} L${tx + Math.sin(rad(fa)) * 16 * g} ${ty - Math.cos(rad(fa)) * 16 * g}`;
          };
          return (
            <G key={i}>
              <Path d={`M${bx} ${by} L${tx} ${ty}`} stroke={i % 2 ? mid : dark} strokeWidth={8} strokeLinecap="round" />
              <Path d={`${fork(-30)} ${fork(30)}`} stroke={light} strokeWidth={5} strokeLinecap="round" />
            </G>
          );
        })}
      </G>
    );
  }

  if (species.kind === 'lotus') {
    const g = phase(p, 0.05, 0.6);
    const open = phase(p, 0.45, 1);
    const headY = BASE_Y - 62 * g;
    const pads: [number, number, number, number][] = [[76, -2, 22, 6], [126, 0, 18, 5], [104, 5, 16, 4.5]];
    return (
      <G>
        <Ellipse cx={100} cy={BASE_Y + 2} rx={46} ry={11} fill={withered ? '#b5ab8a' : '#81d4fa'} />
        {pads.map(([x, dy, rx, ry], i) => (
          <Ellipse key={i} cx={x} cy={BASE_Y + dy} rx={rx * Math.max(g, 0.3)} ry={ry * Math.max(g, 0.3)} fill={mid} />
        ))}
        <Path
          d={`M100 ${BASE_Y - 2} L100 ${headY}`}
          stroke={dark}
          strokeWidth={3}
          strokeLinecap="round"
        />
        {open > 0 && (
          <>
            {[-60, -30, 30, 60].map((a) => (
              <Ellipse
                key={a}
                cx={100}
                cy={headY - 11 * open}
                rx={6 * open}
                ry={14 * open}
                fill={light}
                transform={`rotate(${a} 100 ${headY})`}
              />
            ))}
            <Ellipse cx={100} cy={headY - 12 * open} rx={6.5 * open} ry={15 * open} fill={bloom} />
            <Circle cx={100} cy={headY - 4 * open} r={3.5 * open} fill={center} />
          </>
        )}
      </G>
    );
  }

  if (species.kind === 'cactus') {
    const h = 10 + 86 * phase(p, 0.05, 0.7);
    const w = 8 + 16 * phase(p, 0.05, 0.9);
    const arm = phase(p, 0.45, 0.9);
    return (
      <G>
        {arm > 0 && (
          <Path
            d={`M${100 - w / 2} ${BASE_Y - h * 0.45} h${-14 * arm} v${-26 * arm}
                M${100 + w / 2} ${BASE_Y - h * 0.6} h${14 * arm} v${-22 * arm}`}
            stroke={mid}
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
        <Rect x={100 - w / 2} y={BASE_Y - h} width={w} height={h} rx={w / 2} fill={mid} />
        <Rect x={100 - w / 6} y={BASE_Y - h + 4} width={w / 3} height={Math.max(0, h - 8)} rx={w / 6} fill={light} />
        {!withered && p >= 1 && <Circle cx={100} cy={BASE_Y - h - 3} r={6} fill="#f06292" />}
      </G>
    );
  }

  const trunkH = 8 + 92 * phase(p, 0.05, 0.6);
  const trunkW = 5 + 9 * phase(p, 0.05, 0.9);
  const crown = phase(p, 0.25, 1);
  const top = BASE_Y - trunkH;

  return (
    <G>
      <Rect x={100 - trunkW / 2} y={top} width={trunkW} height={trunkH} rx={trunkW / 2} fill={trunkColor} />

      {/* tunas daun kecil sebelum tajuk besar */}
      {crown < 0.2 && (
        <>
          <Ellipse
            cx={92}
            cy={top}
            rx={9}
            ry={5}
            fill={mid}
            transform={`rotate(${withered ? 40 : -25} 92 ${top})`}
          />
          <Ellipse
            cx={108}
            cy={top}
            rx={9}
            ry={5}
            fill={light}
            transform={`rotate(${withered ? -40 : 25} 108 ${top})`}
          />
        </>
      )}

      {species.kind === 'round' && p > 0.45 && (
        <Path
          d={`M100 ${BASE_Y - trunkH * 0.55} L${100 - 22 * crown} ${BASE_Y - trunkH * 0.8}
              M100 ${BASE_Y - trunkH * 0.45} L${100 + 22 * crown} ${BASE_Y - trunkH * 0.72}`}
          stroke={trunkColor}
          strokeWidth={4}
          strokeLinecap="round"
        />
      )}

      {crown > 0.1 && species.kind === 'round' && (
        <>
          <Circle cx={100} cy={top - 6 * crown} r={34 * crown} fill={dark} />
          <Circle cx={100 - 24 * crown} cy={top + 8 * crown} r={24 * crown} fill={mid} />
          <Circle cx={100 + 24 * crown} cy={top + 8 * crown} r={24 * crown} fill={mid} />
          <Circle cx={100 - 8 * crown} cy={top - 14 * crown} r={20 * crown} fill={light} />
          {!withered && <Circle cx={92 - 6 * crown} cy={top - 20 * crown} r={9 * crown} fill="#ffffff" opacity={0.2} />}
        </>
      )}

      {crown > 0.1 && species.kind === 'cone' && (
        <>
          {[2, 1, 0].map((k) => {
            const yb = top + (14 + k * 20) * crown;
            const hw = (22 + k * 11) * crown;
            return (
              <Path
                key={k}
                d={`M${100 - hw} ${yb} L100 ${yb - 34 * crown} L${100 + hw} ${yb} Z`}
                fill={k === 0 ? light : k === 1 ? mid : dark}
              />
            );
          })}
        </>
      )}

      {/* buah/bunga kecil saat pohon sudah penuh */}
      {!withered && p >= 1 && species.kind === 'round' && (
        <>
          {(species.dots ?? DEFAULT_DOTS).map((color, i) => {
            const [dx, dy] = DOT_SPOTS[i % DOT_SPOTS.length];
            return <Circle key={i} cx={dx} cy={top + dy} r={species.dots ? 4.2 : 3.5} fill={color} />;
          })}
        </>
      )}
    </G>
  );
}

// Kilau kecil berbentuk bintang empat sudut.
function Sparkle({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  const k = r * 0.3;
  return (
    <Path
      d={`M${x} ${y - r} L${x + k} ${y - k} L${x + r} ${y} L${x + k} ${y + k} L${x} ${y + r} L${x - k} ${y + k} L${x - r} ${y} L${x - k} ${y - k} Z`}
      fill={color}
    />
  );
}

type Props = GraphicProps & { size?: number; season?: Season; glow?: boolean };

export default function Tree({
  progress,
  withered = false,
  species = DEFAULT_SPECIES,
  size = 260,
  season = DEFAULT_SEASON,
  glow = false,
}: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const color = glowColor(species);
  // Cahaya ikut tumbuh bersama tanaman dan padam saat layu.
  const strength = withered ? 0 : clamp(0.3 + 0.7 * progress);
  const grown = !withered && progress >= 1;

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {glow && strength > 0 && (
        <>
          <Defs>
            <RadialGradient id={`g${uid}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={color} stopOpacity={0.6 * strength} />
              <Stop offset="0.55" stopColor={color} stopOpacity={0.22 * strength} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id={`w${uid}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#ffffff" stopOpacity={0.55 * strength} />
              <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={100} cy={104} r={98} fill={`url(#g${uid})`} />
          <Circle cx={100} cy={112} r={58} fill={`url(#w${uid})`} />
        </>
      )}
      {/* tanah */}
      <Ellipse cx={100} cy={BASE_Y + 8} rx={62} ry={11} fill={withered ? '#8d7f6a' : season.sideL} />
      <Ellipse cx={100} cy={BASE_Y + 5} rx={56} ry={9} fill={withered ? '#a39577' : season.mound} />
      <TreeGraphic progress={progress} withered={withered} species={species} />
      {glow && grown && (
        <G opacity={0.9}>
          <Sparkle x={42} y={62} r={5} color={color} />
          <Sparkle x={160} y={46} r={4} color="#ffffff" />
          <Sparkle x={152} y={118} r={3.4} color={color} />
          <Sparkle x={56} y={128} r={3} color="#ffffff" />
        </G>
      )}
    </Svg>
  );
}
