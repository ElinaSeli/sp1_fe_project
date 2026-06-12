# Usability

- N1 – Přístupnost ovládání časovače:
  - Ovládání spuštění a ukončení časovače musí být jednoznačné a okamžitě dostupné přímo na hlavní obrazovce aplikace.
- N2 – Srozumitelnost formulářů:
  - Formuláře pro vytváření a úpravu časových záznamů musí vizuálně jasně odlišovat povinná pole od nepovinných a při chybě zobrazit konkrétní textovou nápovědu (např. "Vyplňte název projektu").
- N3 - Přechod z jiných systémů
  - Přechod z jiných systémů musí být pro uživatele co nejmenší překážkou. Rozmístění hlavních ovládacích prvků (např. tlačítka start/stop na horní liště) musí pozičně a vizuálně odpovídat zavedeným zvyklostem ze systémů Toggl a Clockify.

- N4 – Vizuální validace dat:
  - Systém musí uživatele vizuálně upozornit (např. varovným textem u příslušného pole) na zadání neplatných časových údajů (např. konec záznamu nastaven dříve než začátek) ještě před odesláním formuláře.

# Reliability

- N5 – Zachování rozpracovaných dat
  - Systém nesmí ztratit již zadaný nebo rozpracovaný časový záznam v případě běžné chyby aplikace, obnovení stránky prohlížeče nebo krátkodobého výpadku připojení.

- N6 – Odolnost vůči externím chybám (Uživatelské logování)
  - Pokud selže odeslání záznamu z důvodu chyby na straně externího systému (např. úkol byl smazán), aplikace nesmí spadnout. Záznam se vždy úspěšně uloží lokálně a systém u něj v uživatelském rozhraní zobrazí chybovou indikaci formou varovného výkřičníku s možností dodatečně vybrat jiný, platný úkol.

# Performance

- N7 – Odezva uživatelských operací
  - Běžné uživatelské operace, jako je zobrazení formuláře nebo uložení záznamu, musí mít garantovanou odezvu maximálně do 1 až 2 sekund.

- N8 – Výkon synchronizace
  - Propisování dat s ticketovacím systémem musí při dostupném připojení probíhat na pozadí prakticky v reálném čase, aby nedocházelo k prodlevám (přesahujícím 2 sekundy), které by uživateli evokovaly nefunkčnost systém
- N9 – Současná práce více uživatelů:
  - Systém musí podporovat souběžnou práci paralelně přihlášených uživatelů tak, aby průměrná doba odezvy serveru na zpracování záznamu byla nižší než 1s a vyhledávání netrvalo déle než 2 sekundy.

# Supportability

- N10 – Systémové logování chyb
  - Služby komunikující s API externích systémů musí na pozadí zaznamenávat systémové chyby a výjimky do specializovaného nástroje (např. Sentry), aby je vývojář mohl zpětně analyzovat.

- N11 – Bezpečné ukládání citlivých údajů
  - Přihlašovací hesla a integrační API klíče musí být v databázi ukládány bezpečným šifrovaným způsobem, aby k nim neměli přístup neoprávnění uživatelé ani administrátoři databáze.
