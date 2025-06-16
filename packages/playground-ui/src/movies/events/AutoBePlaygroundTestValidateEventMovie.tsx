import { AutoBeTestValidateEvent } from "@autobe/interface";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Button, Card, CardActions, CardContent, Chip } from "@mui/material";
import StackBlitzSDK from "@stackblitz/sdk";

import { ErrorUtil } from "../../utils/ErrorUtil";

export function AutoBePlaygroundTestValidateEventMovie(
  props: AutoBePlaygroundTestValidateEventMovie.IProps,
) {
  const openStackBlitz = () =>
    StackBlitzSDK.openProject(
      {
        files: {
          ...props.event.files,
          ...(props.event.result.type === "failure"
            ? {
                "compile-failure-diagnostics.log": JSON.stringify(
                  props.event.result.diagnostics,
                  null,
                  2,
                ),
              }
            : props.event.result.type === "exception"
              ? {
                  "compile-error.json": JSON.stringify(
                    ErrorUtil.toJSON(props.event.result.error),
                    null,
                    2,
                  ),
                }
              : {}),
          "result.json": JSON.stringify(props.event.result, null, 2),
        },
        title: "AutoBE Test Validate Report",
        description: "Report of Test Validate Event (Compilation Error)",
        template: "node",
      },
      {
        newWindow: true,
      },
    );
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
          label={"Test Compilation Error"}
          variant="outlined"
          color="warning"
        />
        <br />
        <br />
        AI wrote invalid Test code, so compilation error occurred.
        <br />
        <br />
        Trying to recover the compile error by studying the AI agent.
        <br />
        <br />
        Please wait for a while.
      </CardContent>
      <CardActions style={{ textAlign: "right" }}>
        <Button startIcon={<ExpandMoreIcon />} onClick={() => openStackBlitz()}>
          Open Validation Details
        </Button>
      </CardActions>
    </Card>
  );
}
export namespace AutoBePlaygroundTestValidateEventMovie {
  export interface IProps {
    event: AutoBeTestValidateEvent;
  }
}
