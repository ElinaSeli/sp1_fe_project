---
title: UC Vytvořeni workspace
---

# Use Case: Vytvoření nového Workspace

## Akteři:

Uživatel

## Vstupni podminky:

- Uživatel je úspěšně přihlášen do svého uživatelskeho účtu.

## Výstupní podmínky:

- V seznamu Workspace uživatele přibyl jeden nový záznam.

## Hlavní cesta

1. Uživatel přejde do sekce Settings a vybere možnost "Workspaces".
2. System zobrazi aktualní Workspaces, pokud nějake jsou
3. Uživatel klikne na tlačítko "+ Create new workspace".
4. Systém zobrazí formulář pro zadání názvu.
5. Uživatel zadá unikátní název nového Workspace a potvrdí (např. tlačítkem "Create").
6. Systém zvaliduje data a vytvoří nový Workspace.

## Alternativní cesty

### A1: Název Workspace již existuje

_začina krokem 6, kdy uživatel zadá název, který se shoduje s již existujícím názvem v rámci jeho účtu._

1. Systém detekuje duplicitu, zobrazí chybovou hlášku: "Název workspace již existuje, zkuste jiný" a pole pro název nechá aktivní. pokračuje se krokem 5. hlavni cesty. Připad konči.
