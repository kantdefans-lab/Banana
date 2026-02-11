'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/components/ui/chart';
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';

type RevenuePoint = {
  date: string;
  revenue: number;
};

type UsersPoint = {
  date: string;
  users: number;
};

export function OverviewCharts({
  revenue,
  newUsers,
  revenueLabel,
  newUsersLabel,
}: {
  revenue: RevenuePoint[];
  newUsers: UsersPoint[];
  revenueLabel: string;
  newUsersLabel: string;
}) {
  const revenueConfig = {
    revenue: {
      label: revenueLabel,
      color: 'hsl(var(--chart-1))',
    },
  };

  const usersConfig = {
    users: {
      label: newUsersLabel,
      color: 'hsl(var(--chart-2))',
    },
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
          {revenueLabel}
        </h3>
        <ChartContainer
          className="h-[260px] w-full"
          config={revenueConfig}
        >
          <LineChart data={revenue} margin={{ left: 4, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => String(value).slice(5)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={44}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="revenue"
              name="revenue"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
          {newUsersLabel}
        </h3>
        <ChartContainer className="h-[260px] w-full" config={usersConfig}>
          <LineChart data={newUsers} margin={{ left: 4, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => String(value).slice(5)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={44}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="users"
              name="users"
              stroke="var(--color-users)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}
