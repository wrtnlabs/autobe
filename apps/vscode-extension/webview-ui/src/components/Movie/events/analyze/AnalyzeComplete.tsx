import { AutoBeAnalyzeCompleteEvent } from "@autobe/interface";

import CompleteEventBase from "../common/CompleteEventBase";

interface IAnalyzeCompleteProps {
  event: AutoBeAnalyzeCompleteEvent;
}

const AnalyzeComplete = ({ event }: IAnalyzeCompleteProps) => {
  return (
    <CompleteEventBase
      title="분석 완료"
      message={`요구사항 분석이 완료되었습니다. 총 ${event.files.length}개의 문서가 생성되었습니다.`}
      theme="blue"
      timestamp={event.created_at}
      iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      files={event.files}
      enableFileSave={true}
      defaultDirectory="requirements"
    />
  );
};

export default AnalyzeComplete;
