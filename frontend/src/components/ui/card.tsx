import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn('border-b border-gray-100 px-5 py-4 dark:border-gray-800', className)}>{children}</div>;
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  className,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
