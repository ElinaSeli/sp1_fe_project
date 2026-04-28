Umožňuje uživateli vytvořit nový časový záznam pomocí časovače. Během běhu časovače nemusí být vyplněny všechny údaje časového záznamu, ty mohou být doplněny kdykoliv.

### Aktéři:

- **Uživatel:** Běžný uživatel systému

### Vstupní podmínky:

- Uživatel je přihlášen do systému.
- Uživatel má oprávnění vytvářet časové záznamy.

### Výstupní podmínky:

- Časový záznam je uložen v systému se správně vyplněnými a validovanými údaji.
- Nebo časový záznam nebyl uložen (v případě zrušení nebo chyby).

### Basic Path: Vytvoření časového záznamu pomocí časovače

1. Případ užití začíná, když se uživatel rozhodne zaznamenat vykonávanou práci pomocí časovače.
2. Systém zobrazí formulář časového záznamu a ovládací prvek pro spuštění časovače.
3. Uživatel může, ale nemusí před spuštěním časovače vyplnit údaje časového záznamu.
4. Uživatel spustí časovač.
   - «extend»: po spuštění časovače
   - [UC – Přepnout stav úkolu v ticketovacím systému](UC%20–%20Přepnout%20stav%20úkolu%20v%20ticketovacím%20systému.md)
5. Systém zaznamená čas zahájení měření a vytvoří rozpracovaný časový záznam, který může být neúplný. Poté indikuje běžící časovač a průběžně zobrazuje délku měřeného času.
6. Uživatel zastaví časovač.
   - «extend»: po ukon časovače
   - [UC – Přepnout stav úkolu v ticketovacím systému](UC%20–%20Přepnout%20stav%20úkolu%20v%20ticketovacím%20systému.md)
7. Systém zaznamená čas ukončení měření a vypočte délku trvání časového záznamu. Dále vyzve uživatele k doplnění případně chybějících údajů časového záznamu.
8. «include» [[UC - zadat údaje časového záznamu]]
9. Systém uloží nový časový záznam a zobrazí potvrzení o úspěšněchu.

### Alternate: Doplnění údajů během běhu

1. Scénář může proběhnout kdekoliv mezi krokem 4 a 6
2. Uživatel může během běhu časovače kdykoliv doplnit nebo upravit údaje časového záznamu, není to však povinné.
3. Scénář pokračuje krokem 6

### Alternate: Uživatel nevyplní údaje během měření

1. Scénář začíná v 6. kroku hlavního scénáře, pokud uživatel během běhu časovače nevyplní žádné nebo jen část údajů.
2. Po zastavení časovače systém vyžaduje doplnění povinných údajů.
3. Scénář pokračuje 7. krokem hlavního scénáře.

### Alternate: Zrušení rozpracovaného měření

1. Scénář začíná mezi krokem 4 a 6 hlavního scénáře, pokud se uživatel rozhodne rozpracované měření zrušit.
2. Uživatel zvolí zrušení časovače.
3. Systém zruší rozpracovaný časový záznam a neuloží jej.
4. Případ užití končí.

### Alternate: Neúspěšné uložení časového záznamu

1. Scénář začíná ve 9. kroku hlavního scénáře, pokud se časový záznam nepodaří uložit.
2. Systém zobrazí chybovou zprávu o neúspěšném uložení.
3. Uživatel může akci opakovat nebo případ užití ukončit.
