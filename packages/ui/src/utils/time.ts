/**
 * Formats an ISO timestamp string to display time in Korean locale
 *
 * @param isoString - ISO format timestamp string
 * @returns Formatted time string (HH:mm)
 */
export const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
