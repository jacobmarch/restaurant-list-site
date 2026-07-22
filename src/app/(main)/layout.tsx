import { Suspense } from "react";
import { AppDataShell } from "@/components/AppDataShell";
import { Header } from "@/components/Header";

// Shared layout for the app's main screens. It persists across client-side
// navigation between `/` and `/timeline`, so the Header (and its toggle) stays
// mounted and slides between states instead of reloading. App data is loaded
// once into a client provider here, so switching views does not refetch.
// `/login` lives outside this route group and stays headerless.
export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-full pb-safe">
      <Suspense>
        <AppDataShell>
          <Header />
          {children}
        </AppDataShell>
      </Suspense>
    </div>
  );
}
