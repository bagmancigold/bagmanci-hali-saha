import type { SVGProps } from "react";

type SiteLogoProps = SVGProps<SVGSVGElement> & { size?: number };

export default function SiteLogo({ size = 24, ...props }: SiteLogoProps) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="35.5" cy="12.5" r="4.5" fill="currentColor" />
    <circle cx="38" cy="34" r="5" fill="currentColor" />
    <path d="M22.7 14.5c2.3-1.7 5.5-.8 6.6 1.8l2.5 5.9 6.9 2.2c1.4.4 2.2 1.9 1.8 3.3-.5 1.4-2 2.1-3.4 1.7l-8.2-2.3c-1.1-.3-2-.9-2.7-1.8l-2.2-3-1.4 5.9 5.5 6.1c1 1.1.9 2.8-.2 3.8-1.1 1-2.8.9-3.8-.2l-6.5-7.2c-.7-.8-1-1.9-.7-3l2.1-8.4-4.7 3.7-3.8 5.3c-.9 1.2-2.6 1.5-3.8.6-1.2-.9-1.5-2.6-.6-3.8l4.1-5.7c.2-.3.5-.6.8-.8l7.7-5.5Z" fill="currentColor" />
    <path d="m20.3 31.5-3.8 8.2c-.6 1.4 0 3 1.4 3.6 1.4.6 3 0 3.6-1.4l4.1-8.8-5.3-1.6Z" fill="currentColor" />
  </svg>;
}
