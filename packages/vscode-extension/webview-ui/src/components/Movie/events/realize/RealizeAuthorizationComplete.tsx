import { AutoBeRealizeAuthorizationCompleteEvent } from "@autobe/interface";

import EventBubble from "../../../common/EventBubble";
import InfoCard from "../../../common/InfoCard";

interface IRealizeAuthorizationCompleteProps {
  event: AutoBeRealizeAuthorizationCompleteEvent;
}

const RealizeAuthorizationComplete = ({
  event,
}: IRealizeAuthorizationCompleteProps) => {
  return (
    <EventBubble
      iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      title="인증 완료"
      theme="blue"
      timestamp={event.created_at}
    >
      {/* 완료 메시지 */}
      <InfoCard title="인증 구현 완료" theme="blue">
        인증 및 권한 관리 시스템이 완료되었습니다. 역할 기반 접근 제어가
        구현되었습니다.
      </InfoCard>

      {/* 추가 정보 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>분석 단계:</span>
            <span className="font-medium">{event.step}</span>
          </div>
        </div>
      </div>
    </EventBubble>
  );
};

export default RealizeAuthorizationComplete;
