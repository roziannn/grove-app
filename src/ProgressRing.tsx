import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  diameter: number; // diameter lingkaran yang dikelilingi
  progress: number; // 0..1
  color: string;
  stroke?: number; // tebal garis
  gap?: number; // jarak dari tepi lingkaran
  showHead?: boolean; // titik bercahaya di ujung garis
};

// Cincin progres di sekeliling lingkaran. Garis mengisi dari dasar lingkaran (pukul 6) searah jarum jam.
// Ditempatkan absolut di luar tepi lingkaran, jadi induknya harus berposisi relatif.
export default function ProgressRing({ diameter, progress, color, stroke = 7, gap = 6, showHead = true }: Props) {
  const pad = gap + stroke;
  const size = diameter + pad * 2;
  const c = size / 2;
  const r = diameter / 2 + gap + stroke / 2;
  const circ = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));
  const angle = ((90 + p * 360) * Math.PI) / 180; // 90 derajat = dasar lingkaran
  const hx = c + r * Math.cos(angle);
  const hy = c + r * Math.sin(angle);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: -pad, top: -pad, width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} stroke={color} strokeOpacity={0.2} strokeWidth={stroke} fill="none" />
        {p > 0 && (
          <Circle
            cx={c}
            cy={c}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={circ * (1 - p)}
            transform={`rotate(90 ${c} ${c})`}
          />
        )}
        {showHead && p > 0 && p < 1 && (
          <>
            <Circle cx={hx} cy={hy} r={stroke * 1.7} fill={color} opacity={0.25} />
            <Circle cx={hx} cy={hy} r={stroke * 0.8} fill="#ffffff" stroke={color} strokeWidth={2} />
          </>
        )}
      </Svg>
    </View>
  );
}
