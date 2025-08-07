import { AutoBeUserMessageFileContent } from "@autobe/interface";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { Box, Typography } from "@mui/material";

export const AutoBePlaygroundUserMessageFileContentMovie = (
  props: AutoBePlaygroundUserMessageFileContentMovie.IProps,
) => {
  const { file } = props.content;
  const fileName = file.type === "base64" ? file.name : "File";

  // Extract file extension
  const getFileExtension = (name: string) => {
    const lastDot = name.lastIndexOf(".");
    return lastDot !== -1 ? name.substring(lastDot + 1).toUpperCase() : "FILE";
  };

  const extension =
    file.type === "base64" && file.name ? getFileExtension(file.name) : "FILE";

  // Truncate filename if too long
  const displayName =
    fileName.length > 15 ? fileName.substring(0, 12) + "..." : fileName;

  return (
    <Box
      sx={{
        width: 100,
        height: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        backgroundColor: "background.paper",
        cursor: "pointer",
        transition: "all 0.2s",
        "&:hover": {
          borderColor: "primary.main",
          backgroundColor: "action.hover",
        },
      }}
    >
      <InsertDriveFileIcon
        sx={{
          fontSize: 40,
          color: "primary.main",
          mb: 0.5,
        }}
      />
      <Typography
        variant="caption"
        sx={{
          fontWeight: "bold",
          color: "text.secondary",
          fontSize: "0.7rem",
        }}
      >
        {extension}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontSize: "0.65rem",
          color: "text.secondary",
          textAlign: "center",
          px: 0.5,
          width: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={fileName}
      >
        {displayName}
      </Typography>
    </Box>
  );
};
export namespace AutoBePlaygroundUserMessageFileContentMovie {
  export interface IProps {
    index: number;
    content: AutoBeUserMessageFileContent;
  }
}
