import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Truck, Wrench, Sparkle, Brush, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/najem/concierge")({
  head: () => ({ meta: [{ title: "Usługi Concierge — Stay Safe" }] }),
  component: ConciergePage,
});

const services = [
  { icon: Truck, title: "Przeprowadzki", desc: "Zweryfikowane firmy przewozowe ze zniżką dla najemców Stay Safe." },
  { icon: Brush, title: "Sprzątanie i odbiór mieszkania", desc: "Profesjonalne sprzątanie przed wprowadzeniem lub po wyprowadzce." },
  { icon: Wrench, title: "Drobne naprawy i hydraulik", desc: "Szybkie zgłoszenie problemu — wykonawca z naszej sieci." },
  { icon: Shield, title: "Ubezpieczenie OC najemcy", desc: "Polisy partnerskie chroniące najemcę i mieszkanie." },
  { icon: Sparkle, title: "Pakiet powitalny", desc: "Internet, prąd, gaz — pomoc w podłączeniu mediów po wprowadzce." },
];

function ConciergePage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-3">
          <Sparkles className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Usługi Concierge</h1>
          <p className="text-sm text-muted-foreground">Dodatkowy komfort dla najemców Stay Safe — wkrótce dostępne.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border bg-card p-5 shadow-card">
            <Icon className="h-5 w-5 text-gold" />
            <div className="mt-3 font-semibold">{title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
            <div className="mt-3 inline-flex rounded-full border border-dashed px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              Wkrótce
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
