---
title: UC Odhlášení ze systému
---

Umožňuje přihlášenému uživateli bezpečně ukončit svou aktivní relaci a zamezit tak dalšímu přístupu ke svému účtu a datům v Time-Tracking systému.

**Aktéři:**

- **Uživatel:** Běžný uživatel systému

**Vstupní podmínky**

- Uživatel je úspěšně přihlášen a nachází se v zabezpečeném rozhraní systému.

**Výstupní podmínky**

- Aktivní relace uživatele je bezpečně ukončena.
- Uživatel nemá přístup k funkcím systému vyžadujícím autentizaci.
- Uživatel je přesměrován na výchozí přihlašovací obrazovku.

**Basic Path: Úspěšné manuální odhlášení**

1. Uživatel v uživatelském rozhraní zmačkne na odhlášení.
2. Systém zobrazí potvrzení na odhlášení.
3. Uživatel potvrdí odhlášení.
4. Systém zruší platnost aktuální relace uživatele (odstraní autentizační tokeny/cookies), úspěšně odhlásí uživatele a přesměruje ho zpět na přihlašovací formulář.

**Alternate: Uživatel odmitne potvrzení odhlášení**

1. Scénář začíná ve 2. kroku hlavního scénáře, pokud uživatel odmitne odhlášení.
2. Systém vrátí uživatele do původního rozhrání systému.
