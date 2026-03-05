# Hướng dẫn chi tiết tạo file APK cho NutriTrack

Vì dự án NutriTrack đang sử dụng **Expo** (cùng với các native plugins như Camera, Voice), cách chuẩn và tốt nhất để xuất ra file cài đặt `.apk` cho Android là sử dụng hệ thống **EAS Build** (Expo Application Services).

Dưới đây là các bước chi tiết để bạn tự build ra file APK.

## Phần 1: Các bước chuẩn bị ban đầu (Chỉ làm 1 lần)

**Bước 1: Cài đặt công cụ EAS CLI**
Mở Terminal/Command Prompt trên máy tính và chạy lệnh:
```bash
npm install -g eas-cli
```

**Bước 2: Đăng nhập vào tài khoản Expo**
Nếu chưa có tài khoản, hãy đăng ký miễn phí tại [expo.dev](https://expo.dev). Sau đó chạy:
```bash
eas login
```
Điền username và password của bạn vào.

**Bước 3: Cấu hình project để xuất file APK**
Mặc định, Expo sẽ build ra file `.aab` để đăng lên Google Play. Để lấy được file `.apk` cài trực tiếp lên máy, chúng ta cần tùy chỉnh file `eas.json`.

Mở file `eas.json` ở thư mục gốc của project (nếu chưa có, chạy lệnh `eas build:configure`), và cấu hình nó tương tự như sau:

```json
{
  "cli": {
    "version": ">= 13.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```
*Lưu ý: Đoạn quan trọng nhất là `"buildType": "apk"` bên trong phần `"preview"` của `"android"`.*

---

## Phần 2: Tiến hành Build APK

Mỗi lần bạn code xong và muốn xuất ra APK mới, chỉ cần chạy đúng 1 lệnh này trong thư mục project:

```bash
eas build -p android --profile preview
```

**Quá trình này sẽ diễn ra như sau:**
1. Lệnh này sẽ gói toàn bộ source code của bạn và đẩy lên máy chủ của Expo.
2. Máy chủ Expo sẽ tiến hành biên dịch (có thể mất từ 10 - 20 phút tùy vào hàng đợi miễn phí).
3. Khi bạn chạy lệnh, nó sẽ cung cấp cho bạn 1 đường link đến trang web theo dõi quá trình build.
4. Khi build hoàn tất 100%, Terminal (nếu bạn vẫn đang mở) hoặc trang web dashboard của Expo sẽ hiện lên một **chữ Download** hoặc một đường link để tải trực tiếp file `.apk` về máy tính.

---

## 💡 Mẹo nhỏ

- **Cài đặt thử trên máy ảo hoặc thiết bị thật:** Sau khi tải file `.apk` về, bạn chép nó vào điện thoại Android qua cáp USB, Zalo, Google Drive... rồi bấm vào để cài đặt. (Lưu ý phải cho phép cài đặt ứng dụng từ nguồn không xác định).
- **Lỗi không build được do môi trường:** Nếu lệnh trên báo lỗi liên quan đến package, hãy chắc chắn xóa `node_modules` và thư mục `android` (nếu có), sau đó chạy `npm install` lại cho sạch sẽ trước khi build.

Chúc bạn xuất APK thành công để test ứng dụng nha!
