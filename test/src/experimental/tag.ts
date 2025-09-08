// import typia, { tags } from "typia/lib/module";

// // import { v7 } from "uuid";

// // {
// //   const x: number & tags.Type<"int32"> = 3 as any;
// //   const y: number & tags.Type<"int32"> & tags.Minimum<0> = x;
// // }

// // {
// //   const x: (string & tags.Format<"uuid">) | null = v7() as any;
// //   const y: string = x;
// // }

// // {
// //   const x: (number & tags.Type<"int32">) | null = 3 as any;
// //   const y: number & tags.Type<"int32"> & tags.Minimum<0> = x;
// // }

// {
//   const x: number & tags.Type<"int32"> & tags.Minimum<1> & tags.Maximum<100> =
//     1 as any;
//   const y: number & tags.Type<"int32"> = x;
//   y;
// }

// {
//   const x: number & tags.Type<"int32"> & tags.Minimum<0> & tags.Maximum<100> =
//     1 as any;

//   const y: number & tags.Type<"int32"> = typia.assert<
//     number & tags.Type<"int32">
//   >(x);
// }
