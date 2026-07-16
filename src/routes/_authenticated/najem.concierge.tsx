import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sparkles, Truck, Wrench, Brush, Shield, FileSignature, Home, UserSearch, Zap,
  ChevronDown, ChevronUp, Loader2, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/najem/concierge")({
  head: () => ({ meta: [{ title: "Usługi Concierge — Stay Safe" }] }),
  component: ConciergePage,
});

type Service = {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  short: string;
  long: string;
  client: "tenant" | "landlord" | "both";
  audienceLabel: string;
};

const services: Service[] = [
  {
    key: "adres_zastepczy",
    icon: FileSignature,
    title: "Adres zastępczy do najmu okazjonalnego (Wskazanie lokalu)",
    short: "Legalne i ekspresowe pozyskanie oświadczenia właściciela o wyrażeniu zgody na zamieszkanie w jego lokalu.",
    long: "Podpisujesz umowę najmu okazjonalnego, ale właściciel wymaga od Ciebie wskazania innego mieszkania, do którego możesz się wyprowadzić w razie rozwiązania umowy? Nie masz rodziny ani znajomych, którzy posiadają nieruchomość w Polsce i mogą podpisać dla Ciebie takie oświadczenie? To bardzo częsty problem, dlatego oferujemy w pełni legalną, bezpieczną i zatwierdzoną przez prawników usługę dostarczenia oświadczenia od właściciela lokalu zastępczego. Nasz certyfikowany partner podpisuje dla Ciebie notarialne oświadczenie (zgodnie z art. 19b ustawy o ochronie praw lokatorów), które jest w 100% akceptowane przez każdego notariusza w Polsce. Cały proces załatwiamy online w ciągu 24–48 godzin, bez zbędnych formalności, dzięki czemu bez stresu możesz podpisać umowę najmu.",
    client: "tenant",
    audienceLabel: "Dla Najemcy",
  },
  {
    key: "notariusz",
    icon: FileSignature,
    title: "Umówienie notariusza do umowy",
    short: "Kompleksowa organizacja i rezerwacja wizyty w dogodnym terminie i lokalizacji.",
    long: "Oszczędź czas na szukaniu kancelarii i porównywaniu cen. Zajmiemy się całą procedurą – od przesłania niezbędnych szablonów dokumentów i oświadczeń bezpośrednio do notariusza, przez dobór rekomendowanej, partnerskiej kancelarii w Twojej okolicy, aż po rezerwację dogodnego terminu dla Ciebie i Wynajmującego.",
    client: "both",
    audienceLabel: "Dla Najemcy i Wynajmującego",
  },
  {
    key: "zlota_raczka",
    icon: Wrench,
    title: "Pomoc złotej rączki",
    short: "Szybkie wsparcie sprawdzonych fachowców przy naprawach, montażu i awariach.",
    long: "Potrzebujesz zawiesić półki, podłączyć pralkę, naprawić kapiący kran czy złożyć nowe meble z paczek? Nasi zweryfikowani i ubezpieczeni fachowcy zjawią się na miejscu z własnym sprzętem. Gwarantujemy szybkie terminy realizacji, czystość po wykonanej pracy i jasny cennik bez ukrytych kosztów.",
    client: "both",
    audienceLabel: "Dla Najemcy i Wynajmującego",
  },
  {
    key: "przeprowadzki",
    icon: Truck,
    title: "Przeprowadzki",
    short: "Bezpieczny transport mebli i rzeczy osobistych z pełnym ubezpieczeniem ładunku.",
    long: "Profesjonalna ekipa przeprowadzkowa pomoże Ci spakować, bezpiecznie zabezpieczyć (folie bąbelkowe, pasy, koce transportowe), przenieść i przewieźć Twój dobytek do nowego lokalu. Usługa obejmuje zniesienie i wniesienie, a cały transport jest objęty pełnym ubezpieczeniem OC przewoźnika.",
    client: "tenant",
    audienceLabel: "Dla Najemcy",
  },
  {
    key: "sprzatanie",
    icon: Brush,
    title: "Sprzątanie nieruchomości",
    short: "Profesjonalne sprzątanie przed wprowadzką, po wyprowadzce lub regularny serwis.",
    long: "Zamów gruntowne sprzątanie lokalu „na błysk” przed wprowadzeniem się lub przy zwrocie lokalu, aby bezstresowo odzyskać 100% kaucji od właściciela. Oferujemy także wygodne usługi cykliczne (np. raz na dwa tygodnie) – Ty odpoczywasz, a nasz sprawdzony personel dba o porządek w Twoim domu.",
    client: "both",
    audienceLabel: "Dla Najemcy i Wynajmującego",
  },
  {
    key: "oc_najemcy",
    icon: Shield,
    title: "Ubezpieczenie OC Najemcy",
    short: "Kompleksowa ochrona przed kosztami przypadkowych szkód w wynajmowanym lokalu.",
    long: "Zabezpiecz się przed finansowymi skutkami niespodziewanych zdarzeń (np. zalaniem sąsiada, porysowaniem drogiego parkietu czy zniszczeniem sprzętów AGD przez Ciebie lub Twojego zwierzaka). Oferujemy dedykowane polisy partnerskie o wysokiej sumie gwarancyjnej, skrojone pod wymogi wynajmujących.",
    client: "tenant",
    audienceLabel: "Dla Najemcy",
  },
  {
    key: "znajdz_najemce",
    icon: UserSearch,
    title: "Znajdź najemcę na moje miejsce",
    short: "Szybkie poszukiwanie nowego lokatora, gdy musisz opuścić mieszkanie przed czasem.",
    long: "Zmiana planów życiowych lub zawodowych zmusza Cię do wcześniejszej przeprowadzki, a Twoja umowa nie przewiduje łatwego rozwiązania? Pomożemy Ci przygotować profesjonalną ofertę, wypromować ją na portalach i sprawnie znaleźć nowego, zweryfikowanego najemcę na cesję umowy, chroniąc Twoją kaucję przed utratą.",
    client: "tenant",
    audienceLabel: "Dla Najemcy",
  },
  {
    key: "sche",
    icon: Zap,
    title: "Sporządzenie Świadectwa Charakterystyki Energetycznej (ŚChE)",
    short: "Szybkie i zgodne z prawem wyrobienie obowiązkowego certyfikatu energetycznego dla Twojej nieruchomości.",
    long: "Posiadanie Świadectwa Charakterystyki Energetycznej (ŚChE) to ustawowy obowiązek każdego Właściciela i Wynajmującego przy zawieraniu nowej umowy najmu. Brak ważnego certyfikatu grozi wysokimi grzywnami. Nasz certyfikowany audytor energetyczny sporządzi dla Ciebie wymagany dokument w 100% online, bez konieczności kłopotliwych wizyt w mieszkaniu. Gotowe świadectwo, wpisane do centralnego rejestru MRiT i podpisane kwalifikowanym podpisem elektronicznym, otrzymasz na e-mail w zaledwie 48-72h.",
    client: "landlord",
    audienceLabel: "Dla Wynajmującego",
  },
];

function ConciergePage() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<Service | null>(null);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3">
          <Sparkles className="h-6 w-6 text-[#f59e0b]" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Usługi Concierge</h1>
          <p className="text-sm text-muted-foreground">Premium wsparcie dla Najemców i Wynajmujących StaySafe.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => {
          const Icon = s.icon;
          const isOpen = !!expanded[s.key];
          return (
            <div
              key={s.key}
              className="group relative flex flex-col rounded-2xl border border-[#1e293b] bg-gradient-to-b from-[#0f172a]/80 to-[#0b0f19]/80 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#f59e0b]/60 hover:shadow-[0_0_24px_-6px_rgba(245,158,11,0.35)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-2.5">
                  <Icon className="h-5 w-5 text-[#f59e0b]" />
                </div>
                <span className="rounded-full border border-[#1e293b] bg-[#0b0f19]/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  {s.audienceLabel}
                </span>
              </div>

              <h3 className="mt-4 text-base font-semibold leading-snug text-slate-50">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.short}</p>

              <button
                type="button"
                onClick={() => setExpanded((e) => ({ ...e, [s.key]: !e[s.key] }))}
                className="mt-3 inline-flex items-center gap-1 self-start text-xs font-semibold uppercase tracking-wider text-[#f59e0b] hover:text-[#fbbf24]"
              >
                Dowiedz się więcej
                {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              <div
                className={`grid transition-all duration-300 ease-out ${
                  isOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="text-sm leading-relaxed text-slate-300">{s.long}</p>
                </div>
              </div>

              <div className="mt-5 flex-1" />
              <Button
                onClick={() => setModal(s)}
                className="w-full font-bold"
                style={{ backgroundColor: "#f59e0b", color: "#0b0f19" }}
              >
                Zgłoś zainteresowanie
              </Button>
            </div>
          );
        })}
      </div>

      {modal && (
        <LeadModal
          service={modal}
          userEmail={user?.email ?? ""}
          userId={user?.id ?? null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function LeadModal({
  service, userEmail, userId, onClose,
}: { service: Service; userEmail: string; userId: string | null; onClose: () => void }) {
  const isSche = service.key === "sche";
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const title = isSche
    ? "Jesteś zainteresowany usługą: Świadectwo Energetyczne (ŚChE)?"
    : `Jesteś zainteresowany usługą: ${service.title.replace(/\s*\(.*?\)\s*$/, "")}?`;
  const description = isSche
    ? "Zostaw swoje dane kontaktowe. Nasz doradca skontaktuje się z Tobą wkrótce, aby pomóc Ci dopełnić tego ustawowego obowiązku i sprawnie przygotować certyfikat dla Twojej nieruchomości."
    : "Zostaw swoje dane kontaktowe. Nasz doradca skontaktuje się z Tobą wkrótce, aby przedstawić szczegóły i indywidualną wycenę usługi.";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { toast.error("Wymagana jest zgoda na kontakt."); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast.error("Podaj poprawny e-mail."); return; }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 9) { toast.error("Podaj poprawny numer telefonu."); return; }
    if (!userId) { toast.error("Musisz być zalogowany."); return; }

    setSubmitting(true);
    const { error } = await supabase.from("concierge_leads" as any).insert({
      user_id: userId,
      service_key: service.key,
      service_name: service.title,
      client_type: service.client,
      email,
      phone,
      consent_accepted: true,
      consent_timestamp: new Date().toISOString(),
      status: "new",
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    toast.success("Zgłoszenie wysłane. Skontaktujemy się wkrótce.");
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm">Dziękujemy — Twoje zgłoszenie trafiło do naszego zespołu concierge.</p>
            <Button onClick={onClose} className="mt-2">Zamknij</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label htmlFor="lead-email">E-mail</Label>
              <Input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="lead-phone">Telefon</Label>
              <Input id="lead-phone" type="tel" inputMode="tel" placeholder="+48 …" value={phone}
                onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <label className="flex items-start gap-2 rounded-xl border border-[#1e293b] bg-[#0b0f19]/40 p-3 text-xs leading-relaxed">
              <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
              <span>
                <span className="font-semibold text-[#f59e0b]">* </span>
                Wyrażam zgodę na kontakt telefoniczny i mailowy ze strony StaySafe oraz na przekazanie moich danych
                kontaktowych zaufanemu partnerowi realizującemu usługę w celu jej wyceny i wykonania.
              </span>
            </label>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Anuluj</Button>
              <Button type="submit" disabled={submitting || !consent}
                style={{ backgroundColor: "#f59e0b", color: "#0b0f19" }} className="font-bold">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Wyślij zgłoszenie
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
