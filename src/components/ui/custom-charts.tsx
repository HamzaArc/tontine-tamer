
import React, { CSSProperties } from 'react';
import { 
  BarChart as RechartsBarChart, 
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  Bar, 
  Line, 
  Pie,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Cell,
  TooltipProps
} from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';

interface BarChartProps {
  data: any[];
  categories: string[];
  index?: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  categories, 
  index = 'month',
  colors = ['#3b82f6', '#ef4444'], 
  valueFormatter = (value) => `${value}`,
  showLegend = true,
  className
}) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-40">No data available</div>;
  }

  const config = categories.reduce((acc, category, i) => {
    acc[category] = {
      color: colors[i % colors.length],
    };
    return acc;
  }, {} as Record<string, { color: string }>);

  // Create a component as a function to avoid typing issues
  const renderCustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
    if (active && payload && payload.length) {
      return (
        <ChartTooltipContent
          payload={payload}
          label={label}
          formatter={(value) => valueFormatter(Number(value))}
        />
      );
    }
    return null;
  };

  return (
    <ChartContainer config={config} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={index} />
          <YAxis tickFormatter={valueFormatter} />
          <Tooltip content={renderCustomTooltip} />
          {showLegend && <Legend content={<ChartLegendContent />} />}
          {categories.map((category, i) => (
            <Bar 
              key={category}
              dataKey={category} 
              fill={colors[i % colors.length]}
              name={category}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

interface LineChartProps {
  data: any[];
  categories: string[];
  index?: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  categories, 
  index = 'month',
  colors = ['#3b82f6', '#ef4444'], 
  valueFormatter = (value) => `${value}`,
  showLegend = true,
  className
}) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-40">No data available</div>;
  }

  const config = categories.reduce((acc, category, i) => {
    acc[category] = {
      color: colors[i % colors.length],
    };
    return acc;
  }, {} as Record<string, { color: string }>);

  // Create a component as a function to avoid typing issues
  const renderCustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
    if (active && payload && payload.length) {
      return (
        <ChartTooltipContent
          payload={payload}
          label={label}
          formatter={(value) => valueFormatter(Number(value))}
        />
      );
    }
    return null;
  };

  return (
    <ChartContainer config={config} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={index} />
          <YAxis tickFormatter={valueFormatter} />
          <Tooltip content={renderCustomTooltip} />
          {showLegend && <Legend content={<ChartLegendContent />} />}
          {categories.map((category, i) => (
            <Line 
              key={category}
              type="monotone"
              dataKey={category} 
              stroke={colors[i % colors.length]}
              name={category}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

interface PieChartProps {
  data: { name: string; value: number }[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'], 
  valueFormatter = (value) => `${value}`,
  showLegend = true,
  className
}) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-40">No data available</div>;
  }

  const config = data.reduce((acc, item, i) => {
    acc[item.name] = {
      color: colors[i % colors.length],
    };
    return acc;
  }, {} as Record<string, { color: string }>);

  // Create a component as a function to avoid typing issues
  const renderCustomTooltip = ({ active, payload }: TooltipProps<any, any>) => {
    if (active && payload && payload.length) {
      return (
        <ChartTooltipContent
          payload={payload}
          formatter={(value) => valueFormatter(Number(value))}
        />
      );
    }
    return null;
  };

  return (
    <ChartContainer config={config} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={renderCustomTooltip} />
          {showLegend && <Legend content={<ChartLegendContent />} />}
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
