const paths: Record<string, React.ReactNode> = {
  truck: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 7.5h11.5V15H3V7.5zm11.5 2.5h3.2l2.3 2.6V15h-5.5V10zM6.5 17.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm9 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
    />
  ),
  boxes: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 8l8-3.5L20 8l-8 3.5L4 8zm0 0v7.5l8 3.5 8-3.5V8m-8 3.5V19"
    />
  ),
  clock: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 7v5l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
  warehouse: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 10l9-6 9 6v9a1 1 0 01-1 1H4a1 1 0 01-1-1v-9zm5 10v-5h8v5"
    />
  ),
  route: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 8a2 2 0 100-4 2 2 0 000 4zm0 0v3a3 3 0 003 3h4a3 3 0 013 3v2m0 0a2 2 0 100 4 2 2 0 000-4z"
    />
  ),
  document: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 4h6l4 4v10a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2zm6 0v4h4M9 13h6M9 17h4"
    />
  ),
  shield: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3l7 3v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3zm-1 11l5-5-1.4-1.4L11 11.2 9.4 9.6 8 11l3 3z"
    />
  ),
  fast: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 3L5 14h6l-1 7 9-13h-6l0-5z"
    />
  ),
  trust: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 12l2 2 4-4m2 9H8a2 2 0 01-2-2V7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2z"
    />
  ),
  custom: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6l3 2m6 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
  support: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18 10a4 4 0 00-8 0c0 2.5 2 3.5 2 5h4c0-1.5 2-2.5 2-5zm-6 8h4"
    />
  ),
  map: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 4l6 2 5-2v14l-5 2-6-2-4 1.5V6L9 4zm6 2v14M9 4v14"
    />
  ),
};

export function IconBadge({
  icon,
  className = "",
}: {
  icon: string;
  className?: string;
}) {
  const path = paths[icon] || paths.truck;
  return (
    <span
      className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-white ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="h-6 w-6"
        aria-hidden
      >
        {path}
      </svg>
    </span>
  );
}
