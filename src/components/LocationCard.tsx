import type { Location } from "@/lib/types";
import { formatLocation } from "@/lib/store";

export function LocationCard({ location }: { location: Location }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="p-5">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg font-bold text-navy">
            {location.label}
          </h3>
          {location.isPrimary && (
            <span className="rounded-md bg-red/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red">
              Primary
            </span>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {formatLocation(location)}
        </p>
      </div>
      {location.mapEmbedUrl && (
        <div className="aspect-[16/10] w-full border-t border-line bg-sand">
          <iframe
            title={`Map - ${location.label}`}
            src={location.mapEmbedUrl}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </article>
  );
}
