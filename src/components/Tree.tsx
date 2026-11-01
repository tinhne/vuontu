interface Props {
  stage: number;
  size?: number;
}

// Leaf positions around the canopy, revealed progressively as the tree grows.
const LEAVES: [number, number, number][] = [
  [100, 70, 34],
  [72, 86, 28],
  [128, 86, 28],
  [86, 58, 24],
  [116, 56, 24],
  [60, 108, 22],
  [140, 108, 22],
  [100, 44, 22],
  [80, 112, 20],
  [120, 112, 20],
];
const FLOWERS: [number, number][] = [
  [78, 72],
  [118, 64],
  [100, 92],
  [134, 98],
  [66, 100],
  [96, 50],
];
const FRUITS: [number, number][] = [
  [84, 94],
  [116, 82],
  [128, 108],
  [70, 112],
  [102, 70],
  [140, 92],
];

export default function Tree({ stage, size = 180 }: Props) {
  return (
    <svg className="tree" width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="Cây học tập">
      <ellipse cx="100" cy="176" rx="70" ry="12" className="tree-soil" />

      {stage === 0 && (
        <g className="tree-sway">
          <ellipse cx="100" cy="168" rx="11" ry="8" className="tree-seed" />
          <path d="M96 164 q4 -6 8 0" className="tree-seed-line" />
        </g>
      )}

      {(stage === 1 || stage === 2) && (
        <g className="tree-sway">
          <path d={stage === 1 ? 'M100 172 V142' : 'M100 172 V112'} className="tree-stem" />
          <path d="M100 146 q-22 -4 -26 -20 q20 0 26 20z" className="tree-leaf" />
          <path d="M100 146 q22 -4 26 -20 q-20 0 -26 20z" className="tree-leaf alt" />
          {stage === 2 && (
            <>
              <path d="M100 124 q-20 -2 -24 -18 q18 0 24 18z" className="tree-leaf alt" />
              <path d="M100 124 q20 -2 24 -18 q-18 0 -24 18z" className="tree-leaf" />
              <path d="M100 114 q-6 -16 0 -26 q6 10 0 26z" className="tree-leaf" />
            </>
          )}
        </g>
      )}

      {stage >= 3 && (
        <g className="tree-sway">
          <path
            d={stage >= 6 ? 'M88 176 Q94 130 92 104 L108 104 Q106 130 112 176 Z' : 'M94 176 Q98 136 96 108 L104 108 Q102 136 106 176 Z'}
            className="tree-trunk"
          />
          {stage >= 5 && <path d="M98 128 Q84 120 76 108" className="tree-branch" />}
          {stage >= 5 && <path d="M102 122 Q116 114 124 104" className="tree-branch" />}
          {LEAVES.slice(0, stage >= 6 ? 10 : stage >= 5 ? 9 : stage >= 4 ? 7 : 5).map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={stage >= 6 ? cy - 4 : cy} r={stage >= 6 ? r + 4 : r} className={i % 2 ? 'tree-canopy alt' : 'tree-canopy'} />
          ))}
          {stage === 4 && FLOWERS.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="5" className="tree-flower" />)}
          {stage >= 5 &&
            FRUITS.slice(0, stage >= 6 ? 6 : 4).map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="6" className="tree-fruit" />)}
        </g>
      )}
    </svg>
  );
}
