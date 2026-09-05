import { AlertTriangle, CloudOff, FileQuestion, PackageSearch, RotateCcw } from 'lucide-react';
import type { ModelErrorKind } from '../../types/model';

interface Props {
  kind: ModelErrorKind;
  modelId: string | null;
  onRetry: () => void;
}

const COPY: Record<ModelErrorKind, { icon: typeof FileQuestion; title: string; body: string }> = {
  'missing-id': {
    icon: PackageSearch,
    title: 'Model ID is missing',
    body: 'No product was specified. Add a model ID to the URL, for example ?id=13994, then reload the viewer.',
  },
  'not-found': {
    icon: FileQuestion,
    title: 'Model not found',
    body: 'We could not find a 3D model with this ID. It may have been removed or the link may be incorrect.',
  },
  network: {
    icon: CloudOff,
    title: 'Unable to load this 3D model',
    body: 'Something interrupted the download. Check your connection and try again — your model is safe.',
  },
};

export default function ErrorState({ kind, modelId, onRetry }: Props) {
  const { icon: Icon, title, body } = COPY[kind];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-white px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-28 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-soft/70 via-brand-mist/60 to-brand-to/30 blur-3xl" />
        <div className="viewer-dots absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_40%,black,transparent)]" />
      </div>

      <div className="anim-fade-up relative w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-[0_24px_70px_-24px_rgba(206,0,79,0.25)] sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-from via-brand to-brand-to shadow-lg shadow-brand/25">
          {kind === 'network' ? (
            <AlertTriangle className="h-7 w-7 text-white" strokeWidth={2.2} />
          ) : (
            <Icon className="h-7 w-7 text-white" strokeWidth={2.2} />
          )}
        </div>

        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 font-mono text-[11px] font-semibold tracking-wide text-gray-500">
          {modelId ? `ID ${modelId}` : 'NO ID'}
          <span className="h-1 w-1 rounded-full bg-gray-300" />
          <span className="text-rose-500">ERROR</span>
        </div>

        <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-gray-500">{body}</p>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button
            onClick={onRetry}
            className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand hover:shadow-brand/30 active:translate-y-0"
          >
            <RotateCcw className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-180" />
            Try again
          </button>
          <a
            href={window.location.pathname}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 active:translate-y-0"
          >
            Clear viewer
          </a>
        </div>

        <p className="mt-6 text-[11.5px] text-gray-400">
          If the problem persists, the model file may be unavailable on storage.
        </p>
      </div>
    </div>
  );
}
