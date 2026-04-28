Umožňuje uživateli vybrat existující časový záznam z historie a upravit jeho detaily.

**Aktéři:**

- **Uživatel:** Běžný uživatel systému.

**Vstupní podmínky:**

- Uživatel je úspěšně přihlášen do aplikace.
- V systému existuje minimálně jeden časový záznam, ke kterému má uživatel oprávnění pro úpravu.
- Aplikace je v zobrazení, které vypisuje existující časové záznamy.

**Výstupní podmínky:**

- Upravený časový záznam je úspěšně a trvale uložen v systému.
- Změny jsou okamžitě vizuálně reflektovány v uživatelském rozhraní.

**Basic path: Úspěšná úprava záznamu**

1. Uživatel vybere konkrétní časový záznam ze seznamu a zvolí možnost jeho úpravy.
2. Systém načte aktuální data vybraného záznamu z databáze.
3. «include» [[UC - zadat údaje časového záznamu]]
4. Systém aktualizuje vybraný časový záznam v databázi novými hodnotami, zobrazí uživateli potvrzení o úspěšném uložení a aktualizuje zobrazení seznamu záznamů.

**Alternate path: Zrušení úpravy**

- _Scénář může nastat kdykoliv během kroku 3._

1. Uživatel se rozhodne úpravu zrušit (např. kliknutím na tlačítko "Zrušit" nebo zavřením formuláře).
2. Systém ponechá původní časový záznam v databázi beze změny a vrátí uživatele do původního přehledu.

**Alternate path: Záznam nenalezen / Byl mezitím smazán**

- _Scénář začíná v 4. kroku hlavního scénáře (při pokusu o uložení), pokud se systém pokusí načíst záznam, který byl např. smazán z jiného zařízení._

1. Systém zjistí, že požadovaný časový záznam v databázi již neexistuje.
2. Systém zobrazí uživateli chybovou hlášku informující o tom, že záznam nelze upravit.
3. Systém aktualizuje seznam (odstraní smazaný záznam z pohledu) a ukončí proces úpravy.

**neúspěšné lokální uložení + recovery/retry**

- _Scénář začíná v 4. kroku hlavního scénáře (při pokusu o uložení), pokud se z nějakeho duvodu nepodaří uložit data._

1. System zobrazi hlašku "Nepodařilo se uložit, zkuste znovu" a načte data před změnou vybraného záznamu z databáze.
2. Pokračuje se krokem 3. hlavního scenaře.
