import { AutoBePrismaCompleteEvent } from "@autobe/interface";

import StatusIndicator from "../../../common/StatusIndicator";
import CompleteEventBase from "../common/CompleteEventBase";

interface IPrismaCompleteProps {
  event: AutoBePrismaCompleteEvent;
}

const PrismaComplete = ({ event }: IPrismaCompleteProps) => {
  const schemaFiles = Object.keys(event.schemas || {});

  // 오류 메시지들을 추출
  const errorMessages =
    !event.result.success && event.result.errors
      ? event.result.errors.map((error) => error.message)
      : [];

  // 파일 목록을 CompleteEventBase 형식으로 변환
  const files = Object.entries(event.schemas || {}).map(
    ([filename, content]) => ({
      filename,
      content,
    }),
  );

  return (
    <CompleteEventBase
      title="데이터베이스 설계 완료"
      message="데이터베이스 설계가 성공적으로 완료되었습니다."
      theme="green"
      timestamp={event.created_at}
      iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      files={files}
      enableFileSave={true}
      defaultDirectory="prisma"
    >
      {/* 검증 결과 */}
      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="text-sm font-medium text-green-700 mb-2">검증 결과</div>
        <StatusIndicator
          success={event.result.success}
          successText="검증 성공"
          failureText="검증 실패"
          errorMessage={
            errorMessages.length > 0 ? errorMessages.join(", ") : undefined
          }
        />
      </div>

      {/* 컴파일 결과 */}
      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="text-sm font-medium text-green-700 mb-2">
          컴파일 결과
        </div>
        <StatusIndicator
          success={event.compiled.type === "success"}
          successText="컴파일 성공"
          failureText="컴파일 실패"
          errorMessage={
            event.compiled.type === "failure"
              ? "컴파일 중 오류가 발생했습니다."
              : undefined
          }
        />
      </div>
    </CompleteEventBase>
  );
};

export default PrismaComplete;
