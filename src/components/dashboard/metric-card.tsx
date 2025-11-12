import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type ColorVariant = 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'info';

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  description?: string;
  colorVariant?: ColorVariant;
  isCurrency?: boolean;
}

const colorClasses: Record<ColorVariant, string> = {
  primary: 'text-brand-primary',
  accent: 'text-brand-accent',
  success: 'text-green-600',
  warning: 'text-orange-500',
  error: 'text-red-600',
  info: 'text-indigo-600',
};

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  colorVariant = 'primary',
  isCurrency = true,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClasses[colorVariant]}`}>
          {isCurrency ? formatCurrency(value) : value.toLocaleString()}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
