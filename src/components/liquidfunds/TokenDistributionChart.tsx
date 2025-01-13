'use client';

import { ResponsivePie } from '@nivo/pie';
import Image from 'next/image';
import { getTokenIconUrl } from '@/utils/tokens';

interface TokenDistributionChartProps {
  tokens: {
    identifier: string;
    weight: number;
  }[];
}

export const TokenDistributionChart = ({ tokens }: TokenDistributionChartProps) => {
  const data = tokens.map(token => ({
    id: token.identifier,
    label: token.identifier,
    value: token.weight,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsivePie
        data={data}
        margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
        innerRadius={0.5}
        padAngle={1}
        cornerRadius={3}
        colors={{ scheme: 'nivo' }}
        activeOuterRadiusOffset={8}
        borderWidth={2}
        borderColor={{ theme: 'background' }}
        enableArcLinkLabels={true}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor="#ffffff"
        arcLinkLabelsThickness={2}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor="#ffffff"
        tooltip={({ datum }) => (
          <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg border border-white/20">
            <div className="flex items-center gap-2">
              <Image
                src={getTokenIconUrl(String(datum.id))}
                alt={String(datum.label)}
                width={20}
                height={20}
                className="rounded-full"
              />
              <span className="text-black font-medium">{datum.label}</span>
            </div>
            <div className="text-black/60 text-sm mt-1">
              Weight: <span className="text-black font-medium">{datum.value}%</span>
            </div>
          </div>
        )}
        legends={[
          {
            anchor: 'right',
            direction: 'column',
            justify: false,
            translateX: 0,
            translateY: 0,
            itemWidth: 100,
            itemHeight: 20,
            itemsSpacing: 10,
            symbolSize: 20,
            itemTextColor: '#ffffff'
          }
        ]}
      />
    </div>
  );
}; 