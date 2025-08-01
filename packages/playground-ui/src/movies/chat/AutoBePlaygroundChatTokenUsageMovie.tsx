import { IAutoBeTokenUsageJson } from "@autobe/interface";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React from "react";

export function AutoBePlaygroundChatTokenUsageMovie(
  props: AutoBePlaygroundChatTokenUsageMovie.IProps,
) {
  const aggregateComponent = (
    Object.keys(props.tokenUsage) as (keyof IAutoBeTokenUsageJson)[]
  ).reduce(
    (acc, cur) => {
      return {
        total: acc.total + props.tokenUsage[cur].total,
        input: {
          total: acc.input.total + props.tokenUsage[cur].input.total,
          cached: acc.input.cached + props.tokenUsage[cur].input.cached,
        },
        output: {
          total: acc.output.total + props.tokenUsage[cur].output.total,
          reasoning:
            acc.output.reasoning + props.tokenUsage[cur].output.reasoning,
          accepted_prediction:
            acc.output.accepted_prediction +
            props.tokenUsage[cur].output.accepted_prediction,
          rejected_prediction:
            acc.output.rejected_prediction +
            props.tokenUsage[cur].output.rejected_prediction,
        },
      };
    },
    {
      total: 0,
      input: { total: 0, cached: 0 },
      output: {
        total: 0,
        reasoning: 0,
        accepted_prediction: 0,
        rejected_prediction: 0,
      },
    } satisfies IAutoBeTokenUsageJson.IComponent,
  );
  return (
    <React.Fragment>
      <Typography variant="h5"> Token Usage </Typography>
      <hr />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Token Usage</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell>{aggregateComponent.total.toLocaleString()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Input</TableCell>
            <TableCell>
              {aggregateComponent.input.total.toLocaleString()}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Input (Cached)</TableCell>
            <TableCell>
              {aggregateComponent.input.cached.toLocaleString()}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Output</TableCell>
            <TableCell>
              {aggregateComponent.output.total.toLocaleString()}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </React.Fragment>
  );
}
export namespace AutoBePlaygroundChatTokenUsageMovie {
  export interface IProps {
    tokenUsage: IAutoBeTokenUsageJson;
  }
}
