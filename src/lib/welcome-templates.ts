// Welcome message templates — Admin → new user, after first login.
// 4 languages × 3 account roles (najemca / wynajmujacy / oba).

export type Lang = "pl" | "en" | "uk" | "es";
export type AccountType = "najemca" | "wynajmujacy" | "oba";

type Tpl = { subject: string; body: string };

const T: Record<AccountType, Record<Lang, Tpl>> = {
  wynajmujacy: {
    pl: {
      subject: "Cześć! Witamy w StaySafe – czas na bezpieczny wynajem 🚀",
      body: `Cześć! Wielkie dzięki, że wybierasz StaySafe do znalezienia idealnego lokatora i zarządzania swoim najmem. Dobrze Cię tu mieć!

Dzięki naszemu algorytmowi Smart Match będziesz otrzymywać oferty dopasowane nawet w 100% – wszystko zależy od Twoich indywidualnych preferencji. Poświęć chwilę na rzetelne wypełnienie kryteriów swojej nieruchomości. Zaznacz to, co jest dla Ciebie naprawdę kluczowe, ale unikaj zbyt rygorystycznych blokad – zbyt wyśrubowane wymagania mogą niepotrzebnie odciąć Cię od świetnych, ugodowych ludzi. Co najlepsze: to my bierzemy na klatę ciężar trudnych pytań, weryfikacji i wysyłania kulturalnych odmów niepasującym profilom!

Dwie złote zasady maksymalnego bezpieczeństwa w StaySafe:

1. Zawsze żądaj Paszportu: Każdy najemca na naszej platformie może wyrobić cyfrowy Paszport Najemcy. Zanim zaakceptujesz jakąkolwiek ofertę, stanowczo poproś lokatora o jego udostępnienie. To najprostsza i najskuteczniejsza selekcja rzetelnych ludzi.

2. Zatwierdź umowę w aplikacji: Skorzystaj z naszego intuicyjnego kreatora umów, a po podpisaniu dokumentów – koniecznie zatwierdź ten fakt w swoim panelu. Odblokujesz w ten sposób funkcję zgłaszania nieterminowości. Lokator, który spóźnia się z opłatami, natychmiast traci punkty w swoim Paszporcie, dzięki czemu wspólnie eliminujemy nieuczciwe osoby z rynku.

Wiemy, że wynajem niesie za sobą wiele ryzyk, ale ze StaySafe bezstresowo wyeliminujesz większość z nich. A gdyby kiedykolwiek pojawił się problem z lokatorem? Nie zostaniesz z tym sam. Pomożemy Ci z podstawową dokumentacją kryzysową, a docelowo skierujemy sprawę do naszej sprawdzonej, partnerskiej kancelarii prawnej, która weźmie wszystko na siebie.

Cały czas się rozwijamy i mamy mnóstwo nowych pomysłów, aby dawać Wynajmującym coraz większe wsparcie na każdym etapie. Jeśli masz jakiekolwiek uwagi lub sugestie dotyczące działania portalu, będziemy ogromnie wdzięczni, jeśli się nimi z nami podzielisz!

Powodzenia i udanych transakcji! Zespół StaySafe 🛡️`,
    },
    en: {
      subject: "Hi! Welcome to StaySafe – time for secure renting 🚀",
      body: `Hi! Thanks a million for choosing StaySafe to find your perfect tenant and manage your rental property. It's great to have you on board!

Thanks to our Smart Match algorithm, you can receive offers that are up to 100% tailored to your profile – it all depends on your individual preferences. Take a moment to accurately fill out your property criteria. Highlight what is truly essential to you, but avoid overly restrictive conditions – setting the bar too high might unnecessarily cut you off from great, reliable people. Best of all: we take the burden of awkward questions, vetting, and sending polite rejections to unmatched profiles off your shoulders!

Two golden rules for maximum security with StaySafe:

1. Always request the Passport: Every tenant on our platform can obtain a digital Tenant Passport. Before accepting any offer, firmly ask the tenant to share it with you. It is the simplest and most effective way to vet reliable people.

2. Confirm the agreement in the app: Use our intuitive contract generator, and once the documents are signed – make sure to confirm it in your dashboard. This unlocks the feature to report late payments. A tenant who falls behind on rent instantly loses points in their Passport, helping us collectively eliminate bad tenants from the market.

We know that renting carries many risks, but with StaySafe, you can stress-lessly eliminate most of them. And if you ever face an issue with a tenant? You won't be left alone. We will assist you with basic crisis documentation and, if necessary, connect you with our proven, partner law firm to handle everything for you.

We are constantly growing and have plenty of new ideas to provide Landlords with even greater support at every stage. If you have any feedback or suggestions on how we can improve, we would be incredibly grateful if you shared them with us!

Best of luck and happy renting! The StaySafe Team 🛡️`,
    },
    uk: {
      subject: "Привіт! Вітаємо у StaySafe – час для безпечної оренди 🚀",
      body: `Привіт! Щиро дякуємо, що обрали StaySafe для пошуку ідеального орендаря та управління вашою нерухомістю. Раді бачити вас із нами!

Завдяки нашому алгоритму Smart Match ви можете отримувати пропозиції, що відповідають вашим вимогам навіть на всі 100% – усе залежить від ваших індивідуальних уподобань. Приділіть кілька хвилин ретельному заповненню критеріїв вашого об'єкта. Позначте те, що для вас дійсно важливо, але уникайте занадто жорстких обмежень — надмірні вимоги можуть безпідставно відсіяти чудових і порядних людей. І найкраще: ми беремо на себе весь тягар складних запитань, перевірок та надсилання ввічливих відмов невідповідним профілям!

Два золотих правила для максимальної безпеки зі StaySafe:

1. Завжди вимагайте Паспорт: Кожен орендар на нашій платформі може оформити цифровий Паспорт Орендаря. Перш ніж прийняти будь-яку пропозицію, наполегливо попросіть орендаря надати його. Це найпростіший та найефективніший спосіб відбору надійних людей.

2. Підтвердьте договір у додатку: Скористайтеся нашим інтуїтивно зрозумілим конструктором договорів, а після підписання документів — обов'язково підтвердьте цей факт у своєму кабінеті. Таким чином ви розблокуєте функцію повідомлення про затримку платежів. Орендар, який запізнюється з оплатою, миттєво втрачає бали у своєму Паспорті, завдяки чому ми разом усуваємо недобросовісних осіб з ринку нерухомості.

Ми знаємо, що оренда пов'язана з багатьма ризиками, але зі StaySafe ви без зайвого стресу ліквідуєте більшість із них. А якщо колись виникне проблема з орендарем? Ви не залишитеся наодинці. Ми допоможемо з базовою кризовою документацією, а в разі потреби — спрямуємо справу до нашої перевіреної юридичної компанії-партнера, яка візьме все на себе.

Ми постійно розвиваємося та маємо безліч нових ідей, щоб надавати Орендодавцям дедалі більшу підтримку на кожному етапі. Якщо у вас є будь-які зауваження чи пропозиції щодо роботи порталу, ми будемо щиро вдячні, якщо ви поділитеся ними з нами!

Успіхів та вдалих угод! Команда StaySafe 🛡️`,
    },
    es: {
      subject: "¡Hola! Te damos la bienvenida a StaySafe – es hora de un alquiler seguro 🚀",
      body: `¡Hola! Muchísimas gracias por elegir StaySafe para encontrar a tu inquilino ideal y gestionar tu propiedad. ¡Es un placer tenerte a bordo!

Gracias a nuestro algoritmo Smart Match, podrás recibir ofertas con una coincidencia de hasta el 100%, todo dependerá de tus preferencias individuales. Tómate unos minutos para rellenar los criterios de tu propiedad con honestidad. Marca lo que sea realmente crucial para ti, pero evita poner condiciones demasiado estrictas; poner el listón demasiado alto podría dejarte fuera a personas fantásticas y muy fiables. Y lo mejor de todo: ¡nosotros nos encargamos de las preguntas incómodas, las verificaciones y de rechazar amablemente a los perfiles que no encajen!

Dos reglas de oro para la máxima seguridad con StaySafe:

1. Exige siempre el Pasaporte: Cualquier inquilino en nuestra plataforma puede solicitar su Pasaporte de Inquilino digital. Antes de aceptar ninguna oferta, pídile firmemente al inquilino que lo comparta contigo. Es la forma más sencilla y eficaz de filtrar a gente de confianza.

2. Confirma el contrato en la app: Utiliza nuestro intuitivo creador de contratos y, una vez firmados los documentos, asegúrate de confirmarlo en tu panel de control. Así desbloquearás la función de reportar retrasos en los pagos. El inquilino que se retrase con el alquiler perderá puntos al instante en su Pasaporte, ayudándonos a eliminar juntos a los malos inquilinos del mercado.

Sabemos que alquilar conlleva muchos riesgos, pero con StaySafe eliminarás la gran mayoría de ellos sin estrés. ¿Y si alguna vez surge un problema con el inquilino? No te costarás solo. Te ayudaremos con la documentación básica de gestión de crisis y, si fuera necesario, derivaremos el caso a nuestro bufete de abogados asociado de total confianza para que se encargue de todo.

Estamos en constante desarrollo y tenemos muchísimas ideas nuevas para ofrecer a los Propietarios un soporte cada vez mayor en cada etapa. Si tienes cualquier comentario o sugerencia sobre el funcionamiento del portal, ¡te estaríamos enormemente agradecidos si lo compartieras con nosotros!

¡Mucho éxito con tus alquileres! El equipo de StaySafe 🛡️`,
    },
  },
  najemca: {
    pl: {
      subject: "Cześć! Witamy w StaySafe – czas na najem na Twoich warunkach 🚀",
      body: `Cześć! Wielkie dzięki, że dołączasz do społeczności StaySafe. Z nami na dobre zapomnisz o marnowaniu czasu na telefony do właścicieli, którzy sami nie wiedzą, kogo szukają. Tutaj znajdziesz tylko takie nieruchomości, które naprawdę pasują do Twojego stylu życia!

Wystarczy, że złożysz zapytanie o wyszukanie nieruchomości w swoim panelu Najemcy. Określisz w nim swój budżet oraz dodatkowe preferencje. Nasz system odfiltruje resztę i dostarczy Ci wyłącznie oferty skrojone pod Twoje wymagania i możliwości, które będą w 100% zaakceptowane również przez drugą stronę – Wynajmującego. Dzięki temu eliminujemy nietrafione rozmowy już na starcie.

Trzy kroki do bezpiecznego i wygodnego najmu ze StaySafe:

1. Zyskaj przewagę z Paszportem: Właściciele znacznie chętniej rozmawiają i chcą wynajmować mieszkania osobom, które posiadają Paszport Najemcy StaySafe. Zanim uruchomisz wyszukiwanie, wygeneruj swój paszport w panelu – dzięki temu zyskasz dostęp do szerszej i znacznie lepszej oferty nieruchomości.

2. Chroń swoją kaucję: Po zawarciu umowy z Wynajmującym za pośrednictwem portalu StaySafe koniecznie zaakceptuj ten fakt w swoim panelu. Uruchomisz wtedy darmowy, cyfrowy Protokół Zdawczo-Odbiorczy z fotorelacją. Zrób zdjęcia każdego zakamarka. Będzie to Twój nienaruszalny dowód przy zakończeniu umowy, że nie ma podstaw do potencjalnych potrąceń kaucji przez Wynajmującego – co jest niestety dość popularną praktyką stosowaną w Polsce.

3. Wszystko pod ręką (Pakiet Concierge): StaySafe to nie tylko aplikacja, to Twój osobisty asystent. Potrzebujesz ekipy do przeprowadzki, profesjonalnego sprzątania, Złotej Rączki przy nagłej awarii, czy umówienia Notariusza? W ramach naszego Abonamentu Concierge całkowicie bezpłatnie wyszukamy, zweryfikujemy i zorganizujemy dla Ciebie najlepszych, sprawdzonych specjalistów w okolicy, a sam koszt wykonania ich usługi pokryjesz bezpośrednio u fachowca. Oszczędzasz czas i nerwy!

Cały czas się rozwijamy i mamy mnóstwo nowych pomysłów, aby dawać najemcom jak największą pomoc i komfort. Jeśli masz jakiekolwiek uwagi, opinie lub sugestie – będziemy ogromnie wdzięczni, jeśli się nimi z nami podzielisz!

A jeśli podoba Ci się nasza platforma i ułatwiła Ci ona życie, podaj ją dalej i poleć StaySafe swoim znajomym, którzy również szukają lub wynajmują mieszkanie! 🙌

Powodzenia i udanych transakcji! Zespół StaySafe 🛡️`,
    },
    en: {
      subject: "Hi! Welcome to StaySafe – renting on your own terms starts now 🚀",
      body: `Hi! Thanks a million for joining the StaySafe community. With us, you can finally say goodbye to wasting time on phone calls with landlords who don't even know what they are looking for. Here, you will only find properties that truly match your lifestyle!

All you need to do is submit a property search request in your Tenant dashboard, specifying your budget and key preferences. Our system will filter out the noise and deliver only the offers tailored directly to your requirements and financial capabilities—which are also 100% accepted by the other side, the Landlord. This eliminates unmatched conversations right from the start.

Three steps to secure and comfortable renting with StaySafe:

1. Get ahead with the Passport: Landlords are much more eager to chat and want to rent to people who hold a StaySafe Tenant Passport. Before you start your search, generate your passport in the dashboard – it will grant you access to a wider and significantly better selection of properties.

2. Protect your deposit: Once you conclude the agreement with the Landlord through the StaySafe portal, make sure to accept it in your dashboard. This unlocks our free, digital Move-in Protocol with photo verification. Take photos of everything. This will be your unalterable proof when the contract ends, ensuring there are no grounds for potential deposit deductions by the Landlord—which, unfortunately, remains a common practice in Poland.

3. Everything at your fingertips (Concierge Package): StaySafe is more than just an app; it's your personal assistant. Need a moving crew, professional cleaning, a handyman for an emergency, or even a Notary appointment? As part of our Concierge Subscription, we will find, vet, and organize the best, proven professionals in your area for you completely free of charge, while you cover the actual cost of their work directly with the provider. You save time and avoid stress!

We are constantly growing and have plenty of new ideas to provide tenants with the greatest possible support and comfort. If you have any feedback, reviews, or suggestions – we would be incredibly grateful if you shared them with us!

Also, if you like our platform and it made your life easier, spread the word and recommend StaySafe to your friends who are also looking for or renting out an apartment! 🙌

Best of luck finding your new home! The StaySafe Team 🛡️`,
    },
    uk: {
      subject: "Привіт! Вітаємо у StaySafe – час для оренди на ваших умовах 🚀",
      body: `Привіт! Щиро дякуємо, що приєдналися до спільноти StaySafe. З нами ви назавжди забудете про марнування часу на дзвінки власникам, які самі не знають, кого шукають. Тут ви знайдете лише ту нерухомість, яка дійсно відповідає вашому стилю життя!

Досить просто створити запит на пошук нерухомості у вашому кабінеті Орендаря, вказавши свій бюджет та додаткові вимоги. Наша система відфільтрує все зайве та запропонує вам лише ті варіанти, які відповідають вашим потребам і можливостям, і які будуть на 100% схвалені іншою стороною – Орендодавцем. Це дозволяє уникнути невдалих розмов ще на самому старті.

Три кроки до безпечної та комфортної оренди зі StaySafe:

1. Отримайте перевагу з Паспортом: Власники значно охочіше спілкуються та хочуть здавати житло тим людям, хто має Паспорт Орендаря StaySafe. Перш ніж запускати пошук, згенеруйте свій паспорт у панелі — це допоможе знайти ширшу та значно якіснішу базу нерухомості.

2. Захистіть свій заставний депозит (кауцію): Після укладення договору з Орендодавцем через портал StaySafe обов'язково підтвердіть цей факт у своєму кабінеті. Тоді ви зможете згенерувати безкоштовний цифровий Акт прийому-передачі з фотофіксацією. Сфотографуйте кожен куточок. Це буде вашим незаперечним доказом під час завершення договору про те, що у власника немає підстав для утримань із вашої застави — що, на жаль, є досить поширеною практикою в Польщі.

3. Усе під рукою (Пакет Concierge): StaySafe — це не просто додаток, це ваш особистий асистент. Потрібна бригада для переїзду, професійне прибирання, «Майстер на годину» для усунення раптової поломки чи організація візиту до Нотаріуса? У межах нашого Абонемента Concierge ми абсолютно безкоштовно знайдемо, перевіримо та організуємо для вас найкращих та надійних спеціалістів у вашому районі, а саму вартість їхніх послуг ви оплатите безпосередньо виконавцю. Ви заощаджуєте свій час та нерви!

Ми постійно розвиваємося та маємо безліч нових ідей, щоб забезпечити орендарям максимальну допомогу та комфорт. Якщо у вас є будь-які зауваження, відгуки чи пропозиції — ми будемо щиро вдячні, якщо ви поділитеся ними з нами!

І якщо вам подобається наша платформа і вона полегшила вам життя, розкажіть про нас іншим та порадьте StaySafe своїм друзям, які також шукають або здають в оренду житло! 🙌

Успіхів та вдалих угод! Команда StaySafe 🛡️`,
    },
    es: {
      subject: "¡Hola! Te damos la bienvenida a StaySafe – es hora de alquilar a tu manera 🚀",
      body: `¡Hola! Muchísimas gracias por unirte a la comunidad de StaySafe. Con nosotros, te olvidarás para siempre de perder el tiempo llamando a propietarios que ni ellos mismos saben qué buscan. ¡Aquí solo encontrarás viviendas que realmente se adapten a tu estilo de vida!

Solo tienes que registrar una solicitud de búsqueda de inmueble en tu panel de Inquilino, indicando tu presupuesto y preferencias adicionales. Nuestro sistema filtrará el resto y te mostrará únicamente ofertas hechas a la medida de tus necesidades y capacidades, las cuales también serán aceptadas al 100% por la otra parte: el Propietario. De este modo, eliminamos las conversaciones sin futuro desde el primer momento.

Tres pasos para un alquiler seguro y cómodo con StaySafe:

1. Gana ventaja con el Pasaporte: Los propietarios están mucho más dispuestos a hablar y quieren alquilar sus viviendas a personas que tienen el Pasaporte de Inquilino de StaySafe. Antes de iniciar la búsqueda, genera tu pasaporte en el panel; esto te ayudará a acceder a una oferta de viviendas más amplia y de mejor calidad.

2. Protege tu fianza: Una vez que formalices el contrato con el Propietario a través del portal de StaySafe, asegúrate de aceptar este hecho en tu panel de control. Así activarás el Protocolo de Entrega digital gratuito con reportaje fotográfico. Haz fotos de cada rincón. Esta será tu prueba irrefutable al finalizar el contrato de que no existen motivos para posibles deducciones de la fianza por parte del Propietario, algo que, por desgracia, es una práctica bastante común en Polonia.

3. Todo a mano (Paquete Concierge): StaySafe no es solo una app, es tu asistente personal. ¿Necesitas una empresa de mudanzas, una limpieza profesional, un manitas para una avería repentina o coordinar una cita con el Notario? Con nuestro Abono Concierge, nosotros nos encargamos de buscar, verificar y organizar de manera totalmente gratuita a los mejores profesionales de confianza en tu zona; tú solo cubrirás el coste del servicio directamente con el especialista que realice el trabajo. ¡Ahorras tiempo y evitas dolores de cabeza!

Estamos en constante desarrollo y tenemos muchísimas ideas nuevas para ofrecer a los inquilinos el mayor apoyo y comodidad posibles. Si tienes cualquier comentario, opinión o sugerencia, ¡te estaríamos enormemente agradecidos si lo compartieras con nosotros!

Además, si te gusta nuestra plataforma y te ha hecho la vida más fácil, ¡corre la voz y recomienda StaySafe a tus amigos que también estén buscando o alquilando un piso! 🙌

¡Mucho éxito en la búsqueda de tu nuevo hogar! El equipo de StaySafe 🛡️`,
    },
  },
  oba: {
    pl: {
      subject: "Cześć! Witamy w StaySafe – czas na bezpieczny wynajem i najem 🚀",
      body: `Cześć! Wielkie dzięki, że wybierasz StaySafe do zarządzania swoimi nieruchomościami oraz wyszukiwania nowego miejsca dla siebie. Świetnie, że wykorzystujesz pełen potencjał naszej platformy!

Niezależnie od tego, czy akurat działasz jako Wynajmujący, czy jako Najemca, nasz algorytm Smart Match dostarczy Ci oferty dopasowane nawet w 100% – wszystko zależy od Twoich indywidualnych kryteriów, budżetu i możliwości. Pamiętaj, by rzetelnie uzupełnić profile, ale unikaj zbyt rygorystycznych warunków, aby nie odciąć się od świetnych ofert i ugodowych ludzi. Co najlepsze: w obu rolach to my bierzemy na klatę ciężar trudnych pytań, weryfikacji i wysyłania kulturalnych odmów!

Twoje zasady maksymalnego bezpieczeństwa i wygody w StaySafe:

1. Siła Paszportu Najemcy: Jako Wynajmujący zawsze żądaj cyfrowego Paszportu Najemcy przed akceptacją oferty – to najlepsza selekcja rzetelnych ludzi. Jako Najemca – wygeneruj swój Paszport od razu w panelu, aby zyskać zaufanie właścicieli i dostęp do szerszej oferty nieruchomości.

2. Kreator Umów i Ochrona Kaucji: Wygeneruj umowę przez nasz kreator i zatwierdź jej zawarcie w portalu. Jako Wynajmujący zyskujesz opcję zgłaszania nieterminowości (co eliminuje złych lokatorów z rynku). Jako Najemca zyskujesz darmowy, cyfrowy Protokół Zdawczo-Odbiorczy z fotorelacją, który będzie Twoim nienaruszalnym dowodem i zabezpieczy Cię przed bezpodstawnym potrącaniem kaucji przy wyprowadzce.

3. Pełne wsparcie z każdej strony: Wynajem niesie ryzyka, ale z nami je wyeliminujesz. Jeśli jako właściciel będziesz mieć problem z lokatorem, pomożemy z dokumentacją i skierujemy sprawę do naszej sprawdzonej, partnerskiej kancelarii prawnej. Z kolei jako lokator, w ramach Abonamentu Concierge, możesz zlecić nam bezpłatne wyszukanie i organizację sprawdzonych fachowców (przeprowadzki, sprzątanie, Złota Rączka, Notariusz) – sam koszt ich pracy pokrywasz bezpośrednio u specjalisty.

Cały czas się rozwijamy i mamy mnóstwo nowych pomysłów, aby dawać użytkownikom jak największą pomoc z obu stron rynku nieruchomości. Jeśli masz jakiekolwiek uwagi lub sugestie – będziemy ogromnie wdzięczni za podzielenie się nimi z nami!

A jeśli nasza platforma ułatwia Ci życie, podaj ją dalej i poleć StaySafe swoim znajomym! 🙌

Powodzenia w realizacji wszystkich planów! Zespół StaySafe 🛡️`,
    },
    en: {
      subject: "Hi! Welcome to StaySafe – time for secure renting and leasing 🚀",
      body: `Hi! Thanks a million for choosing StaySafe to manage your rental properties and search for your own new space. It's fantastic that you are leveraging the full potential of our platform!

Whether you are acting as a Landlord or a Tenant, our Smart Match algorithm will deliver offers with a match of up to 100%—it all depends on your individual criteria, budget, and capabilities. Remember to fill out your profiles accurately, but avoid overly restrictive conditions so you don't cut yourself off from great deals and reasonable people. Best of all: in both roles, we take the burden of awkward questions, vetting, and sending polite rejections off your shoulders!

Your rules for maximum security and convenience with StaySafe:

1. The Power of the Tenant Passport: As a Landlord, always request a digital Tenant Passport before accepting any offer—it is the best way to vet reliable people. As a Tenant, generate your Passport right away in the dashboard to gain landlords' trust and access a wider selection of properties.

2. Contract Generator & Deposit Protection: Create your agreement using our generator and confirm its conclusion in the portal. As a Landlord, you unlock the feature to report late payments (helping collectively eliminate bad tenants from the market). As a Tenant, you get a free, digital Move-in Protocol with photo verification, which will serve as your unalterable proof and protect you against unjustified deposit deductions when you move out.

3. Full Support from Every Angle: Renting carries risks, but with us, you can eliminate them. If you face an issue with a tenant as an owner, we will assist with documentation and connect you with our proven, partner law firm. Meanwhile, as a tenant, under our Concierge Subscription, you can have us find and organize proven professionals (movers, cleaning, a handyman, a Notary) completely free of charge, while you cover the actual cost of their work directly with the provider.

We are constantly growing and have plenty of new ideas to provide users with the greatest possible support on both sides of the real estate market. If you have any feedback or suggestions, we would be incredibly grateful if you shared them with us!

Also, if our platform makes your life easier, spread the word and recommend StaySafe to your friends! 🙌

Best of luck with all your property goals! The StaySafe Team 🛡️`,
    },
    uk: {
      subject: "Привіт! Вітаємо у StaySafe – час для безпечної здачі та оренди 🚀",
      body: `Привіт! Щиро дякуємо, що обрали StaySafe для управління вашою нерухомістю та пошуку нового житла для себе. Чудово, що ви використовуєте весь потенціал нашої платформи!

Незалежно від того, чи ви виступаєте в ролі Орендодавця, чи Орендаря, наш алгоритм Smart Match запропонує вам варіанти із відповідністю навіть до 100% — усе залежить від ваших індивідуальних критеріїв, бюджету та можливостей. Пам'ятайте про ретельне заповнення профілів, але уникайте занадто жорстких умов, щоб не втратити чудові пропозиції та порядних людей. І найкраще: в обох ролях ми беремо на себе весь тягар складних запитань, перевірок та надсилання ввічливих відмов!

Ваші правила для максимальної безпеки та зручності зі StaySafe:

1. Сила Паспорта Орендаря: Як Орендодавець, завжди вимагайте цифровий Паспорт Орендаря перед прийняттям пропозиції — це найкращий спосіб відбору надійних людей. Як Орендар — згенеруйте свій Паспорт одразу в панелі, щоб отримати довіру власників та доступ до ширшої бази нерухомості.

2. Конструктор договорів та Захист застави: Створіть договір за допомогою нашого конструктора та підтвердьте його укладення на порталі. Як Орендодавець, ви отримуєте можливість повідомляти про затримку платежів (що усуває недобросовісних орендарів з ринку). Як Орендар, ви безкоштовно отримуєте цифровий Акт прийому-передачі з фотофіксацією, який стане вашим незаперечним доказом і захистить від безпідставних утримань із застави (кауції) при виїзді.

3. Повна підтримка з усіх боків: Оренда пов'язана з ризиками, але з нами ви їх ліквідуєте. Якщо у вас, як у власника, виникнуть проблеми з орендарем, ми допоможемо з документацією та спрямуємо справу до нашої перевіреної юридичної компанії-партнера. З іншого боку, як орендар, у межах нашого Абонемента Concierge ви можете доручити нам безкоштовний пошук та організацію перевірених фахівців (переїзд, прибирання, «Майстер на годину», Нотаріус) — саму вартість їхніх послуг ви оплачуєте безпосередньо виконавцю.

Ми постійно розвиваємося та маємо безліч нових ідей, щоб забезпечити користувачам максимальну допомогу з обох сторін ринку нерухомості. Якщо у вас є будь-які зауваження чи пропозиції — ми будемо щиро вдячні, якщо ви поділитеся ними з нами!

І якщо наша платформа полегшує вам життя, розкажіть про нас іншим та порадьте StaySafe своїм друзям! 🙌

Успіхів у реалізації всіх ваших планів! Команда StaySafe 🛡️`,
    },
    es: {
      subject: "¡Hola! Te damos la bienvenida a StaySafe – es hora de alquilar con total seguridad 🚀",
      body: `¡Hola! Muchísimas gracias por elegir StaySafe tanto para gestionar tus propiedades como para buscar un nuevo hogar para ti. ¡Es fantástico que aproveches al máximo todo el potencial de nuestra plataforma!

Tanto si actúas como Propietario o como Inquilino, nuestro algoritmo Smart Match te ofrecerá opciones con una coincidencia de hasta el 100%; todo dependerá de tus criterios individuales, presupuesto y capacidades. Recuerda rellenar tus perfiles con honestidad, pero evita poner condiciones demasiado estrictas para no dejar fuera grandes ofertas y a personas razonables. Y lo mejor de todo: en ambos roles, ¡nosotros nos encargamos de las preguntas incómodas, las verificaciones y de rechazar amablemente a los perfiles que no encajen!

Tus reglas para la máxima seguridad y comodidad con StaySafe:

1. El poder del Pasaporte de Inquilino: Como Propietario, exige siempre el Pasaporte de Inquilino digital antes de aceptar ninguna oferta; es la mejor forma de filtrar a gente de confianza. Como Inquilino, genera tu Pasaporte en el panel de inmediato para ganarte la confianza de los propietarios y acceder a una oferta de viviendas más amplia.

2. Creador de contratos y Protección de la fianza: Crea tu contrato con nuestro asistente y confirma su firma en el portal. Como Propietario, desbloquearás la función de reportar retrasos en los pagos (ayudando a eliminar juntos a los malos inquilinos del mercado). Como Inquilino, obtendrás el Protocolo de Entrega digital gratuito con reportaje fotográfico, que será tu prueba irrefutable y te protegerá de retenciones injustificadas de la fianza al mudarte.

3. Soporte total desde todos los ángulos: Alquilar conlleva riesgos, pero con nosotros los eliminarás. Si como propietario tienes un problema con el inquilino, te ayudaremos con la documentación básica y derivaremos el caso a nuestro bufete de abogados asociado de total confianza. Por otra parte, como inquilino, con nuestro Abono Concierge podemos buscar y organizar de manera totalmente gratuita a los mejores profesionales (mudanzas, limpieza, manitas, Notario); tú solo cubrirás el coste del servicio directamente con el especialista que realice el trabajo.

Estamos en constante desarrollo y tenemos muchísimas ideas nuevas para ofrecer a los usuarios el mayor apoyo posible en ambas caras del mercado inmobiliario. Si tienes cualquier comentario o sugerencia, ¡te estaríamos enormemente agradecidos si lo compartieras con nosotros!

Además, si nuestra plataforma te hace la vida más fácil, ¡corre la voz y recomienda StaySafe a tus amigos! 🙌

¡Mucho éxito con todos tus planes inmobiliarios! El equipo de StaySafe 🛡️`,
    },
  },
};

export function getWelcomeTemplate(accountType: string | null | undefined, lang: string | null | undefined): Tpl {
  const a: AccountType = accountType === "wynajmujacy" ? "wynajmujacy" : accountType === "oba" ? "oba" : "najemca";
  const l: Lang = (["pl", "en", "uk", "es"] as const).includes(lang as Lang) ? (lang as Lang) : "pl";
  return T[a][l];
}
