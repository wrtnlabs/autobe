export const toCompactNumberFormat = (value: number) => {
  const units = [
    { value: 1_000, symbol: "K" },
    { value: 1_000_000, symbol: "M" },
    { value: 1_000_000_000, symbol: "B" },
    { value: 1_000_000_000_000, symbol: "T" },
    { value: 1_000_000_000_000_000, symbol: "Q" },
  ];

  for (const unit of units) {
    if (value >= unit.value) {
      return (value / unit.value).toFixed(1) + unit.symbol;
    }
  }

  return value.toString();
};
