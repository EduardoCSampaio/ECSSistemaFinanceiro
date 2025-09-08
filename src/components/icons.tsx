import type { SVGProps } from 'react';

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 20V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v16" />
      <path d="M16 20V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v16" />
      <path d="M2 20h20" />
    </svg>
  ),
};
