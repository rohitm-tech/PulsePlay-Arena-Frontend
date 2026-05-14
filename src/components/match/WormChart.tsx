'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export function WormChart({
  points,
  className,
}: {
  points: { over: string; runs: number }[];
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';
  const axis = isDark ? '#737373' : '#737373';
  const line = isDark ? '#fafafa' : '#171717';
  const grid = isDark ? '#262626' : '#e5e5e5';
  const tipBg = isDark ? '#171717' : '#fafafa';
  const tipFg = isDark ? '#fafafa' : '#171717';
  const border = isDark ? '#404040' : '#e5e5e5';

  return (
    <div className={cn('h-44 w-full sm:h-48', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <XAxis dataKey="over" stroke={axis} fontSize={10} tickLine={false} axisLine={{ stroke: grid }} />
          <YAxis stroke={axis} fontSize={10} tickLine={false} axisLine={{ stroke: grid }} />
          <Tooltip
            contentStyle={{
              background: tipBg,
              border: `1px solid ${border}`,
              borderRadius: '12px',
              color: tipFg,
            }}
            labelStyle={{ color: tipFg, fontWeight: 600 }}
          />
          <Line type="monotone" dataKey="runs" stroke={line} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: line }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
