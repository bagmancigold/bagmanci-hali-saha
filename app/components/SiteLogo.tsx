import type { SVGProps } from "react";

type SiteLogoProps = SVGProps<SVGSVGElement> & { size?: number };

export default function SiteLogo({ size = 24, ...props }: SiteLogoProps) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="17" cy="8.5" r="4" fill="currentColor" />
    <circle cx="39" cy="18" r="4.5" fill="currentColor" />
    <path d="M15.1 14.1c1.5-1.5 4.1-1.6 5.8-.2l3.8 3.1 5.6 1.6c1.4.4 2.2 1.8 1.8 3.1-.4 1.4-1.8 2.2-3.2 1.8l-6.4-1.8c-.5-.1-1-.4-1.4-.7l-2-1.6-1.2 6.1 5.7 3.8c1.2.8 1.5 2.5.7 3.7-.8 1.2-2.5 1.5-3.7.7l-7-4.7c-1-.7-1.5-1.8-1.3-3l1.4-7.3-3.9 2.7-3.5 4.2c-.9 1.1-2.5 1.3-3.6.4-1.1-.9-1.3-2.5-.4-3.6l4-4.8c.2-.2.4-.4.7-.6l6.7-4.7Z" fill="currentColor" />
    <path d="m17.9 30.4-4.4 7.5c-.7 1.2-.3 2.8.9 3.5 1.2.7 2.8.3 3.5-.9l4.8-8.1-4.8-2Z" fill="currentColor" />
    <path d="m25.8 22.4 6.2 1.8 4.7-1.5c1.4-.4 2.8.4 3.2 1.8.4 1.4-.4 2.8-1.8 3.2l-5.5 1.7c-.5.2-1 .2-1.5 0l-6.8-2.1-2.1-2.8 3.6-2.1Z" fill="currentColor" />
  </svg>;
}
