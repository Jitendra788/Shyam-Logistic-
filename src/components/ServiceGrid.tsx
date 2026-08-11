import type { ServiceItem } from "@/lib/types";
import { IconBadge } from "./IconBadge";

export function ServiceGrid({
  services,
  numbered = false,
}: {
  services: ServiceItem[];
  numbered?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {services.map((service, index) => (
        <article key={service.id} className="card-grid-item">
          <div className="flex items-start justify-between gap-3">
            <IconBadge icon={service.icon} />
            {numbered && (
              <span className="service-number">{index + 1}</span>
            )}
          </div>
          <h3 className="mt-3 font-display text-lg font-bold text-navy sm:mt-4 sm:text-xl">
            {service.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {service.description}
          </p>
        </article>
      ))}
    </div>
  );
}

export function FeatureGrid({
  features,
}: {
  features: { id: string; title: string; description: string; icon: string }[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {features.map((f) => (
        <article key={f.id} className="card-grid-item">
          <IconBadge icon={f.icon} />
          <h3 className="mt-3 font-display text-lg font-bold text-navy sm:mt-4 sm:text-xl">
            {f.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {f.description}
          </p>
        </article>
      ))}
    </div>
  );
}
