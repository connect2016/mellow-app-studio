import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        energy:
          "border-transparent bg-gradient-to-r from-secondary to-accent text-white shadow-sm",
        success:
          "border-transparent bg-[hsl(var(--success))] text-white",
        warning:
          "border-transparent bg-[hsl(var(--warning))] text-white",
        info:
          "border-transparent bg-[hsl(var(--info))] text-white",
        pennant:
          "border-transparent bg-gradient-brick text-secondary-foreground shadow-pennant uppercase tracking-wider font-heading",
        ivy:
          "border-transparent bg-gradient-ivy text-primary-foreground shadow-card uppercase tracking-wider font-heading",
        sky:
          "border-transparent bg-gradient-sky text-accent-foreground shadow-card uppercase tracking-wider font-heading",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
