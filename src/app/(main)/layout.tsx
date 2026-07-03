import { Header } from "@/components/Header";

// Shared layout for the app's main screens. It persists across client-side
// navigation between `/` and `/timeline`, so the Header (and its toggle) stays
// mounted and slides between states instead of reloading. `/login` lives
// outside this route group and stays headerless.
export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-full pb-safe">
      <Header />
      {children}
    </div>
  );
}
