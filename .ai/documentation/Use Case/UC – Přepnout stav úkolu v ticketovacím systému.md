Umožňuje uživateli při spuštění nebo ukončení časovače zvolit nový stav navázaného úkolu v Redmine a tento stav do Redmine propsat.

### Aktéři:

- **Uživatel**
- **Redmine/jiný ticketovací systém**

### Vstupní podmínky:

- Uživatel spouští nebo ukončuje časovač.
- Časový záznam je přiřazen k úkolu synchronizovanému s Redmine.
- Integrace s Redmine je aktivní.

### Výstupní podmínky:

- Stav úkolu v Redmine byl změněn.
- Nebo stav změněn nebyl (uživatel nevybral žádný stav).

### Extension point:

- po spuštění časovače
- po ukončení časovače

### Basic Path:

1. Rozšíření začíná v okamžiku spuštění nebo ukončení časovače.
2. Systém zjistí, jaké cílové stavy jsou pro daný úkol v Redmine dostupné.
3. Systém nabídne uživateli seznam dostupných stavů.
4. Uživatel vybere požadovaný stav.
5. Systém odešle požadavek na změnu stavu úkolu do Redmine.
6. Redmine změnu potvrdí.
7. Systém zobrazí potvrzení o úspěšné změně stavu.
8. Scénář se vrací do hlavního případu užití.

### Alternate: Uživatel stav nevybere

1. Uživatel dialog zavře nebo zvolí pokračování bez změny stavu.
2. Systém neprovede změnu stavu v Redmine.
3. Scénář se vrací do hlavního případu užití.

### Alternate: Nepodaří se načíst dostupné stavy

1. Systém nedokáže získat seznam dostupných stavů z Redmine.
2. Systém zobrazí chybovou informaci.
3. Scénář pokračuje bez změny stavu.

### Alternate: Nepodaří se změnit stav v Redmine

1. Redmine odmítne změnu nebo je nedostupné.
2. Systém zobrazí chybovou zprávu.
3. Scénář pokračuje bez změny stavu.
