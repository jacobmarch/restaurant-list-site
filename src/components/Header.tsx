import { LogoutButton } from "./LogoutButton";
import { Nav } from "./Nav";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-rose-100/80 bg-stone-50/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold tracking-tight text-stone-800 sm:text-xl">
            Our Restaurant Visits
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-3">
          <Nav />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
