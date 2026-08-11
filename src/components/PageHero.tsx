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
        <p className="section-label !text-gold/90 animate-fade-in">{eyebrow}</p>
        <h1 className="animate-fade-up mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="animate-fade-up-delay mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
