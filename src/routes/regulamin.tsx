import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/regulamin")({
  head: () => ({
    meta: [
      { title: "Regulamin — Stay Safe" },
      { name: "description", content: "Regulamin platformy transakcyjnej Stay Safe (staysafe.pl)." },
    ],
  }),
  component: RegulaminPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function RegulaminPage() {
  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Regulamin platformy transakcyjnej Stay Safe</h1>
      <p className="mt-2 text-sm text-muted-foreground">staysafe.pl · obowiązujący od dnia [●]</p>

      <Section title="§1. Informacje ogólne">
        <p>1. Platforma internetowa dostępna pod adresem staysafe.pl (dalej: „Platforma”) prowadzona jest przez podmiot prowadzący działalność gospodarczą pod nazwą Stay Safe, NIP: 5252651283 (dalej: „Operator”).</p>
        <p>2. Platforma stanowi system teleinformatyczny umożliwiający: publikowanie ogłoszeń sprzedaży nieruchomości, przeprowadzanie licytacji online, komunikację pomiędzy Użytkownikami.</p>
        <p>3. Platforma nie jest biurem nieruchomości, pośrednikiem w obrocie nieruchomościami ani stroną umów sprzedaży.</p>
        <p>4. Operator nie świadczy usług doradztwa prawnego, finansowego ani inwestycyjnego.</p>
      </Section>

      <Section title="§2. Model działania Platformy">
        <p>1. Platforma działa w modelu marketplace C2C/B2C.</p>
        <p>2. Operator udostępnia wyłącznie infrastrukturę technologiczną.</p>
        <p>3. Umowa sprzedaży nieruchomości zawierana jest wyłącznie pomiędzy Sprzedającym a Kupującym.</p>
        <p>4. Złożenie Oferty przez Kupującego stanowi wiążące oświadczenie woli.</p>
        <p>5. Licytacja nie stanowi oferty w rozumieniu art. 66 Kodeksu cywilnego po stronie Sprzedającego.</p>
        <p>6. Sprzedający nie jest zobowiązany do zawarcia umowy sprzedaży.</p>
      </Section>

      <Section title="§3. Rejestracja i status Użytkownika">
        <p>1. Korzystanie z funkcji licytacyjnych wymaga rejestracji.</p>
        <p>2. Operator może przeprowadzić proces identyfikacji i weryfikacji (KYC).</p>
        <p>3. Operator może uzależnić pełną aktywację Konta od: weryfikacji tożsamości, weryfikacji dokumentów nieruchomości, dodatkowych czynności compliance.</p>
        <p>4. Operator może odmówić świadczenia usług bez podania przyczyny.</p>
      </Section>

      <Section title="§4. Zasady licytacji">
        <p>1. Oferta złożona przez Kupującego: jest nieodwołalna, ma charakter wiążący, może stanowić podstawę dochodzenia roszczeń przez Sprzedającego.</p>
        <p>2. Kupujący ponosi pełną odpowiedzialność za skutki złożonej Oferty.</p>
        <p>3. Sprzedający może zakończyć licytację bez wyboru zwycięzcy.</p>
        <p>4. Operator nie gwarantuje finalizacji transakcji.</p>
        <p>5. Zwycięzca licytacji uzyskuje dostęp do wewnętrznego systemu komunikacji umożliwiającego bezpośredni kontakt stron.</p>
      </Section>

      <Section title="§5. System reputacyjny i sankcje">
        <p>1. W przypadku niewywiązania się z Oferty Sprzedający może wystawić Negatywną opinię.</p>
        <p>2. 3 Negatywne opinie skutkują statusem ostrzegawczym.</p>
        <p>3. 4 Negatywna opinia powoduje automatyczne zawieszenie Konta.</p>
        <p>4. Operator może zawiesić Konto natychmiast w przypadku: podejrzenia manipulacji cenowej, działania w zmowie, nadużyć finansowych, naruszenia przepisów AML.</p>
        <p>5. Operator może usunąć Konto bez prawa do odszkodowania.</p>
      </Section>

      <Section title="§6. Compliance, AML i przeciwdziałanie nadużyciom">
        <p>1. Operator może wdrażać procedury: KYC (Know Your Customer), AML (Anti-Money Laundering), monitoringu transakcyjnego.</p>
        <p>2. Operator może: analizować aktywność Użytkowników, wstrzymać dostęp do Konta, przekazać dane organom państwowym.</p>
        <p>3. Użytkownik zobowiązuje się do korzystania z Platformy zgodnie z prawem.</p>
        <p>4. Operator nie ponosi odpowiedzialności za działania Użytkowników sprzeczne z prawem.</p>
      </Section>

      <Section title="§7. Odpowiedzialność i wyłączenia">
        <p>1. Operator nie ponosi odpowiedzialności za: brak zawarcia umowy, niewypłacalność którejkolwiek ze stron, wady prawne nieruchomości, szkody pośrednie i utracone korzyści.</p>
        <p>2. Odpowiedzialność Operatora ograniczona jest do kwoty faktycznie uiszczonych opłat przez Użytkownika w okresie 12 miesięcy poprzedzających zdarzenie.</p>
        <p>3. Operator nie ponosi odpowiedzialności za: przerwy techniczne, siłę wyższą, działania podmiotów trzecich.</p>
        <p>4. Żadne postanowienie Regulaminu nie ogranicza odpowiedzialności za szkody wyrządzone umyślnie.</p>
      </Section>

      <Section title="§8. Brak gwarancji">
        <p>1. Platforma udostępniana jest w formule „as is”.</p>
        <p>2. Operator nie gwarantuje: osiągnięcia określonej ceny sprzedaży, zainteresowania licytacją, skuteczności transakcji.</p>
      </Section>

      <Section title="§9. Opłaty i model biznesowy">
        <p>1. Operator może pobierać: opłaty publikacyjne, opłaty promocyjne, prowizje transakcyjne.</p>
        <p>2. Szczegółowy model przychodowy określony jest w Cenniku.</p>
        <p>3. Operator zastrzega możliwość wprowadzenia w przyszłości: wadium, opłat rezerwacyjnych, depozytów zabezpieczających.</p>
      </Section>

      <Section title="§10. Własność intelektualna">
        <p>1. Wszelkie prawa do Platformy należą do Operatora.</p>
        <p>2. Zabronione jest kopiowanie, dekompilacja, scraping danych bez zgody Operatora.</p>
      </Section>

      <Section title="§11. Dane osobowe">
        <p>1. Dane przetwarzane są zgodnie z RODO.</p>
        <p>2. Szczegóły określa{" "}
          <Link to="/polityka-prywatnosci" className="underline">Polityka Prywatności</Link>.
        </p>
      </Section>

      <Section title="§12. Postanowienia końcowe">
        <p>1. Regulamin podlega prawu polskiemu.</p>
        <p>2. Wszelkie spory rozstrzygane będą przez sąd właściwy dla siedziby Operatora.</p>
        <p>3. Operator może zmienić Regulamin z ważnych przyczyn prawnych, technologicznych lub biznesowych.</p>
        <p>4. Zmiany obowiązują od dnia publikacji.</p>
      </Section>

      <Link to="/" className="mt-10 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Wróć na stronę główną
      </Link>
    </article>
  );
}
