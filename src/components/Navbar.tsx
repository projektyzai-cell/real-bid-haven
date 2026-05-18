import { Link, useNavigate } from "@tanstack/react-router";
import { Shield, Plus, LogOut, User as UserIcon, Gavel, List, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </span>
          <span className="text-lg">Stay<span className="text-muted-foreground">Safe</span></span>
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button
                onClick={() => navigate({ to: "/new-listing" })}
                className="rounded-2xl hidden sm:inline-flex"
              >
                <Plus className="h-4 w-4" />
                Dodaj ogłoszenie
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                  <DropdownMenuLabel className="font-normal">
                    <div className="text-xs text-muted-foreground">Zalogowany jako</div>
                    <div className="truncate font-medium">{displayName ?? user.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/new-listing" })} className="sm:hidden">
                    <Plus className="h-4 w-4" /> Dodaj ogłoszenie
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/my-listings" })}>
                    <List className="h-4 w-4" /> Moje ogłoszenia
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/my-bids" })}>
                    <Gavel className="h-4 w-4" /> Moje oferty
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/messages" })}>
                    <MessageCircle className="h-4 w-4" /> Wiadomości
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4" /> Wyloguj
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => navigate({ to: "/auth" })} className="rounded-2xl">
              Zaloguj się
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
