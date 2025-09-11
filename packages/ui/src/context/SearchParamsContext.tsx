import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

interface SearchParamsContextType {
  searchParams: URLSearchParams;
  setSearchParams: React.Dispatch<React.SetStateAction<URLSearchParams>>;
}

const SearchParamsContext = createContext<SearchParamsContextType | null>(null);

export function SearchParamsProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useState<URLSearchParams>(
    new URLSearchParams(window.location.search),
  );

  useEffect(() => {
    const url = new URL(`${window.location.origin}${window.location.pathname}`);
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    window.history.pushState({}, "", url);
  }, [searchParams]);

  return (
    <SearchParamsContext
      value={{
        searchParams,
        setSearchParams,
      }}
    >
      {children}
    </SearchParamsContext>
  );
}

export function useSearchParams() {
  const context = useContext(SearchParamsContext);
  if (!context) {
    throw new Error(
      "useSearchParams must be used within a SearchParamsProvider",
    );
  }
  return context;
}
