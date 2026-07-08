"use client";

import { usePathname } from "next/navigation";

export function useActiveRoute() {
  const pathname = usePathname();
  return (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };
}
