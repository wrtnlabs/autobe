/** From usehooks-ts https://usehooks-ts.com/react-hook/use-media-query */
import { useState } from "react";

import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

type UseMediaQueryOptions = {
  defaultValue?: boolean;
  initializeWithValue?: boolean;
};

const IS_SERVER = typeof window === "undefined";

export function useMediaQuery(
  query: string,
  {
    defaultValue = false,
    initializeWithValue = true,
  }: UseMediaQueryOptions = {},
): boolean {
  const getMatches = (query: string): boolean => {
    if (IS_SERVER) {
      return defaultValue;
    }
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState<boolean>(() => {
    if (initializeWithValue) {
      return getMatches(query);
    }
    return defaultValue;
  });

  // Handles the change event of the media query.
  function handleChange() {
    setMatches(getMatches(query));
  }

  useIsomorphicLayoutEffect(() => {
    const matchMedia = window.matchMedia(query);

    // Triggered at the first client-side load and if query changes
    handleChange();

    // Use deprecated `addListener` and `removeListener` to support Safari < 14 (#135)
    if (matchMedia.addListener) {
      matchMedia.addListener(handleChange);
    } else {
      matchMedia.addEventListener("change", handleChange);
    }

    return () => {
      if (matchMedia.removeListener) {
        matchMedia.removeListener(handleChange);
      } else {
        matchMedia.removeEventListener("change", handleChange);
      }
    };
  }, [query]);

  return matches;
}

export namespace useMediaQuery {
  export const WIDTH_XL = "80rem";
  export const WIDTH_LG = "64rem";
  export const WIDTH_MD = "48rem";
  export const WIDTH_SM = "40rem";
  export const MIN_WIDTH_XL = `(min-width: ${WIDTH_XL})`;
  export const MIN_WIDTH_LG = `(min-width: ${WIDTH_LG})`;
  export const MIN_WIDTH_MD = `(min-width: ${WIDTH_MD})`;
  export const MIN_WIDTH_SM = `(min-width: ${WIDTH_SM})`;
}
