import { CSSProperties, useState } from "react";

import {
  getEncryptedSessionStorage,
  setEncryptedSessionStorage,
} from "../utils/storage";
import AutoBeConfigInput from "./common/AutoBeConfigInput";

/** Generic config field definition */
export interface IConfigField {
  key: string;
  label: string;
  type: "text" | "number" | "checkbox" | "list";
  placeholder?: string;
  default?: string | number | boolean;
  suggestions?: string[];
  required?: boolean;
  min?: number;
  max?: number;
  storageKey: string;
  encrypted?: boolean; // Use sessionStorage with encryption
}

export interface IAutoBeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  fields: IConfigField[];
  onSave?: (config: Record<string, unknown>) => void;
  onReset?: () => void;
}

/**
 * Generic configuration modal component Receives config field definitions from
 * props for maximum flexibility
 */
export const AutoBeConfigModal = (props: IAutoBeConfigModalProps) => {
  // Get stored values for all fields
  const getStoredValue = (field: IConfigField) => {
    if (typeof window === "undefined") {
      if (field.type === "checkbox") return false;
      if (field.type === "number") return 0;
      return "";
    }

    const stored = field.encrypted
      ? getEncryptedSessionStorage(field.storageKey)
      : localStorage.getItem(field.storageKey);

    if (stored !== null && stored !== "") {
      if (field.type === "checkbox") {
        return stored === "true";
      }
      if (field.type === "number") {
        return parseInt(stored, 10) || 0;
      }
      return stored;
    }

    // Return default values based on type
    if (field.type === "checkbox") return false;
    if (field.type === "number") return 0;
  };

  // Initialize config state from stored values
  const [config, setConfig] = useState<Record<string, unknown>>(() => {
    const initialConfig: Record<string, unknown> = {};
    props.fields.forEach((field) => {
      initialConfig[field.key] =
        getStoredValue(field) ?? field.default ?? undefined;
    });
    return initialConfig;
  });

  const updateConfig = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Save all config values to their respective storage
    props.fields.forEach((field) => {
      const value = config[field.key];
      const stringValue = String(value);

      if (field.encrypted) {
        setEncryptedSessionStorage(field.storageKey, stringValue);
      } else {
        localStorage.setItem(field.storageKey, stringValue);
      }
    });

    console.log(config);
    // Call optional external save handler
    props.onSave?.(config);
    props.onClose();
  };

  if (!props.isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1002,
      }}
      onClick={props.onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "1rem",
          padding: "1.25rem",
          width: "90%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflow: "visible",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with title and X button */}
        <div style={{ position: "relative", marginBottom: "1.25rem" }}>
          <h2
            style={{
              margin: "0",
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "#1a1a1a",
              textAlign: "center",
            }}
          >
            {props.title || "Configuration"}
          </h2>

          {/* X Close Button */}
          <button
            onClick={props.onClose}
            style={{
              position: "absolute",
              top: "50%",
              right: "0",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.25rem",
              borderRadius: "50%",
              width: "1.75rem",
              height: "1.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              color: "#6b7280",
              transition: "all 0.2s",
            }}
            className="modal-close-button"
          >
            ✖️
          </button>

          <style>
            {`
              .modal-close-button:hover {
                background-color: #f3f4f6 !important;
                color: #374151 !important;
              }
            `}
          </style>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {props.fields.map((field) => (
            <div key={field.key}>
              {field.type === "checkbox" ? (
                <div style={{ marginBottom: "0.25rem" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "1rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {field.label}
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.75rem 1rem",
                      border: "2px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      backgroundColor: "#f9fafb",
                      transition: "all 0.2s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(config[field.key])}
                      onChange={(e) =>
                        updateConfig(field.key, e.target.checked)
                      }
                      style={{
                        width: "1rem",
                        height: "1rem",
                        cursor: "pointer",
                      }}
                    />
                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      {field.placeholder ||
                        `Enable ${field.label.toLowerCase()}`}
                    </span>
                  </div>
                </div>
              ) : (
                <AutoBeConfigInput
                  label={field.label}
                  type={field.type}
                  value={String(config[field.key] || field.default || "")}
                  onChange={(value) => {
                    const finalValue =
                      field.type === "number" ? parseInt(value) || 0 : value;
                    updateConfig(field.key, finalValue);
                  }}
                  placeholder={field.placeholder}
                  suggestions={field.suggestions?.map((value) => ({ value }))}
                  min={field.min}
                  max={field.max}
                  required={field.required}
                />
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginTop: "1.25rem",
            justifyContent: "flex-end",
          }}
        >
          <ConfigButton variant="secondary" onClick={props.onClose}>
            Cancel
          </ConfigButton>

          <ConfigButton variant="primary" onClick={handleSave}>
            Save
          </ConfigButton>
        </div>
      </div>
    </div>
  );
};

/** Reusable button component for config modal */
interface IConfigButtonProps {
  variant: "primary" | "secondary";
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const ConfigButton = ({
  variant,
  onClick,
  children,
  disabled,
}: IConfigButtonProps) => {
  const baseStyles: CSSProperties = {
    padding: "0.5rem 1.25rem",
    fontSize: "0.875rem",
    fontWeight: "500",
    borderRadius: "0.5rem",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s",
    border: "none",
    outline: "none",
    opacity: disabled ? 0.5 : 1,
  };

  const variantStyles: Record<"primary" | "secondary", CSSProperties> = {
    primary: {
      color: "white",
      backgroundColor: "#3b82f6",
      border: "1px solid #3b82f6",
    },
    secondary: {
      color: "#374151",
      backgroundColor: "#f9fafb",
      border: "1px solid #d1d5db",
    },
  };

  return (
    <>
      <style>
        {`
          .config-button-${variant}:hover:not(:disabled) {
            ${
              variant === "primary"
                ? "background-color: #2563eb !important; border-color: #2563eb !important;"
                : "background-color: #f3f4f6 !important; border-color: #9ca3af !important;"
            }
          }
        `}
      </style>
      <button
        className={`config-button-${variant}`}
        style={{
          ...baseStyles,
          ...variantStyles[variant],
        }}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    </>
  );
};

/** All available AutoBE configuration fields */
const ALL_CONFIG_FIELDS: Record<string, IConfigField> = {
  locale: {
    key: "locale",
    label: "Language",
    type: "text",
    storageKey: "autobe_locale",
    placeholder: "en",
    suggestions: ["en", "ko", "ja", "zh", "es", "fr", "de"],
  },
  schemaModel: {
    key: "schemaModel",
    label: "Schema Model",
    type: "text",
    storageKey: "autobe_schema_model",
    placeholder: "chatgpt",
    suggestions: ["chatgpt", "claude"],
  },
  aiModel: {
    key: "aiModel",
    label: "AI Model",
    type: "text",
    storageKey: "autobe_ai_model",
    placeholder: "gpt-4.1",
    suggestions: [
      "gpt-4.1",
      "gpt-4",
      "gpt-4-turbo",
      "gpt-3.5-turbo",
      "claude-3-sonnet",
      "claude-3-haiku",
      "claude-3-opus",
      "llama-3.1-70b",
      "deepseek-coder",
    ],
  },
  openApiKey: {
    key: "openApiKey",
    label: "OpenAI API Key",
    type: "text",
    storageKey: "autobe_openapi_key_encrypted",
    placeholder: "sk-...",
    encrypted: true,
    required: true,
  },
  baseUrl: {
    key: "baseUrl",
    label: "Base URL",
    type: "text",
    storageKey: "autobe_base_url",
    placeholder: "Leave empty for OpenAI default",
    default: "https://api.openai.com/v1",
  },
  semaphore: {
    key: "semaphore",
    label: "Concurrency Limit",
    type: "number",
    storageKey: "autobe_semaphore",
    placeholder: "16",
    min: 1,
    max: 100,
  },
  supportAudioEnable: {
    key: "supportAudioEnable",
    label: "Audio Support",
    type: "checkbox",
    storageKey: "autobe_support_audio",
    placeholder: "Not STT, just bypass to LLM",
  },
};

/** Available config field keys */
export type AutoBeConfigKey = keyof typeof ALL_CONFIG_FIELDS;

/**
 * Create AutoBE configuration fields with additional keys and optional
 * extensions
 *
 * @example
 *   ```typescript
 *   // Get default fields only
 *   createAutoBeConfigFields()
 *
 *   // Add serverUrl to default fields
 *   createAutoBeConfigFields(['serverUrl'])
 *
 *   // Add multiple keys to default fields
 *   createAutoBeConfigFields(['serverUrl', 'customKey'])
 *
 *   // Add keys + custom extensions
 *   createAutoBeConfigFields(['serverUrl'], [
 *     { key: 'customField', label: 'Custom', type: 'text', storageKey: 'custom' }
 *   ])
 *   ```;
 *
 * @param additionalKeys - Array of additional config keys to add to default
 *   fields
 * @param extensions - Additional custom config fields to append
 * @returns Array of default + additional + extended config fields
 */
export const createAutoBeConfigFields = (
  ...extensions: IConfigField[]
): IConfigField[] => {
  return [...Object.values(ALL_CONFIG_FIELDS), ...extensions];
};

export default AutoBeConfigModal;
