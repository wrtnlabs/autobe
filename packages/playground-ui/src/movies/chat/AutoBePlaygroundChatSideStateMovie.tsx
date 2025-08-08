import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { AutoBePlaygroundState } from "../../structures/AutoBePlaygroundState";

export const AutoBePlaygroundChatSideStateMovie = (
  props: AutoBePlaygroundChatSideStateMovie.IProps,
) => {
  const row = (
    step: string,
    count: Record<string, number>,
    elapsed: number,
  ) => (
    <TableRow>
      <TableCell>{step}</TableCell>
      <TableCell>
        {Object.entries(count)
          .map(([key, value]) => `${key[0]} ${value.toLocaleString()}`)
          .join(" / ")}
      </TableCell>
      <TableCell>
        {(Math.floor((elapsed / 60_000) * 100) / 100).toLocaleString()} mins
      </TableCell>
    </TableRow>
  );
  const empty = (step: string) => (
    <TableRow>
      <TableCell>{step}</TableCell>
      <TableCell colSpan={2}>N/A</TableCell>
    </TableRow>
  );

  const { analyze, prisma, interface: api, test, realize } = props.state;
  return (
    <>
      <Typography variant="h5"> Development State </Typography>
      <hr />
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Step</TableCell>
            <TableCell>Count</TableCell>
            <TableCell>Elapsed Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {analyze
            ? row(
                "Analyze",
                {
                  Documents: Object.keys(analyze.files).length,
                  "Actor Roles": analyze.roles.length,
                },
                analyze.elapsed,
              )
            : empty("Analyze")}
          {prisma
            ? row(
                "Prisma",
                {
                  Namespaces: prisma.result.data.files.length,
                  Models: prisma.result.data.files
                    .map((f) => f.models.length)
                    .reduce((a, b) => a + b, 0),
                },
                prisma.elapsed,
              )
            : empty("Prisma")}
          {api
            ? row(
                "Interface",
                {
                  Operations: api.document.operations.length,
                  Schemas: Object.keys(api.document.components.schemas).length,
                },
                api.elapsed,
              )
            : empty("Interface")}
          {test
            ? row(
                "Test",
                {
                  Functions: test.files.length,
                },
                test.elapsed,
              )
            : empty("Test")}
          {realize
            ? row(
                "Realize",
                {
                  Controllers: Object.keys(realize.controllers).length,
                  Functions: realize.functions.length,
                },
                realize.elapsed,
              )
            : empty("Realize")}
        </TableBody>
      </Table>
    </>
  );
};
export namespace AutoBePlaygroundChatSideStateMovie {
  export interface IProps {
    state: AutoBePlaygroundState;
  }
}
