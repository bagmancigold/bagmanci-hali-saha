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
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Kafa */}
      <circle cx="15" cy="6.5" r="2.8" fill="currentColor" />

      {/* Ronaldo Arkadan Vuruş Silüeti (Gövde, Denge Kolları ve Bacaklar) */}
      <path
        d="M14.2 9.5C12.5 9.8 10.8 10.6 8.5 12.2C7.8 12.7 7.5 13.5 8.1 14.1C8.7 14.7 9.6 14.5 10.4 13.8L12.2 12.5V17L9.5 24.5C9.2 25.3 9.6 26.2 10.5 26.3C11.3 26.4 12 25.8 12.3 25L14.5 19.5L16.8 21.8L21 24.5C21.8 25 22.8 24.7 23.2 23.9C23.6 23.1 23.2 22 22.3 21.5L18.5 18.5L16.5 15.5V11.8C18.2 12.6 19.8 13.6 21.2 14.8C21.9 15.4 22.8 15.2 23.3 14.5C23.8 13.8 23.5 12.9 22.7 12.3C20.6 10.8 18.2 9.8 15.8 9.5H14.2Z"
        fill="currentColor"
      />

      {/* Vurulan Futbol Topu */}
      <circle cx="24.5" cy="27" r="2.5" fill="currentColor" />
      {/* Top Detayı */}
      <circle cx="24.5" cy="27" r="1.2" fill="#FBBF24" />
    </svg>
  );
}