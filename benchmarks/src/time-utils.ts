/** Time utility functions for formatting duration in multiple units */

export function formatDuration(milliseconds: number): string {
  const minutes = (milliseconds / 60000).toFixed(1);
  return `${milliseconds}ms (${minutes} minutes)`;
}

export function formatDurationSeconds(seconds: number): string {
  const minutes = (seconds / 60).toFixed(1);
  return `${seconds}s (${minutes} minutes)`;
}

export function formatDurationSecondsFromMs(milliseconds: number): string {
  const seconds = (milliseconds / 1000).toFixed(1);
  const minutes = (milliseconds / 60000).toFixed(1);
  return `${seconds}s (${minutes} minutes)`;
}

export function msToMinutes(milliseconds: number): string {
  return (milliseconds / 60000).toFixed(1);
}

export function secondsToMinutes(seconds: number): string {
  return (seconds / 60).toFixed(1);
}
