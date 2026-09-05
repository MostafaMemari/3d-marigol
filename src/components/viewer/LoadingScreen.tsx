import { Loader2 } from 'lucide-react';
import { formatBytes, getLoadingMessage } from '../../lib/constants';
import Placeholder3D from './Placeholder3D';

interface Props {
  progress: number | null;
  loadedBytes: number;
  totalBytes: number | null;
  modelId: string | null;
  leaving: boolean;
}

function Ring({ progress }: { progress: number | null }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const pct = progress ?? 0;
  const offset = progress === null ? C * 0.72 : C - (C * Math.min(100, pct)) / 100;

  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={R} fill="none" stroke="#fde8ef" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={R}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.45s cubic-bezier(0.22,1,0.36,1)' }}
          className={progress === null ? 'anim-spin-slow origin-center' : undefined}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b80045" />
            <stop offset="55%" stopColor="#ce004f" />
            <stop offset="100%" stopColor="#ff4d8d" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {progress === null ? (
          <Loader2 className="h-6 w-6 animate-spin text-brand" strokeWidth={2.4} />
        ) : (
          <span className="font-mono text-[22px] font-semibold tabular-nums text-gray-900">
            {Math.floor(progress)}
            <span className="text-[13px] text-gray-400">%</span>
          </span>
        )}
      </div>
    </div>
  );
}

export default function LoadingScreen({ progress, loadedBytes, totalBytes, modelId, leaving }: Props) {
  const message = progress === 100 ? 'Ready' : getLoadingMessage(progress);
  const pct = progress === null ? null : Math.min(100, Math.max(0, progress));

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden bg-white/92 px-6 backdrop-blur-xl ${
        leaving ? 'loading-exit' : 'loading-enter'
      }`}
      aria-live="polite"
    >
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-from/15 via-brand/10 to-brand-to/15 blur-3xl" />
        <div className="viewer-dots absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_40%,black,transparent)]" />
      </div>

      <div className="anim-fade-up relative flex flex-col items-center">
        <div className="mb-2 flex items-center gap-2 rounded-full border border-brand-to/25 bg-brand-to/10 px-3.5 py-1.5 text-[12px] font-semibold tracking-wide text-brand-from">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-from" />
          </span>
          {modelId ? `MODEL #${modelId}` : 'PREPARING 3D MODEL'}
        </div>

        <Placeholder3D />

        <h2 className="mt-6 text-center text-[22px] font-bold tracking-tight text-gray-900 sm:text-2xl">
          Loading model
        </h2>
        <p
          key={message}
          className="anim-fade-in mt-1.5 flex items-center gap-2 text-[13.5px] font-medium text-gray-500"
        >
          {progress === null && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {message}
        </p>

        <div className="mt-6 flex items-center gap-5">
          <Ring progress={progress} />
          <div className="hidden flex-col gap-1 text-left sm:flex">
            <span className="text-[11px] font-bold tracking-[0.14em] text-gray-400 uppercase">
              Download
            </span>
            <span className="font-mono text-sm font-medium text-gray-700 tabular-nums">
              {formatBytes(loadedBytes)}
              <span className="text-gray-400"> / </span>
              {totalBytes ? formatBytes(totalBytes) : '—'}
            </span>
            <span className="text-xs text-gray-400">
              {progress === null ? 'Measuring size…' : 'Real-time transfer'}
            </span>
          </div>
        </div>

        {/* bar */}
        <div className="mt-6 w-64 sm:w-80">
          {pct === null ? (
            <div className="shimmer-track h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-brand-from via-brand to-brand-to" />
            </div>
          ) : (
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="shimmer-track h-full rounded-full bg-gradient-to-r from-brand-from via-brand to-brand-to transition-[width] duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
          <div className="mt-2.5 flex items-center justify-between font-mono text-[11px] font-medium text-gray-400 tabular-nums">
            <span>
              {loadedBytes > 0 ? formatBytes(loadedBytes) : '0 KB'}
              {totalBytes ? ` of ${formatBytes(totalBytes)}` : ''}
            </span>
            <span>{pct === null ? '···' : `${Math.floor(pct)}%`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
