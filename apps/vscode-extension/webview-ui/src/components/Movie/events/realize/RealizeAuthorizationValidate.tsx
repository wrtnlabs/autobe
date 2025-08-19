import {
  AutoBeRealizeAuthorization,
  AutoBeRealizeAuthorizationValidateEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";

import EventBubble from "../../../common/EventBubble";
import ExpandableList from "../../../common/ExpandableList";
import InfoCard from "../../../common/InfoCard";

interface IRealizeAuthorizationValidateProps {
  event: AutoBeRealizeAuthorizationValidateEvent;
}

// 컴파일 오류 아이템 컴포넌트
const CompileErrorItem = ({
  diagnostic,
}: {
  diagnostic: IAutoBeTypeScriptCompileResult.IDiagnostic;
}) => {
  return (
    <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-2 h-2 bg-red-400 rounded-full" />
        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
          {diagnostic.category}
        </span>
      </div>
      <div className="ml-4 space-y-1">
        <div className="text-xs text-gray-600">{diagnostic.messageText}</div>
        {diagnostic.file && (
          <div className="text-xs text-gray-500 font-mono">
            {diagnostic.file}
          </div>
        )}
        {diagnostic.start !== undefined && (
          <div className="text-xs text-gray-500">
            위치: {diagnostic.start} (길이: {diagnostic.length || 0})
          </div>
        )}
      </div>
    </div>
  );
};

// 인증 정보 아이템 컴포넌트
const AuthorizationItem = ({
  authorization,
}: {
  authorization: AutoBeRealizeAuthorization;
}) => {
  return (
    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full" />
        <span className="text-sm font-medium text-gray-800">
          {authorization.role?.name || "인증"}
        </span>
        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
          인증
        </span>
      </div>
      <div className="ml-4 space-y-2">
        {authorization.role?.description && (
          <div className="text-xs text-gray-600">
            {authorization.role.description}
          </div>
        )}
        <div className="bg-gray-100 p-2 rounded text-xs font-mono text-gray-700 overflow-x-auto">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(authorization, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

const RealizeAuthorizationValidate = ({
  event,
}: IRealizeAuthorizationValidateProps) => {
  const isFailure = event.result.type === "failure";
  const isException = event.result.type === "exception";

  return (
    <EventBubble
      iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      title="인증 검증"
      theme="blue"
      timestamp={event.created_at}
    >
      {/* 검증 결과 메시지 */}
      <InfoCard title="인증 검증 결과" theme="blue">
        {isFailure
          ? `${(event.result as IAutoBeTypeScriptCompileResult.IFailure).diagnostics.length}개의 컴파일 오류가 발견되었습니다.`
          : isException
            ? "컴파일 중 예외가 발생했습니다."
            : "인증 검증이 완료되었습니다."}
      </InfoCard>

      {/* 컴파일 오류들 */}
      {isFailure &&
        (event.result as IAutoBeTypeScriptCompileResult.IFailure).diagnostics
          .length > 0 && (
          <ExpandableList
            title="컴파일 오류"
            items={
              (event.result as IAutoBeTypeScriptCompileResult.IFailure)
                .diagnostics
            }
            theme="blue"
            renderItem={(diagnostic, index) => (
              <CompileErrorItem key={index} diagnostic={diagnostic} />
            )}
            maxDisplay={3}
          />
        )}

      {/* 예외 정보 */}
      {isException && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm font-medium text-red-700 mb-2">예외 발생</div>
          <div className="text-xs text-red-600">
            {String(
              (event.result as IAutoBeTypeScriptCompileResult.IException).error,
            )}
          </div>
        </div>
      )}

      {/* 인증 정보 */}
      <ExpandableList
        title="검증된 인증"
        items={[event.authorization]}
        theme="blue"
        renderItem={(authorization, index) => (
          <AuthorizationItem key={index} authorization={authorization} />
        )}
        maxDisplay={1}
      />

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

export default RealizeAuthorizationValidate;
