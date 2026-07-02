import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { signOut } from "../services/authService";
import Button from "../components/shared/Button";

const NAV_ITEMS = [
  { to: "/ai-chat", label: "AI Assistant" },
  { to: "/notifications", label: "Notifications" },
  { to: "/payment", label: "Payment" },
  { to: "/alumni", label: "Alumni" },
  { to: "/reports", label: "Reports" },
];

export default function MainLayout() {
  const { user, profile } = useAuth();

  async function handleSignOut() {
    await signOut();
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-50 h-20 border-b border-white/5 bg-primary-900/95 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <NavLink to="/" className="text-xl font-bold text-secondary-100">
            ClubHub
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-accent-green/20 text-accent-green"
                      : "text-secondary-200 hover:text-secondary-100"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden text-sm text-secondary-300 sm:block">
                  {profile?.full_name ?? user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  Đăng xuất
                </Button>
              </>
            ) : (
              <NavLink to="/ai-chat">
                <Button size="sm">Đăng nhập</Button>
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
