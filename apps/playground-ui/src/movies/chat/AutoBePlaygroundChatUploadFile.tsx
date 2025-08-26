import AddIcon from "@mui/icons-material/Add";
import ErrorIcon from "@mui/icons-material/Error";
import { IconButton, Tooltip } from "@mui/material";
import { ReactNode } from "react";

export const AutoBePlaygroundChatUploadFile = (
  props: AutoBePlaygroundChatUploadFile.IProps,
) => {
  return (
    <Tooltip
      title={props.extensionError || ""}
      open={!!props.extensionError}
      placement="top"
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: "error.main",
            "& .MuiTooltip-arrow": {
              color: "error.main",
            },
          },
        },
      }}
    >
      <IconButton
        size="small"
        color={props.extensionError ? "error" : "primary"}
        onClick={props.onClick}
        disabled={!props.enabled}
        sx={{
          p: 0.75,
          border: "1px solid",
          borderColor: props.extensionError ? "error.main" : "divider",
          backgroundColor: props.extensionError ? "error.light" : "transparent",
          "&:hover": {
            backgroundColor: props.extensionError
              ? "error.light"
              : "action.hover",
            borderColor: props.extensionError ? "error.main" : "primary.main",
          },
          transition: "all 0.3s ease",
        }}
      >
        {props.extensionError ? (
          <ErrorIcon fontSize="small" />
        ) : (
          <AddIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default AutoBePlaygroundChatUploadFile;
export namespace AutoBePlaygroundChatUploadFile {
  export interface IProps {
    extensionError: ReactNode | null;
    onClick: () => void;
    enabled: boolean;
  }
}
