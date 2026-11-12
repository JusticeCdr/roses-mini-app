import { ShopProvider } from "@/components/shop-provider";
import { TabBar } from "@/components/ui";
import { WelcomeSheet } from "@/components/welcome-sheet";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShopProvider>
      <main id="top" className="mx-auto min-h-dvh max-w-xl" style={{ paddingBottom: "calc(var(--tabbar) + 24px)" }}>
        {children}
      </main>
      <TabBar />
      <WelcomeSheet />
    </ShopProvider>
  );
}
