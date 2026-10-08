import type { SVGProps } from "react";

/** Compact rice-bowl mark, drawn to stay legible at favicon sizes. */
export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      width="40"
      height="40"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect x="4" y="4" width="35" height="35" rx="8" fill="#202938" />
      <rect
        x="1"
        y="1"
        width="35"
        height="35"
        rx="8"
        fill="#2563eb"
        stroke="#202938"
        strokeWidth="2"
      />
      <path
        d="M13 16c-3-3 3-4 0-7M23 16c-3-3 3-4 0-7"
        stroke="#fef3c7"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M8 21h21c-1 7-5 10-10.5 10S9 28 8 21Z"
        fill="#fff"
        stroke="#202938"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 21h21"
        stroke="#facc15"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
