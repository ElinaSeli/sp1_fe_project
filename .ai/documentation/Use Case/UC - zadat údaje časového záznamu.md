Umožňuje uživateli zadat nebo upravit údaje časového záznamu tak, aby mohl být časový záznam uložen do systému.  
Tento případ užití představuje sdílenou funkcionalitu využívanou při zpětném vytvoření časového záznamu, při vytvoření časového záznamu pomocí časovače a při zpětné úpravě záznamu.

### Aktéři

- **Uživatel:** Běžný uživatel systému

### Vstupní podmínky

- Uživatel je úspěšně přihlášen do aplikace
- Uživatel zahájil některý nadřazený případ užití, v jehož rámci se zadávají údaje časového záznamu.
- Aplikace má do lokální paměti načtený aktuální seznam dostupných projektů a tagů, aby je mohl uživatel přiřazovat k úkolům

### Výstupní podmínky

- Údaje časového záznamu byly uživatelem zadány a validovány.
- Systém má k dispozici konzistentní sadu údajů připravenou k uložení v nadřazeném případu užití.
- V případě neúspěšné validace nejsou neplatné údaje předány k uložení

### Povinné údaje

- Povinné údaje zmiňované v Use Case budou specifikovány později, může se jednat i o prázdnou množinu (v takovém případě k jejich kontrole nedojde vůbec)

### Basic Path: Zadání údajů časového záznamu

1. Systém zobrazí formulář pro zadání údajů časového záznamu.
2. Uživatel zadá nebo upraví údaje časového záznamu. Jedná se zejména o datum, čas začátku, čas konce, délku trvání, projekt, navázaný úkol a slovní popis práce.
3. Systém zkontroluje věcnou správnost zadaných údajů, zejména zda čas začátku nepřevyšuje čas konce, zda jsou vyplněny všechny povinné údaje a zda záznam neporušuje definovaná validační pravidla systému.
4. Pokud jsou zadané údaje platné, systém umožní potvrdit jejich uložení.
5. Uživatel potvrdí zadané údaje.
6. Systém předá zadané údaje navazujícímu případu užití ke zpracování a uložení.

### Alternate: Nevyplněné povinné údaje

1. Scénář začíná ve 3. kroku hlavního scénáře, pokud uživatel nevyplnil všechny povinné údaje.
2. Systém zobrazí informaci o chybějících povinných údajích a označí příslušná pole formuláře.
3. Uživatel doplní chybějící údaje.
4. Scénář pokračuje 3. krokem hlavního scénáře.

### Alternate: Neplatná kombinace časových údajů

1. Scénář začíná ve 3. kroku hlavního scénáře, pokud zadané časové údaje nejsou ve vzájemném souladu.
2. Systém zobrazí informaci o neplatné kombinaci časových údajů.
3. Uživatel opraví zadané hodnoty.
4. Scénář pokračuje 3. krokem hlavního scénáře.

### Alternate: Porušení dalších validačních pravidel

1. Scénář začíná ve 3. kroku hlavního scénáře, pokud záznam porušuje jiné validační pravidlo systému, například překryv s jiným záznamem nebo neexistující navázaný úkol.
2. Systém zobrazí odpovídající chybové hlášení.
3. Uživatel upraví zadané údaje.
4. Scénář pokračuje 3. krokem hlavního scénáře.
