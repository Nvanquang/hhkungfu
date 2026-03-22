import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { CustomCursor } from "./CustomCursor";

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <CustomCursor />
      <Header />
      <main className="flex-1 w-full relative pt-16 md:pt-20 pb-16 md:pb-0">
        {/* pt is added so content isn't hidden under the fixed/sticky Header */}
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
