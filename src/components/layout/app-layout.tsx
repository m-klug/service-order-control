import { NavLink, Outlet } from 'react-router-dom';
import { LogOutIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/lib/auth-context';
import { navItems } from './nav';

function LogoutButton() {
  const { signOut } = useAuth();
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Sair"
      onClick={() => void signOut()}
    >
      <LogOutIcon />
    </Button>
  );
}

/**
 * Shell da aplicação, responsivo por contexto:
 * - Desktop (md+): sidebar de gestão à esquerda (escritório).
 * - Mobile: barra de navegação inferior, ao alcance do polegar (campo).
 */
export function AppLayout() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Sidebar — desktop / escritório */}
      <aside className="bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r p-4 md:flex">
        <div className="mb-6 px-2">
          <p className="text-base font-semibold">Ordens de Serviço</p>
          <p className="text-muted-foreground text-xs">Beto Sistemas</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex gap-2 pt-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </aside>

      {/* Header — mobile / campo */}
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 backdrop-blur md:hidden">
        <p className="text-base font-semibold">Ordens de Serviço</p>
        <div className="flex gap-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      {/* Conteúdo */}
      <main className="px-4 pt-4 pb-24 md:ml-60 md:px-8 md:py-8">
        <Outlet />
      </main>

      {/* Barra inferior — mobile / campo */}
      <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t backdrop-blur md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            <item.icon className="size-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Toaster />
    </div>
  );
}
