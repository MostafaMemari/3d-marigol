import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

const toggleGroupItemVariants = cva(
  "text-muted-foreground hover:text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 data-[state=on]:bg-foreground data-[state=on]:text-background inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-semibold whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          'bg-transparent data-[state=on]:bg-foreground data-[state=on]:text-background',
        card: 'border-border bg-card data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary hover:border-foreground/20',
        swatch: 'border-border data-[state=on]:ring-primary data-[state=on]:ring-2',
      },
      size: {
        default: 'h-9 min-w-9 px-2.5',
        sm: 'h-8 min-w-8 px-2',
        lg: 'h-auto px-2.5 py-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function ToggleGroup({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn('flex w-full items-center gap-1.5', className)}
      {...props}
    />
  );
}

function ToggleGroupItem({
  className,
  variant,
  size,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleGroupItemVariants>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(toggleGroupItemVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
