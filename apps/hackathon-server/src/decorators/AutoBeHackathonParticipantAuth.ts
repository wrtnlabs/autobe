import { IAutobeHackathon } from "@autobe/hackathon-api";
import { SwaggerCustomizer } from "@nestia/core";
import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { Request } from "express";
import { Singleton } from "tstl";

import { AutoBeHackathonParticipantProvider } from "../providers/AutoBeHackathonParticipantProvider";
import { AutoBeHackathonProvider } from "../providers/AutoBeHackathonProvider";

export const AutoBeHackathonParticipantAuth =
  () =>
  (
    target: object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) => {
    SwaggerCustomizer((props) => {
      props.route.security ??= [];
      props.route.security.push({
        bearer: [],
      });
    })(target, propertyKey as string, undefined!);
    singleton.get()(target, propertyKey, parameterIndex);
  };

const singleton = new Singleton(() =>
  createParamDecorator(async (_0: any, ctx: ExecutionContext) => {
    const hackathon: IAutobeHackathon =
      await AutoBeHackathonProvider.get("20250913");
    const request: Request = ctx.switchToHttp().getRequest();
    const value: string | string[] | undefined =
      request.headers.Authorization ?? request.headers.authorization;
    return AutoBeHackathonParticipantProvider.authorize({
      hackathon,
      accessToken: Array.isArray(value) ? value[0] : value,
    });
  })(),
);
