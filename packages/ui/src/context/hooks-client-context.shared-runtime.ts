import { createContext } from "react";

export const SearchParamsContext = createContext<URLSearchParams | null>(null);
export const PathnameContext = createContext<string | null>(null);
