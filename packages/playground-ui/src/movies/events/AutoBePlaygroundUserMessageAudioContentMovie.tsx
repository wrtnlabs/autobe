import { AutoBeUserMessageAudioContent } from "@autobe/interface";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import { Box, Typography } from "@mui/material";

export const AutoBePlaygroundUserMessageAudioContentMovie = (
  _props: AutoBePlaygroundUserMessageAudioContentMovie.IProps,
) => {
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
      <AudiotrackIcon
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
        AUDIO
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontSize: "0.65rem",
          color: "text.secondary",
          textAlign: "center",
        }}
      ></Typography>
    </Box>
  );
};

export namespace AutoBePlaygroundUserMessageAudioContentMovie {
  export interface IProps {
    content: AutoBeUserMessageAudioContent;
  }
}
