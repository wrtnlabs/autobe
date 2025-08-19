import { AutoBePrismaCorrectEvent } from "@autobe/interface";

import EventBubble from "../../../common/EventBubble";
import InfoCard from "../../../common/InfoCard";

interface IPrismaCorrectProps {
  event: AutoBePrismaCorrectEvent;
}

const PrismaCorrect = ({ event }: IPrismaCorrectProps) => {
  // 오류 메시지들을 추출
  const errorMessages =
    event.failure.errors?.map((error) => error.message) || [];

  return (
    <EventBubble
      iconPath="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      title="데이터베이스 스키마 수정"
      theme="green"
      timestamp={event.created_at}
    >
      <InfoCard title="수정 계획" theme="green">
        {event.planning}
      </InfoCard>

      <InfoCard title="발견된 오류" theme="green">
        {errorMessages.join(", ")}
      </InfoCard>

      <InfoCard title="수정 단계" theme="green">
        검증 오류를 수정하여 데이터베이스 스키마를 개선합니다.
      </InfoCard>
    </EventBubble>
  );
};

export default PrismaCorrect;
