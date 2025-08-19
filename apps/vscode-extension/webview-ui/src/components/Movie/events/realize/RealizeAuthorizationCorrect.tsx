import { AutoBeRealizeAuthorizationCorrectEvent } from "@autobe/interface";

import EventBubble from "../../../common/EventBubble";
import InfoCard from "../../../common/InfoCard";

interface IRealizeAuthorizationCorrectProps {
  event: AutoBeRealizeAuthorizationCorrectEvent;
}

const RealizeAuthorizationCorrect = ({
  event,
}: IRealizeAuthorizationCorrectProps) => {
  return (
    <EventBubble
      iconPath="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
      title="인증 수정"
      theme="blue"
      timestamp={event.created_at}
    >
      {/* 수정 결과 메시지 */}
      <InfoCard title="인증 수정 완료" theme="blue">
        인증 데코레이터가 수정되었습니다. 검증 과정에서 발견된 문제들이
        해결되었습니다.
      </InfoCard>

      {/* 수정된 인증 정보 */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm font-medium text-blue-700 mb-2">
          수정된 인증
        </div>
        <div className="text-xs text-blue-600">
          <div className="mb-2">
            <span className="font-medium">역할:</span>{" "}
            {event.authorization.role?.name || "알 수 없음"}
          </div>
          <div className="mb-2">
            <span className="font-medium">오류 분석:</span>
            <div className="mt-1 p-2 bg-gray-100 rounded text-xs">
              {event.authorization.error_analysis}
            </div>
          </div>
          <div className="mb-2">
            <span className="font-medium">해결 방안:</span>
            <div className="mt-1 p-2 bg-gray-100 rounded text-xs">
              {event.authorization.solution_guidance}
            </div>
          </div>
        </div>
      </div>

      {/* 컴파일 오류 정보 */}
      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
        <div className="text-sm font-medium text-red-700 mb-2">컴파일 오류</div>
        <div className="text-xs text-red-600">
          {event.result.diagnostics.length}개의 오류가 발견되어 수정되었습니다.
        </div>
      </div>

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

export default RealizeAuthorizationCorrect;
