import hApi from "@autobe/hackathon-api";
import { useState } from "react";

import { HACKATHON_CODE } from "./constant";
import { useAuthorizationToken } from "./hooks/useAuthorizationToken";

export function AutoBeLoginApplication() {
  //----
  // STATES
  //----
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const { setToken } = useAuthorizationToken();
  //----
  // EVENT HANDLERS
  //----
  const handleInputChange =
    (field: "username" | "password") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCredentials((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.username.trim() || !credentials.password.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const result =
        await hApi.autobe.hackathon.participants.authenticate.login(
          {
            host: import.meta.env.VITE_API_BASE_URL,
          },
          HACKATHON_CODE,
          {
            email: credentials.username,
            password: credentials.password,
          },
        );
      setToken(JSON.stringify(result));
      window.location.href = "/";
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  //----
  // STYLES
  //----
  const containerStyle: React.CSSProperties = {
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const formStyle: React.CSSProperties = {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "1.5rem",
    fontWeight: "600",
    textAlign: "center",
    margin: "0 0 1rem 0",
    color: "#333",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "1rem",
    outline: "none",
    transition: "border-color 0.2s ease",
    boxSizing: "border-box",
  };

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: isLoading ? "#6c757d" : "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: isLoading ? "not-allowed" : "pointer",
    transition: "background-color 0.2s ease",
    outline: "none",
  };

  //----
  // RENDER
  //----
  return (
    <div style={containerStyle}>
      <form style={formStyle} onSubmit={handleSubmit}>
        <h1 style={titleStyle}>Login</h1>

        <div>
          <input
            type="text"
            placeholder="Username"
            value={credentials.username}
            onChange={handleInputChange("username")}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#007bff";
              e.target.style.boxShadow = "0 0 0 2px rgba(0, 123, 255, 0.25)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#ddd";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        <div>
          <input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={handleInputChange("password")}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#007bff";
              e.target.style.boxShadow = "0 0 0 2px rgba(0, 123, 255, 0.25)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#ddd";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        <button
          type="submit"
          disabled={
            isLoading ||
            !credentials.username.trim() ||
            !credentials.password.trim()
          }
          style={buttonStyle}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = "#0056b3";
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = "#007bff";
            }
          }}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
