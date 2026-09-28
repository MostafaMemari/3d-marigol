import * as SwitchPrimitive from '@radix-ui/react-switch';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:ring-ring/50 inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'bg-card pointer-events-none block size-[18px] rounded-full ring-0 transition-transform',
          'data-[state=checked]:translate-x-[17px] data-[state=unchecked]:translate-x-[2px]',
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
