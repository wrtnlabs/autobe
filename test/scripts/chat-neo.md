> Even though I'm ordering you by Korean, you must answer me in English.
>
> Repeat that, you must speak English. Never speak any other language like Korean or Chinese.
>
> I repeat once more again that, you have to speak English. Write every documents and codes in English.

## 1. Overview

나는 엔터프라이즈 SASS AI chatbot 서비스를 만들꺼야.

## 2. Internal Member (Supporter)

내부 회원은 엔터프라이즈 기업을 관리하는 역할을 해. 서포터의 일종이라 볼 수 있다.

다만 이들의 역할 (`wrtn_members.role`) 은 다음과 같이 세 가지로 세분화되어있다. 그리고 이 중 administrator 와 moderator 는 엔터프라이즈를 개설하고 철폐하는 등의 엔터프라이즈사들에 대한 직접적인 관리가 가능하며, member 는 오로지 단순 통계 및 레코드 열람 등만이 가능하다.

- `administrator`: administrator, moderator, member 모두를 임명하고 권한 변경할 수 있다.
- `moderator`: moderator, member를 임명하고 권한 변경할 수 있다.
- `member`: 통계 및 단순 레코드 열람만 할 수 있다.

`wrtn_members`, 이들은 이메일과 비밀번호로 로그인할 것이되, 복수의 이메일 계정을 가질 수 있다. 그 이유는 SASS 서비스 특성상 기업 고객사로의 출장을 가야할 수도 있는데, 이 때 그 회사가 보안을 이유로 폐쇄망이 갖춰져있어 외부 인터넷 접속이 불가능할 수도 있기 때문이다.

또한 `wrtn_members` 의 가입은 크게 두 방법으로 이루어진다. 첫 번째는 당사자가 직접 뤼튼 엔터프라이즈의 내부 직원용 홈페이지에 들어와 가입 신청을 하거든, administrator 또는 moderator 가 이를 승인해주는 방법이다. 이 때에는 가입 승인 처리와 동시에 `wrtn_member_appointments` 레코드가 생성되고, `wrtn_members.approved_at` 에 그 시각이 기록된다. 두 번째 방법은 기존의 회원이 `wrtn_member_invitations` 레코드를 발행하며 새 회원에게 이메일로 초대장을 보내는 것이다. 이 때 초대받은 사람이 가입 신청을 하면, 그 즉시로 `wrtn_members` 와 함께 `wrtn_member_appointments` 레코드도 생성된다. 물론 이 때의 임명자는 바로 초대장을 보낸 바로 그 회원이며, `wrtn_member_emails.verified_at` 는 `wrtn_member_invitations.created_at` 의 것이 기록된다.

이외에 administrator 나 moderator 가 기존의 회원을 탈퇴 처리하면, `wrtn_members.deleted_at` 에 그 시각이 기록되며, 이 때에도 역시 `wrtn_member_appointments` 레코드가 하나 더 생성된다. 이 때의 임명자는 탈퇴 처리를 한 바로 그 회원이며, 이 때 변경되는 역할은 `wrtn_members.role` 과 `wrtn_member_appointments.role` 모두 `null` 이 된다. 만일 회원 당사자 스스로가 탈퇴한 것이라면, `wrtn_member_appointments.wrtn_appointer_id` 는 자기 자신이 되며, 이 때의 `role` 역시 두 곳 모두 `null` 이 된다.

```prisma
model wrtn_members {
  id String @id @uuid
  mobile String
  nickname String
  name String
  password_hashed String

  // - administrator: can appoint and invite administrator and moderator
  // - moderator: can appoint and invite member
  // - member: just viewing statistics
  // - null: no role, so can't do anything
  role String?
  created_at DateTime
  updated_at DateTime // updated when title changes
  approved_at DateTime? // first approved time
  deleted_at DateTime?
  
  @@unique([mobile])
  @@unique([nickname])
  @@index([name])
}

model wrtn_member_appointments {
  id String @id @uuid
  wrtn_member_id String @uuid

  // some member who appointed
  // however, it can be null due to the first membership seeding
  wrtn_appointer_id String? @uuid
  role String? // null := 보직 발령 대기
  created_at DateTime
}

model wrtn_member_invitations {
  id String @id @uuid
  wrtn_member_id String @uuid // invitor's member id
  email String
  created_at DateTime
}

model wrtn_member_emails {
  id String @id @uuid
  wrtn_member_id String @uuid
  email String
  verified_at DateTime?
  created_at DateTime
  deleted_at DateTime?
  
  @@unique([email])
  @@index([wrtn_member_id])
}
```

## 3. Enterprise

```prisma
model wrtn_members {
  id String @id @uuid
  name String
  mobile String
  password String

  // - administrator: can appoint and invite administrator and moderator
  // - moderator: can appoint and invite member
  // - member: just viewing statistics
  role String
  created_at DateTime
  updated_at DateTime // updated when title changes
  approved_at DateTime? // first approved time
  deleted_at DateTime?
  
  @@unique([mobile])
  @@index([name])
}

model wrtn_member_appointments {
  id String @id @uuid
  wrtn_member_id String @uuid  

  // some member who appointed
  // however, it can be null due to the first membership seeding
  wrtn_appointer_id String? @uuid
  role String
  created_at DateTime
}

model wrtn_member_invitations {
  id String @id @uuid
  wrtn_member_id String @uuid // invitor's member id
  email String
  created_at DateTime
}

model wrtn_member_emails {
  id String @id @uuid
  wrtn_member_id String @uuid
  email String
  verified_at DateTime?
  created_at DateTime
  deleted_at DateTime?
  
  @@unique([email])
  @@index([wrtn_member_id])
}
```

## 3. Enterprise

```prisma
model wrtn_enterprises {
  id String @id @uuid
  code String
  name String
  created_at DateTime
  updated_at DateTime
  deleted_at DateTime?
}

model wrtn_enterprise_employees {
  id String @id @uuid
  wrtn_enterprise_id String @uuid
  email String
  password String
  name String

  // - owner
  // - manager
  // - member
  // - observer
  title String
  created_at DateTime
  updated_at DateTime // whenever title changed
  approved_at DateTime? // first approved time
  deleted_at DateTime? // the fired time

  @@unique([wrtn_enterprise_id, email])
  @@index([wrtn_enterprise_id, name])
}

model wrtn_enterprise_employee_appointments {
  id String @id @uuid
  wrtn_enterprise_employee_id String @uuid
  wrtn_enterprise_appointer_id String? @uuid
  title String
  created_at DateTime
}

model wrtn_enterprise_employee_invitations {
  id String @id @uuid
  wrtn_enterprise_id String @uuid
  wrtn_enterprise_team_id String? @uuid
  wrtn_enterprise_invitor_id String @uuid
  email String @uuid
  title String
  created_at DateTime
  deleted_at DateTime?
}

model wrtn_enterprise_teams {
  id String @id @uuid
  wrtn_enterprise_id String @uuid
  parent_id String? @uuid
  code String
  name String
  created_at DateTime
  updated_at DateTime
  deleted_at DateTime?

  @@unique([wrtn_enterprise_id, code])
  @@unique([wrtn_enterprise_id, name])
}

model wrtn_enterprise_team_companions {
  id String @id @uuid
  wrtn_enterprise_team_id String @uuid
  wrtn_enterprise_employee_id String @uuid
  role String
  created_at DateTime
  updated_at DateTime
  deleted_at DateTime?
  
  @@unique([wrtn_enterprise_team_id, wrtn_enterprise_employee_id])
}

model wrtn_enterprise_team_companion_appointments {
  id String @id @uuid
  wrtn_enterprise_team_appointer_id String @uuid
  wrtn_enterprise_team_employee_id String @uuid
  role String
  created_at DateTime
}

model wrtn_enterprise_team_companion_invitations {
  id String @id @uuid
  wrtn_enterprise_team_id String @uuid // target team
  wrtn_enterprise_employee_id String @uuid // target employee to invite
  wrtn_enterprise_invitor_id String @uuid // some employee who invited
}
```


## 4. AI Chatbot

AI Chatbot 서비스는 뤼튼 엔터프라이즈의 핵심 기능으로써, OpenAI GPT 등의 AI 모델과 자연어로 대화할 수 있는 서비스이다.

`wrtn_chat_sessions` 는 그러한 AI 챗봇의 세션으로써, 기업의 직원이 `openai/gpt-4.1` 나 `anthropic/claude-sonnet-4.5` 등의 AI 모델을 선택하여 채팅방을 개설할 수 있다. 또한 `wrtn_chat_sessions.disclosure` 를 조정하여 해당 채팅방을 동 기업 내 누구와 공유할 지 설정할 수 있다.

- `public`: 기업 구성원 모두가 채팅방 열람 가능
- `protected`: 기업의 같은 팀 동료들끼리만 열람 가능
- `private`: 당사자만 열람 가능

그리고 딱 여기 `wrtn_chat_sessions` 까지가 Restful API 로 생성할 수 있는 엔티티의 끝이다. 이후로 채팅 세션에의 접속 정보를 뜻하는 `wrtn_chat_session_connections` 와 채팅 세션에서 사람과 AI 가 주고받은 정보들을 뜻하는 `wrtn_chat_session_histories` 는 모두 WebSocket streaming API 에서 생성하니, AutoBE 는 이들에 대한 열람 API 만을 만들면 된다. 웹소켓 로직을 구현하는 것은 사람에게 넘기자.

또한 `wrtn_chat_session_histories` 에는 사람과 AI가 주고받은 데이터 정보가 `wrtn_chat_session_histories.data` JSON value 로써 기록되는데, 다만 개인 민감 정보 등을 고려하여 그 데이터는 모두 암호화된다. 그리고 이들 `data` 는 아래와 같이 복수의 타입을 유니언으로 묶은 형태인데, `wrtn_chat_session_histories.type` 이 그것의 discriminator key 역할을 한다.

마지막으로 `wrtn_chat_session_aggregates` 은 해당 채팅 세션의 총 토큰 사용량을 계산하여 누적 기록하는 엔티티로써, `wrtn_chat_session_histories` 레코드가 생성될 때 `token_usage` 값이 `null` 이 아니거든, 그것은 항시 `wrtn_chat_session_aggregates.token_usage` 에 더해진다.

단, 반복컨대 본 AI chatbot 은 웹소켓으로 구현된다. 따라서 AutoBE 가 만들어낼 Restful API 에서는 오직 `wrtn_chat_sessions` 레코드만 생성할 수 있고, 나머지 레코드들은 오직 읽기 API 로만 구현해야한다. 절대 나머지 엔티티들을 작성하고 편집하는 API 를 설계해서는 아니될 것이다.

```prisma
model wrtn_chat_sessions {
  id String @id @uuid
  wrtn_enterprise_employee_id String @uuid
  wrtn_enterprise_employee_persona_id String @uuid
  vendor String
  title String?

  // - private: only session creator can access
  // - protected: session creator and his/her team members can access
  // - public: anyone in the enterprise can access
  disclosure String
  created_at DateTime
  updated_at DateTime // when title or disclosure changed 
  deleted_at DateTime?

  @@index([wrtn_enterprise_employee_id, created_at])
  @@index([wrtn_enterprise_employee_persona_id])
}

model wrtn_chat_session_connections {
  id String @id @uuid
  wrtn_chat_session_id String @uuid
  connected_at DateTime
  disconnected_at DateTime?

  @@index([wrtn_chat_session_id, connected_at, disconnected_at])
}

model wrtn_chat_session_histories {
  id String @id @uuid
  wrtn_chat_session_id String @uuid
  wrtn_chat_session_connection_id String @uuid
  type String // Discriminator type
  data String // JSON value, encrypted
  token_usage String? // JSON value
  created_at DateTime

  @@index([wrtn_chat_session_id, created_at])
  @@index([wrtn_chat_session_connection_id])
}

model wrtn_chat_session_history_files {
  id String @id @uuid
  wrtn_chat_session_history_id String @uuid
  wrtn_file_id String @uuid
  sequence Int

  @@index([wrtn_chat_session_history_id])
  @@index([wrtn_file_id])
}

model wrtn_chat_session_aggregates {
  id String @id @uuid
  wrtn_chat_session_id String @uuid
  token_usage String // JSON value

  @@unique([wrtn_chat_session_id])
}
```

참고로 이 밑으로 적은 인터페이스 타입들은 내가 (사람이) 직접 `wrtn_chat_user_histories.data` 의 타입에 대하여 정의한 DTO 타입들이야. 웹소켓에서 본격적으로 다루게 될 녀석들인데, 너 AutoBE 는 이 타입 그대로 구현하되 각 타입마다 시의적절한 설명을 보충하여 사용하도록 해.

```typescript
export type IWrtnChatHistory =
  | IWrtnChatUserMessageHistory
  | IWrtnChatAssistantMessageHistory
  | IWrtnChatFunctionCallHistory;

export interface IWrtnChatUserMessageHistory {
  id: string & tags.Format<"uuid">;
  type: "userMessage";
  contents: IWrtnChatUserMessageContent[];
  created_at: string & tags.Format<"date-time">;
}

export type IWrtnChatUserMessageContent = 
  | IWrtnChatUserMessageAudioContent
  | IWrtnChatUserMessageFileContent
  | IWrtnChatUserMessageImageContent
  | IWrtnChatUserMessageTextContent
export interface IWrtnChatUserMessageAudioContent {
  type: "audio";
  file: IWrtnFile;
}
export interface IWrtnChatUserMessageFileContent {
  type: "audio";
  file: IWrtnFile;
}
export interface IWrtnChatUserMessageImageContent {
  type: "audio";
  file: IWrtnFile;
}
export interface IWrtnChatUserMessageTextContent {
  type: "audio";
  file: IWrtnFile;
}

export interface IWrtnChatAssistantMessageHistory {
  id: string & tags.Format<"uuid">;
  type: "assistantMessage";
  text: string;
  files: IWrtnFile[];
  created_at: string & tags.Format<"date-time">;
  completed_at: string & tags.Format<"date-time">;
}

export interface IWrtnChatFunctionCallHistory {
  id: string & tags.Format<"uuid">;
  type: "functionCall";
  arguments: object;
  success: boolean;
  value: unknown;
  created_at: string & tags.Format<"date-time">;
  completed_at: string & tags.Format<"date-time">;
}
```

마지막으로 토큰 사용량 타입은 이렇게 정의한다.

물론 이 또한 너가 상세한 설명을 보충하여 (`AutoBeOpenApi.IJsonSchemaDescriptive.description`) DTO 정의해야함.

```typescript
export interface IWrtnTokenUsage {
  total: number;
  input: IWrtnTokenUsageInput;
  output: IWrtnTokenUsageOutput;
}
export interface IWrtnTokenUsageInput {
  total: number;
  cached: number;
}
export interface IWrtnTokenUsageOutput {
  total: number;
  reasoning: number;
  accepted_prediction: number;
  rejected_prediction: number;
}
```

## 5. AI Procedure

함수 형태의 AI 서비스.

뤼튼 엔터프라이즈에서 말하는 AI Procedure 란, 위 [4. AI Chatbot](#4-ai-chatbot) 과 같은 챗봇의 형태가 아닌, 지정된 형태의 인풋을 받아서 약속된 형태의 아웃풋을 반환하는 함수형 서비스이다. 문자 그대로 함수(프로시저) 형태의 AI 서비스로써, Stable Diffusion 으로 이미지를 생성하는게 AI Procedure 의 가장 대표적인 사례이다.

또한 이 중 뤼튼 엔터프라이즈가 제공하는 프로시저의 종류 및 그에 대한 설명은 `wrtn_procedures` 테이블에 기록되는데 (메타데이터의 일종), 다만 enterprise 및 team 단위로 사용 가능한 프로시저의 종류를 설정하고 제약할 수 있으니, 이 점에 유의하기 바란다.

그리고 `wrtn_procedure_sessions` 는 Restful API 로 생성할 수 있되, 이후 프로시저를 구동하여 입력값을 전달하고 그 결과를 받아보는 일은 Restful API 와 WebSocket Streaming 방식을 모두 지원한다. 다만 Restful API 는 프로시저의 중간 진행과정을 알 수 없으며, 오직 AI 프로시저가 모든 작업을 마친 후에라야 그 최종 결과값만을 받아볼 수 있을 뿐이다.

반대로 WebSocket Streaming 의 경우에는 프로시저의 중간 진행 과정을 실시간으로 받아볼 수 있으며, 한 번 접속하여 `wrtn_procedure_session_histories` 를 계속 생성할 수 있다. 즉, 웹소켓으로 한 번 접속하여 stable diffusion 으로 이미지의 중간 진행과정들을 살펴보며 계속 생성할 수 있는 것. 즉, 1 connection N histories 가 가능하다. Restful API 방식은 오로지 1 connection 1 history 만이 가능하다.

Protocol   | HTTP    | WebSocket
-----------|---------|-----------
Connect to | Session | Session
Histories  | 1       | N
Progress   | None    | Streaming

참고로 `wrtn_procedure_session_histories` 의 경우에는 `success`, `value`, `token_usage`, `completed_at` 컬럼들이 모두 NULLABLE 한데, 이것은 해당 프로시저의 작업이 아직 끝나지 않아서 그러한 것이다. 즉, 프로시저가 모든 작업을 마치거든, 이 값들이 공실히 남아있지 않고 모두 채워지게 되는 것.

이외에 `wrtn_procedure_session_aggregates` 테이블에는 각 `wrtn_procedure_session_histories` 가 완료될 때마다의 `token_usage` 총 사용량이 누적되어 기록되어야 한다. `token_usage` 에 기록되는 JSON value type 은 `IWrtnTokenUsage` 로써 앞서의 [4. AI Chatbot](#4-ai-chatbot) 때와 같다.

```prisma
model wrtn_procedures {
  id String @id @uuid
  code String // identifier code like "image-generation"
  title String // human friendly title like "Image Generation"
  description String? // detailed description if required (markdown)
  icon String? // Image URL
  active Boolean @default(true) // Whether this procedure is active or not
  created_at DateTime
  updated_at DateTime
  deleted_at DateTime?
  
  @@unique([code])
  @@unique([title])
  @@index([created_at])
}

model wrtn_procedure_sessions {
  id String @id @uuid
  wrtn_procedure_id String @uuid // which procedure selected
  wrtn_enterprise_employee_id String @uuid // who created this session
  title String?

  // - private: only session creator can access
  // - protected: session creator and his/her team members can access
  // - public: anyone in the enterprise can access
  disclosure String
  created_at DateTime
  updated_at DateTime
  deleted_at DateTime?
  
  @@index([wrtn_procedure_id])
  @@index([wrtn_enterprise_employee_id, created_at])
}

model wrtn_procedure_session_connections {
  id String @id @uuid
  wrtn_procedure_session_id String @uuid
  
  // - http
  // - websocket
  protocol String
  connected_at DateTime
  disconnected_at DateTime?
  
  @@index([wrtn_procedure_session_id, created_at, disconnected_at])
}

// Must define every JSON value columns separately
// Never merge them into one column like "data"
model wrtn_procedure_session_histories {
  id String @id @uuid
  wrtn_procedure_session_id String @uuid
  wrtn_procedure_session_connection_id String @uuid
  arguments String    // JSON value, encrypted
  success Boolean?    // Whether returned or exception thrown
  value String?       // JSON value of return or exception, encrypted
  token_usage String? // JSON value
  created_at DateTime
  completed DateTime?
  
  @@index([wrtn_procedure_session_id, created_at])
  @@index([wrtn_procedure_session_connection_id])
}

model wrtn_procedure_session_aggregates {
  id String @id @uuid
  wrtn_procedure_session_id String @uuid
  token_usage String // JSON value, total aggregation
  
  @@unique([wrtn_procedure_session_id])
}
```


## 6. Configurations
### 6.1. Persona
뤼튼의 모든 엔터프라이즈 유저들은 (`wrtn_enterprise_employees`) 페르소나를 설정할 수 있다. 여기서 말하는 페르소나란, AI chatbot 의 말투 및 태도에 관한 것을 뜻한다. 

그리고 엔터프라이즈 유저들이 설정한 페르소나를 저장하는 테이블이 `wrtn_enterprise_employee_personas` 인데, 보다시피 `updated_at` 컬럼이 존재하지 않는다. 이것인 곧 인터프라이즈 유저가 페르소나를 수정했어도, 시스템 상에서는 기존 레코드를 수정하는게 아니라 새 레코드를 만들어 누적하는 개념이기 때문에 그러하다. 

왜냐하면 페르소나 정보는 AI chatbot 세션에 기록되는데 (`wrtn_chat_sessions.wrtn_enterprise_employee_persona_id`), 이것의 정합성을 지키기 위해서이다. 이미 기존에 한창 진행한 채팅 세션이, 페르소나 설정을 바꾸었다고 갑자기 말투나 성격까지 바뀌어서야 되겠는가?

```prisma
model wrtn_enterprise_employee_personas {
  id String @id @uuid
  wrtn_enterprise_employee_id String @uuid
  avatar_image_url String
  name String
  auto_web_search Boolean
  auto_question_suggest Boolean
  tone String
  memory String? // JSON value
  prompt String?
  created_at DateTime
  deleted_at DateTime?

  @@index([wrtn_enterprise_employee_id, created_at])
}

model wrtn_enterprise_procedures {
  id String @id @uuid
  wrtn_enterprise_id String @uuid
  wrtn_procedure_id String @uuid
  sequence Int
  created_at DateTime
  deleted_at DateTime?

  @@unique([wrtn_enterprise_id, wrtn_procedure_id])
  @@index([wrtn_enterprise_id])
}

model wrtn_enterprise_team_procedures {
  id String @id @uuid
  wrtn_enterprise_team_id String @uuid
  wrtn_procedure_id String @uuid
  sequence Int
  created_at DateTime
  deleted_at DateTime?
}
```