import { cn } from '@/lib/utils';

interface DesktopPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function DesktopPanel({ children, className }: DesktopPanelProps) {
  return (
    <div
      className={cn(
        'lg:mx-auto lg:max-w-2xl lg:bg-background/60 lg:backdrop-blur-md lg:rounded-2xl lg:p-6 lg:shadow-xl lg:mt-4 lg:mb-8',
        className
      )}
    >
      {children}
    </div>
  );
}
