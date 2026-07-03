import { logout } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-full px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
      >
        Sign out
      </button>
    </form>
  );
}
