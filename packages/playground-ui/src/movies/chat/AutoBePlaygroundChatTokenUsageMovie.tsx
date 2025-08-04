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
  const aggregate = props.tokenUsage.aggregate;
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
            <TableCell>{aggregate.total.toLocaleString()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Input</TableCell>
            <TableCell>{aggregate.total.toLocaleString()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Input (Cached)</TableCell>
            <TableCell>{aggregate.input.cached.toLocaleString()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Output</TableCell>
            <TableCell>{aggregate.output.total.toLocaleString()}</TableCell>
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
