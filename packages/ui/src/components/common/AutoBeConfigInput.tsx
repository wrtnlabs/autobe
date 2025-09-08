import { CSSProperties } from "react";

export interface IAutoBeConfigInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "password" | "url" | "number";
  icon?: string;
  suggestions?: Array<{ value: string; label?: string }>;
  min?: number;
  max?: number;
  style?: CSSProperties;
  disabled?: boolean;
}

/**
 * Common input component for configuration forms Supports text, password, url,
 * and number inputs with optional suggestions
 */
export const AutoBeConfigInput = (props: IAutoBeConfigInputProps) => {
  const {
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    icon,
    suggestions,
    min,
    max,
    style,
    disabled = false,
  } = props;

  const suggestionId = `suggestions-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div style={{ ...style }}>
      <label
        style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "500",
          color: "#374151",
          marginBottom: "0.5rem",
        }}
      >
        {icon && `${icon} `}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list={suggestions ? suggestionId : undefined}
        min={min}
        max={max}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "0.75rem",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          fontSize: "0.875rem",
          transition: "border-color 0.2s ease",
          outline: "none",
          boxSizing: "border-box",
          backgroundColor: disabled ? "#f9fafb" : "white",
          color: disabled ? "#9ca3af" : "#000000",
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = "#3b82f6";
          }
        }}
        onBlur={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = "#d1d5db";
          }
        }}
      />
      {suggestions && (
        <datalist id={suggestionId}>
          {suggestions.map((suggestion, index) => (
            <option key={index} value={suggestion.value}>
              {suggestion.label || suggestion.value}
            </option>
          ))}
        </datalist>
      )}
    </div>
  );
};

export default AutoBeConfigInput;
