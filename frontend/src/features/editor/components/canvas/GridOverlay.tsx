import { type FC } from 'react';
import { Line } from 'react-konva';

interface GridOverlayProps {
  width: number;
  height: number;
  gridSize?: number;
}

export const GridOverlay: FC<GridOverlayProps> = ({ width, height, gridSize = 10 }) => {
  const lines: JSX.Element[] = [];

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <Line
        key={`gv-${x}`}
        points={[x, 0, x, height]}
        stroke="#ddd"
        strokeWidth={x % (gridSize * 10) === 0 ? 0.5 : 0.25}
        listening={false}
      />
    );
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      <Line
        key={`gh-${y}`}
        points={[0, y, width, y]}
        stroke="#ddd"
        strokeWidth={y % (gridSize * 10) === 0 ? 0.5 : 0.25}
        listening={false}
      />
    );
  }

  return <>{lines}</>;
};
