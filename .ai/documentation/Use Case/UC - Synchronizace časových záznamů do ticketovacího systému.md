Umožňuje serveru naší aplikace okamžitě (v reálném čase) odeslat odpracovaný čas do externího ticketovacího systému v momentě, kdy je záznam úspěšně přijat a uložen na našem backendu. To zaručuje, že čas je v externím systému neustále aktuální bez nutnosti ručního spouštění synchronizace.

**Aktéři:**

- **Uživatel:** Běžný spolupracovník nebo manažer, který loguje svůj čas (iniciuje akci přes klientskou aplikaci) a očekává jeho propsání do externího systému.
- **Externí ticketovací systém (např. Redmine):** Systém třetí strany, který v reálném čase přijímá časový záznam přes API a aktualizuje stav úkolu.

**Vstupní podmínky:**

- Integrace s externím ticketovacím systémem je úspěšně nastavena a aktivní.
- Klientská aplikace úspěšně předala data na server naší aplikace. Časový záznam je na našem serveru bezpečně vytvořen nebo upraven (nachází se ve stavu `[Uložený serverově]`) a má vazbu na externí úkol.

**Výstupní podmínky:**

- Konkrétní časový záznam je úspěšně zkopírován do externího ticketovacího systému.
- V naší aplikaci (na serveru i v UI) je tento záznam uložen s příznakem „synchronizovaný“ (bez varovných ikon).
- Celková statistika odpracovaného času u úkolu v externím systému je okamžitě aktualizována.

**Hlavní scénář: Úspěšné okamžité odeslání záznamu**

1. Případ užití začíná automaticky na pozadí v okamžiku, kdy server naší aplikace úspěšně uloží nový nebo upravený časový záznam od klienta.
2. Server aplikace okamžitě odešle API požadavek s daty tohoto záznamu do externího ticketovacího systému.
3. Externí ticketovací systém v reálném čase přijme odeslaná data, zpracuje je a vrátí našemu serveru potvrzení o úspěšném uložení (HTTP 200 OK).
4. Server aplikace označí záznam v databázi jako úspěšně synchronizovaný a odešle do klientské aplikace signál k vizuálnímu potvrzení.

**Alternativní scénáře:**
**A1: Externí API je nedostupné (Fallback do fronty na serveru)** _Tento scénář nahrazuje kroky 2–4 v Hlavním scénáři a řeší situaci, kdy spojení selže na straně serverů._

1. Server aplikace se pokusí odeslat data, ale zjistí, že API externího ticketovacího systému neodpovídá (timeout), nebo vrací chybu serveru (např. HTTP 500/503).
2. Server aplikace přeruší okamžité odesílání, ale záznam si ponechá bezpečně uložený v databázi.
3. Server označí záznam příznakem `[Čeká na synchronizaci]` a zařadí ho do fronty pro pozdější automatické opakování.
4. Klientská aplikace dostane informaci o zpoždění a zobrazí uživateli nenápadné upozornění: „Externí systém momentálně neodpovídá. Záznam je u nás v bezpečí a propíše se, jakmile bude spojení obnoveno.“ (U záznamu svítí varovná ikonka čekání).

**A2: Úkol v externím systému byl smazán nebo uzavřen pro vykazování času** _Tento scénář se spouští ve 3. kroku Hlavního scénáře._

1. Externí ticketovací systém odmítne uložit odeslaný záznam a vrátí našemu serveru chybovou zprávu (např. HTTP 400/403), protože s ním spojený úkol byl v mezičase smazán nebo přesunut do stavu „Uzavřeno“.
2. Server aplikace zachytí chybu a předá tuto informaci zpět do klientské aplikace uživatele.
3. Klientská aplikace zobrazí uživateli okamžité varování: „Záznam nelze na úkol propasat, protože je uzavřen nebo smazán.“
4. Klientská aplikace ponechá uživatele ve formuláři pro úpravu záznamu a nabídne mu možnost vybrat jiný, aktivní úkol, nebo záznam ponechat pouze pro naši interní evidenci bez vazby na Redmine.
