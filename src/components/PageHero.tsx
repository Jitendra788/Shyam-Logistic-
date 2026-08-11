export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="page-hero">
      <div className="site-container relative z-10">
        <p className="section-label animate-fade-in !text-gold/90">{eyebrow}</p>
        <h1 className="animate-fade-up mt-2 max-w-3xl font-display font-bold leading-[1.1] tracking-tight sm:mt-3">
          {title}
        </h1>
        {subtitle && (
          <p className="animate-fade-up-delay mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:mt-4 sm:text-base md:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
