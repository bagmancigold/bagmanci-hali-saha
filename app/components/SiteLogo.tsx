export default function SiteLogo({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Ronaldo Kafa */}
      <circle cx="15.8" cy="4.6" r="2.1" />

      {/* Ronaldo Gövde, Sol Denge Kolu ve Sağ Kol */}
      <path
        d="M14.6 7.4C13.2 7.7 10.4 9.2 6.8 11.6C4.8 12.9 3.2 13.8 2.3 14.4C1.7 14.8 1.8 15.6 2.4 15.9C3.1 16.2 3.9 15.8 5.2 14.8L9.2 12.6L12.4 11.4L12.2 17.2L17.8 17.2L17.8 13.2L20.6 15.2C21.4 15.8 22.4 15.9 23.1 15.4C23.8 14.8 23.8 13.8 23.1 13L20.2 10.1L17.5 7.6C16.4 7.3 15.5 7.3 14.6 7.4Z"
      />

      {/* Şort & Yere Basan Sol Bacak (Krampon Çime Basıyor) */}
      <path
        d="M12.2 17.2L11.1 21.2C10.8 22.4 11.3 23.6 12 24.6L12.9 29.2C13.1 30.1 13.7 30.8 14.6 30.8C15.5 30.8 16.1 30.1 16 29.2L15.2 24.8L15.6 21.2L14.8 17.2H12.2Z"
      />

      {/* Havaya Kalkan Sağ Bacak (Geriye Doğru Bükülü Şut Hareketi) */}
      <path
        d="M15.4 17.2L17.8 17.2L20.8 20.4C21.5 21.2 21.2 22.4 20.3 22.8C19.4 23.2 18.3 22.8 17.8 21.9L16.8 20.2L13.8 20.8C12.7 21 12 20.2 12.3 19.2C12.6 18.3 13.6 18 14.5 18.4L16.4 19.2L15.4 17.2Z"
      />

      {/* Krampon Tabanı / Dişleri Detayı (Havadaki Ayak) */}
      <path
        d="M11.6 19.5L10.6 20.8C10.2 21.3 10.6 22 11.2 22C11.8 22 12.4 21.5 12.6 20.8L12.8 19.8L11.6 19.5Z"
      />

      {/* Yerdeki Futbol Topu */}
      <circle cx="22" cy="29.2" r="3.2" />

      {/* Şampiyonlar Ligi Yıldız Deseni Kesikleri */}
      <path
        d="M22 27.2L22.6 28.5L24 28.6L22.9 29.5L23.3 30.8L22 30L20.7 30.8L21.1 29.5L20 28.6L21.4 28.5L22 27.2Z"
        fill="#FBBF24"
      />
    </svg>
  );
}