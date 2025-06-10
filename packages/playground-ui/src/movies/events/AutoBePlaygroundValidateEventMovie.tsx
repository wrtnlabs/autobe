import {
  AutoBeRealizeValidateEvent,
  AutoBeTestValidateEvent,
} from "@autobe/interface";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Collapse,
} from "@mui/material";
import { useState } from "react";

import { MarkdownViewer } from "../../components/MarkdownViewer";

export function AutoBePlaygroundValidateEventMovie(
  props: AutoBePlaygroundValidateEventMovie.IProps,
) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card
      elevation={3}
      style={{
        marginTop: 15,
        marginBottom: 15,
        marginRight: "15%",
      }}
    >
      <CardContent>
        <Chip
          icon={<ErrorOutlineIcon />}
          label={"TypeScript Compilation Error"}
          variant="outlined"
          color="warning"
        ></Chip>
        <br />
        <br />
        AI wrote invalid TypeScript code so compilation error occurred.
        <br />
        <br />
        Trying to recover the compile error by studying the AI agent.
        <br />
        <br />
        Please wait for a while.
      </CardContent>
      <CardActions style={{ textAlign: "right" }}>
        <Button
          startIcon={
            <ExpandMoreIcon
              style={{
                transform: `rotate(${expanded ? 180 : 0}deg)`,
              }}
            />
          }
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide Validation Details" : "Show Validation Details"}
        </Button>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          {props.event.result.type === "failure" ? (
            <MarkdownViewer>
              {props.event.result.diagnostics
                .map(
                  (diag) =>
                    `- ${diag.file} (${diag.category}): ${diag.messageText}`,
                )
                .join("\n")}
            </MarkdownViewer>
          ) : (
            <MarkdownViewer>
              {JSON.stringify(props.event.result.error, null, 2)}
            </MarkdownViewer>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
}
export namespace AutoBePlaygroundValidateEventMovie {
  export interface IProps {
    event: AutoBeTestValidateEvent | AutoBeRealizeValidateEvent;
  }
}
