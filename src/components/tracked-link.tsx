"use client";

import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics-client";

type TrackedLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  eventName: string;
  eventData?: Record<string, string>;
  newTab?: boolean;
};

export function TrackedLink({
  href,
  children,
  className,
  eventName,
  eventData,
  newTab = false,
}: TrackedLinkProps) {
  return (
    <a
      className={className}
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noreferrer" : undefined}
      onClick={() => trackEvent(eventName, eventData)}
    >
      {children}
    </a>
  );
}
