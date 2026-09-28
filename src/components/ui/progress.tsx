import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

function Progress({
  className,
  value,
  ...props
}: ComponentProps<'div'> & { value?: number | null }) {
  const pct = value === null || value === undefined ? null : Math.min(100, Math.max(0, value));
  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct ?? undefined}
      className={cn('bg-muted relative h-2.5 w-full overflow-hidden rounded-full', className)}
      {...props}
    >
      {pct === null ? (
        <div className="shimmer-track h-full w-full">
          <div className="bg-primary h-full w-2/5 rounded-full bg-gradient-to-r from-brand-from via-brand to-brand-to" />
        </div>
      ) : (
        <div
          className="from-brand-from via-brand to-brand-to h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      )}
    </div>
  );
}

export { Progress };
