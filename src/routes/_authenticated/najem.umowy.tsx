import { createFileRoute, Link } from "@tanstack/react-router";
import { FileSignature, FileText, Wallet, Bell, ShieldCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/najem/umowy")({
  head: () => ({ meta: [{ title: "Zarządzanie umowami i płatnościami — Stay Safe" }] }),
  component: UmowyPage,
});

const features = [
  { icon: FileText, title: "Rejestr umów najmu", desc: "Umowy okazjonalne i tradycyjne, załączniki, terminy końca najmu — wszystko w jednym miejscu." },
  { icon: Wallet, title: "Harmonogram płatności", desc: "Czynsz, media, kaucja — wraz ze statusem (opłacone / zaległe) i historią wpłat." },
  { icon: Bell, title: "Podatek ryczałt (8,5% / 12,5%)", desc: "Rozliczenie łączne z całego portfela, próg 100 000 zł, terminy PIT-28." },
  { icon: ShieldCheck, title: "Dokumenty i notatki", desc: "Protokoły zdawczo-odbiorcze, świadectwo energetyczne, ubezpieczenia, notatki do najemcy." },
];

function UmowyPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-3">
          <FileSignature className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Zarządzanie umowami i płatnościami</h1>
          <p className="text-sm text-muted-foreground">Profesjonalny panel dla wynajmujących — wszystkie zmiany zapisują się automatycznie na Twoim koncie.</p>
        </div>
      </div>

      <Link
        to="/najem/portfel"
        className="mt-6 flex items-center justify-between rounded-2xl border-2 border-[var(--gold)]/50 bg-gradient-to-br from-[var(--gold)]/15 to-transparent p-5 shadow-card transition hover:border-[var(--gold)] hover:shadow-lg"
      >
        <div>
          <div className="text-lg font-semibold">Otwórz Portfel Nieruchomości</div>
          <div className="text-sm text-muted-foreground">Zarządzaj mieszkaniami, pokojami, najemcami, wpisami finansowymi i podatkiem.</div>
        </div>
        <ArrowRight className="h-5 w-5 text-gold" />
      </Link>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border bg-card p-5 shadow-card">
            <Icon className="h-5 w-5 text-gold" />
            <div className="mt-3 font-semibold">{title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
