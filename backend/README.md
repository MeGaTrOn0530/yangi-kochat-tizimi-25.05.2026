# Issiqxona Tizimi - Backend Server (Mening Ma'lumotlarim/Xizmatlarim)

Ushbu papkada loyihaning mustaqil **Node.js + Express + TypeScript** yordamida yozilgan backend qismi joylashgan. Bu server ma'lumotlar ombori (JSON fayl yoki ixtiyoriy ravishda MySQL) bilan bevosita ishlaydi va frontend uchun REST API xizmatlarini taqdim etadi.

## Xususiyatlari:
- **Mustaqil API Server**: Hech qanday frontend renderisiz faqat toza REST API o'laroq ishlaydi.
- **Dual-Database Mode**: Standart holatda `db.json` fayli yordamida ishga tushadi, lekin `.env` orqali MySQL ulanish parametrlari berilsa, avtomatik ravishda jadval sxemalarini yaratib, MySQL-ga ulanadi va sinxron ishlaydi!
- **CORS Yoqilgan**: Frontend boshqa port yoki domenda joylashganda bemalol so'rov yuborishi uchun cross-origin so'rovlar ruxsat etilgan.

## O'rnatish va Ishga Tushirish Bosqichlari:

1. **Kutubxonalarni o'rnatish**:
   Ushbu papka ichiga kirib quyidagi buyruqni terminalda bajaring:
   ```bash
   npm install
   ```

2. **Muhit o'zgaruvchilarini sozlash (Optional)**:
   `.env.example` faylini nusha qilib `.env` nomi bilan yarating va kerakli port yoki MySQL sozlamalarini kiriting. Agar MySQL ishlatmasangiz, standart holatda local JSON fayl ishga tushadi.

3. **Ishga tushirish (Development)**:
   TypeScript-da to'g'ridan-to'g'ri ishga tushirish uchun:
   ```bash
   npm run dev
   ```
   Server standart ravishda `http://localhost:5000` portida ishlay boshlaydi.

4. **Production Build tayyorlash**:
   ```bash
   npm run build
   npm start
   ```
