---
title: UC Přihlášení do systému
---

Umožňuje existujícímu uživateli ověřit svou identitu a získat zabezpečený přístup k funkčnostem Time-Tracking systému.

**Aktéři:**

- **Uživatel:** Běžný uživatel systému

**Vstupní podmínky**

- Uživatel není přihlášen a nachází se na přihlašovací obrazovce systému.

**Výstupní podmínky**

- Uživatel je úspěšně autentizován a je přesměrován na výchozí obrazovku systému.
- V případě selhání není uživatel vpuštěn do systému a je upozorněn na chybu.

**Basic Path: Úspěšné přihlášení**

1. Případ užití začíná, když uživatel zadá své přihlašovací údaje (uživatelské jméno a heslo) a potvrdí požadavek na přihlášení.
2. Systém ověří platnost zadaných údajů, úspěšně přihlásí uživatele a přesměruje ho do rozhraní aplikace.

**Alternate: Neplatné přihlašovací údaje**

1. Tento scénář se spouští po kroku 1 hlavního scénáře.
2. Systém při ověřování zjistí, že zadané uživatelské jméno neexistuje, nebo zadané heslo neodpovídá, pak zamítne přístup a zobrazí uživateli chybové hlášení o neplatných údajích.
3. Případ užití se vrací před krok 1 hlavního scénáře a systém čeká na nové zadání údajů uživatelem.
