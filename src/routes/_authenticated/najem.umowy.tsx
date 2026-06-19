import { createFileRoute } from "@tanstack/react-router";
import { FileSignature, FileText, Wallet, Bell, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/najem/umowy")({
  head: () => ({ meta: [{ title: "Zarządzanie umowami i płatnościami — Stay Safe" }] }),
  component: UmowyPage,
});

const features = [
  { icon: FileText, title: "Generator umowy najmu", desc: "Gotowy szablon umowy okazjonalnej i tradycyjnej — wypełniany danymi z paszportu i oferty." },
  { icon: ShieldCheck, title: "Najem okazjonalny u notariusza", desc: "Wsparcie w organizacji notarialnego poddania się egzekucji." },
  { icon: Wallet, title: "Harmonogram płatności", desc: "Czynsz, media, kaucja — wszystko w jednym miejscu, z potwierdzeniami." },
  { icon: Bell, title: "Przypomnienia i powiadomienia", desc: "Automatyczne alerty o zbliżających się terminach płatności i końcu umowy." },
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
          <p className="text-sm text-muted-foreground">Profesjonalne narzędzia dla wynajmujących — wkrótce dostępne.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, desc }) => (
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
