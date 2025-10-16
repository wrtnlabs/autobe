> Even though I'm ordering you by Korean, you must answer me in English.
>
> Repeat that, you must speak English. Never speak any other language like Korean or Chinese.
>
> I repeat once more again that, you have to speak English. Write every documents and codes in English.

## 1. Overview

뤼튼 엔터프라이즈는 기업 고객을 위한 B2B SaaS AI 서비스로, **AI Chatbot**과 **AI Procedure** 두 가지 핵심 기능을 제공한다.

### 핵심 특징

**계층적 권한 체계**: 내부 관리자(`wrtn_members`) → 기업(`wrtn_enterprises`) → 팀(`wrtn_enterprise_teams`) → 직원(`wrtn_enterprise_employees`)의 4단계 계층 구조로, 각 계층마다 명확한 권한과 책임이 정의된다.

**이중 역할 시스템**: 기업 전체 직책(owner/manager/member/observer)과 팀 내 역할(chief/manager/member)이 분리되어, 한 직원이 여러 팀에서 다른 역할을 수행할 수 있다.

**완벽한 감사 추적**: 모든 인사 변동, 권한 변경, 데이터 접근이 appointments와 audit log에 기록되어 언제 누가 무엇을 했는지 추적 가능하다.

**계층별 데이터 격리**: 각 사용자는 자신의 권한 범위 내에서만 데이터에 접근할 수 있으며, 상위 조직이나 타 부서의 정보는 완전히 차단된다.

### 시스템 구성

1. **조직 관리**: 기업 등록, 직원 계정, 팀 구조, 권한 설정
2. **AI 서비스**: 대화형 Chatbot, 함수형 Procedure 실행
3. **세션 관리**: 공개 수준(private/protected/public) 설정, 암호화된 대화 저장
4. **토큰 추적**: 입력/출력/캐시/추론별 상세 집계, 비용 계산
5. **통계 대시보드**: 권한별 맞춤형 통계, 실시간 모니터링
6. **프로시저 제한**: 기업/팀 단위로 사용 가능한 AI 기능 제어

### 보안과 프라이버시

- 모든 대화 내용과 실행 결과는 암호화 저장
- 초대장 시스템을 통한 안전한 사용자 온보딩  
- 만료 기능이 있는 시간 제한 초대
- 개인 데이터는 본인만, 팀 데이터는 팀 관리자만 접근

이 시스템은 기업의 복잡한 조직 구조를 그대로 반영하면서도, 철저한 권한 관리와 데이터 보호를 통해 엔터프라이즈 환경에 최적화된 AI 서비스를 제공한다.

### AutoBE 구현 지침

**DB 테이블 구현 원칙**:
- 본 문서에 명시된 모든 테이블명과 컬럼은 **필수** 구현해야 한다
- 테이블명, 기존 컬럼명, 타입을 임의로 변경하거나 재해석할 수 없다
- 필요시 **추가 컬럼**이나 **추가 인덱스**를 자유롭게 추가할 수 있다
- **CRITICAL**: 각 섹션의 테이블들은 모두 동일한 namespace로 그룹핑해야 한다:
  - Section 2 (Internal Member): 모든 `wrtn_member*` 테이블은 하나의 namespace
  - Section 3 (Enterprise): 모든 `wrtn_enterprise*` 테이블은 하나의 namespace
  - Section 4 (AI Chatbot): 모든 `wrtn_chat*` 테이블은 하나의 namespace
  - Section 5 (AI Procedure): 모든 `wrtn_procedure*` 테이블은 하나의 namespace
  - Section 6 (Configurations): 모든 config 관련 테이블은 하나의 namespace

**DTO 구현 원칙**:
- DTO 인터페이스는 정의된 타입과 속성을 **정확히** 따라야 한다
- 추가 속성이나 확장은 별도 인터페이스로 정의한다

**추가 구현의 자유**:
- 본 문서에 명시되지 않은 추가 테이블이나 DTO는 자유롭게 설계할 수 있다
- 특히 파일 관리, 결제 시스템, 알림 기능 등 언급만 되고 구체화되지 않은 부분은 AutoBE의 재량으로 구현한다

> 서비스 prefix 는 `wrtn` 으로 한다.
>
> 그러니 이미 `wrtn` prefix 가 있는데 또 `wrtn` 을 그 뒤에 기어이 추가하여 DB 테이블에 `wrtn_wrtn-~` 같은 이름을 짓거나 DTO 타입 이름을 `IWrtnWrtn` 로 짓는 우행은 범하지 말기 바란다.

## 2. Internal Member (Supporter)

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
  expired_at DateTime?
  deleted_at DateTime?
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

내부 회원은 엔터프라이즈 기업을 관리하는 역할을 해. 서포터의 일종이라 볼 수 있다.

다만 이들의 역할 (`wrtn_members.role`) 은 다음과 같이 세 가지로 세분화되어있다. 그리고 이 중 administrator 와 moderator 는 엔터프라이즈를 개설하고 철폐하는 등의 엔터프라이즈사들에 대한 직접적인 관리가 가능하며, member 는 오로지 단순 통계 및 레코드 열람 등만이 가능하다.

- `administrator`: administrator, moderator, member 모두를 임명하고 권한 변경할 수 있다.
- `moderator`: moderator, member를 임명하고 권한 변경할 수 있다.
- `member`: 통계 및 단순 레코드 열람만 할 수 있다.

`wrtn_members`, 이들은 이메일과 비밀번호로 로그인할 것이되, 복수의 이메일 계정을 가질 수 있다. 그 이유는 SaaS 서비스 특성상 기업 고객사로의 출장을 가야할 수도 있는데, 이 때 그 회사가 보안을 이유로 폐쇄망이 갖춰져있어 외부 인터넷 접속이 불가능할 수도 있기 때문이다.

또한 `wrtn_members` 의 가입은 크게 두 방법으로 이루어진다. 첫 번째는 당사자가 직접 뤼튼 엔터프라이즈의 내부 직원용 홈페이지에 들어와 가입 신청을 하거든, administrator 또는 moderator 가 이를 승인해주는 방법이다. 이 때에는 가입 승인 처리와 동시에 `wrtn_member_appointments` 레코드가 생성되고, `wrtn_members.approved_at` 에 그 시각이 기록된다. 두 번째 방법은 기존의 회원이 `wrtn_member_invitations` 레코드를 발행하며 새 회원에게 이메일로 초대장을 보내는 것이다. 이 때 초대받은 사람이 가입 신청을 하면, 그 즉시로 `wrtn_members` 와 함께 `wrtn_member_appointments` 레코드도 생성된다. 물론 이 때의 임명자는 바로 초대장을 보낸 바로 그 회원이며, `wrtn_member_emails.verified_at` 는 `wrtn_member_invitations.created_at` 의 것이 기록된다.

이외에 administrator 나 moderator 가 기존의 회원을 탈퇴 처리하면, `wrtn_members.deleted_at` 에 그 시각이 기록되며, 이 때에도 역시 `wrtn_member_appointments` 레코드가 하나 더 생성된다. 이 때의 임명자는 탈퇴 처리를 한 바로 그 회원이며, 이 때 변경되는 역할은 `wrtn_members.role` 과 `wrtn_member_appointments.role` 모두 `null` 이 된다. 만일 회원 당사자 스스로가 탈퇴한 것이라면, `wrtn_member_appointments.wrtn_appointer_id` 는 자기 자신이 되며, 이 때의 `role` 역시 두 곳 모두 `null` 이 된다.

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
  // - null: 아무 직책도 없어 그 무엇도 할 수 없는 상태
  title String?
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
  title String?
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
  expired_at DateTime?
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
  role String?
  created_at DateTime
  updated_at DateTime
  deleted_at DateTime?
  
  @@unique([wrtn_enterprise_team_id, wrtn_enterprise_employee_id])
}

model wrtn_enterprise_team_companion_appointments {
  id String @id @uuid
  wrtn_enterprise_team_appointer_id String @uuid
  wrtn_enterprise_team_employee_id String @uuid
  role String?
  created_at DateTime
}

model wrtn_enterprise_team_companion_invitations {
  id String @id @uuid
  wrtn_enterprise_team_id String @uuid // target team
  wrtn_enterprise_employee_id String @uuid // target employee to invite
  wrtn_enterprise_invitor_id String @uuid // some employee who invited
  created_at DateTime
  expired_at DateTime?
  deleted_at DateTime?
}
```

### 3.1. Corporation

`wrtn_enterprises` 는 뤼튼 엔터프라이즈 AI 서비스를 이용하는 기업 고객사들이다. 이들의 등록은 오직 `wrtn_members` 중 그 역할이 administrator 또는 moderator 만 할 수 있으며, 동시에 최초의 owner 직원을 임명하게 된다.

### 3.2. Employee

`wrtn_enterprise_employees` 는 각 기업에 소속된 직원들을 형상화하였으며 곧 그들의 로그인 계정이다. 앞서 `wrtn_members` 에 의해 최초로 임명된 owner 직원에 이해 해당하여 기업 직원 계정을 최초 발급받는다. 그리고 이들 기업 직원들의 직책 (`wrtn_enterprise_employees.title`) 은 다음과 같이 네 가지로 구분된다.

이 중 owner 는 기업 내 모든 권한을 가지며 다른 owner, manager, member, observer 를 임명할 수 있다. manager 는 member 와 observer 만 임명할 수 있으며, member 는 일반 사용자로써 AI 서비스를 이용할 수 있되 임명 권한은 없다. observer 는 오직 통계와 사용 내역 열람만 가능하다.

- `owner`: owner, manager, member, observer 모두를 임명할 수 있다
- `manager`: member, observer 를 임명할 수 있다  
- `member`: AI 서비스 이용 가능, 임명 권한 없음
- `observer`: 통계 및 사용 내역 열람만 가능

직원의 가입은 두 가지 방법으로 이루어진다. 첫 번째는 당사자가 직접 기업 홈페이지에서 가입 신청을 하고 owner 또는 manager 가 이를 승인하는 것이다. 이 때 승인과 동시에 `wrtn_enterprise_employee_appointments` 레코드가 생성되고 `wrtn_enterprise_employees.approved_at` 에 승인 시각이 기록된다. 두 번째는 기존 직원이 (역시 owner 또는 manager) `wrtn_enterprise_employee_invitations` 를 통해 이메일로 초대장을 보내는 것이다. 초대받은 사람이 가입하면 즉시 `wrtn_enterprise_employees` 와 `wrtn_enterprise_employee_appointments` 레코드가 생성되며, 초대장에 명시된 직책이 부여된다. 초대장이 수락되지 않은 경우 `expired_at` 시점에 만료되며, 만료된 초대장으로는 가입할 수 없다.

직원의 직책은 변경될 수 있으며, 심지어 `null` 로 설정하여 모든 권한을 박탈할 수도 있다. owner 는 다른 모든 직원의 직책을 변경하거나 `null` 로 만들 수 있고, manager 는 member 와 observer 의 직책만 변경할 수 있다. 직책이 `null` 이 되면 해당 직원은 기업 계정은 유지하되 어떠한 권한도 행사할 수 없게 된다. 모든 직책 변경은 `wrtn_enterprise_employee_appointments` 에 기록되며, `wrtn_enterprise_employees.updated_at` 이 갱신된다.

다만 최초 owner 의 경우 `wrtn_members` 에 의해 임명되므로 `wrtn_enterprise_employee_appointments.wrtn_enterprise_appointer_id` 가 `null` 이 된다. 이는 기업 생성 시점에 내부 관리자가 직접 owner 를 지정했음을 의미한다.

직원의 퇴사는 두 가지 경우로 나뉜다. 첫 번째는 owner 또는 manager 가 직원을 해고하는 경우이다. owner 는 모든 직책의 직원을 해고할 수 있으며, manager 는 member 와 observer 만 해고할 수 있다. 해고 처리 시 `wrtn_enterprise_employees.deleted_at` 에 그 시각이 기록되고, `wrtn_enterprise_employee_appointments` 레코드가 새로 생성된다. 이 때 임명자 (`wrtn_enterprise_appointer_id`) 는 해고를 집행한 그 직원이며, `title` 은 `null` 이 되어 더 이상 직책이 없음을 나타낸다.

두 번째는 직원 본인이 스스로 사직하는 경우이다. 이 때도 마찬가지로 `wrtn_enterprise_employees.deleted_at` 에 시각이 기록되고 `wrtn_enterprise_employee_appointments` 레코드가 생성되지만, `wrtn_enterprise_appointer_id` 는 자기 자신의 ID가 되며, `title` 은 역시 `null` 이 된다. 이를 통해 자진 퇴사와 해고를 구분할 수 있다.

### 3.3. Team

`wrtn_enterprise_teams` 는 기업 내 조직이다. `parent_id` 를 통해 계층 구조를 가질 수 있어, "개발팀" 아래 "백엔드팀", "프론트엔드팀" 같은 하위 팀을 둘 수 있다. 각 팀은 기업 내에서 고유한 `code` 와 `name` 을 가진다. 참고로 `wrtn_enterprise_teams` 는 owner 또는 manager 직책을 가진 직원만이 만들 수 있으며, 팀 생성자는 동시에 해당 팀의 최초 chief 를 임명한다. 팀 삭제는 owner 또는 manager 직책을 가진 직원이 할 수 있으며, `wrtn_enterprise_teams.deleted_at` 에 그 시각이 기록된다.

그리고 `wrtn_enterprise_team_companions` 는 팀 구성원이다. 한 직원은 여러 팀에 동시에 소속될 수 있으며, 각 팀에서의 역할 (`wrtn_enterprise_team_companions.role`) 은 다음과 같다.

- `chief`: 팀장, chief 와 manager, member 를 팀에 임명할 수 있다
- `manager`: 매니저, member 만 팀에 임명할 수 있다
- `member`: 팀원, 임명 권한 없음

### 3.4. Companion

팀 구성원의 임명은 팀 내 역할에 따라 권한이 다르다. chief 는 다른 chief, manager, member 를 모두 팀에 임명할 수 있고, manager 는 member 만 임명할 수 있다. member 는 임명 권한이 없다. 모든 임명 이력은 `wrtn_enterprise_team_companion_appointments` 에 기록되며, `wrtn_enterprise_team_appointer_id` 는 임명한 팀 구성원의 companion ID 이다. 

팀원 초대는 `wrtn_enterprise_team_companion_invitations` 를 통해 이루어진다. chief 와 manager 만이 다른 직원을 자신의 팀으로 초대할 수 있으며, 초대받은 직원이 수락하면 `wrtn_enterprise_team_companions` 레코드가 생성되고 동시에 `wrtn_enterprise_team_companion_appointments` 에 임명 기록이 남는다. 팀원 초대장도 `expired_at` 시점에 만료되며, 만료된 초대장으로는 팀에 가입할 수 없다.

팀 구성원의 역할도 변경될 수 있으며, `null` 로 설정하여 팀 내 모든 권한을 박탈할 수도 있다. chief 는 다른 모든 팀원의 역할을 변경하거나 `null` 로 만들 수 있고, manager 는 member 의 역할만 변경할 수 있다. 역할이 `null` 이 되면 해당 직원은 팀 소속은 유지하되 팀 내에서 어떠한 권한도 행사할 수 없게 된다. 모든 역할 변경은 `wrtn_enterprise_team_companion_appointments` 에 기록되며, `wrtn_enterprise_team_companions.updated_at` 이 갱신된다.

팀 구성원의 해촉도 두 가지 경우로 나뉜다. 첫 번째는 chief 또는 manager 가 팀원을 강제 해촉하는 경우이다. chief 는 모든 역할의 팀원을 해촉할 수 있으며, manager 는 member 만 해촉할 수 있다. 해촉 처리 시 `wrtn_enterprise_team_companions.deleted_at` 에 그 시각이 기록되고, `wrtn_enterprise_team_companion_appointments` 레코드가 새로 생성된다. 이 때 임명자는 해촉을 집행한 그 팀원이며, `role` 은 `null` 이 되어 더 이상 팀 내 역할이 없음을 나타낸다.

두 번째는 팀원 본인이 스스로 팀을 탈퇴하는 경우이다. 이 때도 마찬가지로 `wrtn_enterprise_team_companions.deleted_at` 에 시각이 기록되고 `wrtn_enterprise_team_companion_appointments` 레코드가 생성되지만, `wrtn_enterprise_team_appointer_id` 는 자기 자신의 companion ID가 되며, `role` 은 역시 `null` 이 된다. 이를 통해 자진 탈퇴와 강제 해촉을 구분할 수 있다.

## 4. AI Chatbot

```prisma
model wrtn_chat_sessions {
  id String @id @uuid
  wrtn_enterprise_employee_id String @uuid
  wrtn_enterprise_employee_persona_id String @uuid
  wrtn_enterprise_team_id String? @uuid // 팀 소속이 없을 때만 null
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

AI Chatbot 서비스는 뤼튼 엔터프라이즈의 핵심 기능으로써, OpenAI GPT 등의 AI 모델과 자연어로 대화할 수 있는 서비스이다.

`wrtn_chat_sessions` 는 그러한 AI 챗봇의 세션으로써, 기업의 직원이 `openai/gpt-4.1` 나 `anthropic/claude-sonnet-4.5` 등의 AI 모델을 선택하여 채팅방을 개설할 수 있다. 또한 `wrtn_chat_sessions.disclosure` 를 조정하여 해당 채팅방을 동 기업 내 누구와 공유할 지 설정할 수 있다.

- `public`: 기업 구성원 모두가 채팅방 열람 가능
- `protected`: 기업의 같은 팀 동료들끼리만 열람 가능
- `private`: 당사자만 열람 가능

그리고 딱 여기 `wrtn_chat_sessions` 까지가 Restful API 로 생성할 수 있는 엔티티의 끝이다. 이후로 채팅 세션에의 접속 정보를 뜻하는 `wrtn_chat_session_connections` 와 채팅 세션에서 사람과 AI 가 주고받은 정보들을 뜻하는 `wrtn_chat_session_histories` 는 모두 WebSocket streaming API 에서 생성하니, AutoBE 는 이들에 대한 열람 API 만을 만들면 된다. 웹소켓 로직을 구현하는 것은 사람에게 넘기자.

또한 `wrtn_chat_session_histories` 에는 사람과 AI가 주고받은 데이터 정보가 `wrtn_chat_session_histories.data` JSON value 로써 기록되는데, 다만 개인 민감 정보 등을 고려하여 그 데이터는 모두 암호화된다. 그리고 이들 `data` 는 아래와 같이 복수의 타입을 유니언으로 묶은 형태인데, `wrtn_chat_session_histories.type` 이 그것의 discriminator key 역할을 한다.

마지막으로 `wrtn_chat_session_aggregates` 은 해당 채팅 세션의 총 토큰 사용량을 계산하여 누적 기록하는 엔티티로써, `wrtn_chat_session_histories` 레코드가 생성될 때 `token_usage` 값이 `null` 이 아니거든, 그것은 항시 `wrtn_chat_session_aggregates.token_usage` 에 더해진다.

단, 반복컨대 본 AI chatbot 은 웹소켓으로 구현된다. 따라서 AutoBE 가 만들어낼 Restful API 에서는 오직 `wrtn_chat_sessions` 레코드만 생성할 수 있고, 나머지 레코드들은 오직 읽기 API 로만 구현해야한다. 절대 나머지 엔티티들을 작성하고 편집하는 API 를 설계해서는 아니될 것이다.

### `IWrtnChatHistory`

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

위 인터페이스 타입들은 본인(사람)이 직접 `wrtn_chat_user_histories.data` 의 타입에 대하여 정의한 DTO 타입들이다.

웹소켓에서 본격적으로 다루게 될 녀석들인데, AutoBE 는 이 타입 그대로 구현하되 각 타입마다 시의적절한 설명을 보충하여 사용할 것 (JSON schema 상 `description`).

### `IWrtnTokenUsage`

토큰 사용량 타입은 이렇게 정의한다.

물론 이 또한 AutoBE가 상세한 설명을 보충하여 (JSON schema 상 `description`) DTO 정의해야함.

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
  wrtn_enterprise_team_id String? @uuid // 팀 소속이 없을 때만 null
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
```

### 6.2. Enterprise Procedure
각 회사는 당사가 사용할 수 있는 프로시저를 직접 지정할 수 있다. 이것을 관리하는 엔티티가 `wrtn_enterprise_procedures` 인데, 만일 아무런 레코드도 존재하지 않는다면, 그 회사는 정말 그 어떠한 프로시저도 사용할 수 없는 경우에 해당한다.

그리고 각 회사의 각 팀은 다시 각 팀이 사용할 수 있는 프로시저를 스스로 설정할 수 있다; `wrtn_enterprise_team_procedures`. 그러나 설정할 수 있는 프로시저는 해당 회사가 지원하는 프로시저로 한정한다.

또한 해당 팀에 단 하나의 `wrtn_enterprise_team_procedures` 레코드도 없다면, 이 때는 해당 팀이 그 어떠한 프로시저도 사용할 수 없는게 아니라, `wrtn_enterprise_procedures` 설정을 따라가는 것으로 한다.

이외에 `wrtn_enterprise_procedures` 와 `wrtn_enterprise_team_procedures` 는 각각 설정자를 기록하고 있는데, 이 때 설정자 값이 `null` 이라면 `wrtn_enterprise_procedures` 는 엔터프라이즈 계정을 개설한 `wrtn_members` 가 행한 설정이라 그러한 것이고, `wrtn_enterprise_team_procedures` 는 팀을 개설하면서 회사의 관리자 이상 직책인이 (`wrtn_enterprise_employees.title`) 해당 팀에서 사용 가능한 프로시저를 동시 설정해서 그러한 것이다.

```prisma
model wrtn_enterprise_procedures {
  id String @id @uuid
  wrtn_enterprise_id String @uuid
  wrtn_procedure_id String @uuid
  wrtn_enterprise_configurator_id String? @uuid // employee.id
  sequence Int
  created_at DateTime
  deleted_at DateTime?

  @@unique([wrtn_enterprise_id, wrtn_procedure_id])
  @@index([wrtn_procedure_id])
}

model wrtn_enterprise_team_procedures {
  id String @id @uuid
  wrtn_enterprise_team_id String @uuid
  wrtn_procedure_id String @uuid
  wrtn_enterprise_team_configurator_id String? @uuid // companion.id
  sequence Int
  created_at DateTime
  deleted_at DateTime?

  @@unique([wrtn_enterprise_team_id, wrtn_procedure_id])
  @@index([wrtn_procedure_id])
}
```

## 7. Statistics & Dashboard

뤼튼 엔터프라이즈는 복잡한 조직 구조와 다층적 권한 체계에 맞춰, 각 사용자가 자신의 권한 범위 내에서만 통계와 대시보드에 접근할 수 있도록 설계되어야 한다.

### 7.1. 권한별 접근 범위

통계 시스템의 핵심은 **계층적 데이터 격리**이다. 각 역할은 다음과 같은 범위의 데이터에만 접근할 수 있다:

**내부 관리자 (`wrtn_members`)**
- 전체 시스템의 집계 통계 (개별 기업의 상세 내용은 제외)
- 기업별 사용량과 비용 총계
- 시스템 성능 메트릭과 에러율
- 청구 및 결제 현황

**기업 소유자 (owner)**
- 자사 전체의 모든 통계
- 전 직원의 사용량과 활동 내역
- 팀별, 개인별 상세 분석
- 비용 및 예산 관리

**기업 관리자 (manager)**
- 전사 레벨 통계 조회
- 직원 관리 범위 내 상세 정보
- 비용 정보는 조회만 가능 (수정 불가)

**팀 책임자 (chief/manager)**
- 자신이 관리하는 팀과 하위 팀의 통계
- 팀원들의 사용량과 생산성 지표
- 다른 팀 데이터는 완전 차단

**일반 직원 (member)**
- 본인의 사용 내역과 통계만 조회
- 팀이나 전사 통계는 접근 불가

**관찰자 (observer)**
- 제한된 요약 통계만 조회 가능

### 7.2. 수집해야 할 핵심 지표

**사용량 메트릭**
- 토큰 사용량 (입력/출력/캐시/추론 별도 집계)
- 세션 수와 평균 지속 시간
- 프로시저 실행 횟수와 성공률
- 파일 업로드 수와 총 용량

**비용 추적**
- 모델별 토큰 단가 적용한 실제 비용
- 스토리지 비용
- 예산 대비 사용률
- 청구 주기별 누적 비용

**활동 분석**
- 일별/주별/월별 사용 추이
- 시간대별 사용 패턴
- 가장 많이 사용하는 모델과 프로시저
- 팀별 기여도와 협업 지수

**성능 지표**
- API 응답 시간
- 동시 접속자 수
- 시스템 에러율
- 세션당 평균 토큰 사용량

### 7.3. 실시간 대시보드

대시보드는 사용자 역할에 따라 다른 위젯과 레이아웃을 제공해야 한다:

- **시스템 대시보드**: 전체 서비스 상태 모니터링
- **경영진 대시보드**: 비용과 ROI 중심
- **팀 대시보드**: 생산성과 협업 중심  
- **개인 대시보드**: 본인 사용 패턴 분석

각 대시보드는 실시간 업데이트되며, 사용자가 위젯을 커스터마이징할 수 있어야 한다.

### 7.4. 감사 추적 (Audit Trail)

모든 중요한 활동은 감사 로그에 기록되어야 한다:

- 로그인/로그아웃
- 권한 변경
- 세션 생성/삭제
- 파일 업로드/다운로드
- 설정 변경
- 데이터 접근 (특히 타인 데이터)

감사 로그 역시 권한에 따라 조회 범위가 제한된다. 시스템 관리자는 전체를, owner는 자사 전체를, chief는 자기 팀의 로그만 볼 수 있다.

### 접근 권한 요약

| 데이터 범위 | 내부 관리자 | owner | manager | chief | member | observer |
|----------|-----------|--------|----------|--------|---------|-----------|
| 시스템 전체 | 집계만 | - | - | - | - | - |
| 기업 전체 | 집계만 | 전체 | 전체 | - | - | 요약만 |
| 팀별 | - | 전체 | 전체 | 자기팀 | - | - |
| 개인별 | - | 전체 | 관리범위 | 팀원만 | 본인만 | - |
| 비용/청구 | 전체 | 전체 | 조회만 | - | - | - |
| 감사 로그 | 시스템 | 전사 | 전사 | 자기팀 | - | - |

이러한 통계 시스템을 통해 조직의 AI 사용을 효과적으로 모니터링하면서도, 개인정보와 기밀 데이터를 철저히 보호할 수 있다.
