# Contributing Guidelines

This document defines the basic rules for working in this repository. Following these rules ensures that our code remains of high quality, well-organized, and prevents us from breaking functionality while collaborating.

## 1. Development Workflow (GitHub Flow)

We strictly follow the **GitHub Flow** methodology. This means that the `develop` branch is always considered fully functional, stable, and ready for production deployment. All development takes place in separate, derived branches.

### Workflow Steps:

1. **Branching:**
   - Always create a new branch from the most up-to-date `develop` branch (`git checkout develop`, `git pull`, `git checkout -b <branch-name>`).
   - Name branches appropriately based on the type of change (e.g., `feature/...`, `fix/...`, `chore/...`, `docs/...`).
2. **Committing:**
   - Write clear and understandable commit messages.
   - During a commit, a local **Husky** hook is triggered which, via `lint-staged`, automatically fixes linting errors and formats the modified files.
3. **Creating a Merge Request (MR):**
   - After pushing your branch to the server (`git push`), you must immediately create a **Merge Request** targeting the `develop` branch.

## 2. No Direct Pushes to Develop and Code Review Rule (Critical)

**Direct commits (pushes) to the `develop` branch are strictly prohibited!**
To protect the `develop` branch, you must adhere to the following process when integrating code from your branch:

1. **Mandatory Merge Request:** All changes to `develop` are made **exclusively** through a Merge Request.
2. **Code Review by Another Developer:** To approve a Merge Request, **it is absolutely necessary to have an Approval from a second person / colleague** on the project. They must review your code. Never merge your own Merge Request without a Code Review from the other side!
3. **Successful CI Pipeline:** A merge to `develop` can only be performed when the tests and tasks within the CI pipeline (lint, typecheck, SonarQube analysis) pass successfully. If the Pipeline fails (red status), the developer is required to fix the code on their branch.
