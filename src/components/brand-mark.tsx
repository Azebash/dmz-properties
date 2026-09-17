type BrandMarkProps = {
  className?: string;
  title?: string;
};

export function BrandMark({ className, title }: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 178 60"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <path
        className="brand-mark-primary"
        fillRule="evenodd"
        d="M0 0h23c18 0 28 11 28 30S41 60 23 60H0V0Zm13 12v36h9c10 0 16-7 16-18s-6-18-16-18h-9Z"
      />
      <path
        className="brand-mark-primary"
        d="M61 60V0h12l16 23 16-23h12v60h-13V22L89 43 74 22v38H61Z"
      />
      <path
        className="brand-mark-accent"
        d="M128 0h50v11l-32 37h32v12h-51V49l32-37h-31V0Z"
      />
    </svg>
  );
}
