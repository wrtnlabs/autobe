import { AutoBeRealizeAuthorizationCompleteEvent } from "@autobe/interface";

import CompleteEventBase from "../common/CompleteEventBase";

interface IRealizeAuthorizationCompleteProps {
  event: AutoBeRealizeAuthorizationCompleteEvent;
}

const RealizeAuthorizationComplete = ({
  event,
}: IRealizeAuthorizationCompleteProps) => {
  return (
    <CompleteEventBase
      title="인증 완료"
      message="인증 및 권한 관리 시스템이 완료되었습니다. 역할 기반 접근 제어가 구현되었습니다."
      theme="blue"
      timestamp={event.created_at}
      iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      enableFileSave={false}
    >
      {/* 추가 정보 */}
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>분석 단계:</span>
            <span className="font-medium">{event.step}</span>
          </div>
        </div>
      </div>
    </CompleteEventBase>
  );
};

export default RealizeAuthorizationComplete;
