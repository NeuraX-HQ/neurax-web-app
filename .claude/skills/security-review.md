# Security Review — NutriTrack

Use this skill when reviewing code for security vulnerabilities before committing or pushing, or when auditing existing code for sensitive information leaks.

Invoke with: `/security-review` or `/security-review <file-or-directory>`

---

## 1. Sensitive Data Scan

Search the entire codebase (or specified path) for leaked secrets:

```
Pattern                          | What it catches
---------------------------------|------------------------------------------
AKIA[0-9A-Z]{16}                 | AWS Access Key ID (hardcoded)
[0-9a-zA-Z/+]{40}               | AWS Secret Key candidates
-----BEGIN (RSA|EC|PRIVATE)      | PEM private keys
(password|passwd|secret|token)\s*[:=]\s*['"][^'"]{8,} | Hardcoded credentials
(api_key|apikey|client_secret)\s*[:=]\s*['"] | Hardcoded API keys
mongodb(\+srv)?://[^@]+@         | Database connection strings with credentials
eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,} | JWT tokens
```

### NOT sensitive (do not flag):
- Cognito `user_pool_id`, `user_pool_client_id`, `identity_pool_id` — public config
- GraphQL/AppSync endpoint URLs — public
- S3 bucket names — public config
- ARN patterns with wildcard `*:*` — no account ID exposed
- GitHub Actions `${{ secrets.* }}` — references, not actual values
- `.env.example` with placeholder values like `your_api_key_here`
- `amplify_outputs.json` — auto-generated Amplify public config

---

## 2. File-Level Checks

| Check | Action |
|---|---|
| `.env`, `.env.local`, `.env.prod` tracked by git? | `git ls-files --cached \| grep -iE '\.env'` — must return empty |
| `.gitignore` covers secrets? | Must include: `.env`, `*.key`, `*.pem`, `credentials*`, `amplify/team-provider-info.json` |
| `node_modules/` tracked? | Must not be in git |
| Lock files with integrity hashes? | `package-lock.json` — safe to commit (no secrets) |
| Large binary files? | Flag any >5MB file in git — may contain embedded data |

---

## 3. OWASP Top 10 — React Native / Amplify Focus

### A01: Broken Access Control
- [ ] Amplify data models use `@auth` rules with owner-based access
- [ ] Lambda functions validate `event.identity.sub` before DynamoDB writes
- [ ] Owner field format matches Amplify identity claim (`sub::cognitoUsername`)
- [ ] No public read/write on sensitive models (user, FoodLog, Friendship)

### A02: Cryptographic Failures
- [ ] Auth tokens stored via `expo-secure-store`, not `AsyncStorage`
- [ ] No plaintext passwords in code or logs
- [ ] HTTPS enforced for all API endpoints

### A03: Injection
- [ ] No raw SQL — Amplify uses DynamoDB (NoSQL, parameterized)
- [ ] User input sanitized before passing to `dangerouslySetInnerHTML` (if any)
- [ ] Lambda input validated before DynamoDB operations
- [ ] No `eval()` or `new Function()` with user input

### A04: Insecure Design
- [ ] Rate limiting on friend requests (`MAX_PENDING_REQUESTS`)
- [ ] Friend code length sufficient to prevent brute-force (8 chars, 32-char alphabet = ~1.1 trillion combinations)
- [ ] Mock login disabled or gated behind `__DEV__` in production builds

### A05: Security Misconfiguration
- [ ] `amplify_outputs.json` does not contain secrets (only public IDs)
- [ ] CORS not set to `*` in production Lambda/API
- [ ] Amplify auth password policy enforces minimum length (8+)

### A07: Authentication Failures
- [ ] Session expiry handled (check `loginTime` + TTL)
- [ ] `signOut()` clears all stores (authStore, mealStore, fridgeStore, friendStore)
- [ ] Biometric auth properly guarded (`biometricEnabled && biometricSupported && biometricEnrolled`)

### A08: Data Integrity
- [ ] `package-lock.json` committed (prevents supply chain drift)
- [ ] No `--no-verify` in any scripts or CI
- [ ] Lambda `package.json` pinned or uses lock file

### A09: Logging & Monitoring
- [ ] No PII (email, userId) logged at INFO level in production
- [ ] Error logs use `console.error` with context, not raw user data
- [ ] No `console.log(password)` or `console.log(token)` anywhere

---

## 4. Pre-Push Checklist

Run before every `git push`:

```bash
# 1. Check for tracked .env files
git ls-files --cached | grep -iE '\.env$|credential|\.pem|\.key$'

# 2. Scan staged changes for secrets
git diff --cached | grep -iE 'AKIA|password\s*=|secret\s*=|api_key\s*='

# 3. Check amplify_outputs.json for non-public data
grep -iE 'secret|password|private_key' amplify_outputs.json

# 4. Verify .gitignore covers sensitive patterns
grep -E '\.env|\.key|\.pem|credential' .gitignore

# 5. Check for large files that shouldn't be committed
git diff --cached --stat | awk '{print $NF}' | xargs -I{} du -sh {} 2>/dev/null | sort -rh | head -5
```

All commands must return clean (empty or expected) results before pushing.

---

## 5. NutriTrack-Specific Patterns

| Pattern | Location | Status |
|---|---|---|
| `MOCK_LOGIN` credentials | `app/login.tsx` | Acceptable for dev — gate behind `__DEV__` for prod |
| Cognito pool IDs in `amplify_outputs.json` | Root | Safe — public config by Amplify design |
| DynamoDB ARN wildcards in `backend.ts` | `amplify/backend.ts` | Safe — no account ID, uses `*:*` |
| `expo-secure-store` for auth tokens | `src/services/authService.ts` | Correct — encrypted storage |
| `AsyncStorage` for meal/fridge data | `src/store/mealStore.ts` | Acceptable — non-sensitive data |
| Friend codes | `src/services/userService.ts` | Safe — 8-char random, no PII |
