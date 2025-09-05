import { useCallback, useEffect, useState } from "react";

/**
 * Type definition for search parameters state Supports single values, arrays,
 * and undefined values
 */
type SearchParamsState = Record<string, string | string[] | undefined>;

/**
 * Return type for useSearchParams hook Provides comprehensive URL search
 * parameter management functionality
 */
interface UseSearchParamsReturn {
  /** Current search parameters state */
  searchParams: SearchParamsState;
  /** Set a search parameter value */
  setSearchParam: (key: string, value: string | string[] | null) => void;
  /** Delete a search parameter */
  deleteSearchParam: (key: string) => void;
  /** Clear all search parameters */
  clearSearchParams: () => void;
  /** Get a specific search parameter value */
  getSearchParam: (key: string) => string | string[] | undefined;
  /** Check if a search parameter exists */
  hasSearchParam: (key: string) => boolean;
  /** Convert search parameters to query string */
  toString: () => string;
}

/**
 * Custom hook for managing URL search parameters
 *
 * @example
 *   ```tsx
 *   const { searchParams, setSearchParam, getSearchParam, hasSearchParam } = useSearchParams();
 *
 *   // Set a parameter
 *   setSearchParam('filter', 'active');
 *
 *   // Get a parameter
 *   const filter = getSearchParam('filter');
 *
 *   // Check if parameter exists
 *   if (hasSearchParam('page')) {
 *     console.log('Page parameter exists');
 *   }
 *
 *   // Handle arrays
 *   setSearchParam('tags', ['react', 'typescript']);
 *   ```;
 *
 * @returns Object with search parameter management functions and state
 */
export function useSearchParams(): UseSearchParamsReturn {
  const [searchParams, setSearchParams] = useState<SearchParamsState>({});

  // Parse search parameters from URL
  const parseSearchParams = useCallback((): SearchParamsState => {
    if (typeof window === "undefined") return {};

    const urlSearchParams = new URLSearchParams(window.location.search);
    const params: SearchParamsState = {};

    urlSearchParams.forEach((value, key) => {
      const existingValue = params[key];

      if (existingValue === undefined) {
        params[key] = value;
      } else if (Array.isArray(existingValue)) {
        existingValue.push(value);
      } else {
        params[key] = [existingValue, value];
      }
    });

    return params;
  }, []);

  // Read parameters from URL on initial load
  useEffect(() => {
    setSearchParams(parseSearchParams());
  }, [parseSearchParams]);

  // popstate event listener (handle back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      setSearchParams(parseSearchParams());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [parseSearchParams]);

  // URL update function
  const updateURL = useCallback((newParams: SearchParamsState) => {
    if (typeof window === "undefined") return;

    const urlSearchParams = new URLSearchParams();

    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => urlSearchParams.append(key, v));
        } else {
          urlSearchParams.set(key, value);
        }
      }
    });

    const newURL = `${window.location.pathname}${urlSearchParams.toString() ? "?" + urlSearchParams.toString() : ""}`;
    window.history.pushState({}, "", newURL);
  }, []);

  // Set search parameter
  const setSearchParam = useCallback(
    (key: string, value: string | string[] | null) => {
      setSearchParams((prev) => {
        const newParams = { ...prev };

        if (value === null) {
          delete newParams[key];
        } else {
          newParams[key] = value;
        }

        updateURL(newParams);
        return newParams;
      });
    },
    [updateURL],
  );

  // Delete search parameter
  const deleteSearchParam = useCallback(
    (key: string) => {
      setSearchParam(key, null);
    },
    [setSearchParam],
  );

  // Clear all search parameters
  const clearSearchParams = useCallback(() => {
    setSearchParams({});
    updateURL({});
  }, [updateURL]);

  // Get specific search parameter value
  const getSearchParam = useCallback(
    (key: string): string | string[] | undefined => {
      return searchParams[key];
    },
    [searchParams],
  );

  // Check if search parameter exists
  const hasSearchParam = useCallback(
    (key: string): boolean => {
      return key in searchParams;
    },
    [searchParams],
  );

  // Convert search parameters to string
  const toString = useCallback((): string => {
    const urlSearchParams = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => urlSearchParams.append(key, v));
        } else {
          urlSearchParams.set(key, value);
        }
      }
    });

    return urlSearchParams.toString();
  }, [searchParams]);

  return {
    searchParams,
    setSearchParam,
    deleteSearchParam,
    clearSearchParams,
    getSearchParam,
    hasSearchParam,
    toString,
  };
}
