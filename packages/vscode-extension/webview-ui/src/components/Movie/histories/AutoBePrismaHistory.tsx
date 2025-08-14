import { AutoBePrismaHistory } from "@autobe/interface";

import FileList from "../../common/FileList";
import HistoryBubble from "../../common/HistoryBubble";
import HistoryInfoCard from "../../common/HistoryInfoCard";
import StatusIndicator from "../../common/StatusIndicator";

interface IAutoBePrismaHistoryProps {
  history: AutoBePrismaHistory;
}

const AutoBePrismaHistoryComponent = (props: IAutoBePrismaHistoryProps) => {
  const { history } = props;

  const schemaFiles = Object.keys(history.schemas || {});

  return (
    <HistoryBubble
      iconPath="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
      title="데이터베이스 설계 완료"
      theme="green"
      timestamp={history.created_at}
    >
      <HistoryInfoCard title="설계 이유" theme="green">
        {history.reason}
      </HistoryInfoCard>

      <HistoryInfoCard title="검증 결과" theme="green">
        <StatusIndicator
          success={history.result.success}
          successText="검증 성공"
          failureText="검증 실패"
          errorMessage={
            !history.result.success && history.result.errors
              ? history.result.errors.join(", ")
              : undefined
          }
        />
      </HistoryInfoCard>

      <FileList title="생성된 스키마 파일" files={schemaFiles} theme="green" />

      <HistoryInfoCard title="컴파일 결과" theme="green">
        <StatusIndicator
          success={history.compiled.type === "success"}
          successText="컴파일 성공"
          failureText="컴파일 실패"
          errorMessage={
            history.compiled.type === "failure"
              ? "컴파일 중 오류가 발생했습니다."
              : undefined
          }
        />
      </HistoryInfoCard>
    </HistoryBubble>
  );
};

export default AutoBePrismaHistoryComponent;
