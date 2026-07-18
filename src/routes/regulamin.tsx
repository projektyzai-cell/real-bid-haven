import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/regulamin")({
  head: () => ({
    meta: [
      { title: "Regulamin — Stay Safe" },
      { name: "description", content: "Regulamin Portalu StaySafe — zasady korzystania, Auto-matching, Concierge, oceny i Paszport Najemcy." },
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

type Lang = "pl" | "en" | "uk";

const CONTENT: Record<Lang, {
  title: string; version: string; backHome: string;
  sections: { title: string; body: React.ReactNode }[];
}> = {
  pl: {
    title: "Regulamin Portalu StaySafe",
    version: "Data ostatniej aktualizacji: 16 lipca 2026 r.",
    backHome: "← Wróć na stronę główną",
    sections: [
      { title: "§1. Postanowienia ogólne", body: (<ol className="list-decimal space-y-1 pl-6">
        <li>Właścicielem i administratorem Portalu StaySafe jest spółka <strong>Stay Safe sp. z o.o.</strong> z siedzibą w Warszawie (00-844), przy ul. Łuckiej 15, wpisana do rejestru przedsiębiorców Krajowego Rejestru Sądowego prowadzonego przez Sąd Rejonowy dla m.st. Warszawy w Warszawie, XII Wydział Gospodarczy Krajowego Rejestru Sądowego pod numerem KRS: <strong>0000607397</strong>, posiadająca numer NIP: <strong>5252651283</strong> (dalej: „Administrator").</li>
        <li>Niniejszy Regulamin określa zasady korzystania z Portalu, w tym korzystania z systemu dopasowań (Auto-matching), usług Concierge, systemu wzajemnych ocen oraz Paszportu Najemcy.</li>
        <li>Portal stanowi platformę technologiczną ułatwiającą kojarzenie stron umów najmu (Najemców i Wynajmujących) oraz udostępniającą usługi wspierające proces najmu świadczone przez Partnerów Zewnętrznych.</li>
        <li>Administrator nie jest stroną umów najmu zawieranych między Użytkownikami.</li>
      </ol>) },
      { title: "§2. Usługi Concierge", body: (<ol className="list-decimal space-y-1 pl-6">
        <li>Portal umożliwia Użytkownikom zgłoszenie zainteresowania usługami dodatkowymi (np. notariusz, przeprowadzki, ubezpieczenia, ŚChE) poprzez funkcję „Concierge".</li>
        <li>StaySafe nie jest wykonawcą usług Concierge. Administrator działa wyłącznie jako pośrednik przekazujący dane kontaktowe Użytkownika do certyfikowanego Partnera Zewnętrznego.</li>
        <li>Odpowiedzialność za jakość, terminowość i zgodność z prawem świadczonych usług Concierge ponosi wyłącznie Partner Zewnętrzny.</li>
      </ol>) },
      { title: "§3. System Auto-Matching i kontakt", body: (<ol className="list-decimal space-y-1 pl-6">
        <li>Portal wykorzystuje algorytmy do rekomendowania ofert (Auto-matching) na podstawie danych z Profilu Użytkownika. Wyniki dopasowania mają charakter sugestii i nie stanowią gwarancji znalezienia najemcy lub lokalu.</li>
        <li>Portal umożliwia bezpośredni kontakt między Stronami (Najemcą i Wynajmującym).</li>
        <li>Po przekazaniu danych kontaktowych, każda ze Stron staje się niezależnym Administratorem danych osobowych drugiej strony i ponosi odpowiedzialność za ich przetwarzanie zgodnie z RODO.</li>
      </ol>) },
      { title: "§4. System ocen, Paszport Najemcy i moderacja", body: (<ol className="list-decimal space-y-1 pl-6">
        <li>Portal udostępnia dwustronny system ocen (Najemca ocenia Wynajmującego/Nieruchomość, Wynajmujący ocenia Najemcę).</li>
        <li><strong>Mechanizm Double-Blind:</strong> w celu zapewnienia obiektywizmu, oceny są ukryte do momentu wystawienia oceny przez obie strony lub upływu 14 dni od daty zakończenia umowy najmu.</li>
        <li><strong>Paszport Najemcy:</strong> jest to zestawienie reputacji użytkownika, oparte na średniej z ocen wystawionych przez Wynajmujących.</li>
        <li><strong>Moderacja:</strong> Administrator zastrzega sobie prawo do moderacji treści ocen. Użytkownik może złożyć wniosek o usunięcie oceny, jeśli ta jest nieprawdziwa, narusza dobra osobiste lub jest wynikiem działań o charakterze odwetowym. Administrator podejmuje decyzję o usunięciu oceny na podstawie analizy dowodów (np. potwierdzenia płatności, protokołów zdawczo-odbiorczych).</li>
      </ol>) },
      { title: "§5. Odpowiedzialność Administratora (wyłączenia)", body: (<ol className="list-decimal space-y-1 pl-6">
        <li>Administrator dokłada wszelkich starań, aby dane prezentowane w Portalu były rzetelne, jednak nie gwarantuje poprawności danych wprowadzanych przez Użytkowników.</li>
        <li><strong>Wyłączenie odpowiedzialności za zachowania Najemców:</strong> Administrator nie pełni roli zarządcy nieruchomości ani agencji nieruchomości i nie ponosi odpowiedzialności za działania lub zaniechania Najemców. W szczególności Administrator nie odpowiada za:
          <ul className="mt-1 list-disc space-y-1 pl-6">
            <li>brak regulowania opłat czynszowych oraz opłat za media;</li>
            <li>uszkodzenia mienia, dewastację lokalu oraz wyposażenia;</li>
            <li>nieprzestrzeganie regulaminu porządku domowego oraz zakłócanie spokoju sąsiedzkiego;</li>
            <li>niewykonanie innych obowiązków wynikających z umowy najmu.</li>
          </ul>
        </li>
        <li><strong>Charakter narzędzi weryfikacyjnych:</strong> mechanizmy takie jak Paszport Najemcy czy system ocen stanowią jedynie wsparcie dla Wynajmującego w procesie podejmowania decyzji o wyborze lokatora. Dane zawarte w Paszporcie Najemcy opierają się na subiektywnych ocenach innych użytkowników, dlatego nie mogą być traktowane jako gwarancja wypłacalności czy rzetelności Najemcy w przyszłości. Ostateczna decyzja o zawarciu umowy najmu należy wyłącznie do Wynajmującego i to on ponosi pełne ryzyko biznesowe związane z tym wyborem.</li>
        <li>Administrator nie ponosi odpowiedzialności za jakiekolwiek szkody poniesione przez Wynajmującego w wyniku działań Najemcy, w tym za utracone korzyści.</li>
      </ol>) },
      { title: "§6. Obowiązki Użytkowników", body: (<ol className="list-decimal space-y-1 pl-6">
        <li>Użytkownik zobowiązany jest do podawania prawdziwych danych w Profilu Użytkownika oraz w ofertach najmu.</li>
        <li>Zabrania się wykorzystywania Portalu w celach niezgodnych z prawem, w tym do wyłudzeń kaucji, nękania innych użytkowników czy zamieszczania ofert typu „fake".</li>
        <li>Naruszenie zasad może skutkować czasowym zawieszeniem lub usunięciem Konta Użytkownika bez prawa do odszkodowania.</li>
      </ol>) },
      { title: "§7. Reklamacje", body: (<ol className="list-decimal space-y-1 pl-6">
        <li>Reklamacje dotyczące działania Portalu należy zgłaszać na adres e-mail: <a href="mailto:kontakt@staysafe.pl" className="underline">kontakt@staysafe.pl</a>.</li>
        <li>Administrator rozpatruje reklamacje w terminie 14 dni roboczych.</li>
        <li>Reklamacje dotyczące sporów między Najemcą a Wynajmującym (np. o zwrot kaucji) nie są rozstrzygane przez Administratora – są to spory cywilnoprawne rozstrzygane bezpośrednio przez strony lub sądy powszechne.</li>
      </ol>) },
      { title: "§8. Postanowienia końcowe", body: (<ol className="list-decimal space-y-1 pl-6">
        <li>Administrator zastrzega sobie prawo do zmiany Regulaminu. O zmianach Użytkownicy zostaną powiadomieni z wyprzedzeniem 14 dni.</li>
        <li>W sprawach nieuregulowanych zastosowanie mają przepisy Kodeksu Cywilnego oraz RODO.</li>
        <li>Wszelkie spory będą rozstrzygane przez sąd właściwy dla siedziby Administratora.</li>
      </ol>) },
    ],
  },
  en: {
    title: "StaySafe Portal Terms of Service",
    version: "Last updated: 16 July 2026.",
    backHome: "← Back to home",
    sections: [
      { title: "§1. General provisions", body: (<ol className="list-decimal space-y-1 pl-6">
        <li>The Portal is owned and administered by <strong>Stay Safe sp. z o.o.</strong>, Warsaw (00-844), ul. Łucka 15, KRS: <strong>0000607397</strong>, VAT ID: <strong>5252651283</strong> ("Administrator").</li>
        <li>These Terms govern use of the Portal — Auto-matching, Concierge, two-sided reviews and the Tenant Passport.</li>
        <li>The Portal is a technology platform matching Tenants and Landlords and providing add-on services from External Partners.</li>
        <li>The Administrator is not a party to leases between Users.</li>
      </ol>) },
      { title: "§2. Concierge services", body: (<p>Users can request add-on services (notary, moving, insurance, EPC etc.) via "Concierge". StaySafe only forwards contact data to a vetted External Partner; the Partner is solely responsible for the service.</p>) },
      { title: "§3. Auto-Matching and contact", body: (<p>Auto-matching produces non-binding suggestions. Once both sides accept, contact data is shared; each side becomes an independent controller under GDPR.</p>) },
      { title: "§4. Reviews, Tenant Passport and moderation", body: (<p>Double-blind reviews unlock when both sides submit or after 14 days. The Tenant Passport aggregates landlord reviews. The Administrator can moderate reviews on evidence.</p>) },
      { title: "§5. Administrator liability (exclusions)", body: (<p>The Administrator is not a property manager or agent and is not liable for Tenants' acts or omissions (unpaid rent/utilities, damage, house-rule breaches). Verification tools are advisory only; the final decision rests with the Landlord.</p>) },
      { title: "§6. User obligations", body: (<p>Users must provide truthful data and may not misuse the Portal. Violations may result in suspension or account removal without compensation.</p>) },
      { title: "§7. Complaints", body: (<p>Complaints: <a href="mailto:kontakt@staysafe.pl" className="underline">kontakt@staysafe.pl</a>, 14 business days. Landlord–Tenant disputes are civil matters between the parties.</p>) },
      { title: "§8. Final provisions", body: (<p>Terms may change with 14 days' notice. Polish Civil Code and GDPR apply to unregulated matters. Disputes are resolved by the court competent for the Administrator's seat.</p>) },
    ],
  },
  uk: {
    title: "Правила Порталу StaySafe",
    version: "Дата останнього оновлення: 16 липня 2026 р.",
    backHome: "← Повернутися на головну",
    sections: [
      { title: "§1. Загальні положення", body: (<ol className="list-decimal space-y-1 pl-6">
        <li>Власником та адміністратором Порталу є <strong>Stay Safe sp. z o.o.</strong>, м. Варшава (00-844), ul. Łucka 15, KRS: <strong>0000607397</strong>, NIP: <strong>5252651283</strong> («Адміністратор»).</li>
        <li>Правила визначають користування Порталом — Auto-matching, Concierge, оцінки, Паспорт Орендаря.</li>
        <li>Портал — технологічна платформа підбору Орендарів та Орендодавців із послугами Партнерів.</li>
        <li>Адміністратор не є стороною договорів оренди.</li>
      </ol>) },
      { title: "§2. Послуги Concierge", body: (<p>Через «Concierge» користувач може замовити додаткові послуги. StaySafe передає контакт перевіреному Партнеру, який несе повну відповідальність за виконання.</p>) },
      { title: "§3. Auto-Matching і контакт", body: (<p>Auto-matching дає лише рекомендації. Після взаємної згоди сторони обмінюються контактами й стають незалежними контролерами за GDPR.</p>) },
      { title: "§4. Оцінки, Паспорт Орендаря та модерація", body: (<p>Double-blind: оцінки відкриваються після подання обох сторін або через 14 днів. Паспорт Орендаря — агрегація відгуків. Адміністратор модерує на підставі доказів.</p>) },
      { title: "§5. Відповідальність Адміністратора (виключення)", body: (<p>Адміністратор не є керуючим нерухомістю та не відповідає за дії Орендарів (несплата, пошкодження тощо). Інструменти верифікації мають рекомендаційний характер.</p>) },
      { title: "§6. Обов'язки Користувачів", body: (<p>Правдиві дані, заборона зловживань. Порушення — призупинення або видалення акаунта без компенсації.</p>) },
      { title: "§7. Скарги", body: (<p>Скарги: <a href="mailto:kontakt@staysafe.pl" className="underline">kontakt@staysafe.pl</a>, 14 робочих днів. Спори Орендар–Орендодавець вирішують сторони або суд.</p>) },
      { title: "§8. Прикінцеві положення", body: (<p>Зміни Правил — за 14 днів. Застосовуються Цивільний кодекс Польщі та GDPR. Спори — за місцем реєстрації Адміністратора.</p>) },
    ],
  },
};

function RegulaminPage() {
  const { i18n } = useTranslation();
  const lang = ((["pl","en","uk"] as const).includes(i18n.language as Lang) ? i18n.language : "pl") as Lang;
  const c = CONTENT[lang];
  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{c.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{c.version}</p>
      {c.sections.map((s, i) => <Section key={i} title={s.title}>{s.body}</Section>)}
      <Link to="/" className="mt-10 inline-block text-sm text-muted-foreground hover:text-foreground">{c.backHome}</Link>
    </article>
  );
}
