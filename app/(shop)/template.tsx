/** Re-mounts on every navigation, so each page slides in softly. */
export default function ShopTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
