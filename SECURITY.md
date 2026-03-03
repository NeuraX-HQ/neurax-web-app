# Security Features - NutriTrack

## Biometric Authentication

NutriTrack hỗ trợ xác thực sinh trắc học (Face ID, Touch ID, Fingerprint) để bảo vệ dữ liệu sức khỏe của bạn.

### Tính năng

1. **Session Management**
   - Đăng nhập một lần, giữ session cho đến khi logout
   - Token được lưu trữ an toàn trong SecureStore
   - Tự động kiểm tra session khi mở app

2. **Biometric Authentication (Tùy chọn)**
   - Yêu cầu xác thực sinh trắc học khi mở app
   - Có thể bật/tắt trong Settings
   - Hỗ trợ Face ID (iOS), Touch ID (iOS), Fingerprint (Android)
   - Fallback về PIN/Password nếu biometric không khả dụng

3. **Secure Storage**
   - Auth tokens được lưu trong Expo SecureStore (Keychain trên iOS, KeyStore trên Android)
   - Session data được mã hóa
   - Tự động xóa khi logout

### Cách sử dụng

#### Bật Biometric Authentication

1. Mở app và đăng nhập
2. Vào **Settings** > **Security**
3. Bật **Biometric Authentication**
4. Lần sau mở app sẽ yêu cầu xác thực

#### Sử dụng trong code

```typescript
import { useAuthStore } from '../src/store/authStore';

// Check authentication status
const { isAuthenticated, checkSession } = useAuthStore();

// Login
await login(email, userId, token);

// Logout
await logout();

// Check biometric availability
await checkBiometricAvailability();

// Authenticate with biometric
const success = await authenticateWithBiometric('Verify your identity');
```

#### Bảo vệ hành động nhạy cảm

```typescript
import { useBiometricAuth } from '../src/hooks/useBiometricAuth';

const { requireAuth } = useBiometricAuth();

// Require biometric for sensitive action
await requireAuth(async () => {
    // Your sensitive action here
    await deleteUserData();
}, 'Authenticate to delete data');
```

### API Reference

#### authService.ts

- `isBiometricSupported()` - Kiểm tra thiết bị có hỗ trợ biometric
- `isBiometricEnrolled()` - Kiểm tra đã đăng ký biometric chưa
- `authenticateWithBiometric(message)` - Thực hiện xác thực
- `saveAuthToken(token)` - Lưu token an toàn
- `getAuthToken()` - Lấy token
- `saveSession(session)` - Lưu session
- `getSession()` - Lấy session
- `clearSession()` - Xóa session (logout)
- `setBiometricEnabled(enabled)` - Bật/tắt biometric
- `isBiometricEnabled()` - Kiểm tra trạng thái biometric

#### authStore.ts (Zustand)

```typescript
interface AuthState {
    isAuthenticated: boolean;
    userId: string | null;
    email: string | null;
    biometricEnabled: boolean;
    biometricSupported: boolean;
    biometricEnrolled: boolean;
    
    login: (email, userId, token) => Promise<void>;
    logout: () => Promise<void>;
    checkSession: () => Promise<boolean>;
    setBiometricEnabled: (enabled) => Promise<void>;
    checkBiometricAvailability: () => Promise<void>;
    authenticateWithBiometric: (message?) => Promise<boolean>;
}
```

### Security Best Practices

1. **Token Management**
   - Tokens được lưu trong SecureStore, không phải AsyncStorage
   - Tự động xóa khi logout
   - Không log tokens ra console trong production

2. **Session Validation**
   - Kiểm tra session khi app khởi động
   - Redirect về login nếu session không hợp lệ
   - Implement token refresh nếu cần

3. **Biometric Settings**
   - User có toàn quyền kiểm soát bật/tắt
   - Không bắt buộc nếu thiết bị không hỗ trợ
   - Có fallback về password/PIN

4. **Error Handling**
   - Graceful fallback khi biometric fail
   - Clear error messages cho user
   - Log errors cho debugging (không log sensitive data)

### Roadmap

- [ ] Implement actual OAuth providers (Google, Apple, Facebook)
- [ ] Add email/password authentication
- [ ] Token refresh mechanism
- [ ] Biometric for specific actions (delete data, export, etc.)
- [ ] Auto-lock after inactivity
- [ ] Multiple biometric attempts limit
- [ ] Security audit logging

### Dependencies

```json
{
  "expo-local-authentication": "^17.0.0",
  "expo-secure-store": "^13.0.0",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "zustand": "^5.0.11"
}
```

### Platform Support

| Feature | iOS | Android |
|---------|-----|---------|
| Face ID | ✅ | ❌ |
| Touch ID | ✅ | ❌ |
| Fingerprint | ❌ | ✅ |
| Face Unlock | ❌ | ✅ |
| SecureStore | ✅ (Keychain) | ✅ (KeyStore) |

### Testing

```bash
# Run on iOS simulator (biometric simulation available)
npm run ios

# Run on Android emulator (configure fingerprint in settings)
npm run android

# Test biometric on physical device for best results
```

### Troubleshooting

**Biometric không hoạt động?**
- Kiểm tra thiết bị đã đăng ký Face ID/Touch ID/Fingerprint chưa
- Restart app
- Check permissions trong Settings

**Session bị mất?**
- Kiểm tra AsyncStorage và SecureStore
- Clear app data và login lại
- Check console logs

**Authentication failed?**
- Thử lại với biometric
- Sử dụng fallback (PIN/Password)
- Tắt biometric trong Settings nếu cần
