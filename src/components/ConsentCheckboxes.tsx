import { Link } from "@tanstack/react-router";
import { Checkbox } from "@/components/ui/checkbox";

export type ConsentKey =
  | "terms"
  | "privacy"
  | "binding_offer"
  | "legal_capacity"
  | "marketing_email"
  | "marketing_phone"
  | "aml_kyc"
  | "auto_suspend"
  | "infrastructure_only";

export interface ConsentState {
  terms: boolean;
  privacy: boolean;
  binding_offer: boolean;
  legal_capacity: boolean;
  marketing_email: boolean;
  marketing_phone: boolean;
  aml_kyc: boolean;
  auto_suspend: boolean;
  infrastructure_only: boolean;
}

export const defaultConsents: ConsentState = {
  terms: false,
  privacy: false,
  binding_offer: false,
  legal_capacity: false,
  marketing_email: false,
  marketing_phone: false,
  aml_kyc: false,
  auto_suspend: false,
  infrastructure_only: false,
};

export const requiredConsentKeys: ConsentKey[] = [
  "terms",
  "privacy",
  "binding_offer",
  "legal_capacity",
];

interface Props {
  value: ConsentState;
  onChange: (next: ConsentState) => void;
}

function Row({
  id, checked, onChange, required, children,
}: { id: string; checked: boolean; onChange: (v: boolean) => void; required?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 rounded-xl border bg-background/50 p-3 text-sm">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <span className="leading-relaxed">
        {required && <span className="mr-1 font-semibold text-primary">*</span>}
        {children}
      </span>
    </label>
  );
}

export function ConsentCheckboxes({ value, onChange }: Props) {
  const set = (k: ConsentKey, v: boolean) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Wymagane zgody
      </p>
      <Row id="c-terms" checked={value.terms} onChange={(v) => set("terms", v)} required>
        Oświadczam, że zapoznałem(-am) się z{" "}
        <Link to="/regulamin" target="_blank" className="underline">Regulaminem platformy Stay Safe</Link>{" "}
        i akceptuję jego treść.
      </Row>
      <Row id="c-privacy" checked={value.privacy} onChange={(v) => set("privacy", v)} required>
        Oświadczam, że zapoznałem(-am) się z{" "}
        <Link to="/polityka-prywatnosci" target="_blank" className="underline">Polityką Prywatności</Link>{" "}
        i informacją o przetwarzaniu moich danych osobowych.
      </Row>
      <Row id="c-binding" checked={value.binding_offer} onChange={(v) => set("binding_offer", v)} required>
        Jestem świadomy(-a), że złożenie Oferty w ramach licytacji ma charakter wiążący i stanowi zobowiązanie do zawarcia umowy sprzedaży nieruchomości.
      </Row>
      <Row id="c-capacity" checked={value.legal_capacity} onChange={(v) => set("legal_capacity", v)} required>
        Oświadczam, że posiadam pełną zdolność do czynności prawnych oraz działam we własnym imieniu lub jako uprawniony przedstawiciel podmiotu.
      </Row>

      <p className="pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Zgody opcjonalne
      </p>
      <Row id="c-mail" checked={value.marketing_email} onChange={(v) => set("marketing_email", v)}>
        Wyrażam zgodę na otrzymywanie informacji handlowych drogą elektroniczną.
      </Row>
      <Row id="c-phone" checked={value.marketing_phone} onChange={(v) => set("marketing_phone", v)}>
        Wyrażam zgodę na kontakt telefoniczny lub SMS w celach marketingowych.
      </Row>
      <Row id="c-aml" checked={value.aml_kyc} onChange={(v) => set("aml_kyc", v)}>
        Przyjmuję do wiadomości, że Operator może przeprowadzić weryfikację mojej tożsamości (KYC) oraz zażądać dokumentów.
      </Row>
      <Row id="c-suspend" checked={value.auto_suspend} onChange={(v) => set("auto_suspend", v)}>
        Przyjmuję do wiadomości, że otrzymanie 4 negatywnych opinii skutkuje automatycznym zawieszeniem konta.
      </Row>
      <Row id="c-infra" checked={value.infrastructure_only} onChange={(v) => set("infrastructure_only", v)}>
        Rozumiem, że Platforma Stay Safe jest wyłącznie dostawcą infrastruktury technologicznej i nie jest stroną umów zawieranych pomiędzy Użytkownikami.
      </Row>
    </div>
  );
}

export function allRequiredAccepted(c: ConsentState): boolean {
  return requiredConsentKeys.every((k) => c[k]);
}
