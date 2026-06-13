import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-card/50">
      <div className="container mx-auto flex flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>© {new Date().getFullYear()} Stay Safe · staysafe.pl</span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link to="/wycena-live" className="text-muted-foreground hover:text-foreground">
            Rynkowa wycena nieruchomości
          </Link>
          <Link to="/ogloszenia" className="text-muted-foreground hover:text-foreground">
            Oferty sprzedaży
          </Link>
          <Link to="/regulamin" className="text-muted-foreground hover:text-foreground">
            Regulamin
          </Link>
          <Link to="/polityka-prywatnosci" className="text-muted-foreground hover:text-foreground">
            Polityka prywatności (RODO)
          </Link>
          <a href="mailto:kontakt@staysafe.pl" className="text-muted-foreground hover:text-foreground">
            Kontakt
          </a>
        </nav>
      </div>
    </footer>
  );
}
