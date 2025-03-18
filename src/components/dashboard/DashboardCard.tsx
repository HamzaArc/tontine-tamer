
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  description?: string; // Added the missing description prop
  icon?: React.ReactNode;
  value?: string | number;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
  children?: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  description,
  icon,
  value,
  trend,
  className,
  children,
}) => {
  return (
    <Card className={cn("overflow-hidden card-hover", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {value && (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={cn(
            "flex items-center text-xs",
            trend.positive ? "text-green-500" : "text-red-500"
          )}>
            <span>{trend.positive ? "+" : "-"}{Math.abs(trend.value)}%</span>
            <span className="ml-1">from last month</span>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
