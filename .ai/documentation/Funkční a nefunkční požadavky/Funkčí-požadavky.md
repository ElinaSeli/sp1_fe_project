# Must have: 

- Správa uživatel
  - **F1:** Registrace uživatele do systému. [UC-Zaregistrovat-uživatele](UC-Zaregistrovat-uživatele.md)
  - **F2:** Přihlášení do systému s preferencí využití systémového webového prohlížeče pro snazší přístup k uloženým heslům. [UC-Přihlášení-do-systému](UC-Přihlášení-do-systému.md)
  - **F3:** Odhlášení ze systému. [UC-Odhlášení-ze-systemu](UC-Odhlášení-ze-systemu.md)
  - **F4:** Zajištění bezpečného a izolovaného přístupu pouze k vlastním datům (workspace, projekty, záznamy). (Pokryto v rámci [UC-Přihlášení-do-systému](UC-Přihlášení-do-systému.md) a [UC-Vytvořeni-workspaceu](UC-Vytvořeni-workspaceu.md) [UC - Synchronizace dat z Redmine](UC%20-%20Synchronizace%20dat%20z%20Redmine.md))

- Správa workspace
  - **F5:** Vytvoření lokálního workspace pro ukládání časových záznamů. [UC-Vytvořeni-workspaceu](UC-Vytvořeni-workspaceu.md)
    - **F6:** Zajištění lokální funkčnosti (evidence času) i při výpadku spojení s externím ticket systémem. Pokryto v rámci [UC - zadat údaje časového záznamu](UC%20-%20zadat%20údaje%20časového%20záznamu.md) a [UC - Synchronizace časových záznamů do ticketovacího systému](UC%20-%20Synchronizace%20časových%20záznamů%20do%20ticketovacího%20systému.md)
- Správa času
  - **F7:** Vytvoření časového záznamu pomocí spuštění a ukončení časovače. [UC - Vytvoření časového záznamu pomocí časovače](UC%20-%20Vytvoření%20časového%20záznamu%20pomocí%20časovače.md)
  - **F8:** Vytvoření časového záznamu zpětně ručním zadáním. [UC-Zpětné-vytvoření-časového-záznamu](UC-Zpětné-vytvoření-časového-záznamu.md)
  - **F9:** Úprava existujícího časového záznamu s automatickým a spolehlivým lokálním uložením (v případě chyby integrace nedojde ke ztrátě úprav). [UC - Úprava časového záznamu](UC%20-%20Úprava%20časového%20záznamu.md)
  - **F10:** Smazání časového záznamu. [UC - Smazání časového záznamu](UC%20-%20Smazání%20časového%20záznamu.md)
- Integrace
  - **F11:** Propojení systému s ticket aplikací. [UC - Nastavení integrace s tiketovacím systémem](UC%20-%20Nastavení%20integrace%20s%20tiketovacím%20systémem.md)
    - **F12:** Automatický import a synchronizace všech uživatelových projektů a tagů z ticket aplikace výhradně do lokální databáze daného uživatele (data jsou stahována a ukládána pouze lokálně a izolovaně pro přihlášeného uživatele) [UC - Synchronizace dat z Redmine](UC%20-%20Synchronizace%20dat%20z%20Redmine.md)
    - **F13:** Odesílání dokončených časových záznamů do ticket aplikace. [UC - Synchronizace časových záznamů do ticketovacího systému](UC%20-%20Synchronizace%20časových%20záznamů%20do%20ticketovacího%20systému.md)

# Could have: 

- **F15:** Automatické přepínání stavu úkolu v externím systému po spuštění/ukončení časovače.
- **F16**: Detekovat nečinnost (Idle detection): Systém automaticky upozorní uživatele (desktop aplikace), pokud zapomene běžet časovač a uživatel není u PC.
- **F17**: Spustit Pomodoro časovač: Integrovaná technika pro lepší soustředění na práci.

# Should have:

- **F18:** Průběžná synchronizace _běžícího_ časového záznamu v konfigurovatelném intervalu (např. každých 15, 30 nebo 60 minut).

# Wont have:
