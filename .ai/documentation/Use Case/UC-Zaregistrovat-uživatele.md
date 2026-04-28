Umožňuje neregistrovanému uživateli vytvořit si osobní účet v systému, aby mohl následně evidovat svůj čas a spravovat projekty.

### Aktéři

- **Neregistrovaný uživatel:** Externí entita přistupující k systému.

### Vstupní podmínky

- Uživatel nemá v systému existující účet a nachází se na registrační obrazovce.

### Výstupní podmínky

- V databázi aplikace je bezpečně vytvořen a uložen nový uživatelský účet.

### Basic Path: Zaregistrování uživatele

1. Případ užití začíná, když se Neregistrovaný uživatel rozhodne vytvořit si nový účet.
2. Systém zobrazí registrační formulář umožňující zadat potřebné registrační údaje.
3. Neregistrovaný uživatel vyplní požadované údaje a potvrdí odeslání registrace.
4. Systém zkontroluje zadané údaje (zda jsou vyplněna povinná pole, heslo splňuje bezpečnostní kritéria a e-mail je unikátní), uloží data nového uživatele do databáze, zobrazí informaci o úspěšné registraci a přesměruje uživatele k přihlášení.

### Alternate: E-mail je již v systému registrován

1. Scénář začíná ve 4. kroku hlavního scénáře, pokud systém při kontrole zjistí, že pro zadanou e-mailovou adresu již účet existuje.
2. Systém přeruší registraci, upozorní uživatele varovnou hláškou na existující účet, nabídne možnost přihlášení nebo obnovy hesla a vrací případ užití do 2. kroku hlavního scénáře (čeká na novou akci uživatele).

### Alternate: Nevalidní registrační údaje

1. Scénář začíná ve 4. kroku hlavního scénáře, pokud systém při kontrole zjistí, že zadané heslo je příliš krátké nebo e-mail nemá platný formát.
2. Systém chybově zvýrazní nevyhovující pole, zobrazí uživateli nápovědu k jejich opravě a vrací případ užití do 2. kroku hlavního scénáře (čeká na úpravu dat).
