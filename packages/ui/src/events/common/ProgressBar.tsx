export interface IProgressBarProps {
  current: number;
  total: number;
  color?: string;
  backgroundColor?: string;
  height?: string;
  showLabel?: boolean;
}

/**
 * Common progress bar component Provides consistent progress visualization
 * across event components
 */
export const ProgressBar = (props: IProgressBarProps) => {
  const {
    current,
    total,
    color = "#4caf50",
    backgroundColor = "#e2e8f0",
    height = "10px",
    showLabel = true,
  } = props;

  const percentage = Math.round((current / total) * 100);

  return (
    <>
      <div
        style={{
          width: "100%",
          height,
          backgroundColor,
          borderRadius: "10px",
          overflow: "hidden",
          marginBottom: showLabel ? "0.5rem" : "0",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: "10px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      {showLabel && (
        <div
          style={{
            fontSize: "0.75rem",
            color: "#64748b",
            textAlign: "center",
          }}
        >
          {current} / {total} completed
        </div>
      )}
    </>
  );
};

export default ProgressBar;
