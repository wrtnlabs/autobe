export namespace AutoBeRealizeAuthorizationReplaceImport {
  export function replaceProviderImport(role: string, content: string): string {
    let updatedContent = content;

    const roleCapitalized =
      role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

    const nestjsCommonPattern =
      /import\s+{\s*[^}]*\s*}\s+from\s+"@nestjs\/common";/g;
    const nestjsCommonReplacement =
      'import { ForbiddenException, UnauthorizedException } from "@nestjs/common";';

    const myGlobalPattern = /import\s+{\s*MyGlobal\s*}\s+from\s+[^;]+;/g;
    const myGlobalReplacement = 'import { MyGlobal } from "../../MyGlobal";';

    const jwtAuthorizePattern =
      /import\s+{\s*jwtAuthorize\s*}\s+from\s+[^;]+;/g;
    const jwtAuthorizeReplacement =
      'import { jwtAuthorize } from "./jwtAuthorize";';

    const payloadPattern = /import\s+{\s*\w*Payload\s*}\s+from\s+[^;]+;/g;
    const payloadReplacement = `import { ${roleCapitalized}Payload } from "../../decorators/payload/${roleCapitalized}Payload";`;

    // 각 패턴을 순차적으로 적용
    updatedContent = updatedContent.replace(
      nestjsCommonPattern,
      nestjsCommonReplacement,
    );
    updatedContent = updatedContent.replace(
      myGlobalPattern,
      myGlobalReplacement,
    );
    updatedContent = updatedContent.replace(
      jwtAuthorizePattern,
      jwtAuthorizeReplacement,
    );
    updatedContent = updatedContent.replace(payloadPattern, payloadReplacement);

    return updatedContent;
  }

  export function replaceDecoratorImport(
    role: string,
    content: string,
  ): string {
    let updatedContent = content;

    const roleLowercase = role.toLowerCase();

    // ~Authorize로 끝나는 import 구문을 특정 경로로 변경하는 정규표현식
    const authorizePattern = /import\s+{\s*\w*Authorize\s*}\s+from\s+[^;]+;/g;

    // role을 기반으로 동적으로 replacement 생성
    const authorizeReplacement = `import { ${roleLowercase}Authorize } from "../providers/authorize/${roleLowercase}Authorize";`;

    // 패턴 적용
    updatedContent = updatedContent.replace(
      authorizePattern,
      authorizeReplacement,
    );

    return updatedContent;
  }
}
