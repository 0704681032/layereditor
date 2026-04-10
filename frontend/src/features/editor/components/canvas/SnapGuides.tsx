import { type FC } from 'react';
import { Line } from 'react-konva';

export interface SnapGuideLine {
  axis: 'x' | 'y';
  position: number;
}

interface SnapGuidesProps {
  guides: SnapGuideLine[];
  canvasWidth: number;
  canvasHeight: number;
}

export const SnapGuides: FC<SnapGuidesProps> = ({ guides, canvasWidth, canvasHeight }) => {
  if (guides.length === 0) return null;

  return (
    <>
      {guides.map((guide, i) => {
        if (guide.axis === 'x') {
          return (
            <Line
              key={`sg-x-${i}`}
              points={[guide.position, -5000, guide.position, 5000]}
              stroke="#1890ff"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          );
        }
        return (
          <Line
            key={`sg-y-${i}`}
            points={[-5000, guide.position, 5000, guide.position]}
            stroke="#1890ff"
            strokeWidth={1}
            dash={[4, 4]}
            listening={false}
          />
        );
      })}
    </>
  );
};
