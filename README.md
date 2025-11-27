# Vạn Niên Lịch

Ứng dụng Lịch Vạn Niên (PWA) đậm chất Việt Nam, hỗ trợ xem ngày Âm/Dương chính xác, quản lý sự kiện cá nhân và nhắc nhở ngày lễ tết.

## Tính năng nổi bật

- **Lịch Âm/Dương Chính Xác**: Tra cứu ngày tháng, giờ Hoàng Đạo, Can Chi, Tiết Khí.
- **Quản lý Sự kiện**: Thêm sự kiện cá nhân theo ngày Âm hoặc Dương lịch.
- **Nhắc nhở Thông minh**: Hỗ trợ nhắc nhở trước ngày diễn ra, nhắc nhở Rằm/Mùng 1 và các ngày lễ lớn.
- **Cá nhân hóa**: Chế độ tối (Dark Mode), đổi hình nền, màu chủ đạo phong thủy, tùy chỉnh Font chữ.
- **PWA (Progressive Web App)**: Hỗ trợ cài đặt lên màn hình chính, hoạt động mượt mà trên iOS và Android.
- **Sao lưu & Phục hồi**: Dễ dàng bảo vệ dữ liệu cá nhân.

## Nguồn dữ liệu & Thuật toán

**Dự án này sử dụng mã nguồn và thuật toán tính toán Lịch Âm của tác giả Hồ Ngọc Đức.**
*   Thuật toán: [AmLich-JS](https://www.informatik.uni-leipzig.de/~duc/amlich/)
*   Tác giả: **Hồ Ngọc Đức**
*   Đây là thuật toán tiêu chuẩn, đảm bảo tính chính xác cho các quy tắc tính tháng nhuận và tiết khí của Việt Nam (bao gồm các trường hợp đặc biệt như năm 2025, 2033).

## Hướng dẫn Deploy lên Vercel

1.  **Fork/Clone** repository này về GitHub của bạn.
2.  Truy cập [Vercel](https://vercel.com) và đăng nhập.
3.  Chọn **Add New Project** -> **Import** repository bạn vừa tạo.
4.  Vercel sẽ tự động nhận diện đây là dự án **Vite**.
5.  Nhấn **Deploy**.
6.  Sau khi deploy xong, bạn có thể truy cập ứng dụng qua domain `.vercel.app`.

## Cài đặt trên điện thoại (PWA)

*   **iOS (Safari)**: Nhấn nút Share -> Chọn "Add to Home Screen" (Thêm vào MH chính).
*   **Android (Chrome)**: Nhấn menu 3 chấm -> Chọn "Install App" (Cài đặt ứng dụng).

## Tech Stack

*   React 19 (TypeScript)
*   Vite
*   Tailwind CSS
*   Google Gemini API (cho các tính năng văn hóa mở rộng)

---
*Được phát triển với niềm đam mê văn hóa Việt.*
