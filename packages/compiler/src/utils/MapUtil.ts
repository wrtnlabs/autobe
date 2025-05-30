export namespace MapUtil {
  export function take<K, V>(map: Map<K, V>, key: K, value: () => V): V {
    if (map.has(key)) {
      return map.get(key) as V;
    }
    const newValue = value();
    map.set(key, newValue);
    return newValue;
  }
}
