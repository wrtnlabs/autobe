import { AutoBeUserMessageEvent } from "@autobe/interface";
import FaceIcon from "@mui/icons-material/Face";
import { Card, CardContent, Chip } from "@mui/material";

import { MarkdownViewer } from "../../components/MarkdownViewer";
import { AutoBePlaygroundUserMessageAudioContentMovie } from "./AutoBePlaygroundUserMessageAudioContentMovie";
import { AutoBePlaygroundUserMessageFileContentMovie } from "./AutoBePlaygroundUserMessageFileContentMovie";
import { AutoBePlaygroundUserMessageImageContentMovie } from "./AutoBePlaygroundUserMessageImageContentMovie";

export function AutoBePlaygroundUserMessageEventMovie({
  prompt,
}: AutoBePlaygroundUserMessageEventMovie.IProps) {
  const texts = prompt.contents.filter((c) => c.type === "text");
  const multimedia = prompt.contents.filter(
    (c) => c.type === "audio" || c.type === "image" || c.type === "file",
  );
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <Card
        elevation={1}
        style={{
          marginTop: 15,
          marginBottom: 15,
          marginLeft: "15%",
          textAlign: "right",
          backgroundColor: "lightyellow",
        }}
      >
        <CardContent>
          {multimedia.length !== 0 ? (
            <>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  justifyContent: "flex-end",
                }}
              >
                {multimedia.map((content, index) =>
                  content.type === "audio" ? (
                    <AutoBePlaygroundUserMessageAudioContentMovie
                      content={content}
                    />
                  ) : content.type === "file" ? (
                    <AutoBePlaygroundUserMessageFileContentMovie
                      index={index}
                      content={content}
                    />
                  ) : content.type === "image" ? (
                    <AutoBePlaygroundUserMessageImageContentMovie
                      key={index}
                      content={content}
                    />
                  ) : null,
                )}
              </div>
              {texts.length ? <br /> : null}
            </>
          ) : null}
          {texts.map((content) => (
            <>
              <Chip
                icon={<FaceIcon />}
                label="User"
                variant="outlined"
                color="primary"
              />
              <MarkdownViewer>{content.text}</MarkdownViewer>
            </>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
export namespace AutoBePlaygroundUserMessageEventMovie {
  export interface IProps {
    prompt: AutoBeUserMessageEvent;
  }
}
