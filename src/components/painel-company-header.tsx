"use client";
import {usePathname} from "next/navigation";
import type {ReactNode} from "react";
export function PainelCompanyHeader({children}:{children:ReactNode}) {
 return usePathname() === "/painel/pagina" ? null : children;
}
