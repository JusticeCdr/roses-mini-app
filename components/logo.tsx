/** Roses monogram — a drawn rose bloom inside a circle. */
export function RoseMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx="20" cy="20" r="19" fill="#2f5d46" />
      <g fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 13.2c2.6 0 4.2 1.7 4.2 3.8 0 2.4-2.1 3.9-4.4 3.9-1.8 0-3.1-1.1-3.1-2.6 0-1.3 1-2.2 2.3-2.2 1 0 1.7.6 1.7 1.4" />
        <path d="M15.6 15.6c-1.5 1.1-2.3 2.7-2.3 4.3 0 3.6 3 6.1 6.7 6.1s6.7-2.5 6.7-6.1c0-1.6-.7-3-1.9-4.1" />
        <path d="M20 26v6.5" />
        <path d="M20 29.4c-1.6-1.6-3.7-2-5.4-1.4 1 1.7 3 2.6 5.4 1.4Z" />
      </g>
    </svg>
  );
}
