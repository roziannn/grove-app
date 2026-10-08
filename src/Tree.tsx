import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

type Props = {
  progress: number; // 0..1
  withered?: boolean;
  size?: number;
};

const clamp = (v: number) => Math.min(1, Math.max(0, v));
// Bagian pohon tumbuh bertahap: fase mulai di `from`, selesai di `to`.
const phase = (p: number, from: number, to: number) => clamp((p - from) / (to - from));

export default function Tree({ progress, withered = false, size = 260 }: Props) {
  const p = clamp(progress);
  const trunkColor = withered ? '#7a6a58' : '#8b5a2b';
  const leafDark = withered ? '#a39a7a' : '#2e7d32';
  const leafMid = withered ? '#b5ab8a' : '#43a047';
  const leafLight = withered ? '#c7bd9c' : '#66bb6a';

  const trunkH = 8 + 92 * phase(p, 0.05, 0.6);
  const trunkW = 5 + 9 * phase(p, 0.05, 0.9);
  const crown = phase(p, 0.25, 1);
  const baseY = 170;

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* tanah */}
      <Ellipse cx={100} cy={baseY + 8} rx={62} ry={11} fill={withered ? '#8d7f6a' : '#6d4c2f'} />
      <Ellipse cx={100} cy={baseY + 5} rx={56} ry={9} fill={withered ? '#a39577' : '#8a6a3f'} />

      {/* biji kecil di awal */}
      {p < 0.06 && <Ellipse cx={100} cy={baseY + 1} rx={5} ry={3.5} fill="#5d4037" />}

      {p >= 0.06 && (
        <>
          {/* batang */}
          <Rect
            x={100 - trunkW / 2}
            y={baseY - trunkH}
            width={trunkW}
            height={trunkH}
            rx={trunkW / 2}
            fill={trunkColor}
          />

          {/* tunas daun kecil sebelum tajuk besar */}
          {crown < 0.2 && (
            <>
              <Ellipse
                cx={92}
                cy={baseY - trunkH}
                rx={9}
                ry={5}
                fill={leafMid}
                transform={`rotate(${withered ? 40 : -25} 92 ${baseY - trunkH})`}
              />
              <Ellipse
                cx={108}
                cy={baseY - trunkH}
                rx={9}
                ry={5}
                fill={leafLight}
                transform={`rotate(${withered ? -40 : 25} 108 ${baseY - trunkH})`}
              />
            </>
          )}

          {/* ranting */}
          {p > 0.45 && (
            <Path
              d={`M100 ${baseY - trunkH * 0.55} L${100 - 22 * crown} ${baseY - trunkH * 0.8}
                  M100 ${baseY - trunkH * 0.45} L${100 + 22 * crown} ${baseY - trunkH * 0.72}`}
              stroke={trunkColor}
              strokeWidth={4}
              strokeLinecap="round"
            />
          )}

          {/* tajuk daun */}
          {crown > 0.1 && (
            <>
              <Circle cx={100} cy={baseY - trunkH - 6 * crown} r={34 * crown} fill={leafDark} />
              <Circle
                cx={100 - 24 * crown}
                cy={baseY - trunkH + 8 * crown}
                r={24 * crown}
                fill={leafMid}
              />
              <Circle
                cx={100 + 24 * crown}
                cy={baseY - trunkH + 8 * crown}
                r={24 * crown}
                fill={leafMid}
              />
              <Circle
                cx={100 - 8 * crown}
                cy={baseY - trunkH - 14 * crown}
                r={20 * crown}
                fill={leafLight}
              />
            </>
          )}

          {/* buah/bunga kecil saat pohon sudah penuh */}
          {!withered && p >= 1 && (
            <>
              <Circle cx={84} cy={baseY - trunkH - 4} r={3.5} fill="#ef5350" />
              <Circle cx={116} cy={baseY - trunkH + 6} r={3.5} fill="#ef5350" />
              <Circle cx={102} cy={baseY - trunkH - 24} r={3.5} fill="#ffca28" />
            </>
          )}
        </>
      )}
    </Svg>
  );
}
