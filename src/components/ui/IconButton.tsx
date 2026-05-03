import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'ghost' | 'outline';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: ReactNode;
  /** Required for accessibility — screen-reader label for the icon-only button. */
  'aria-label': string;
  variant?: Variant;
}

/**
 * Icon-only button with a guaranteed 44x44 touch target. The visual icon
 * stays at its natural size (20–24px); padding provides the hit area.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, variant = 'ghost', type = 'button', ...rest }, ref) => {
    const variantClass =
      variant === 'outline'
        ? 'border border-border bg-transparent hover:bg-muted'
        : 'bg-transparent hover:bg-muted';
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex min-w-[44px] min-h-[44px] items-center justify-center rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none',
          variantClass,
          className,
        )}
        {...rest}
      >
        {icon}
      </button>
    );
  },
);
IconButton.displayName = 'IconButton';
