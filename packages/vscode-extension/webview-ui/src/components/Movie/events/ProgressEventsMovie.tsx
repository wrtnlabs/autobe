import {
  AutoBeAnalyzeReviewEvent,
  AutoBeAnalyzeWriteEvent,
  AutoBeInterfaceEndpointsEvent,
  AutoBeInterfaceOperationsReviewEvent,
  AutoBeInterfaceSchemasEvent,
  AutoBeInterfaceSchemasReviewEvent,
  AutoBePrismaReviewEvent,
  AutoBePrismaSchemasEvent,
} from "@autobe/interface";

import ChatBubble from "../../ChatBubble";

interface IProgressEventsMovieProps {
  event: /** Analyze */
  | AutoBeAnalyzeWriteEvent
    | AutoBeAnalyzeReviewEvent
    /** Prisma */
    | AutoBePrismaSchemasEvent
    | AutoBePrismaReviewEvent

    /** Interface */
    | AutoBeInterfaceEndpointsEvent
    | AutoBeInterfaceOperationsReviewEvent
    | AutoBeInterfaceSchemasEvent
    | AutoBeInterfaceSchemasReviewEvent;
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

const getTitle = (event: IProgressEventsMovieProps["event"]) => {
  switch (event.type) {
    case "analyzeWrite": {
      return "분석 초안 작성";
    }
    case "analyzeReview": {
      return "분석안 퇴고";
    }
    case "prismaSchemas":
    case "prismaReview": {
      return "데이터베이스 스키마 (Prisma)";
    }
    case "interfaceEndpoints":
    case "interfaceOperationsReview":
    case "interfaceSchemas":
    case "interfaceSchemasReview": {
      return "API 인터페이스 (Interface)";
    }
    default: {
      return "알 수 없음";
    }
  }
};

export default ProgressEventsMovie;
