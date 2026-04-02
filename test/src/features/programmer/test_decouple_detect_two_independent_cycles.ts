import { AutoBeInterfaceSchemaDecoupleProgrammer } from "@autobe/agent/src/orchestrate/interface/programmers/AutoBeInterfaceSchemaDecoupleProgrammer";
import {
  AutoBeInterfaceSchemaDecoupleCycle,
  AutoBeOpenApi,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

interface IAuthor {
  post: IPost;
}
interface IPost {
  author: IAuthor;
}
interface IProduct {
  review: IReview;
}
interface IReview {
  product: IProduct;
}

export const test_decouple_detect_two_independent_cycles = () => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchema> = typia.json.schemas<
    [IAuthor, IPost, IProduct, IReview]
  >().components.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;

  const cycles: AutoBeInterfaceSchemaDecoupleCycle[] =
    AutoBeInterfaceSchemaDecoupleProgrammer.detectCycles(schemas);
  TestValidator.equals("two independent cycles detected", 2, cycles.length);

  // Sort cycles by each cycle's first sorted type so comparison is stable
  const sorted: AutoBeInterfaceSchemaDecoupleCycle[] = cycles
    .slice()
    .sort((a, b) =>
      a.types.slice().sort()[0]!.localeCompare(b.types.slice().sort()[0]!),
    );

  const [authorPost, productReview] = sorted;

  TestValidator.equals(
    "author/post cycle types",
    authorPost!.types.slice().sort(),
    ["IAuthor", "IPost"],
  );
  TestValidator.equals(
    "author/post cycle edges",
    authorPost!.edges
      .slice()
      .sort((a, b) => a.sourceType.localeCompare(b.sourceType)),
    [
      { sourceType: "IAuthor", propertyName: "post", targetType: "IPost" },
      { sourceType: "IPost", propertyName: "author", targetType: "IAuthor" },
    ],
  );

  TestValidator.equals(
    "product/review cycle types",
    productReview!.types.slice().sort(),
    ["IProduct", "IReview"],
  );
  TestValidator.equals(
    "product/review cycle edges",
    productReview!.edges
      .slice()
      .sort((a, b) => a.sourceType.localeCompare(b.sourceType)),
    [
      {
        sourceType: "IProduct",
        propertyName: "review",
        targetType: "IReview",
      },
      {
        sourceType: "IReview",
        propertyName: "product",
        targetType: "IProduct",
      },
    ],
  );
};
