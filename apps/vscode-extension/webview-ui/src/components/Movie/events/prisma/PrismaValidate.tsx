import { AutoBePrismaValidateEvent } from "@autobe/interface";

import EventBubble from "../../../common/EventBubble";
import InfoCard from "../../../common/InfoCard";
import StatusIndicator from "../../../common/StatusIndicator";

interface IPrismaValidateProps {
  event: AutoBePrismaValidateEvent;
}

const PrismaValidate = ({ event }: IPrismaValidateProps) => {
  // 오류 메시지들을 추출
  const errorMessages =
    event.result.errors?.map((error) => error.message) || [];

  return (
    <EventBubble
      iconPath="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
      title="데이터베이스 스키마 검증"
      theme="green"
      timestamp={event.created_at}
    >
      <InfoCard title="검증 결과" theme="green">
        <StatusIndicator
          success={false}
          successText="검증 성공"
          failureText="검증 실패"
          errorMessage={errorMessages.join(", ")}
        />
      </InfoCard>

      <InfoCard title="검증 단계" theme="green">
        데이터베이스 스키마 검증 중 오류가 발견되어 수정이 필요합니다.
      </InfoCard>
    </EventBubble>
  );
};

export default PrismaValidate;
