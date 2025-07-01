export function filterTestFileName(key: string): boolean {
  if (key.endsWith(".ts") === false) return false;
  else if (key.startsWith("src/") === true) return true;
  return (
    key.startsWith("test/") === true &&
    key.startsWith("test/features/") === false &&
    key.startsWith("test/benchmark/") === false
  );
}
