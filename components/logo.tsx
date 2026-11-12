/** Roses logo emblem (red rose in a sage circle with a gold ring). */
export function RoseMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/roses-emblem.webp"
      alt=""
      width={size}
      height={size}
      className={`rounded-full ${className ?? ""}`}
      style={{ width: size, height: size }}
    />
  );
}
