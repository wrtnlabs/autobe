import { AutoBeEvent, AutoBeProgressEventBase } from "@autobe/interface";

import ChatBubble from "../../ChatBubble";

type ExtractTarget<T extends AutoBeEvent> = T extends AutoBeProgressEventBase
  ? T
  : never;
export interface IProgressEventsMovieProps {
  event: ExtractTarget<AutoBeEvent>;
}

const ProgressEventsMovie = (props: IProgressEventsMovieProps) => {
  const { event } = props;

  const title = getTitle(event);
  const progressPercent =
    event.total > 0 ? Math.round((event.completed / event.total) * 100) : 0;

  const content =
    `🔄 ${title} 진행 중...\n\n` +
    `📊 진행률: ${event.completed}/${event.total} (${progressPercent}%)\n` +
    `${generateProgressBar(progressPercent)}\n\n` +
    `${event.completed === event.total ? "✅ 완료됨" : "⏳ 처리 중..."}`;

  return (
    <ChatBubble
      content={content}
      type="assistant"
      timestamp={event.created_at}
      assistantName="AutoBe"
    />
  );
};

const generateProgressBar = (percent: number): string => {
  const barLength = 20;
  const filledLength = Math.round((percent / 100) * barLength);
  const emptyLength = barLength - filledLength;

  const filled = "█".repeat(filledLength);
  const empty = "░".repeat(emptyLength);

  return `[${filled}${empty}]`;
};

const TITLE_MAP = {
  analyzeWrite: "분석 초안 작성",
  analyzeReview: "분석안 퇴고",
  prismaSchemas: "데이터베이스 스키마 (Prisma)",
  prismaReview: "데이터베이스 스키마 (Prisma) 퇴고",
  interfaceEndpoints: "API 인터페이스 (Interface)",
  interfaceOperationsReview: "API 인터페이스 (Interface) 퇴고",
  interfaceSchemas: "API 인터페이스 (Interface) 스키마",
  interfaceSchemasReview: "API 인터페이스 (Interface) 스키마 퇴고",
  interfaceAuthorization: "API 인터페이스 (Interface) 권한 설정",
  interfaceOperations: "API 인터페이스 (Interface) 작업",
  testScenarios: "테스트 시나리오",
  testWrite: "테스트 초안 작성",
  realizeWrite: "코드 구현 초안 작성",
  realizeCorrect: "코드 구현 퇴고",
  realizeAuthorizationWrite: "권한 코드 구현",
  realizeTestOperation: "테스트 코드 구현",
} satisfies Record<ExtractTarget<AutoBeEvent>["type"], string>;

const getTitle = (event: IProgressEventsMovieProps["event"]) => {
  return TITLE_MAP[event.type] ?? "아무튼 무언가 작업 중";
};

export default ProgressEventsMovie;
