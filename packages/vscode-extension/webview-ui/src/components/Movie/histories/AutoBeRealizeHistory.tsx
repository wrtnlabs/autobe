import { AutoBeRealizeHistory } from "@autobe/interface";

import HistoryBubble from "../../common/HistoryBubble";
import HistoryInfoCard from "../../common/HistoryInfoCard";

interface IAutoBeRealizeHistoryProps {
  history: AutoBeRealizeHistory;
}

const AutoBeRealizeHistoryComponent = (props: IAutoBeRealizeHistoryProps) => {
  const { history } = props;

  return (
    <HistoryBubble
      iconPath="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      title="비즈니스 로직 구현 완료"
      theme="purple"
      timestamp={history.created_at}
    >
      <HistoryInfoCard title="구현 이유" theme="purple">
        {history.reason}
      </HistoryInfoCard>

      <HistoryInfoCard title="인증/인가 데코레이터 수" theme="purple">
        {history.authorizations?.length || 0}개
      </HistoryInfoCard>
    </HistoryBubble>
  );
};

export default AutoBeRealizeHistoryComponent;
