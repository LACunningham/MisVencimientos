# AGENTS.md

## Expo HAS CHANGED

Read the exact versioned docs at **https://docs.expo.dev/versions/v57.0.0/** before
writing any code. Do not rely on memory or on older docs.

If the `expo` dependency in `package.json` moves to another SDK, update that URL to
match. Current pin: `expo ~57.0.26`, `react-native 0.86.3`, `expo-router ~57.0.24`.

## NEVER run `npm run reset-project`

It is leftover Expo template scaffolding. It **moves or deletes `src/` and
`scripts/`**, which would wipe the entire app. Delete the script from
`package.json` and `scripts/reset-project.js` if it ever gets run by accident.

## Stack

Expo SDK 57 · Expo Router (file-based) · TypeScript · `expo-sqlite` for
persistence · Jest + `jest-expo` + `@testing-library/react-native` v14.

## Verify before claiming done

All three, every time:

```bash
npm.cmd run typecheck     # tsc --noEmit
npm.cmd run lint          # expo lint
npm.cmd test -- --maxWorkers=1
```

Plus a real build whenever you touch DB wiring, routing or platform splits:

```bash
npx.cmd expo export --platform web --output-dir .expo\export-check
```

## Environment (Windows)

- Bare `npx` and `npm` are **blocked** by the PowerShell execution policy
  (`npx.ps1`). Always use `npx.cmd` / `npm.cmd`.
- Windows PowerShell 5.1: there is **no `&&`**. Chain with `; if ($?) { ... }`.
- Piping command output through PowerShell **mangles UTF-8** (accents, `✓`, `●`),
  which hides real error text. Write to a file and read that instead:
  ```powershell
  npx.cmd jest --maxWorkers=1 2>&1 | Out-File -FilePath "$env:TEMP\opencode\out.txt" -Encoding utf8
  ```

## Testing gotchas

- `render` is **async** in RNTL v14: `const { getByText } = await render(<X />)`.
  The global `screen` is not populated — always use the queries returned by
  `render`.
- `fireEvent.press` on a `Text` nested inside a `Pressable` **does not** trigger
  the press. Press an element with an `accessibilityRole`, or the `Pressable`.
- Never `import { describe, it } from 'jest-expo'` — it throws
  `SyntaxError: Cannot use import statement outside a module`. Use
  `@jest/globals`.
- `jest-expo` instantiates `NativeDatabase` at import time, so any test that
  reaches `expo-sqlite` needs:
  ```ts
  jest.mock('@/db/sqlite', () => ({
    getDatabase: jest.fn(() => null),
    isPersistenceEnabled: jest.fn(() => false),
    closeDatabase: jest.fn(),
  }));
  ```
- Components calling `useAppTheme` must be wrapped in `<ThemeProvider>`, and
  `expo-sqlite/kv-store` mocked (`getItemSync`, `setItemSync`).
- After changing a text input, wait for the re-render before pressing a button —
  use `findByText`, not `getByText`.

## Platform splits

- **Never import `expo-sqlite` from shared code.** Only from
  `src/db/sqlite.ts` / `sqlite.web.ts`. The web build is alpha and drags in a
  wasm worker plus COOP/COEP headers.
- `Alert.alert` is a **no-op stub** in `react-native-web` (empty class). Use
  `confirm()` from `src/lib/confirm.ts`; it falls back to `window.confirm`.
- `@react-native-community/datetimepicker` has no web support; `DateField`
  already falls back to a text input.

## Architecture rules

Each of these exists because breaking it caused a real bug:

- **`listBills()` must never return the internal array.** Return a copy. If the
  provider stores the same reference, `insertBill`'s mutation lands in React
  state and the bill renders twice with inflated totals.
- **`updateBill` SQL params must be explicit and ordered to match the `SET`
  clause.** Never `billParams(bill).slice(1)` — `SET` skips `created_at`, so
  every value shifts one position and the `UPDATE` matches **zero rows with no
  error**. `__tests__/db/binding-test.ts` pins the binding.
- **Reducer `add` must sort** by `fecha` then `createdAt`, matching
  `ORDER BY fecha ASC, created_at ASC`, or new bills jump to the top and re-sort
  themselves on restart.
- **`esSuscripcion`, `color`, `icono` are form state**, never derived from
  `catalogId`. Deriving them downgrades a subscription to a one-off bill when
  the user taps "Cambiar del catálogo".
- **`monto` is an integer.** Round on save — `parseMonto` rejects `"1.5"`, which
  would leave the edit form permanently unable to save.
- **All writes go through the provider** (`addBill` / `updateBill` / `payBill` /
  `deleteBill`): DB write first, then dispatch.
- Dates are ISO `YYYY-MM-DD` strings; amounts are numbers, never text.
- Keep business logic in `src/lib/` and `src/db/` as pure functions, separate
  from screens, so it is testable without mounting components.

## Known gaps

- **Web has no persistence** — `expo-sqlite` is alpha there, so web uses an
  in-memory store by design.
- Typed routes: `.expo/types/router.d.ts` is gitignored. On a fresh clone
  `npm run typecheck` fails until `npx.cmd expo start` has been run once.
- The native `updateBill` fix is verified by parameter counting, not by
  execution. Confirm on a real device: edit an amount, kill the app, reopen, and
  check it stuck.
- Notifications are intentionally out of scope.
