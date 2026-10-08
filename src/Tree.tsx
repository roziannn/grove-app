import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { DEFAULT_SPECIES, Species } from './species';

const clamp = (v: number) => Math.min(1, Math.max(0, v));
// Bagian pohon tumbuh bertahap: fase mulai di `from`, selesai di `to`.
const phase = (p: number, from: number, to: number) => clamp((p - from) / (to - from));

const BASE_Y = 170;

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
          <Circle cx={84} cy={top - 4} r={3.5} fill="#ef5350" />
          <Circle cx={116} cy={top + 6} r={3.5} fill="#ef5350" />
          <Circle cx={102} cy={top - 24} r={3.5} fill="#ffca28" />
        </>
      )}
    </G>
  );
}

type Props = GraphicProps & { size?: number };

export default function Tree({ progress, withered = false, species = DEFAULT_SPECIES, size = 260 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* tanah */}
      <Ellipse cx={100} cy={BASE_Y + 8} rx={62} ry={11} fill={withered ? '#8d7f6a' : '#6d4c2f'} />
      <Ellipse cx={100} cy={BASE_Y + 5} rx={56} ry={9} fill={withered ? '#a39577' : '#8a6a3f'} />
      <TreeGraphic progress={progress} withered={withered} species={species} />
    </Svg>
  );
}
