import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import jwt from "jsonwebtoken";

import { MyGlobal } from "../../MyGlobal";

export function jwtAuthorize(props: {
  request: {
    headers: { authorization?: string };
  };
}) {
  if (!props.request.headers.authorization)
    throw new ForbiddenException("No token value exists");

  // PARSE TOKEN
  try {
    if (
      props.request.headers.authorization.startsWith(BEARER_PREFIX) === true
    ) {
      const token: string = props.request.headers.authorization.substring(
        BEARER_PREFIX.length,
      );

      const verified = jwt.verify(token, MyGlobal.env.JWT_SECRET_KEY);

      return verified;
    } else {
      const token = props.request.headers.authorization;

      const verified = jwt.verify(token, MyGlobal.env.JWT_SECRET_KEY);

      return verified;
    }
  } catch {
    throw new UnauthorizedException("Invalid token");
  }
}

const BEARER_PREFIX = "Bearer ";
