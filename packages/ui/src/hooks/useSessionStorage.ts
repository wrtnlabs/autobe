export const useSessionStorage = () => {
  return {
    getItem: (key: string): string => {
      return sessionStorage.getItem(key) ?? "";
    },
    setItem: (key: string, value: string): void => {
      sessionStorage.setItem(key, value);
    },
  };
};
