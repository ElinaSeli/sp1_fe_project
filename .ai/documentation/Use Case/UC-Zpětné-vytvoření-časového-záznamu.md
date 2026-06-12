Umožňuje uživateli dodatečně vytvořit nový časový záznam za práci, která již byla vykonána v minulosti.

### Aktéři

- **Uživatel:** Běžný uživatel systému

### Vstupní podmínky

- Uživatel je přihlášen do systému.

### Výstupní podmínky

- V systému je uložen nový časový záznam zadaný zpětně.
- Nový časový záznam splňuje validační pravidla systému.
- V případě zrušení nebo chyby při ukládání nevznikne nový časový záznam.

### Basic Path: Zpětné vytvoření časového záznamu

1. Případ užití začíná, když se uživatel rozhodne dodatečně zaznamenat již vykonanou práci.
2. Systém zobrazí prázdný formulář pro vytvoření časového záznamu.
3. «include» [[UC - zadat údaje časového záznamu]]
4. uživatel potvrdí, že chce záznam vytvořit
5. Systém uloží nový časový záznam a zobrazí potvrzení o úspěchu.

### Alternate: Zrušení vytvoření časového záznamu

1. Scénář začíná kdekoliv mezi 2. nebo 4. krokem hlavního scénáře, pokud se uživatel rozhodne vytvoření časového záznamu zrušit.
2. Uživatel zruší zadávání časového záznamu.
3. Systém zahodí neuložené změny.
4. Případ užití končí.

### Alternate: Neúspěšné uložení časového záznamu

1. Scénář začíná ve 4. kroku hlavního scénáře, pokud se časový záznam nepodaří uložit.
2. Systém zobrazí chybovou zprávu o neúspěšném uložení.
3. Uživatel může akci opakovat nebo případ užití ukončit.
