import { AutoBePrismaValidateEvent } from "@autobe/interface";
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
          label={"Prisma Compilation Error"}
          variant="outlined"
          color="warning"
        ></Chip>
        <br />
        <br />
        AI wrote invalid Prisma schema, so compilation error occured.
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
          {expanded ? "Hide Function Calls" : "Show Function Calls"}
        </Button>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          {props.event.result.type === "failure" ? (
            props.event.result.reason
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
    event: AutoBePrismaValidateEvent;
  }
}
