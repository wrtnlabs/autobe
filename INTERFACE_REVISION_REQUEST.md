INTERFACE_ENDPOINT.md 를 정독해보면 (반드시 정독할 것) input material 관련 다음 스토리들을 볼 수 있다.

1. input material 데이터 취득 함수들은 최종 목적 함수가 아니며, 단지 최종 목적을 달성하기 위한 수단일 뿐이다. 따라서 input material 관련 함수들을 호출하는게 본 에이전트의 최종 목적이 아니니, 반드시 유념하라 뭐 그런 이야기
2. input material 의 모든 정보를 100% 취득할 필요 없으며, 스스로 딱 필요한만큼만 가져다가 쓰라.
3. 이미 취득한 input material 을 중복 취득하려 들지 마라
4. input material 취득 함수를 호출하며, 공배열을 두지 말지어다
5. input material 과 관련하여 assistant message 들이 주어질 것이고, 또한 이들에는 어떤 input material 요소들을 취득할 수 있고, 이미 취득한 것이 무엇이어서 다시 호출하지 말라는 등, 지시사항들이 함께 적혀져있을 것이다. 이들의 지시사항에 100% 따라라. AI가 임의 판단으로 이를 어기거나 스스로 그보다 더 나은 의사결정을 할 수 있다고 하는 일련의 행위 금지이며, 무조건 절대복종

또한 INTERFACE_ENDPOINT.md 를 보면 파이널 체크리스트에서 이 input material 에 대한 지시사항도 함께 다루고있어. 이것의 원래 final checklist 는 최종 목적 함수에 대한 검증만이 있었는데, 이번에 개정하면서 input material 을 취득하기 위한 함수 호출에 대하여도 여러 최종 점검 요소들을 두어 안정성을 확보하고 있지.

이외에 내가 INTERFACE_ENDPOINT.md 중 놓친게 있을지도 몰라. INTEFACE_ENDPOINT.md 를 다른 인터페이스 부문 시스템 프롬프트들과 비교, 혹시 놓친게 있다면 그 또한 발굴해서 찾아내주기 바래.

-----------------------

그리고 이렇게 INTERFACE_ENDPOINT.md 를 정독하여 추려낸 input material 관련 컨텐츠들을, 여타 시스템 프롬프트 상 interface 부문에 모두 적용해줘. INTERFACE_GROUP.md 와 INTERFACE_SCHEMA_RENAME.md 파일을 제외한 모든 INTERFACE_*.md 파일이 대상이야.

또한 각 문서를 개정함에 있어, 그들 문서 역시 꼼꼼하게 정독하고, 그들의 스토리라인에 맞춰 자연스러운 흐름이 되도록 문서를 개정해야해. 더불어 각 문서는 최고 품질의 시스템 프롬프트여야하니, 문서를 개정한 후 다시 한 번 돌아보며 스스로 최고 품질의 문서 개정을 이루었는지 확인하고 미진했다면 또 한 번 개선해.

이외에 시스템 프롬프트는 CLAUDE.md 를 참고하여 그 가이드를 따르도록 하고, 마지막으로 각 interface agent 들이 사용하는 input material 정보 및 취득 함수들에 대하여, packages/agent/src/interface 의 소스코드를 참고하여 혹시 누락된 material 이 있거나 본디 제공하지 않는데 문서에 쓰인게 없는지 확인하여 고쳐주렴.

-----------------------

이 모든 작업을 마친 후, 너의 작업 내역을 총 요약한 보고서를 INTERFACE_REVISION_REPORT.md 로 적어내도록 해.