Tento scénář popisuje, jak systém udržuje data z Redmine aktuální, aniž by uživatel musel čekat na načítání při každém otevření aplikace.

**Aktéři:**

- **Uživatel:** Chce vidět své úkoly a začít trackovat čas bez čekání.
- **Redmine:** Zdrojová data (externí systém).
- **Čas**.

**Vstupní podmínky:**

- Uživatel je přihlášen v aplikace.
- Propojení uživatele s Redmine je aktivní (platný API klíč).

**Výstupní podmínky:**

- Uživatel vidí nejaktuálnější seznam projektů/úkolů/tagů ke kterým má přístup.
- Změny v Redmine se promítly do TTS bez manuálního zásahu.

---

### Basic Path: Standardní práce s aplikací

1. Uživatel otevře TTS aplikaci (mobilní nebo desktop).
2. Systém okamžitě zobrazí data, které má uložené v **lokální databázi** (může být prázdná) a pokud uplynul nastavený interval 5 minut, systém odešle požádavek na data uživatele na Redmine API.
3. Uživatel může současně provádět jakékoliv akce.
4. Redmine vrácí data a stáhne jen nové/upravené data.
5. Začne se počítání času (5 minut) než může začít další synchronizace.
6. Pokud systém najde změny, plynule (bez probliknutí) aktualizuje seznam projektů, tasků, tagů.

---

### Alternativní cesta A1: Manuální vynucená synchronizace (Force Refresh)

_Uživatel právě vytvořil úkol v Redmine a chce ho v TTS vidět hned._

1. Uživatel v sekci projektů použije gesto **"Pull-to-refresh"** nebo klikne na tlačítko synchronizace.
2. Systém ignoruje standardní interval a okamžitě kontaktuje Redmine API pro daného uživatele a zobrazí vizuální indikátor.
3. Redmine vrácí data a stáhne jen nové/upravené data.
4. Systém uloží data do DB a ihned je zobrazí.

---

### Alternativní cesta A2: Redmine je nedostupný (Offline/Error)

_Tento scénář nahrazuje krok 4 hlavního scénáře._

1. Systém se pokusí kontaktovat Redmine.
2. Remine vrací chybu.
3. Systém zaloguje chybu, ale nezobrozí žádnou chybovou hlášku, která by blokovala práci.
4. Uživatel dál pracuje s daty, která byla stažena při poslední úspěšné synchronizaci.
5. Systém zkusí synchronizaci znovu automaticky za 5 minut.
