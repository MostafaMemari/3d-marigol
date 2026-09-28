import { Download } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { buildProductUrl } from '../../lib/constants';
import type { AssetType } from '../../types/model';

interface Props {
  id: string | null;
  assetType: AssetType;
  productUrl: string | null;
}

/** Brand chip with the asset id, plus the product download action. */
export default function TopBar({ id, assetType, productUrl }: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-3 p-3 sm:p-4">
      <div className="bg-surface border-surface-border anim-fade-up border-surface-border pointer-events-auto flex items-center gap-2.5 rounded-2xl border py-2 pr-3 pl-2.5 shadow-lg backdrop-blur-xl sm:pr-4">
        <span className="from-brand-from via-brand to-brand-to shadow-brand/25 flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md">
          <img src="./logo.webp" alt="Marigol" className="size-4" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="text-foreground block truncate text-[13.5px] font-bold tracking-tight">
            Marigol 3D
          </span>
          <span className="text-muted-foreground block font-mono text-[10.5px] font-medium">
            {id ? `#${id}` : 'viewer'}
          </span>
          {assetType === 'material' && (
            <Badge variant="brand" className="mt-1 px-1.5 py-px text-[9px]">
              Material
            </Badge>
          )}
        </span>
      </div>

      {productUrl && (
        <div className="anim-fade-up stagger-1 pointer-events-auto flex items-center gap-2">
          <Button asChild size="lg" className="rounded-2xl px-4 shadow-xl sm:px-5">
            <a href={productUrl} target="_blank" rel="noopener noreferrer">
              <Download className="size-4 transition-transform duration-200 group-hover:translate-y-0.5" />
              <span className="hidden sm:inline">Download</span>
              <span className="sm:hidden">Get</span>
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

export function productLinkFor(id: string | null): string | null {
  return id ? buildProductUrl(id) : null;
}
