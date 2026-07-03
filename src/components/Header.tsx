import { LogoutButton } from "./LogoutButton";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-rose-100/80 bg-stone-50/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
        <div>
          <p className="font-display text-xl font-semibold tracking-tight text-stone-800">
            Our Restaurant Visits
          </p>
          <p className="text-xs text-stone-500">Every meal, every memory</p>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
