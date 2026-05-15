import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40 min-h-[44px] select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] hover:shadow-[1px_1px_0px_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]",
        destructive:
          "bg-destructive text-destructive-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] hover:shadow-[1px_1px_0px_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]",
        outline:
          "bg-background text-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:bg-accent hover:text-accent-foreground hover:shadow-[1px_1px_0px_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:bg-secondary/80 hover:shadow-[1px_1px_0px_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]",
        ghost:
          "text-foreground hover:bg-accent hover:text-accent-foreground border-2 border-transparent",
        link:
          "text-link underline-offset-4 hover:underline border-2 border-transparent shadow-none",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-md",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10 rounded-md p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      data-slot="button"
      {...props}
    />
  );
}

export { Button, buttonVariants };
