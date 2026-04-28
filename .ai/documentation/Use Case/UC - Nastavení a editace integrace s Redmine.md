Umožňuje uživateli propojit Time-Tracking aplikaci s Redmine. Toto propojení je nezbytné pro budoucí automatické stahování projektů a následné odesílání odpracovaného času k jednotlivým úkolům.

**Aktéři:**

- **Uživatel:** Běžný uživatel nebo manažer s oprávněním spravovat nastavení svého účtu.
- **Redmine:** Systém třetí strany, který přijímá požadavek na propojení a ověřuje platnost poskytnutých přístupových údajů.

**Vstupní podmínky:**

- Uživatel je úspěšně přihlášen do aplikace.
- Uživatel má k dispozici přístupové údaje ze svého externího systému (obvykle URL adresu a osobní bezpečnostní klíč / token).

**Výstupní podmínky:**

- Propojovací údaje jsou ověřeny a bezpečně uloženy v aplikaci.
- Aplikace je propojena s externím systémem a je připravena na synchronizaci dat (což řeší jiné případy užití).
- V rozhraní aplikace je integrace vizuálně označena jako aktivní a funkční.

**Basic Path: Úspěšné nastavení nového propojení**

1. Uživatel v hlavním menu přejde do sekce "Nastavení" a vybere položku "Integrace".
2. Systém zobrazí formulář vyžadující zadání propojovacích detailů (URL adresa a bezpečnostní klíč).
3. Uživatel vyplní požadované údaje do formuláře a klikne na tlačítko "Ověřit a připojit".
4. Systém odešle zkušební požadavek s údaji do zvoleného Externího tiketovacího systému k ověření.
5. Externí tiketovací systém ověří platnost údajů a vrátí potvrzení o úspěšném spojení.
6. Systém uloží nastavení integrace do databáze, přesměruje uživatele na přehled integrací a zobrazí potvrzující zprávu o úspěšném propojení.

**Alternate Paths:**
**A1: Neplatné propojovací údaje** _Scénář začíná po 4. kroku hlavního scénáře, pokud zadaný klíč nebo adresa nejsou správné nebo._

1. Externí tiketovací systém zjistí, že údaje jsou neplatné, spojení odmítne a vrátí chybovou odpověď.
2. Systém přeruší ukládání integrace, chybově zvýrazní pole formuláře a zobrazí varovnou hlášku (např. "Nepodařilo se připojit. Zkontrolujte prosím zadanou adresu a přístupový klíč.").
3. Případ užití se vrací do 3. kroku hlavního scénáře a čeká na to, až uživatel údaje opraví a znovu odešle k ověření.

**A2: Externí systém je dočasně nedostupný** _Scénář začíná po 4. kroku hlavního scénáře, pokud externí systém vůbec neodpovídá._

1. Externí tiketovací systém na požadavek neodpovídá (vypršení časového limitu) nebo není k zastižení (např. kvůli chybějícímu připojení k internetu).
2. Systém přeruší proces ověřování a zobrazí chybovou zprávu: "Cílový systém momentálně neodpovídá. Zkuste to prosím později."
3. Uživatel může proces zopakovat později, nebo formulář opustit (tím UC předčasně končí).

**A3: Zrušení nastavení integrace** _Scénář může nastat kdykoliv mezi 1. a 3. krokem hlavního scénáře._ 4. Uživatel se rozhodne integraci nenastavovat a klikne na tlačítko "Zrušit" (nebo odejde do jiné sekce aplikace). 5. Systém zahodí veškeré nevyplněné nebo neuložené údaje z formuláře. 6. Případ užití předčasně končí a integrace není vytvořena.

**A4: Úprava již existující integrace** _Scénář nahrazuje kroky 2 a 3 hlavního scénáře v případě, že propojení již existuje a uživatel ho chce pouze upravit._

1. Systém v sekci "Integrace" zobrazí formulář předvyplněný aktuálními údaji (přičemž bezpečnostní klíč může být z bezpečnostních důvodů skrytý).
2. Uživatel zvolí možnost "Upravit".
3. Scénář dále normálně pokračuje 3. krokem hlavního scénáře.
