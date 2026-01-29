import {
  AutoBeAnalyzeActor,
  AutoBeDatabaseComponentTableRevise,
} from "@autobe/interface";
import { IValidation } from "typia";

import { AutoBeDatabaseComponentReviewProgrammer } from "./AutoBeDatabaseComponentReviewProgrammer";

export namespace AutoBeDatabaseAuthorizationReviewProgrammer {
  export const validate = (props: {
    errors: IValidation.IError[];
    path: string;
    prefix: string | null;
    actor: AutoBeAnalyzeActor;
    revises: AutoBeDatabaseComponentTableRevise[];
  }): void => {
    AutoBeDatabaseComponentReviewProgrammer.validate(props);

    // @todo Michael
    //   revises 적용했더니 actor나 session 테이블이 사라지는 경우를 위한 피드백 필요
  };
}
