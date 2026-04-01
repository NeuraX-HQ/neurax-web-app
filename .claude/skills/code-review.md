# Code Review — NutriTrack

Use this skill when reviewing code changes for bugs, logic errors, quality issues, and adherence to project conventions before merging or pushing.

Invoke with: `/code-review` or `/code-review <file-or-directory-or-PR-url>`

---

## 1. Review Process

### Step 1: Scope
- If a PR URL is given: `gh pr diff <number>` to get all changes
- If a file/directory is given: review that path
- If no argument: review all uncommitted changes (`git diff` + `git diff --cached` + untracked files)

### Step 2: Categorize findings by confidence
- **HIGH** (>90% sure it's a bug): Logic errors, runtime crashes, data loss, security issues
- **MEDIUM** (70-90%): Potential issues that depend on context — race conditions, edge cases
- **LOW** (<70%): Style, naming, minor improvements — mention only if pattern is systemic

**Only report HIGH and MEDIUM by default.** Report LOW only if explicitly requested.

### Step 3: Output format
```
## [HIGH] <file>:<line> — <short title>
<explanation + fix suggestion>

## [MEDIUM] <file>:<line> — <short title>
<explanation + fix suggestion>
```

---

## 2. Bug Detection Checklist

### TypeScript / React Native
- [ ] `useState` initial value type matches usage
- [ ] `useEffect` dependency array is complete (no stale closures)
- [ ] `useEffect` cleanup function handles unmount (timers, subscriptions, listeners)
- [ ] Async operations check component mounted state before `setState`
- [ ] Optional chaining used where values can be `null`/`undefined`
- [ ] Array `.map()` / `.filter()` callbacks return correct types
- [ ] `key` prop on list items is stable and unique (not array index for dynamic lists)

### Zustand Store
- [ ] `get()` used inside actions (not stale closure of `state`)
- [ ] State updates are immutable (spread operator, not mutation)
- [ ] `set()` calls don't overwrite unrelated state fields
- [ ] Async actions handle errors and reset `isLoading`
- [ ] No circular dependencies between stores (use lazy `require()` if needed)

### AsyncStorage
- [ ] `JSON.parse()` wrapped in try/catch (corrupt data handling)
- [ ] Storage keys are unique and namespaced (`@nutritrack_*`)
- [ ] Large data is not stored unnecessarily (prefer cloud sync)
- [ ] Logout clears all user-scoped storage keys

### Amplify / AWS
- [ ] `generateClient<Schema>()` called once at module level, not per-request
- [ ] DynamoDB operations handle `errors` array from Amplify response
- [ ] Lambda functions validate `event.identity` before processing
- [ ] Owner field format: `${sub}::${cognitoUsername}` (NOT `${sub}::${sub}`)
- [ ] DynamoDB `Scan` with `FilterExpression` does NOT use `Limit` (limit applies before filter)
- [ ] `GetCommand` used for single-item lookup by full primary key (not `QueryCommand`)
- [ ] Lambda error responses include meaningful status codes

### Navigation (Expo Router)
- [ ] `router.push()` targets exist as files in `app/` directory
- [ ] `router.replace()` used for auth redirects (prevents back navigation to login)
- [ ] Route params are typed and validated
- [ ] No navigation during render (must be in `useEffect` or event handler)

---

## 3. Performance Checklist

- [ ] No expensive computation inside render (move to `useMemo` or `useCallback`)
- [ ] Large lists use `FlatList` / `SectionList`, not `.map()` in `ScrollView`
- [ ] Images use proper caching and sizing (not raw base64 in state)
- [ ] API calls are not duplicated (check `useEffect` runs once, not on every render)
- [ ] Fire-and-forget operations use `.catch(() => {})` to prevent unhandled rejection

---

## 4. NutriTrack Convention Checks

### Naming
- [ ] Store files: `src/store/<name>Store.ts` with `use<Name>Store` export
- [ ] Service files: `src/services/<name>Service.ts`
- [ ] Screen files: `app/<route>.tsx` (kebab-case for multi-word)
- [ ] Constants: UPPER_SNAKE_CASE
- [ ] Types/Interfaces: PascalCase

### i18n
- [ ] All user-visible strings use `t('key')` from `useAppLanguage()`
- [ ] New strings added to both `vi` and `en` in `src/i18n/translations.ts`
- [ ] No hardcoded Vietnamese or English strings in components

### Error Handling
- [ ] User-facing errors shown via `Alert.alert()` or error state, not `console.error` only
- [ ] Network errors have retry logic or graceful fallback
- [ ] Loading states (`isLoading`) set to `false` in both success and error paths

### Data Flow
- [ ] Meals use `selectedDateStr` from mealStore (not `new Date()` directly)
- [ ] Cloud sync is non-blocking (fire-and-forget with `.catch()`)
- [ ] Optimistic updates: local state updated before cloud call, rolled back on failure

---

## 5. Common Pitfalls in This Codebase

| Pitfall | Where | What to check |
|---|---|---|
| Amplify owner format mismatch | Lambda handlers | Must be `sub::cognitoUsername`, not `sub::sub` |
| DynamoDB Scan + Limit | Lambda queries | `Limit` applies BEFORE `FilterExpression` — use pagination instead |
| expo-clipboard crash | Any screen | Native module not in Expo Go — use `Alert.alert()` fallback |
| Circular store imports | Store files | Use `require()` inside functions, not top-level `import` |
| Auth guard race condition | `app/_layout.tsx` | `initializeAuth` timeout must be long enough (15s+) |
| signOut before signIn | `app/login.tsx` | Only call `signOut()` on specific "unknown error", not unconditionally |
| Missing `@aws-amplify/react-native` | `src/lib/amplify.ts` | Required for SRP auth in React Native |
| Metro watcher crash | `.amplify/` artifacts | `metro.config.js` must exclude `.amplify/` |

---

## 6. PR Review Template

When reviewing a PR, structure the review as:

```markdown
## Summary
<1-2 sentences describing what the PR does>

## Findings

### [HIGH] ...
### [MEDIUM] ...

## Checklist
- [ ] No hardcoded secrets or PII
- [ ] i18n strings added for both vi/en
- [ ] Error handling covers loading/error/success states
- [ ] Amplify auth rules and owner format correct
- [ ] Tests pass (if applicable)

## Verdict
APPROVE / REQUEST_CHANGES / COMMENT
```
