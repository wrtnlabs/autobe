import { useEffect } from "react";

/**
 * Hook to handle ESC key press to close modal or overlay
 *
 * @param isOpen - Whether the modal/overlay is open
 * @param onClose - Callback function to close the modal/overlay
 */
export const useEscapeKey = (isOpen: boolean, onClose: () => void): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);
};
