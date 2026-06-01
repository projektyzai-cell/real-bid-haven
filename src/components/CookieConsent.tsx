import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "ss_cookie_consent_v1";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);

  function set(value: "accepted" | "necessary") {
    localStorage.setItem(KEY, value);
    setShow(false);
  }

  if (!show) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-3xl border bg-background/95 p-4 shadow-glow backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Cookie className="h-5 w-5" />
        </div>
        <div className="flex-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Korzystamy z plików cookies</p>
          <p className="mt-1 leading-relaxed">
            Serwis Stay Safe wykorzystuje pliki cookies (ciasteczka) w celu zapewnienia prawidłowego działania,
            utrzymania sesji zalogowanego użytkownika, zapamiętywania preferencji oraz w celach analitycznych
            i statystycznych. Korzystanie z serwisu oznacza zgodę na ich używanie zgodnie z ustawieniami
            Twojej przeglądarki. Szczegóły opisaliśmy w{" "}
            <Link to="/polityka-prywatnosci" className="text-primary underline">
              Polityce prywatności (RODO)
            </Link>.
          </p>
        </div>
        <div className="flex shrink-0 gap-2 sm:flex-col">
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => set("necessary")}>
            Tylko niezbędne
          </Button>
          <Button size="sm" className="rounded-xl" onClick={() => set("accepted")}>
            Akceptuję wszystkie
          </Button>
        </div>
      </div>
    </div>
  );
}
