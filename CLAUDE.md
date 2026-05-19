# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product

**Saha CRM** — an offline-first React Native mobile CRM for field sales teams and small businesses. All data lives on-device in SQLite; there is no backend, cloud sync, or auth. Export/import handles backup and transfer.

## Commands

```bash
npm start              # Metro bundler
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run android:release  # Run release build on Android
npm run apk:release    # Build release APK → android/app/build/outputs/apk/release/app-release.apk
npm run lint           # ESLint
npm test               # Jest (run a single file: npx jest path/to/file.test.tsx)
```

## Architecture

### Data flow

Screen → Zustand Store → Repository → SQLite (react-native-quick-sqlite)

- **Screens** consume Zustand stores and handle navigation. No direct SQL in screens.
- **Stores** (`src/store/`) orchestrate repository calls and hold in-memory state via Zustand.
- **Repositories** (`src/repositories/`) are the only place raw SQL is written. Each repository exports typed functions.
- **DB layer** (`src/db/`) manages the SQLite connection singleton (`client.ts`) and version-based migrations (`init.ts`). Schema: `customers`, `terms`, `activities`, `feature_usage`.

### Navigation

Bottom tab navigator with four tabs: Home, Customers, Terms, Settings. Customers tab uses a nested stack navigator (`CustomerStack`). Navigation types are defined in `src/types/navigation.ts`.

### UI system

- **NativeWind** (Tailwind v3) for class-based styling in JSX.
- **Theme** (`src/components/ui/theme.ts`) provides `darkModeColors` / `lightModeColors`, `uiStyles`, `surfaceStyles`, and `SHADOWS` Proxy objects that resolve at render time. Use `useAppTheme()` to access `colors` and `isDark`.
- Reusable primitives in `src/components/ui/`: `AppButton`, `AppScreen`, `AppTopBar`, `PageHeader`, `SurfaceCard`, `EmptyState`, `BottomSheetModal`, etc.
- Domain components live under `src/components/customer/`, `src/components/activity/`, `src/components/term/`.

### Forms

React Hook Form + Zod. Use the custom `createZodResolver` from `src/utils/createZodResolver.ts`. All modal forms live in `src/modals/`.

### Internationalisation

i18next with `tr` and `en` namespaces. Translation files: `src/i18n/translations/tr.json` and `en.json`. Language preference is persisted in AsyncStorage. All user-visible strings must go through `useTranslation()` — never hardcode UI text. Use correct Turkish characters in translation values (`müşteri`, `görüşme`, not `musteri`, `gorusme`).

### Database migrations

Migrations are append-only entries in the `MIGRATIONS` array in `src/db/init.ts`. Each entry has a `version` (integer) and `statements` (SQL). `PRAGMA user_version` tracks applied version. Always wrap schema changes in a new migration entry — never mutate existing ones.

### Notifications

Local/offline only via `@notifee/react-native`. `src/services/termNotifications.ts` syncs term reminders on app launch.

## Coding rules

- Keep TypeScript types narrow and explicit.
- Store dates as ISO strings; format for display using locale helpers in `src/utils/dateUtils.ts`.
- Never bypass the repository layer; screens must not call `getDB()` directly.
- Keep store logic in `src/store/`; don't scatter it across screens.
- Before adding a new data field, consider the migration impact and backward compatibility.
- Require user confirmation before any action that can delete data.

## Git remotes

- `origin` — legacy `mini-crm` repo (do not push without explicit request)
- `saha` — active `saha-crm` repo: `git push saha main`
