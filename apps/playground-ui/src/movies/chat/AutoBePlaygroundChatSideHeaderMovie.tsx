import { IAutoBeRpcHeader } from "@autobe/interface";
import {
  Table,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ILlmSchema } from "@samchon/openapi";

export const AutoBePlaygroundChatSideHeaderMovie = (
  props: AutoBePlaygroundChatSideHeaderMovie.IProps,
) => {
  return (
    <>
      <Typography variant="h5">Agent Information</Typography>
      <hr />
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Component</TableCell>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableHead>
        <TableRow>
          <TableCell>AI Model</TableCell>
          <TableCell>{props.header.vendor.model}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Schema Model</TableCell>
          <TableCell>{props.header.model}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Locale</TableCell>
          <TableCell>{props.header.locale}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Timezone</TableCell>
          <TableCell>{props.header.timezone}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Semaphore</TableCell>
          <TableCell>{props.header.vendor.semaphore ?? 16}</TableCell>
        </TableRow>
      </Table>
    </>
  );
};
export namespace AutoBePlaygroundChatSideHeaderMovie {
  export interface IProps {
    header: IAutoBeRpcHeader<ILlmSchema.Model>;
  }
}
