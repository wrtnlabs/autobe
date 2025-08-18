import { AutoBeRealizeTestResetEvent } from "@autobe/interface";

import EventBubble from "../../../common/EventBubble";
import InfoCard from "../../../common/InfoCard";

interface IRealizeTestResetProps {
  event: AutoBeRealizeTestResetEvent;
}

const RealizeTestReset = ({ event }: IRealizeTestResetProps) => {
  return (
    <EventBubble
      iconPath="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      title="테스트 리셋"
      theme="green"
      timestamp={event.created_at}
    >
      {/* 리셋 결과 메시지 */}
      <InfoCard title="테스트 환경 리셋 완료" theme="green">
        테스트 환경이 성공적으로 리셋되었습니다. 이전 테스트 데이터와 상태가
        초기화되었습니다. 새로운 테스트 실행을 위한 깨끗한 환경이
        준비되었습니다.
      </InfoCard>

      {/* 추가 정보 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>분석 단계:</span>
            <span className="font-medium">{event.step}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>완료 시간:</span>
            <span className="font-medium">
              {new Date(event.completed_at).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </EventBubble>
  );
};

export default RealizeTestReset;
