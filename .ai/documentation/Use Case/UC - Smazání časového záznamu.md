Umožňuje uživateli trvale odstranit existující časový záznam ze systému.

**Aktéři:**

- **Uživatel:** Běžný uživatel systému.

**Vstupní podmínky:**

- Uživatel je úspěšně přihlášen do aplikace.
- V systému existuje konkrétní časový záznam, který chce uživatel smazat, a uživatel má k jeho smazání oprávnění.

**Výstupní podmínky:**

- Časový záznam je trvale odstraněn z databáze.
- Navázané statistiky a celkový odpracovaný čas v denním/týdenním přehledu jsou přepočítány.
- Záznam již není vizuálně dostupný v uživatelském rozhraní.

**Basic Path: Úspěšné smazání záznamu**

1. Uživatel zvolí možnost smazat konkrétní časový záznam (např. kliknutím na ikonu koše).
2. Systém zobrazí varovný dialog s žádostí o potvrzení smazání (např. "Opravdu chcete tento záznam trvale smazat?").
3. Uživatel potvrdí smazání.
4. Systém odstraní časový záznam z databáze, přepočítá související statistiky a zobrazí potvrzující zprávu o úspěšném smazání.

**Alternate: Zrušení mazání**

- _Scénář začíná ve 2. kroku hlavního scénáře._

1. Uživatel se rozhodne smazání nepotvrdit a klikne na "Zrušit" (nebo zavře dialog).
2. Systém dialog zavře a ponechá záznam beze změny.
3. Případ užití končí, systém se vrací do předchozího stavu.

**Alternate: Nepodařilo se smazat**

- _Scénář začíná ve č. kroku hlavního scénáře. Pokud z nějakeho duvodu se nepodaři z DB zaznam odstranit._

1. Systém zobrazi chybovou hlašku "smazat zaznam se nepodařilo. Zkuste prosim znovu" a znovu zobrazi vyběr zaznamu.
2. Případ užití končí, systém se vrací do předchozího stavu.
