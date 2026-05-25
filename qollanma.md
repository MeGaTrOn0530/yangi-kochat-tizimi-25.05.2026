Frontend va backendni alohida server yoki joylarda ishga tushirish hamda ularni bir-biri bilan bog'lash juda keng tarqalgan va professional yondashuv hisoblanadi. Buni amalga oshirish qadamlarini batafsil tushuntirib beraman:
1. Frontendni alohida ishga tushirish (React / Vite)
Frontend bu asosan foydalanuvchi ko'radigan vizual qism bo'lib, u oxir-oqibat faqat statik fayllarga (HTML, CSS, JS) aylanadi.
Lokal (Dasturlash jarayonida) ishga tushirish:
Frontend papkasiga kirib, terminallardan quyidagi buyruqlarni bajarasiz:
code
Bash
npm install
npm run dev
Loyihangiz kompyuteringizda odatda http://localhost:5173 portida brauzerda ochiladi.
Production (Jonli efirga uzatish) uchun:
Loyiha to'liq tayyor bo'lgach, uni statik fayllarga yig'asiz:
code
Bash
npm run build
Bu buyruq loyihangizda dist yoki build deb nomlangan papka yaratadi. Ushbu papkani Vercel, Netlify, GitHub Pages yoki Firebase Hosting kabi platformalarga mutlaqo bepul va oson joylashtirishingiz mumkin.
2. Backendni alohida ishga tushirish (Node.js / Express)
Backend doimiy ravishda ishlab turishi, ma'lumotlar bazasi bilan aloqa qilishi va API so'rovlariga javob qaytarishi kerak.
Lokal (Dasturlash jarayonida) ishga tushirish:
Backend papkasida kerakli paketlarni o'rnatib, serverni yoqasiz:
code
Bash
npm install
node server.js   # yoki tsx server.ts
Backend odatda http://localhost:3000 (yoki istalgan boshqa portda) ishga tushadi.
Production (Jonli efirga uzatish) uchun:
Server doimiy ishlab turishi uchun uni Render, Railway, Heroku, DigitalOcean VPS yoki Google Cloud Run kabi bulutli xizmatlarga joylashtirasiz.
3. Ikkalasini o'zaro qanday bog'laysiz? (Eng muhim nuqtalar)
Frontend va backendni alohida ishlatganingizda ular ikki xil manzilda (portda) ishlagani sababli quyidagi ikki narsaga alohida e'tibor berish kerak:
A. CORS (Cross-Origin Resource Sharing) muammosini hal qilish
Xavfsizlik nuqtai nazaridan, brauzerlar bir manzildagi frontendga boshqa manzildagi backenddan ma'lumot olishga ruxsat bermaydi. Buning uchun backendda ruxsat berish (CORSni yoqish) shart.
Backendda o'rnatish:
code
Bash
npm install cors
Backend kodingizda sozlash (server.js):
code
JavaScript
const express = require('express');
const cors = require('cors');
const app = express();

// Frontend manzilingizga ruxsat berish
app.use(cors({
  origin: 'http://localhost:5173' // Dasturlashda frontend manzili
  // yoki jonli efirdagi manzil: 'https://mening-frontend-saytim.vercel.app'
}));
B. Frontendda API manzilini Environment Variable (Atrof-muhit o'zgaruvchilari) orqali boshqarish
Frontendda backendning manzilini kodning ichiga to'g'ridan-to'g'ri yozib qo'yish yaxshi yondashuv emas (chunki lokalda localhost:3000 bo'lsa, real serverda u o'zgaradi).
Frontendda .env faylini yaratasiz:
code
Env
VITE_API_URL=http://localhost:3000
Kodingizda API so'rovlarni quyidagicha yuborasiz:
code
JavaScript
// Misol uchun axios orqali:
const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/lessons`);
Tizimni serverga yuklaganingizda (masalan, Vercel va Render-da), shunchaki sozlamalar (Environment Variables) qismida VITE_API_URL qiymatini real backend manzilingizga (masalan, https://api.mening-saytim.com) o'zgartirib qo'yasiz. Shunda frontend kodingizni o'zgartirmasdan tizim to'g'ri ishlab ketaveradi.
