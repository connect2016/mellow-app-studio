import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97] active:brightness-95",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-lg",
        outline:
          "border-2 border-primary bg-transparent hover:bg-primary/10 shadow-sm text-destructive-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 hover:shadow-lg",
        ghost:
          "hover:bg-accent/15 hover:text-accent-foreground",
        tertiary:
          "bg-transparent text-primary hover:text-primary/80 hover:underline underline-offset-4",
        link: "text-primary underline-offset-4 hover:underline",
        premium:
          "bg-gradient-ivy text-primary-foreground shadow-elevated hover:brightness-110 hover:shadow-elevated",
        pennant:
          "bg-gradient-brick text-secondary-foreground shadow-pennant hover:brightness-110 uppercase tracking-wider",
      },
      size: {
        default: "h-12 min-h-[48px] px-5 py-2.5 text-base",
        sm: "h-10 min-h-[44px] rounded-xl px-4 text-sm",
        lg: "h-14 min-h-[56px] rounded-xl px-10 text-lg",
        icon: "h-12 w-12 min-h-[48px] min-w-[48px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
