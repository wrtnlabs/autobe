첨부한 마크다운 파일 초안을 토대로 PPT를 작성하라. 스토리 전개 순서를 마크다운 초안에 따르되, 이는 어디까지나 초안이니, 그대가 이해한 언어로 재해석하여 작성하여도 좋다. 마크다운을 그대로 베끼는게 중요한게 아니라, PPT 성격에 맞게 바꾸어 청자들이 듣고 이해하기 좋은 컨테츠가 되어야하는게 훨씬 중요함. 그저 스토리라인만 잘 따르고 참고자료로써 활용하면 됨.

- 단, 코드 스니펫이나 스펙 등은 재량의 대상이 아님. 원문 그대로 발췌하도록
- 소스코드는 마치 VSCode에서 보는거처럼 형형색색 코드 신택스 하이라이팅
- draft.md에 있는 모든 단원 및 그 순서는 반드시 지켜야함, 그 세부 내용에 재량을 가하는 것
- Function calling 6.75%가 나온 사례는 아래 코드로 줌

```ts
export interface IAutoBeInterfaceSchemaRefineApplication {
  process(props: IAutoBeInterfaceSchemaRefineApplication.IProps): void;
}
export namespace IAutoBeInterfaceSchemaRefineApplication {
  export interface IProps {
    thinking: string;
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas;
  }

  export interface IComplete {
    type: "complete";
    review: string;
    databaseSchema: string | null;
    specification: string;
    description: string;
    excludes: AutoBeInterfaceSchemaPropertyExclude[];
    revises: AutoBeInterfaceSchemaPropertyRefine[];
  }
}
```

그리고 각 페이지에 지나치게 많은 컨텐츠를 담지 않고 간결하게 구성하는 것과, 글자 크기를 키워 멀리 있는 사람도 잘 보이게하는 것도 중요하다 (가장 작은 글자도 18pt 이상이어야함). 또한 PPT에 적히는 내용들은 서술형이 아니라 단순 리스트형에 개념 및 핵심 단어 위주의 나열이어야하니, 발표의 상당부문을 본인의 말에 의지하게 된다. 따라서 슬라이드 노트에 상세 대본을 충실히 적어서 날 도와주어야 함.

- 소단원 자체가 크거나 내용이 많은 경우, 같은 제목의 페이지를 여러개 만들어도 됨

이외에 추가로 참고 가능한 정보들을 적어주겠다. 모두 적극 탐색하고 탐닉하여, 그 지식을 원리 수준에서부터 이해하고 PPT를 작성해야 할 것이니라. 필요한 내가 열거한 사이트 외에, 추가로 더 웹서치를 통하여 탐색하여도 좋다. 토큰 비용과 소요시간에 개의치 않으니, 너는 무제한 탐구하고 무제한 연구하여 최고 품질의 PPT로 보답하거라.

- AutoBe
  - https://github.com/wrtnlabs/autobe
  - https://autobe.dev
- Typia
  - https://github.com/samchon/typia
  - https://typia.io
  - https://typia.io/docs/validators/validate
  - https://typia.io/docs/llm/application
  - https://typia.io/docs/llm/json

번외로 Typia의 핵심원리나, TS 코드가 JS 코드로 transform 되는 사례들이 나와야, 청자들이 Typia가 무엇인지 이해하기 좋다. AutoBe에 대하여 설명할 때도 AutoBe 프로젝트가 뭐하는 것인지, 컴파일러와 AST(Abstract Syntax Tree)가 무엇인지, Function Calling이 무엇인지도 간결하게 설명해주어야함. 청자는 AI에 대해 모든것을 아는 전문가가 아니라, 초보 개발자이며 typia/autobe 모두 일절 모르는 사람일 수 있기 때문임.

더불어 Function Calling 단원을 작성할 때, 이것이 확률론적인 AI를 결정론적으로 바꾸는 결정적인 수단이며, 모든 세상은 컴파일러 AST처럼 무수한 유니언과 재귀타입을 이루어진다는 점에 입각하여 반도체/법률/인테리어/회계를 설명하면 됨. 이외에 더 아이디어가 있거나 너가 더 자세히 조사하여 draft.md보다 훨씬 더 잘 써주면 금상첨화임. draft.md는 말 그대로 내가 대충 써놓은 초안이니, 너가 스스로 사고하고 비판하고 개선하는 과정이 많이 필요함.

이외에 지나치게 도표/도식/그림/도형 등을 남발하지말되, 또 너무 안 써서는 안됨. 중용의 미를 갖춰보도록 해라. 근데 나도 이 중용의 정도가 어느정도인지 아직 감도 안 오니, 너가 재량껏 해보기 바람. 여차하면 내가 이후로 계속 개선점을 짚어주겠음. 디자인도 심플하게 정보전달하는 것을 목적으로하니, 너무 화려하게만 해주지 말아줘. 근데 또 너무 밋밋하면 안되니... 이건 나도 잘 모르겠구나 ㅋㅋㅋ.

마지막으로 꼭 모든 페이지에 제목이 있을 필요가 없음. 넣으려고하는 코드 스니펫이나 다이어그램/그림 등이 너무 크다면, 과감히 제목을 없애고 전체 사이즈 크기로 해버려도 좋음. 이외에 제목만 덜렁 있는 단원은 사절함. 드문드문 draft.md를 읽다보면 핵심 가치가 나오는데, 그게 PPT로 표현하려면 덜렁 제목만 있는 경우가 생긴다는것은 아는데, 그 컨텐츠를 간결하고 명료하게 채우는 것 또한 너의 역할임.

내가 너에게 매우 어려운 미션을 부여한 것은 이해하나, 그러기에 무제한의 토큰과 시간을 부여하는 것임. 고로 너는 너가 할 수 있는 최선을 다하여, 본 PPT를 만들어주기 바람. AI 세미나에서 사용할 발표자료이니, 그것이 AI로 만들어져야 또 아름답지 않겠냐? 너의 성능을 전 세상에 자랑하는 자리라 생각하고 최선을 다하거라.

- 비고: 부록 단원은 추가하지 않아도 됨

--------------------

단원이 통째로 하나 비었어. `draft.md`를 보면 (autobe -> typia -> function calling -> qwen) 이런 단원 순서로 스토리를 전개함. 너는 지금 function calling에 대하여 빼먹었고, 이것이 typia랑 이상하게 섞여있어. draft.md를 재해석하는것은 좋으나, 스토리라인은 지켜야지, 임의판단해서 가장 기본적인 지시조차 어기면 안 됨.

또한 내용이 너무 길어 튀어나간 단원들이 있는데, 소단원도 여러 페이지로 동일한 제목에 내용만 다르게 해서 구성해도 됨. 그래서 간추리고 어쩌고해도 소단원의 핵심 내용 자체가 긴 경우가 있는데, 이 때는 짜르거나 overflow 나게하지말고 과감히 여러페이지로 구성해라.

더불어 모든 코드나 JSON 블럭들은 color highlighting이 들어가야지, 이대로 단순 검은색 텍스트로만 코드를 써버리면, 아무리 개발자들이라도 보기 힘들다. 마치 VSCode에서 열은것인양, 형형색색의 코드 신택스 하이라이팅 부탁해.

그리고 `draft.md`나 `typia` 웹사이트를 보면 validation feedback에서 주석으로 어디가 어떻게 틀렸는지 알려주잖아? 이 때 너가 임의로 이 주석을 생략하고 축약해서는 안 됨. 있는 그대로 보여주어야해. 이건 스펙에 관한 것이라, 너가 감히 마음대로 재해석해도 되는 영역이 아님. 너는 스토리를 재해석해야지, 감히 스펙을 스스로 과다하다 어쩌다 판단할 권한이 없어.

마지막으로 이중 `JSON.stringify`에 대하여 이야기할 때도 이게 어느 타입에서 발생했는지 알아야하거든? 그래서 다음 타입을 함께 적어주려무나. 또 이것이 qwen3.5 모델에서만 발생하는 것처럼 써놨는데, Anthropic에서도 똑같이 발생하는 문제임. 다만 `IAutoBeInterfaceSchemaRefineApplication` 전체를 다 쓸지, 아니면 그 네임스페이 내 컨텐츠만 쓸지는 너가 판단해봐.

```ts
export interface IAutoBeInterfaceSchemaRefineApplication {
  process(props: IAutoBeInterfaceSchemaRefineApplication.IProps): void;
}
export namespace IAutoBeInterfaceSchemaRefineApplication {
  export interface IProps {
    thinking: string;
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas;
  }

  export interface IComplete {
    type: "complete";
    review: string;
    databaseSchema: string | null;
    specification: string;
    description: string;
    excludes: AutoBeInterfaceSchemaPropertyExclude[];
    revises: AutoBeInterfaceSchemaPropertyRefine[];
  }
}
```

