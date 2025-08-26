export const executeCachedBatch = async <T>(
  tasks: Array<() => Promise<T>>,
): Promise<T[]> => {
  if (tasks.length === 0) return [];
  return [
    await tasks[0]!(),
    ...(await Promise.all(tasks.slice(1).map((task) => task()))),
  ];
};
