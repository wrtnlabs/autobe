import { CSSProperties } from "react";

export interface IAutoBeConfigInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "password" | "url" | "number" | "list";
  icon?: string;
  suggestions?: Array<{ value: string; label?: string }>;
  min?: number;
  max?: number;
  style?: CSSProperties;
  disabled?: boolean;
  required?: boolean;
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
    required = false,
  } = props;

  console.log("suggestions", suggestions);
  const suggestionId = `suggestions-${label.replace(/\s+/g, "-").toLowerCase()}`;

  // Check if field is required and empty
  const isEmpty =
    value === "" || (typeof value === "string" && value.trim() === "");
  const isRequiredEmpty = required && isEmpty;

  return (
    <div style={{ ...style }}>
      <label
        style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: "500",
          color: isRequiredEmpty ? "#dc3545" : "#374151",
          marginBottom: "0.5rem",
        }}
      >
        {icon && `${icon} `}
        {label}
        {required && (
          <span style={{ color: "#dc3545", marginLeft: "0.25rem" }}>*</span>
        )}
      </label>
      {type === "list" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{
            width: "100%",
            padding: "0.75rem",
            border: `1px solid ${isRequiredEmpty ? "#dc3545" : "#d1d5db"}`,
            borderRadius: "8px",
            fontSize: "0.875rem",
            transition: "border-color 0.2s ease",
            outline: "none",
            boxSizing: "border-box",
            backgroundColor: disabled
              ? "#f9fafb"
              : isRequiredEmpty
                ? "#fef2f2"
                : "white",
            color: disabled ? "#9ca3af" : "#000000",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
          onFocus={(e) => {
            if (!disabled && !isRequiredEmpty) {
              e.currentTarget.style.borderColor = "#3b82f6";
            }
          }}
          onBlur={(e) => {
            if (!disabled) {
              const newIsEmpty =
                e.currentTarget.value === "" ||
                e.currentTarget.value.trim() === "";
              const newIsRequiredEmpty = required && newIsEmpty;
              e.currentTarget.style.borderColor = newIsRequiredEmpty
                ? "#dc3545"
                : "#d1d5db";
            }
          }}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {suggestions?.map((suggestion, index) => (
            <option key={index} value={suggestion.value}>
              {suggestion.label || suggestion.value}
            </option>
          ))}
        </select>
      ) : (
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
            border: `1px solid ${isRequiredEmpty ? "#dc3545" : "#d1d5db"}`,
            borderRadius: "8px",
            fontSize: "0.875rem",
            transition: "border-color 0.2s ease",
            outline: "none",
            boxSizing: "border-box",
            backgroundColor: disabled
              ? "#f9fafb"
              : isRequiredEmpty
                ? "#fef2f2"
                : "white",
            color: disabled ? "#9ca3af" : "#000000",
          }}
          onFocus={(e) => {
            if (!disabled && !isRequiredEmpty) {
              e.currentTarget.style.borderColor = "#3b82f6";
            }
          }}
          onBlur={(e) => {
            if (!disabled) {
              const newIsEmpty =
                e.currentTarget.value === "" ||
                e.currentTarget.value.trim() === "";
              const newIsRequiredEmpty = required && newIsEmpty;
              e.currentTarget.style.borderColor = newIsRequiredEmpty
                ? "#dc3545"
                : "#d1d5db";
            }
          }}
        />
      )}
      {isRequiredEmpty && (
        <div
          style={{
            fontSize: "0.75rem",
            color: "#dc3545",
            marginTop: "0.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <span>⚠️</span>
          This field is required
        </div>
      )}
      {suggestions && type !== "list" && (
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
