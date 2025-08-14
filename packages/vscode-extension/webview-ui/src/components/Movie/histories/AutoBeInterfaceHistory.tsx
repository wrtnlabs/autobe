import { AutoBeInterfaceHistory } from "@autobe/interface";

import HistoryBubble from "../../common/HistoryBubble";
import HistoryInfoCard from "../../common/HistoryInfoCard";

interface IAutoBeInterfaceHistoryProps {
  history: AutoBeInterfaceHistory;
}

const AutoBeInterfaceHistoryComponent = (
  props: IAutoBeInterfaceHistoryProps,
) => {
  const { history } = props;

  return (
    <HistoryBubble
      iconPath="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      title="API 인터페이스 설계 완료"
      theme="purple"
      timestamp={history.created_at}
    >
      <HistoryInfoCard title="설계 이유" theme="purple">
        {history.reason}
      </HistoryInfoCard>

      <HistoryInfoCard title="API 엔드포인트 수" theme="purple">
        {history.document.operations ? history.document.operations.length : 0}개
      </HistoryInfoCard>

      <HistoryInfoCard title="요구사항 분석 단계" theme="purple">
        {history.step}단계
      </HistoryInfoCard>

      <HistoryInfoCard title="완료 시간" theme="purple">
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

export default AutoBeInterfaceHistoryComponent;
