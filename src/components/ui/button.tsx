import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink-900 focus-visible:outline-offset-2 dark:focus-visible:outline-ink-50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-ink-900 text-ink-50 hover:bg-ink-800 hover:scale-[1.02] active:scale-[0.98] dark:bg-ink-50 dark:text-ink-950 dark:hover:bg-ink-200',
        outline:
          'border-2 border-ink-200 bg-transparent hover:bg-ink-100 dark:border-ink-700 dark:hover:bg-ink-900 hover:scale-[1.01] active:scale-[0.99]',
        secondary:
          'bg-ink-100 text-ink-900 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-50 dark:hover:bg-ink-700 hover:scale-[1.01] active:scale-[0.99]',
        ghost: 'hover:bg-ink-100 dark:hover:bg-ink-900/60',
        link: 'text-ink-900 underline-offset-4 hover:underline dark:text-ink-50',
      },
      size: {
        default: 'h-11 min-h-[2.75rem] px-6 py-2.5',
        sm: 'h-9 min-h-9 px-6 text-xs',
        lg: 'h-12 min-h-[3rem] px-8 text-base',
        icon: 'h-11 w-11 min-h-[2.75rem] min-w-[2.75rem] px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
