import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Page-content container. The max width matches the masthead and footer so the
 * page has one measure; the rules at the top and bottom of a section line up
 * with the rule under the nav.
 */
export default function Container({ children, className = "" }: ContainerProps) {
  return (
    <div
      className={`mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-6 lg:py-8 ${className}`}
    >
      {children}
    </div>
  );
}
