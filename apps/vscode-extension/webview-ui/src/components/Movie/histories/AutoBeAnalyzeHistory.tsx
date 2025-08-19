import { AutoBeAnalyzeHistory } from "@autobe/interface";

import FileList from "../../common/FileList";
import HistoryBubble from "../../common/HistoryBubble";
import HistoryInfoCard from "../../common/HistoryInfoCard";

interface IAutoBeAnalyzeHistoryProps {
  history: AutoBeAnalyzeHistory;
}

const AutoBeAnalyzeHistoryComponent = (props: IAutoBeAnalyzeHistoryProps) => {
  const { history } = props;

  const fileNames = history.files?.map((file) => file.filename) || [];
  const roleNames = history.roles?.map((role) => role.name) || [];

  return (
    <HistoryBubble
      iconPath="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      title="분석 완료"
      theme="blue"
      timestamp={history.created_at}
    >
      <HistoryInfoCard title="분석 이유" theme="blue">
        {history.reason}
      </HistoryInfoCard>

      <FileList title="생성된 문서" files={fileNames} theme="blue" />

      <FileList title="식별된 역할" files={roleNames} theme="blue" />

      <HistoryInfoCard title="완료 시간" theme="blue">
        {new Date(history.completed_at).toLocaleString("ko-KR", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </HistoryInfoCard>
    </HistoryBubble>
  );
};

export default AutoBeAnalyzeHistoryComponent;
