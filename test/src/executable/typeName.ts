import { AutoBeTest } from "@autobe/interface";
import typia, { IJsonSchemaUnit } from "typia";

const unit: IJsonSchemaUnit = typia.json.schema<AutoBeTest.IExpression>();
console.log(unit.components.schemas?.["AutoBeTest.IExpression"]);
