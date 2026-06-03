import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, LogOut, User as UserIcon, Gavel, List, MessageCircle, Home, Building2, KeyRound, Heart } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadMessages } from "@/hooks/use-unread-messages";

const tabs = [
  { to: "/wycena-live", label: "Rynkowa wycena nieruchomości", icon: Gavel },
  { to: "/ogloszenia", label: "Oferty sprzedaży", icon: Building2 },
  { to: "/najem", label: "Strefa najmu", icon: KeyRound },
] as const;

export function Navbar() {
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const unread = useUnreadMessages();

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <img src={logo} alt="Stay Safe" className="h-10 w-10 rounded-full object-cover" />
          <span className="text-lg hidden sm:inline">Stay<span className="text-muted-foreground">Safe</span></span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          <Link to="/" className="hidden md:inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm hover:bg-muted"
            activeProps={{ className: "bg-muted font-semibold" }} activeOptions={{ exact: true }}>
            <Home className="h-4 w-4" /> Dashboard
          </Link>
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm whitespace-nowrap hover:bg-muted"
              activeProps={{ className: "bg-primary/10 text-primary font-semibold" }}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative rounded-full">
                  <UserIcon className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-bold text-yellow-950 ring-2 ring-background">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-2xl">
                <DropdownMenuLabel className="font-normal">
                  <div className="text-xs text-muted-foreground">Zalogowany jako</div>
                  <div className="truncate font-medium">{displayName ?? user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/new-listing" })}>
                  <Plus className="h-4 w-4" /> Wystaw na Wycenę Live
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/ogloszenia/nowe" })}>
                  <Plus className="h-4 w-4" /> Dodaj ogłoszenie sprzedaży
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/najem/nowe-zapytanie" })}>
                  <Plus className="h-4 w-4" /> Zapytanie najemcy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/najem/nowa-oferta" })}>
                  <Plus className="h-4 w-4" /> Oferta wynajmującego
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/my-listings" })}>
                  <List className="h-4 w-4" /> Moje nieruchomości
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/my-bids" })}>
                  <Gavel className="h-4 w-4" /> Moje oferty
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/najem/moje-zapytania" })}>
                  <KeyRound className="h-4 w-4" /> Moje zapytania najmu
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/najem/moje-oferty" })}>
                  <Building2 className="h-4 w-4" /> Moje oferty najmu
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/polubione" })}>
                  <Heart className="h-4 w-4" /> Polubione
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/messages" })}
                  className={unread > 0 ? "bg-yellow-100 font-semibold text-yellow-900 focus:bg-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-100" : ""}>
                  <MessageCircle className="h-4 w-4" /> Wiadomości
                  {unread > 0 && (
                    <span className="ml-auto rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-yellow-950">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="h-4 w-4" /> Wyloguj
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate({ to: "/auth" })} className="rounded-2xl">
              Zaloguj się
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
