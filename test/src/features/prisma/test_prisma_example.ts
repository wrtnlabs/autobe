import { AutoBeAgent, orchestrate } from "@autobe/agent";
import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";
import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeAnalyzeHistory } from "@autobe/interface";
import OpenAI from "openai";
import { v4 } from "uuid";

import { TestGlobal } from "../../TestGlobal";

export const test_prisma_example = async () => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;
  const files: Record<string, string> = await FileSystemIterator.read({
    root: `${TestGlobal.ROOT}/assets/shopping/docs/requirements`,
    extension: "md",
    prefix: "",
  });
  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({ apiKey: TestGlobal.env.CHATGPT_API_KEY }),
      model: "gpt-4.1",
    },
    compiler: new AutoBeCompiler(),
  });
  await orchestrate.prisma({
    ...agent.getContext(),
    state: () =>
      ({
        analyze: {
          id: v4(),
          type: "analyze",
          files,
          reason: "User request make this user requirement report.",
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          step: 0,
        } satisfies AutoBeAnalyzeHistory,
        prisma: null,
        interface: null,
        test: null,
        realize: null,
      }) satisfies AutoBeState,
  })({
    reason: "just for testing",
    userPlanningRequirements: `
\`\`\`md
### **사내 게시판 요구사항 명세**

| **분류** | **요구사항** |
| --- | --- |
| **1. 사용자 인증·권한** | • 회사 이메일 + 비밀번호 로그인만 허용• 최초 발급 비밀번호: **1234**• 최초 로그인 시 **비밀번호 강제 변경** 절차 필수• 로그인 전에는 **모든 게시글·댓글 열람 불가** |
| **2. 게시판 구조** | • 게시판 유형: **공지사항**, **자유게시판**, **인기게시판**• **인기게시판**: 좋아요 ≥ 10 인 글이 자동 승격 |
| **3. 글·댓글 기능** | • 글 작성, 수정, 삭제 (본인 + 관리자 권한)• 댓글 및 **대댓글(1‑depth)** 작성·삭제 지원• 글·댓글 모두 **좋아요** 가능 (사용자 당 1회) |
| **4. UI / UX** | • **왼쪽 네비게이션 바**: 게시판 목록·글쓰기 버튼• **우측 상단**: 로그인/로그아웃, 비밀번호 변경 메뉴 |
| **5. 기타 제약** | • 삭제된 글·댓글은 복구 불가 (하드 삭제)• 동시 좋아요 중복 방지 처리가 서버 측에 구현될 것 |
\`\`\`    
`,
  });
};
