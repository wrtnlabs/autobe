import { AutoBeTestHistory } from "@autobe/interface";

import FileList from "../../common/FileList";
import HistoryBubble from "../../common/HistoryBubble";
import HistoryInfoCard from "../../common/HistoryInfoCard";
import StatusIndicator from "../../common/StatusIndicator";

interface IAutoBeTestHistoryProps {
  history: AutoBeTestHistory;
}

const AutoBeTestHistoryComponent = (props: IAutoBeTestHistoryProps) => {
  const { history } = props;

  const testFileNames = history.files?.map((file) => file.location) || [];

  return (
    <HistoryBubble
      iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      title="E2E 테스트 작성 완료"
      theme="orange"
      timestamp={history.created_at}
    >
      <HistoryInfoCard title="테스트 파일 수" theme="orange">
        {testFileNames.length}개
      </HistoryInfoCard>

      <FileList
        title="생성된 테스트 파일"
        files={testFileNames}
        theme="orange"
      />

      <HistoryInfoCard title="컴파일 결과" theme="orange">
        <StatusIndicator
          success={history.compiled.type === "success"}
          successText="컴파일 성공"
          failureText="컴파일 실패"
          errorMessage={
            history.compiled.type === "failure"
              ? "테스트 코드 컴파일 중 오류가 발생했습니다."
              : undefined
          }
        />
      </HistoryInfoCard>

      <HistoryInfoCard title="요구사항 분석 단계" theme="orange">
        {history.step}단계
      </HistoryInfoCard>
    </HistoryBubble>
  );
};

export default AutoBeTestHistoryComponent;
