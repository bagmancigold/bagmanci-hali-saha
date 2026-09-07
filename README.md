# Bağmancı Halı Saha

Güncel üretim sürümü: Bağmancı Halı Saha rezervasyon, paket seçimi ve yönetim paneli.

Tailwind CSS ve TypeScript kullanan Next.js halı saha yönetim ve rezervasyon arayüzü.

## Başlatma

Node.js 20 veya üzerini kurduktan sonra proje klasöründe:

```bash
npm install
npm run dev
```

Ardından `http://localhost:3000` adresini açın.

## İçerik

- Responsive ana sayfa: hero, tesis yaklaşımı ve iletişim/konum alanları
- Gün ve saat seçilebilir rezervasyon takvimi
- Dolu saatlerin devre dışı bırakılması ve tarayıcı içi rezervasyon akışı
- Maç kayıtları için video arşivi ve oynatıcı tasarımı
- Tek maç, haftalık takım ve aylık sezon üyelik planları

Rezervasyonlar bu demo sürümünde tarayıcı oturumu içinde tutulur. Kalıcı veri için `app/page.tsx` içindeki `submitBooking` fonksiyonu bir API route veya veritabanı servisine bağlanabilir.