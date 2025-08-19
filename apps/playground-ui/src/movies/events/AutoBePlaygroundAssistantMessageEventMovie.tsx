import { AutoBeAssistantMessageEvent } from "@autobe/interface";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { Card, CardContent, Chip } from "@mui/material";

import { MarkdownViewer } from "../../components/MarkdownViewer";

export function AutoBePlaygroundAssistantMessageEventMovie({
  prompt,
}: AutoBePlaygroundAssistantMessageEventMovie.IProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
      }}
    >
      <Card
        elevation={1}
        style={{
          marginTop: 15,
          marginBottom: 15,
          marginRight: "15%",
          textAlign: "left",
        }}
      >
        <CardContent>
          <Chip
            icon={<SmartToyIcon />}
            label="Assistant"
            variant="outlined"
            color="default"
          />
          <MarkdownViewer>{prompt.text}</MarkdownViewer>
        </CardContent>
      </Card>
    </div>
  );
}
export namespace AutoBePlaygroundAssistantMessageEventMovie {
  export interface IProps {
    prompt: AutoBeAssistantMessageEvent;
  }
}
