> Even though I'm ordering you by Korean, you must answer me in English.
>
> Repeat that, you must speak English. Never speak any other language like Korean or Chinese.
>
> I repeat once more again that, you have to speak English. Write every documents and codes in English.

## 1. Overview

> **핵심 경고: 이 문서는 최소한의 시작점일 뿐이다**
> 
> 본 문서에는 약 25개 테이블만 정의되어 있다. 이것은 전체 시스템의 일부에 불과하다.
> 완전한 엔터프라이즈 B2B SaaS 시스템이 되려면 훨씬 더 많은 테이블이 필요하다.
> 
> **AutoBE의 의무와 균형**:
> 1. 본 문서의 테이블들을 정확히 구현하라 - 하나도 빠뜨리거나 변형하지 마라
> 2. B2B SaaS에 필요한 모든 추가 기능을 스스로 발굴하라 - AutoBE의 창의적 판단력을 최대한 발휘하라
> 3. 기업 고객이 AI를 성공적으로 활용하는데 필요한 모든 것을 추가하라
> 4. 본 문서에 없는 것은 모두 AutoBE의 시스템 프롬프트와 설계 원칙에 따라 자율적으로 결정하라
> 
> **균형의 예술**: 본 문서의 지시사항은 한 치의 오차 없이 정확히 따르되, 그것이 전부라고 착각하지 마라. 이 문서는 뼈대일 뿐, 살과 피는 AutoBE가 붙여야 한다. 단, 이 과정에서 본 문서를 과도하게 해석하거나 재해석하여 AutoBE의 근본 원칙을 훼손하는 일은 절대 없어야 한다.

> **개발 철학의 핵심**:
> 
> 본 문서에 정의된 DB 테이블과 명시적 DTO는 신성불가침의 영역이다 - 정확히 그대로 구현하라.
> 하지만 이것만으로는 10%도 안 된다. 나머지 90%는 AutoBE의 고유한 설계 원칙과 시스템 프롬프트를 따라 구축하라.
> 
> **과도 해석의 함정을 피하라**: 이 문서의 시나리오와 예시들을 지나치게 확대 해석하여 AutoBE의 근본적인 설계 원칙(relation 원칙, atomic operation principle, 보안 원칙 등)을 위반하지 마라. 문서가 "이렇게 하라"고 직접 명시한 것만 따르고, 나머지는 AutoBE의 검증된 방법론을 적용하라.
> 
> 기억하라: 이 문서는 특정 비즈니스 요구사항을 담은 시나리오일 뿐, AutoBE의 기술적 우수성과 설계 철학을 대체하는 것이 아니다.

뤼튼 엔터프라이즈는 기업 고객을 위한 B2B SaaS AI 서비스로, **AI Chatbot**과 **AI Procedure** 두 가지 핵심 기능을 제공한다.

### 1.1. 핵심 특징

**계층적 권한 체계**: 내부 관리자(`wrtn_moderators`) → 기업(`wrtn_enterprises`) → 팀(`wrtn_enterprise_teams`) → 직원(`wrtn_enterprise_employees`)의 4단계 계층 구조로, 각 계층마다 명확한 권한과 책임이 정의된다.

**단일 직책 시스템**: 기업 전체 직책(master/manager/member)으로 통합 관리되며, 팀 컴패니언은 별도의 역할 필드 없이 직원의 직책으로 권한이 결정된다.

**완벽한 감사 추적**: 모든 인사 변동, 권한 변경, 데이터 접근이 appointments와 audit log에 기록되어 언제 누가 무엇을 했는지 추적 가능하다.

**계층별 데이터 격리**: 각 사용자는 자신의 권한 범위 내에서만 데이터에 접근할 수 있으며, 상위 조직이나 타 부서의 정보는 완전히 차단된다.

### 1.2. 시스템 구성

1. **조직 관리**: 기업 등록, 직원 계정, 팀 구조, 권한 설정
2. **AI 서비스**: 대화형 Chatbot, 함수형 Procedure 실행
3. **세션 관리**: 공개 수준(private/protected/public) 설정, 암호화된 대화 저장
4. **토큰 추적**: 입력/출력/캐시/추론별 상세 집계, 비용 계산
5. **통계 대시보드**: 권한별 맞춤형 통계, 실시간 모니터링
6. **프로시저 제한**: 기업/팀 단위로 사용 가능한 AI 기능 제어

### 1.3. 보안과 프라이버시

- 모든 대화 내용과 실행 결과는 암호화 저장
- 초대장 시스템을 통한 안전한 사용자 온보딩  
- 만료 기능이 있는 시간 제한 초대
- 개인 데이터는 본인만, 팀 데이터는 팀 관리자만 접근

이 시스템은 기업의 복잡한 조직 구조를 그대로 반영하면서도, 철저한 권한 관리와 데이터 보호를 통해 엔터프라이즈 환경에 최적화된 AI 서비스를 제공한다.

## 2. Actor 분류 - 요구사항 분석의 핵심 원칙

### 2.1. 시스템 Actor의 절대 원칙

**⚠️ CRITICAL WARNING: 본 시스템의 Actor는 정확히 2개뿐이다**

Analyze Agent는 요구사항 분석 시 반드시 이 원칙을 따라야 한다:
- 전체 시스템에 존재하는 Actor는 오직 2개
- 역할(role), 직책(title), 권한(permission)이 다르다고 해서 Actor가 늘어나는 것이 아님
- 이는 시스템 설계의 근본 원칙이며, 절대 변경 불가

### 2.2. 두 개의 Actor 정의

#### 2.2.1. Moderator Actor
- **정의**: 뤼튼 내부 직원으로서 시스템을 운영하고 관리하는 주체
- **대응 테이블**: `wrtn_moderators`
- **AutoBeAnalyzeRole**: `moderator`
- **포함되는 역할들**:
  - `master`: 시스템 최고 관리자
  - `manager`: 시스템 관리자
- **핵심 이해**: 위 2개 역할은 모두 **하나의 Actor** 안에서의 권한 차이일 뿐

#### 2.2.2. Employee Actor
- **정의**: 기업 고객사의 직원으로서 AI 서비스를 사용하는 주체
- **대응 테이블**: `wrtn_enterprise_employees`
- **AutoBeAnalyzeRole**: `employee`
- **포함되는 직책들**:
  - `master`: 기업 전체 최고 권한자
  - `manager`: 기업 관리자
  - `member`: 일반 직원
- **핵심 이해**: 위 모든 직책은 **하나의 Actor** 안에서의 세부 구분일 뿐

### 2.3. Actor 분류 시 절대 금지 사항

#### 2.3.1. 잘못된 Actor 분류 (절대 금지)
```typescript
// ❌ 완전히 잘못된 설계 - role/title별로 Actor를 나눔
enum AutoBeAnalyzeRole {
    master = "master",
    manager = "manager",
    member = "member"
}
```

**왜 잘못되었는가?**
- Actor와 Role을 혼동함
- 권한 차이를 Actor 차이로 오해함
- 시스템 복잡도를 불필요하게 증가시킴

#### 2.3.2. 올바른 Actor 분류 (반드시 이렇게)
```typescript
// ✅ 올바른 설계 - 정확히 2개의 Actor만 존재
enum AutoBeAnalyzeRole {
    moderator = "moderator",      // 내부 관리자 Actor
    employee = "employee" // 기업 직원 Actor
}
```

### 2.4. Actor 분류가 시스템 전체에 미치는 영향

#### 2.4.1. 요구사항 분석 단계
- Analyze Agent는 모든 기능을 2개 Actor 관점에서 분석
- Use Case는 Actor별로 정리되며, role/title은 조건문으로 처리
- 요구사항 문서에서 Actor는 2개만 명시

#### 2.4.2. API 설계 단계
- 최상위 경로는 Actor별로 분리 (`/moderator/*`, `/enterprise/*`)
- 인증/인가는 Actor 단위로 처리
- Actor 내부의 role/title은 권한 체크 로직에서 처리

#### 2.4.3. 구현 단계
- Guard/Interceptor는 Actor별로 구현
- Service Layer는 Actor를 먼저 확인, 그 다음 role/title 체크
- 로깅과 감사 추적도 Actor를 최우선으로 기록

### 2.5. 실제 적용 예시

#### 2.5.1. 챗봇 세션 생성 시
```typescript
// Analyze Agent의 요구사항 분석
if (actor === AutoBeAnalyzeRole.moderator) {
    // 내부 관리자는 모든 기업의 세션 생성 가능
    // role에 따라 생성 가능한 세션 타입이 달라질 수 있음
} else if (actor === AutoBeAnalyzeRole.employee) {
    // 기업 직원은 자신이 속한 기업/팀의 세션만 생성
    // title과 team role에 따라 권한이 세분화됨
}
```

#### 2.5.2. 통계 조회 시
```typescript
// Actor별 접근 범위 결정
switch(actor) {
    case AutoBeAnalyzeRole.moderator:
        // 전체 시스템 통계 접근 가능
        break;
    case AutoBeAnalyzeRole.employee:
        // 소속 기업 통계만 접근
        // title === 'master'면 기업 전체, 아니면 제한적 접근
        break;
}
```

### 2.6. Actor 분류의 철학적 배경

**왜 2개의 Actor만 존재하는가?**

1. **명확한 경계**: 내부 운영자 vs 외부 고객의 명확한 구분
2. **보안 강화**: Actor 레벨에서의 완전한 데이터 격리
3. **확장성**: 새로운 role/title 추가는 쉽지만 Actor 추가는 시스템 전체 재설계
4. **단순성**: 복잡한 권한 체계를 2개 Actor로 단순화

**이 원칙을 위반하면?**
- 시스템 복잡도 기하급수적 증가
- 보안 취약점 발생 가능성
- 유지보수 불가능한 코드베이스
- 요구사항과 구현의 불일치

### 2.7. Analyze Agent에게 주는 최종 명령

1. `AutoBeAnalyzeRole` enum은 정확히 2개 값만 가져야 함
2. 모든 요구사항을 2개 Actor 관점에서 분석할 것
3. role/title/position은 Actor가 아닌 속성으로 처리할 것
4. Actor를 늘리려는 유혹에 절대 굴복하지 말 것
5. 이 원칙은 시스템 설계의 근간이므로 절대 타협 불가

> **최종 경고**: Actor를 2개 이상 만드는 것은 시스템 설계의 근본을 흔드는 치명적 실수다. 
> Analyze Agent는 이 원칙을 생명처럼 지켜야 한다.

### 2.8. AutoBE 구현 지침

> **🔴 핵심: 본 문서의 직접 지시사항 외에는 AutoBE 시스템 프롬프트를 따른다**

**두 가지 핵심 원칙의 균형**:
1. **기존 테이블 보호**: 본 문서에 정의된 약 25개 테이블은 절대 수정 불가
2. **신규 테이블 적극 추가**: 본 문서에 없는 새로운 기능 영역에 대해서는 AutoBE의 DB 설계 원칙에 따라 추가 테이블 설계

**1단계: 기존 테이블 보호 원칙**
본 문서에 정의된 테이블들은 다음과 같이 보호된다:
- **수정 금지**: 테이블명, 컬럼명, 타입, DTO 인터페이스명, 속성명 변경 불가
- **추가 금지**: 기존 테이블에 새로운 컬럼이나 속성 추가 불가
- **삭제 금지**: 기존 정의된 어떤 요소도 삭제 불가
- **영역 보호**: 기존 테이블이 담당하는 핵심 영역에 중복 테이블 생성 금지
  - 예: 내부 관리자 관리는 `wrtn_moderators`가 담당하므로 별도의 관리자 테이블 금지
  - 예: 챗봇 세션은 `wrtn_chat_sessions`가 담당하므로 별도의 세션 테이블 금지

**2단계: 신규 테이블 적극 추가 원칙**
다음 영역들은 본 문서에 정의되지 않았으므로 반드시 새 테이블을 추가해야 한다:
- **필수 추가 영역 예시**:
  - 고객 지원 시스템 (티켓, 문의, FAQ 등)
  - 청구 및 결제 관리 (인보이스, 결제 내역, 환불 등)
  - 알림 시스템 (이메일, 인앱 알림, 구독 설정 등)
  - 피드백 수집 (설문, 평가, 제안 등)
  - 모니터링 대시보드 (사용량 추적, 성능 지표 등)
  - 교육 및 온보딩 (튜토리얼, 가이드, 인증 등)
  - 기타 B2B SaaS 필수 기능들

**3단계: 제약사항 명확화**
다음 경우에만 새 테이블 생성이 금지된다:
1. **role/title 서브타입 테이블**: 역할별 별도 테이블 생성 금지
   - 금지 예: wrtn_moderator_administrators, wrtn_enterprise_employee_owners
2. **첨부파일 확장 테이블**: `wrtn_attachment_files` 관련 추가 테이블 금지
3. **기존 영역 중복**: 이미 정의된 테이블의 핵심 기능과 중복되는 테이블 금지

**위 제약사항을 제외한 모든 영역에서 새 테이블을 적극적으로 추가하라**

**DB 테이블 구현 원칙**:
- 본 문서에 명시된 모든 테이블과 컬럼을 **정확히 그대로** 구현해야 한다
- 테이블명, 컬럼명, 타입을 임의로 변경하거나 재해석할 수 없다
- 새로운 컬럼이나 인덱스를 추가할 수 없다
- 오직 주석(description)만 추가하여 의미를 설명할 수 있다
- **CRITICAL**: 각 섹션의 테이블들은 모두 동일한 namespace로 그룹핑해야 한다:
  - Section 3 (Moderator): 모든 `wrtn_moderator*` 테이블은 하나의 namespace
  - Section 4 (Enterprise): 모든 `wrtn_enterprise*` 테이블은 하나의 namespace
  - Section 5 (Chatbot): 모든 `wrtn_chat*` 테이블은 하나의 namespace
  - Section 6 (Procedure): 모든 `wrtn_procedure*` 테이블은 하나의 namespace
  - Section 7 (Configurations): 모든 config 관련 테이블은 하나의 namespace

### 2.9. DTO 구현 원칙

> **🔴 핵심: 본 문서의 직접 지시사항 외에는 AutoBE 시스템 프롬프트의 DTO 설계 원칙을 따른다**

#### 2.9.1. 문서 명시 DTO와 자율 설계 DTO의 구분

**본 문서에서 직접 명시한 DTO**:
- 인터페이스명과 속성은 정확히 그대로 구현해야 한다
- 새로운 속성을 추가할 수 없다
- 오직 주석(description)만 추가하여 각 속성의 의미를 설명할 수 있다

**본 문서에 정의되지 않은 DTO**:
- 아래 원칙에 따라 자율적으로 설계한다
- DB 스키마 지시사항은 DTO에 적용하지 않는다
- API 사용성과 개발자 경험을 최우선으로 고려한다

#### 2.9.2. DB 스키마와 DTO의 분리 원칙

**DB 스키마에 대한 지시사항은 DTO에 적용되지 않음**
- DB 테이블 구조를 그대로 DTO로 만들지 말 것
- DB 스키마는 저장 구조 최적화에 초점, DTO는 API 사용성에 초점
- DB의 정규화된 구조를 그대로 노출하지 않고, 사용자 친화적으로 변환
- FK 관계, 조인된 데이터 등을 적절히 구성하여 제공

#### 2.9.3. AutoBE의 DTO 설계 원칙

**AutoBE interface 설계 원칙 준수**
- AutoBE의 고유 시스템 프롬프트에 정의된 interface 설계 원칙을 철저히 따라 DTO 설계 진행
- 아래 설명하는 "Relation 맵핑 원칙"과 "JWT 인증 컨텍스트 보안 원칙"은 AutoBE interface 설계 원칙의 일부를 발췌한 것임
- **중요**: AutoBE의 interface (특히 DTO) 설계 원칙을 완벽하게 준수하여 설계해야 함

**Relation 맵핑 원칙**
- Response DTO에서 FK를 객체로 변환
- Create DTO에서 관계 타입별로 적절히 구성 (Composition, Association, Aggregation)
- Create DTO는 단일 API 호출로 완전한 엔티티 생성이 가능하도록 설계 (Atomic Operation Principle)
- 관련 엔티티들이 함께 생성되어야 할 경우, 중첩된 객체 구조로 한 번에 처리

```typescript
//----
// Relation 맵핑 예시
//----
// 아래 타입 정의는 참고사항이자 권유사항일 뿐이니 이 설계를 
// 100% 따라야하는 것은 아니다. 다만 Read(Response) DTO 기준 
// 맵핑을 어떻게 해야하는지 본 예제로부터 그 원리를 파악하여 
// 도처에 응용하기 바란다
export interface IWrtnChatSession {
  // 이하 FK 참조 관계를 객체로 맵핑
  employee: IWrtnEnterpriseEmployee.ISummary;
  team: IWrtnEnterpriseTeam.ISummary | null;
  persona: IWrtnPersona.ISummary;

  // 이하 has 관계를 객체 내지 배열로 맵핑
  token_usage: IWrtnTokenUsage | null;
  connections: IWrtnChatSessionConnection[];
  histories: IWrtnChatSessionHistory[];
  
  // 이후로 자유로이 나머지 속성들을 설계할 것...
  id: string & tags.Format<"uuid">;
  title: string | null;
  created_at: string & tags.Format<"date-time">;
}

export interface IWrtnEnterpriseEmployee {
  // FK 참조관계 및 has 관계 맵핑
  enterprise: IWrtnEnterprise.ISummary;
  companions: IWrtnEnterpriseTeamCompanion.ISummary[];

  // 이후로 자유로이 나머지 속성들을 설계할 것...
  id: string & tags.Format<"uuid">;
  email: string & tags.Format<"email">;
  title: "master" | "manager" | "member" | null;
  created_at: string & tags.Format<"date-time">;
  updated_at: string & tags.Format<"date-time">;
  approved_at: string & tags.Format<"date-time"> | null;
}
export interface IWrtnEnterpriseEmployeeAppointment {
  id: string & tags.Format<"uuid">;
  employee: IWrtnEnterpriseEmployee.ISummary; // 임명된 사람
  appointer: IWrtnEnterpriseEmployee.ISummary; // 임명한 사람
  title: "master" | "manager" | "member" | null;
  created_at: string & tags.Format<"date-time">;
}
export interface IWrtnEnterpriseEmployeeInvitation {
  id: string & tags.Format<"uuid">;
  employee: IWrtnEnterpriseEmployee.ISummary; // 초대한 사람
  email: string & tags.Format<"email">; // 초대받은 이메일
  title: "master" | "manager" | "member" | null;
  created_at: string & tags.Format<"date-time">;
  expired_at: string & tags.Format<"date-time"> | null;
}
```

**JWT 인증 컨텍스트 보안 원칙**
- Create DTO에 **현재 인증된 사용자**의 actor_id나 actor_session_id를 포함하지 마라
- 현재 사용자의 `wrtn_moderator_id`, `wrtn_moderator_session_id`, `wrtn_enterprise_employee_id`, `wrtn_enterprise_employee_session_id`는 JWT 토큰에서 자동 취득
- 단, 대상 엔티티 지정이 필요한 경우 (예: 직원 임명 시 target_employee_id)는 반드시 포함해야 함
- 클라이언트가 제공한 현재 사용자 identity를 신뢰하지 말고, 서버가 JWT에서 검증된 사용자 컨텍스트를 주입

### 2.10. 추가 구현의 자유와 확장 의무

> **🔴 핵심: 본 문서 외의 모든 개발은 AutoBE 시스템 프롬프트에 따라 자율적으로 진행한다**

**새로운 테이블과 기능을 적극 추가**:
- 본 문서에 이미 정의된 테이블과 DTO는 절대 수정 불가하며, 정확히 그대로 구현해야 한다
- **중요**: 본 문서는 **최소한의 핵심 테이블**만을 정의한 것이다. 완전한 엔터프라이즈 B2B SaaS 시스템이 되려면 훨씬 많은 테이블과 기능이 필요하다
- **명령**: 본 문서의 테이블들은 단지 시작점일 뿐이다. AutoBE는 완전히 작동하는 엔터프라이즈 백엔드를 만들기 위해 필요한 모든 추가 테이블과 기능을 자율적으로 설계하고 구현해야 한다

#### 2.10.1. B2B SaaS 필수 기능 발굴 의무

**AutoBE는 엔터프라이즈 B2B SaaS 서비스에 당연히 필요한 모든 기능을 스스로 발굴하고 구현해야 한다**:
- AI 서비스 사용에 도움이 필요한 기업들을 위한 지원 시스템
- 직원들이 AI를 효과적으로 활용할 수 있도록 돕는 기능들
- 기업 고객의 성공을 위한 Customer Success 기능들
- B2B SaaS 서비스가 갖춰야 할 모든 표준 기능들
- 기타 AutoBE가 필요하다고 판단하는 모든 기능들

**적극적인 요구사항 발굴**:
- 본 문서에 없지만 당연히 있어야 할 기능들을 적극 추가하라
- 사용자 경험을 개선할 수 있는 모든 기능을 자유롭게 추가하라
- 기업 고객이 AI 서비스를 성공적으로 도입할 수 있도록 돕는 모든 기능을 구현하라
- B2B SaaS best practice를 적용하여 필요한 모든 테이블을 설계하라

- **제약사항**: 영역 중복과 role/title 서브타입만 금지. 그 외에는 모두 자유다
- 중요: 기존 테이블과 연관된 새 테이블을 만들 때도 기존 테이블에는 어떤 컬럼도 추가하지 않는다

> **절대 준수사항**: 서비스 prefix 는 `wrtn` 으로 한다.
>
> **절대 금지**: 이미 `wrtn` prefix 가 있는데 또 `wrtn` 을 그 뒤에 추가하는 것을 절대 금지한다.
> - ❌ DB 테이블: `wrtn_wrtn~` 같은 이름 절대 금지
> - ❌ DTO 타입: `IWrtnWrtn` 같은 이름 절대 금지
> - 내가 작성한 테이블명과 DTO명을 그대로 사용하라. 절대 수정하지 마라.

## 3. Moderator (Internal Supporter)

> **절대 준수사항**: 아래 정의된 모든 테이블과 컬럼을 정확히 그대로 구현하라. 어떠한 수정도 금지한다.

```prisma
// This table handles all internal member roles through the role field
model wrtn_moderators {
  id String @id @uuid
  mobile String
  nickname String
  name String
  password_hashed String

  // - master: can appoint and invite master and manager
  // - manager: can appoint and invite manager
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

// for audit tracing about individual events
model wrtn_moderator_sessions {
  id String @id @uuid
  wrtn_moderator_id String
  href String // connection URL
  referrer String // referrer URL
  ip String // IP address
  created_at DateTime
  expired_at DateTime?

  @@index([wrtn_moderator_id, created_at])
}

model wrtn_moderator_appointments {
  id String @id @uuid
  wrtn_moderator_id String @uuid

  // some member who appointed
  // however, it can be null due to the first membership seeding
  wrtn_appointer_id String? @uuid
  wrtn_appointer_session_id String? @uuid // for audit tracing

  role String? // null := 보직 발령 대기
  created_at DateTime

  @@index([wrtn_moderator_id, created_at])
  @@index([wrtn_appointer_id])
  @@index([wrtn_appointer_session_id])
}

model wrtn_moderator_invitations {
  id String @id @uuid
  wrtn_moderator_id String @uuid // invitor's member id
  wrtn_moderator_session_id String @uuid // invitor's session id for audit tracing
  email String
  created_at DateTime
  expired_at DateTime?
  deleted_at DateTime?

  @@index([wrtn_moderator_id])
  @@index([wrtn_moderator_session_id])
  @@index([email])
  @@index([created_at])
}

model wrtn_moderator_emails {
  id String @id @uuid
  wrtn_moderator_id String @uuid
  email String
  verified_at DateTime?
  created_at DateTime
  deleted_at DateTime?
  
  @@unique([email])
  @@index([wrtn_moderator_id])
}
```

내부 관리자는 엔터프라이즈 기업을 관리하는 역할을 해. 서포터의 일종이라 볼 수 있다.

다만 이들의 역할 (`wrtn_moderators.role`) 은 다음과 같이 두 가지로 세분화되어있다. 이들 모두 엔터프라이즈를 개설하고 철폐하는 등의 엔터프라이즈사들에 대한 직접적인 관리가 가능하다.

- `master`: master와 manager 모두를 임명하고 권한 변경할 수 있다.
- `manager`: manager를 임명하고 권한 변경할 수 있다.

> **중요**: `wrtn_moderators.role`은 위의 2가지 값(master/manager/null)만 가진다. 이 role 값으로 모든 권한을 관리한다.

`wrtn_moderators`, 이들은 이메일과 비밀번호로 로그인할 것이되, 복수의 이메일 계정을 가질 수 있다. 그 이유는 SaaS 서비스 특성상 기업 고객사로의 출장을 가야할 수도 있는데, 이 때 그 회사가 보안을 이유로 폐쇄망이 갖춰져있어 외부 인터넷 접속이 불가능할 수도 있기 때문이다.

또한 `wrtn_moderators` 의 가입은 크게 두 방법으로 이루어진다. 첫 번째는 당사자가 직접 뤼튼 엔터프라이즈의 내부 직원용 홈페이지에 들어와 가입 신청을 하거든, master 또는 manager 가 이를 승인해주는 방법이다. 이 때에는 가입 승인 처리와 동시에 `wrtn_moderator_appointments` 레코드가 생성되고, `wrtn_moderators.approved_at` 에 그 시각이 기록된다. 두 번째 방법은 기존의 관리자가 `wrtn_moderator_invitations` 레코드를 발행하며 새 관리자에게 이메일로 초대장을 보내는 것이다. 이 때 초대받은 사람이 가입 신청을 하면, 그 즉시로 `wrtn_moderators` 와 함께 `wrtn_moderator_appointments` 레코드도 생성된다. 물론 이 때의 임명자는 바로 초대장을 보낸 바로 그 관리자이며, `wrtn_moderator_emails.verified_at` 는 `wrtn_moderator_invitations.created_at` 의 것이 기록된다.

이외에 master 나 manager 가 기존의 관리자를 탈퇴 처리하면, `wrtn_moderators.deleted_at` 에 그 시각이 기록되며, 이 때에도 역시 `wrtn_moderator_appointments` 레코드가 하나 더 생성된다. 이 때의 임명자는 탈퇴 처리를 한 바로 그 관리자이며, 이 때 변경되는 역할은 `wrtn_moderators.role` 과 `wrtn_moderator_appointments.role` 모두 `null` 이 된다. 만일 관리자 당사자 스스로가 탈퇴한 것이라면, `wrtn_moderator_appointments.wrtn_appointer_id` 는 자기 자신이 되며, 이 때의 `role` 역시 두 곳 모두 `null` 이 된다.

> ### 추적을 위한 세션 관리
> 
> `wrtn_moderator_sessions`는 내부 관리자들의 모든 접속 세션을 기록한다. 이는 단순히 "누가 무엇을 했는가"를 넘어 "정확히 어느 접속 세션에서 했는가"까지 추적하기 위함이다. 각 세션은 다음 정보를 포함한다:
> 
> - **href**: 접속한 URL 주소
> - **referrer**: 어디서 왔는지 (리퍼러 URL)
> - **ip**: 접속자의 IP 주소
> - **created_at**: 세션 시작 시각
> - **expired_at**: 세션 종료 시각
> 
> 이를 통해 계정 도용이나 비정상 접근을 탐지할 수 있으며, 모든 중요한 행위는 해당 세션 ID와 함께 기록된다. 예를 들어:
> - 기업 생성 시: `wrtn_enterprises` 테이블에 `wrtn_moderator_id`와 함께 `wrtn_moderator_session_id` 기록
> - 관리자 임명 시: `wrtn_moderator_appointments` 테이블에 `wrtn_appointer_id`와 함께 `wrtn_appointer_session_id` 기록
> - 초대장 발송 시: `wrtn_moderator_invitations` 테이블에 `wrtn_moderator_id`와 함께 `wrtn_moderator_session_id` 기록
> 
> **AI 설계 원칙**: AutoBE가 내부 관리자와 관련된 새 테이블을 설계할 때도 이 세션 추적 원칙을 동일하게 적용해야 한다. 모든 관리자 행위 기록에는 반드시 `wrtn_moderator_id`와 함께 `wrtn_moderator_session_id`도 포함시켜라.

## 4. Enterprise

> **절대 준수사항**: 아래 정의된 모든 테이블과 컬럼을 정확히 그대로 구현하라. 슈퍼타입/서브타입 생성 절대 금지.

```prisma
model wrtn_enterprises {
  id String @id @uuid
  wrtn_moderator_id String @uuid // who created the enterprise record
  wrtn_moderator_session_id String @uuid // for audit tracing
  code String
  name String @uuid
  created_at DateTime
  updated_at DateTime
  deleted_at DateTime?

  @@unique([code])

  @@index([wrtn_moderator_id])
  @@index([wrtn_moderator_session_id])
  @@index([name])
  @@index([created_at])
}

// This table handles all enterprise employee titles through the title field
model wrtn_enterprise_employees {
  id String @id @uuid
  wrtn_enterprise_id String @uuid
  email String
  password String
  name String

  // - master
  // - manager
  // - member
  // - null: 아무 직책도 없어 그 무엇도 할 수 없는 상태
  title String?
  created_at DateTime
  updated_at DateTime // whenever title changed
  approved_at DateTime? // first approved time
  deleted_at DateTime? // the fired time

  @@unique([wrtn_enterprise_id, email])
  @@index([wrtn_enterprise_id, name])
}

// for audit tracing about individual events
model wrtn_enterprise_employee_sessions {
  id String @id @uuid
  wrtn_enterprise_employee_id String @uuid
  href String
  referrer String
  ip String
  created_at DateTime
  expired_at DateTime?

  @@index([wrtn_enterprise_employee_id, created_at])
}

model wrtn_enterprise_employee_appointments {
  id String @id @uuid
  wrtn_enterprise_employee_id String @uuid
  wrtn_enterprise_appointer_id String? @uuid
  wrtn_enterprise_appointer_session_id String? @uuid
  title String?
  created_at DateTime

  @@index([wrtn_enterprise_employee_id, created_at])
  @@index([wrtn_enterprise_appointer_id])
  @@index([wrtn_enterprise_appointer_session_id])
}

model wrtn_enterprise_employee_invitations {
  id String @id @uuid
  wrtn_enterprise_id String @uuid
  wrtn_enterprise_employee_id String @uuid
  wrtn_enterprise_employee_session_id String @uuid
  wrtn_enterprise_team_id String? @uuid
  email String @uuid
  title String
  created_at DateTime
  expired_at DateTime?
  deleted_at DateTime?

  @@index([wrtn_enterprise_id, created_at])
  @@index([wrtn_enterprise_employee_id])
  @@index([wrtn_enterprise_employee_session_id])
  @@index([wrtn_enterprise_team_id])
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
  @@index([parent_id])
}

model wrtn_enterprise_team_companions {
  id String @id @uuid
  wrtn_enterprise_team_id String @uuid
  wrtn_enterprise_employee_id String @uuid

  // - member: 팀에 소속되어 있는 상태
  // - null: 팀에서 배제된 상태 (deleted_at이 null이면서 role이 null이면 배제됨)
  role String?
  created_at DateTime
  updated_at DateTime
  deleted_at DateTime?

  @@unique([wrtn_enterprise_team_id, wrtn_enterprise_employee_id])
  @@index([wrtn_enterprise_employee_id])
}

model wrtn_enterprise_team_companion_appointments {
  id String @id @uuid
  wrtn_enterprise_team_employee_id String @uuid
  wrtn_enterprise_team_appointer_id String @uuid
  wrtn_enterprise_team_appointer_session_id String @uuid
  role String? // member := 팀에 임명, null := 팀에서 배제
  created_at DateTime

  @@index([wrtn_enterprise_team_employee_id, created_at])
  @@index([wrtn_enterprise_team_appointer_id])
  @@index([wrtn_enterprise_team_appointer_session_id])
}

model wrtn_enterprise_team_companion_invitations {
  id String @id @uuid
  wrtn_enterprise_team_id String @uuid // target team
  wrtn_enterprise_employee_id String @uuid // target employee to invite
  wrtn_enterprise_invitor_id String @uuid // some employee who invited
  wrtn_enterprise_invitor_session_id String @uuid // for exact tracing
  created_at DateTime
  expired_at DateTime?
  deleted_at DateTime?

  @@index([wrtn_enterprise_team_id, created_at])
  @@index([wrtn_enterprise_employee_id])
  @@index([wrtn_enterprise_invitor_id])
  @@index([wrtn_enterprise_invitor_session_id])
}
```

### 4.1. Corporation

`wrtn_enterprises` 는 뤼튼 엔터프라이즈 AI 서비스를 이용하는 기업 고객사들이다. 이들의 등록은 오직 `wrtn_moderators` 중 그 역할이 master 또는 manager 만 할 수 있으며, 동시에 최초의 master 직원을 임명하게 된다.

### 4.2. Employee

`wrtn_enterprise_employees` 는 각 기업에 소속된 직원들을 형상화하였으며 곧 그들의 로그인 계정이다. 앞서 `wrtn_moderators` 에 의해 최초로 임명된 master 직원에 의해 해당하여 기업 직원 계정을 최초 발급받는다. 그리고 이들 기업 직원들의 직책 (`wrtn_enterprise_employees.title`) 은 다음과 같이 세 가지로 구분된다.

이 중 master 는 기업 내 모든 권한을 가지며 다른 master, manager, member 를 임명할 수 있다. manager 는 member 만 임명할 수 있으며, member 는 일반 사용자로써 AI 서비스를 이용할 수 있되 임명 권한은 없다.

- `master`: master, manager, member 모두를 임명할 수 있다
- `manager`: member 를 임명할 수 있다
- `member`: AI 서비스 이용 가능, 임명 권한 없음

> **중요**: `wrtn_enterprise_employees.title`은 위의 3가지 값(master/manager/member/null)만 가진다. 이 title 값으로 모든 권한을 관리한다.

직원의 가입은 두 가지 방법으로 이루어진다. 첫 번째는 당사자가 직접 기업 홈페이지에서 가입 신청을 하고 master 또는 manager 가 이를 승인하는 것이다. 이 때 승인과 동시에 `wrtn_enterprise_employee_appointments` 레코드가 생성되고 `wrtn_enterprise_employees.approved_at` 에 승인 시각이 기록된다. 두 번째는 기존 직원이 (역시 master 또는 manager) `wrtn_enterprise_employee_invitations` 를 통해 이메일로 초대장을 보내는 것이다. 초대받은 사람이 가입하면 즉시 `wrtn_enterprise_employees` 와 `wrtn_enterprise_employee_appointments` 레코드가 생성되며, 초대장에 명시된 직책이 부여된다. 초대장이 수락되지 않은 경우 `expired_at` 시점에 만료되며, 만료된 초대장으로는 가입할 수 없다.

직원의 직책은 변경될 수 있으며, 심지어 `null` 로 설정하여 모든 권한을 박탈할 수도 있다. master 는 다른 모든 직원의 직책을 변경하거나 `null` 로 만들 수 있고, manager 는 member 의 직책만 변경할 수 있다. 직책이 `null` 이 되면 해당 직원은 기업 계정은 유지하되 어떠한 권한도 행사할 수 없게 된다. 모든 직책 변경은 `wrtn_enterprise_employee_appointments` 에 기록되며, `wrtn_enterprise_employees.updated_at` 이 갱신된다.

다만 최초 master 의 경우 `wrtn_moderators` 에 의해 임명되므로 `wrtn_enterprise_employee_appointments.wrtn_enterprise_appointer_id` 가 `null` 이 된다. 이는 기업 생성 시점에 내부 관리자가 직접 master 를 지정했음을 의미한다.

직원의 퇴사는 두 가지 경우로 나뉜다. 첫 번째는 master 또는 manager 가 직원을 해고하는 경우이다. master 는 모든 직책의 직원을 해고할 수 있으며, manager 는 member 만 해고할 수 있다. 해고 처리 시 `wrtn_enterprise_employees.deleted_at` 에 그 시각이 기록되고, `wrtn_enterprise_employee_appointments` 레코드가 새로 생성된다. 이 때 임명자 (`wrtn_enterprise_appointer_id`) 는 해고를 집행한 그 직원이며, `title` 은 `null` 이 되어 더 이상 직책이 없음을 나타낸다.

두 번째는 직원 본인이 스스로 사직하는 경우이다. 이 때도 마찬가지로 `wrtn_enterprise_employees.deleted_at` 에 시각이 기록되고 `wrtn_enterprise_employee_appointments` 레코드가 생성되지만, `wrtn_enterprise_appointer_id` 는 자기 자신의 ID가 되며, `title` 은 역시 `null` 이 된다. 이를 통해 자진 퇴사와 해고를 구분할 수 있다.

> #### 세션 기반 감사 추적
> 
> `wrtn_enterprise_employee_sessions`는 기업 직원들의 모든 접속 세션을 기록한다. 내부 관리자의 세션 관리와 동일한 원칙으로, 기업 내에서 발생하는 모든 중요 행위를 "누가 + 언제 + 어느 세션에서" 했는지 완벽하게 추적한다.
> 
> 이 세션 정보는 기업 내 모든 활동과 연결된다:
> - 직원 임명/해고: `wrtn_enterprise_employee_appointments`에 `wrtn_enterprise_appointer_session_id` 기록
> - 초대장 발송: `wrtn_enterprise_employee_invitations`에 `wrtn_enterprise_employee_session_id` 기록
> - 팀 구성원 관리: `wrtn_enterprise_team_companion_appointments`에 `wrtn_enterprise_team_appointer_session_id` 기록
> - AI 채팅 생성: `wrtn_chat_sessions`에 `wrtn_enterprise_employee_session_id` 기록
> - AI 프로시저 실행: `wrtn_procedure_sessions`에 `wrtn_enterprise_employee_session_id` 기록
> - 페르소나 설정: `wrtn_enterprise_employee_personas`에 `wrtn_enterprise_employee_session_id` 기록
> 
> 이를 통해 기업은 직원들의 모든 활동을 정확하게 감사 추적할 수 있으며, 보안 사고 발생 시 정확한 원인 파악이 가능하다.
> 
> **AI 설계 원칙**: AutoBE가 기업 직원과 관련된 새 테이블을 설계할 때도 이 세션 추적 원칙을 동일하게 적용해야 한다. 모든 직원 행위 기록에는 반드시 `wrtn_enterprise_employee_id`와 함께  `wrtn_enterprise_employee_session_id`도 포함시켜라.

### 4.3. Team

`wrtn_enterprise_teams` 는 기업 내 조직이다. `parent_id` 를 통해 계층 구조를 가질 수 있어, "개발팀" 아래 "백엔드팀", "프론트엔드팀" 같은 하위 팀을 둘 수 있다. 각 팀은 기업 내에서 고유한 `code` 와 `name` 을 가진다. 참고로 `wrtn_enterprise_teams` 는 master 또는 manager 직책을 가진 직원만이 만들 수 있으며, 팀 생성자는 동시에 해당 팀의 최초 구성원으로 추가된다 (`role` = `member`). 팀 삭제는 master 또는 manager 직책을 가진 직원이 할 수 있으며, `wrtn_enterprise_teams.deleted_at` 에 그 시각이 기록된다.

`wrtn_enterprise_team_companions` 는 팀 구성원이다. 한 직원은 여러 팀에 동시에 소속될 수 있다. `role` 필드는 `member` 또는 `null` 값만 가지며, `member`는 팀에 소속되어 있는 상태, `null`은 팀에서 배제된 상태를 나타낸다.

> **중요**: `wrtn_enterprise_team_companions.role`은 오직 2가지 값(member/null)만 가진다. 팀장 등의 별도 역할은 없으며, 팀원 관리(초대/배제)는 오직 `wrtn_enterprise_employees.title`이 master 또는 manager인 직원만 할 수 있다.

### 4.4. Companion

팀원 초대는 `wrtn_enterprise_team_companion_invitations` 를 통해 이루어진다. master 또는 manager 직책을 가진 직원만이 다른 직원을 팀으로 초대할 수 있으며, 초대받은 직원이 수락하면 `wrtn_enterprise_team_companions` 레코드가 생성되고 (`role` = `member`) 동시에 `wrtn_enterprise_team_companion_appointments` 에 임명 기록이 남는다 (`role` = `member`). 팀원 초대장도 `expired_at` 시점에 만료되며, 만료된 초대장으로는 팀에 가입할 수 없다.

팀 구성원의 `role` 변경은 오직 master 또는 manager 직책을 가진 직원만이 할 수 있다. `role`을 `null`로 변경하면 해당 직원은 팀에서 배제된다 (팀 소속은 유지하되 팀원 자격을 박탈). 모든 role 변경은 `wrtn_enterprise_team_companion_appointments` 에 기록되며, `wrtn_enterprise_team_companions.updated_at` 이 갱신된다.

팀 구성원의 완전한 제거는 두 가지 경우로 나뉜다. 첫 번째는 master 또는 manager 직책을 가진 직원이 팀원을 강제 제거하는 경우이다. 제거 처리 시 `wrtn_enterprise_team_companions.deleted_at` 에 그 시각이 기록되고, `wrtn_enterprise_team_companion_appointments` 레코드가 새로 생성된다 (`role` = `null`). 이 때 임명자는 제거를 집행한 그 직원의 companion ID이다.

두 번째는 팀원 본인이 스스로 팀을 탈퇴하는 경우이다. 이 때도 마찬가지로 `wrtn_enterprise_team_companions.deleted_at` 에 시각이 기록되고 `wrtn_enterprise_team_companion_appointments` 레코드가 생성되지만 (`role` = `null`), `wrtn_enterprise_team_appointer_id` 는 자기 자신의 companion ID가 된다. 이를 통해 자진 탈퇴와 강제 제거를 구분할 수 있다.

## 5. AI Chatbot

**절대 준수사항**: 모든 JSON 필드는 반드시 JSON으로 유지하라. JSON 필드를 절대 분해하거나 정규화하지 마라.

```prisma
// Core chat session table - maintains conversation metadata
model wrtn_chat_sessions {
  id String @id @uuid
  wrtn_enterprise_employee_id String @uuid // employee who created the chatting session
  wrtn_enterprise_employee_session_id String @uuid // for audit tracing
  wrtn_enterprise_employee_persona_id String @uuid // persona setting
  wrtn_enterprise_team_id String? @uuid // 팀 소속이 없을 때만 null
  vendor String // AI vendor model name like "openai/gpt-4.1-mini"
  title String?

  // - private: only session creator can access
  // - protected: session creator and his/her team members can access
  // - public: anyone in the enterprise can access
  disclosure String
  created_at DateTime
  updated_at DateTime // when title or disclosure changed 
  deleted_at DateTime?

  @@index([wrtn_enterprise_employee_id, created_at])
  @@index([wrtn_enterprise_employee_session_id])
  @@index([wrtn_enterprise_employee_persona_id])
  @@index([wrtn_enterprise_team_id])
}

// Connection tracking for chat sessions
model wrtn_chat_session_connections {
  id String @id @uuid
  wrtn_chat_session_id String @uuid // belonged session
  wrtn_enterprise_employee_id String @uuid // employee who connected
  wrtn_enterprise_employee_session_id String @uuid // for audit tracing
  connected_at DateTime
  disconnected_at DateTime?

  @@index([wrtn_chat_session_id, connected_at, disconnected_at])
  @@index([wrtn_enterprise_employee_id])
  @@index([wrtn_enterprise_employee_session_id])
}

// History tracking for chat messages and interactions
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

// File attachments for chat history entries
model wrtn_chat_session_history_files {
  id String @id @uuid
  wrtn_chat_session_history_id String @uuid
  wrtn_attachment_file_id String @uuid
  sequence Int

  @@index([wrtn_chat_session_history_id])
  @@index([wrtn_attachment_file_id])
}

// Aggregated metrics for chat sessions
model wrtn_chat_session_aggregates {
  id String @id @uuid
  wrtn_chat_session_id String @uuid
  history_count Int
  token_usage String // JSON value

  @@unique([wrtn_chat_session_id])
}
```

AI Chatbot 서비스는 뤼튼 엔터프라이즈의 핵심 기능으로써, OpenAI GPT 등의 AI 모델과 자연어로 대화할 수 있는 서비스이다.

> **중요**: 이 섹션의 모든 JSON 필드들은 반드시 JSON 타입으로 유지해야 한다. 절대로 JSON 필드를 해체하여 정규 컬럼으로 나누지 마라. 특히 다음 필드들은 반드시 JSON으로 유지해야 한다:
>
> - `wrtn_chat_session_histories.data` - JSON value, encrypted
> - `wrtn_chat_session_histories.token_usage` - JSON value
> - `wrtn_chat_session_aggregates.token_usage` - JSON value
>
> 추가 필드를 달아도 된다는 것은 새로운 컬럼을 추가할 수 있다는 의미이지, 기존 JSON 필드를 분해하라는 의미가 절대 아니다.

`wrtn_chat_sessions` 는 그러한 AI 챗봇의 세션으로써, 기업의 직원이 `openai/gpt-4.1` 나 `anthropic/claude-sonnet-4.5` 등의 AI 모델을 선택하여 채팅방을 개설할 수 있다. 또한 `wrtn_chat_sessions.disclosure` 를 조정하여 해당 채팅방을 동 기업 내 누구와 공유할 지 설정할 수 있다.

- `public`: 기업 구성원 모두가 채팅방 열람 가능
- `protected`: 기업의 같은 팀 동료들끼리만 열람 가능
- `private`: 당사자만 열람 가능

그리고 딱 여기 `wrtn_chat_sessions` 까지가 Restful API 로 생성할 수 있는 엔티티의 끝이다. 이후로 채팅 세션에의 접속 정보를 뜻하는 `wrtn_chat_session_connections` 와 채팅 세션에서 사람과 AI 가 주고받은 정보들을 뜻하는 `wrtn_chat_session_histories` 는 모두 WebSocket streaming API 에서 생성하니, AutoBE 는 이들에 대한 열람 API 만을 만들면 된다. 웹소켓 로직을 구현하는 것은 사람에게 넘기자.

또한 `wrtn_chat_session_histories` 에는 사람과 AI가 주고받은 데이터 정보가 `wrtn_chat_session_histories.data` JSON value 로써 기록되는데, 다만 개인 민감 정보 등을 고려하여 그 데이터는 모두 암호화된다. 그리고 이들 `data` 는 아래와 같이 복수의 타입을 유니언으로 묶은 형태인데, `wrtn_chat_session_histories.type` 이 그것의 discriminator key 역할을 한다.

마지막으로 `wrtn_chat_session_aggregates` 은 해당 채팅 세션의 총 토큰 사용량을 계산하여 누적 기록하는 엔티티로써, `wrtn_chat_session_histories` 레코드가 생성될 때 `token_usage` 값이 `null` 이 아니거든, 그것은 항시 `wrtn_chat_session_aggregates.token_usage` 에 더해진다.

단, 반복컨대 본 AI chatbot 은 웹소켓으로 구현된다. 따라서 AutoBE 가 만들어낼 Restful API 에서는 오직 `wrtn_chat_sessions` 레코드만 생성할 수 있고, 나머지 레코드들은 오직 읽기 API 로만 구현해야한다. 절대 나머지 엔티티들을 작성하고 편집하는 API 를 설계해서는 아니될 것이다.

### 5.1. Chat Session 생성 API 요구사항

**IWrtnChatSession.ICreate**

채팅 세션을 생성할 때 페르소나 ID는 선택적으로 제공할 수 있다:

```typescript
export namespace IWrtnChatSession {
  export interface ICreate {
    vendor: string; // AI vendor model name
    title?: string | null;
    disclosure: "private" | "protected" | "public";
    wrtn_enterprise_team_id?: string | null; // optional team ID
    wrtn_enterprise_employee_persona_id?: string | null; // optional persona ID
  }
}
```

**페르소나 ID 처리 로직**:

1. **페르소나 ID가 명시적으로 제공된 경우**: 
   - 제공된 페르소나 ID를 검증하고 사용
   - 유효하지 않은 ID인 경우 400 Bad Request 반환

2. **페르소나 ID가 제공되지 않은 경우 (null 또는 undefined)**:
   - 자동으로 해당 직원의 가장 최근 페르소나를 조회
   - `GET /enterprise/employees/{employeeId}/personas/latest` 로직과 동일
   - 페르소나가 존재하면 해당 ID를 사용하여 chat session 생성
   - 페르소나가 존재하지 않으면 404 Not Found 반환

3. **예외 처리**:
   - 직원이 페르소나를 한 번도 설정하지 않았고, 페르소나 ID도 제공하지 않은 경우 → 404 Not Found
   - 삭제된 페르소나 ID를 제공한 경우 → 400 Bad Request

**중요**: 데이터베이스의 `wrtn_chat_sessions.wrtn_enterprise_employee_persona_id`는 NOT NULL이므로, 반드시 유효한 페르소나 ID가 있어야만 chat session을 생성할 수 있다.

이를 통해 사용자는 매번 페르소나를 명시하지 않아도 자동으로 마지막 설정을 사용할 수 있으며, 필요시 다른 페르소나를 지정할 수도 있다.

### 5.2. `IWrtnChatHistory`

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
  file: IWrtnAttachmentFile;
}
export interface IWrtnChatUserMessageFileContent {
  type: "file";
  file: IWrtnAttachmentFile;
}
export interface IWrtnChatUserMessageImageContent {
  type: "image";
  file: IWrtnAttachmentFile;
}
export interface IWrtnChatUserMessageTextContent {
  type: "text";
  text: IWrtnAttachmentFile;
}

export interface IWrtnChatAssistantMessageHistory {
  id: string & tags.Format<"uuid">;
  type: "assistantMessage";
  text: string;
  files: IWrtnAttachmentFile[];
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

### 5.3. `IWrtnTokenUsage`

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

## 6. AI Procedure

> **절대 준수사항**: JSON 필드는 절대 분해하지 마라. 정규화하지 마라. JSON으로 유지하라.

```prisma
// Available AI procedures catalog
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

// Procedure execution sessions
model wrtn_procedure_sessions {
  id String @id @uuid
  wrtn_procedure_id String @uuid // which procedure selected
  wrtn_enterprise_employee_id String @uuid // who created this session
  wrtn_enterprise_employee_session_id String @uuid
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
  @@index([wrtn_enterprise_employee_session_id])
  @@index([wrtn_enterprise_team_id])
}

// Connection tracking for procedure sessions
model wrtn_procedure_session_connections {
  id String @id @uuid
  wrtn_procedure_session_id String @uuid // belonged session
  wrtn_enterprise_employee_id String @uuid // who connected
  wrtn_enterprise_employee_session_id String @uuid // for audit tracing
  
  // - http
  // - websocket
  protocol String
  connected_at DateTime
  disconnected_at DateTime?
  
  @@index([wrtn_procedure_session_id, connected_at, disconnected_at])
  @@index([wrtn_enterprise_employee_id])
  @@index([wrtn_enterprise_employee_session_id])
}

// Must define every JSON value columns separately
// Never merge them into one column like "data"
// CRITICAL: 절대로 JSON 필드를 정규화하여 분해하지 마라
// History of procedure executions
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

// Aggregated metrics for procedure sessions
model wrtn_procedure_session_aggregates {
  id String @id @uuid
  wrtn_procedure_session_id String @uuid
  history_count Int
  token_usage String // JSON value, total aggregation
  
  @@unique([wrtn_procedure_session_id])
}
```

함수 형태의 AI 서비스.

**중요**: 이 섹션의 모든 JSON 필드들은 반드시 JSON 타입으로 유지해야 한다. 절대로 JSON 필드를 해체하여 정규 컬럼으로 나누지 마라. 특히 다음 필드들은 반드시 JSON으로 유지해야 한다:
- `wrtn_procedure_session_histories.arguments` - JSON value, encrypted
- `wrtn_procedure_session_histories.value` - JSON value, encrypted
- `wrtn_procedure_session_histories.token_usage` - JSON value
- `wrtn_procedure_session_aggregates.token_usage` - JSON value
추가 필드를 달아도 된다는 것은 새로운 컬럼을 추가할 수 있다는 의미이지, 기존 JSON 필드를 분해하라는 의미가 절대 아니다.

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

## 7. Configurations
### 7.1. Persona
뤼튼의 모든 엔터프라이즈 유저들은 (`wrtn_enterprise_employees`) 페르소나를 설정할 수 있다. 여기서 말하는 페르소나란, AI chatbot 의 말투 및 태도에 관한 것을 뜻한다.

> **중요**: `wrtn_enterprise_employee_personas.memory` 필드는 JSON value로 유지해야 한다. 절대로 이를 분해하여 정규 컬럼으로 나누지 마라. 

그리고 엔터프라이즈 유저들이 설정한 페르소나를 저장하는 테이블이 `wrtn_enterprise_employee_personas` 인데, 보다시피 `updated_at` 컬럼이 존재하지 않는다. 이것인 곧 인터프라이즈 유저가 페르소나를 수정했어도, 시스템 상에서는 기존 레코드를 수정하는게 아니라 새 레코드를 만들어 누적하는 개념이기 때문에 그러하다. 

왜냐하면 페르소나 정보는 AI chatbot 세션에 기록되는데 (`wrtn_chat_sessions.wrtn_enterprise_employee_persona_id`), 이것의 정합성을 지키기 위해서이다. 이미 기존에 한창 진행한 채팅 세션이, 페르소나 설정을 바꾸었다고 갑자기 말투나 성격까지 바뀌어서야 되겠는가?

```prisma
model wrtn_enterprise_employee_personas {
  id String @id @uuid
  wrtn_enterprise_employee_id String @uuid
  wrtn_enterprise_employee_session_id String @uuid // for audit tracing
  avatar_image_url String // 아바타 이미지 (gif)
  name String // 아바타 이름
  auto_web_search Boolean // 웹 검색 자동으로 사용 여부
  auto_question_suggest Boolean // 질문 자동 추천 여부
  tone String // 톤 앤 매너
  memory String? // JSON value
  prompt String?
  created_at DateTime
  deleted_at DateTime?

  @@index([wrtn_enterprise_employee_id, created_at])
  @@index([wrtn_enterprise_employee_session_id])
}
```

#### 7.1.1. Persona API 요구사항

**직원의 마지막 페르소나 조회**

직원은 자신이 가장 최근에 설정한 페르소나를 조회할 수 있어야 한다. 이는 아직 삭제되지 않은 (`deleted_at`이 `null`인) 레코드 중에서 `created_at`이 가장 최신인 것을 찾아 반환한다.

- **API Endpoint**: `GET /enterprise/employees/{employeeId}/personas/latest`
- **Response**: 해당 직원의 가장 최근 페르소나 레코드
- **Error**: 페르소나를 한 번도 설정하지 않은 경우 404 Not Found 반환
- **권한**: 본인의 페르소나만 조회 가능

이 API는 직원이 자신의 현재 페르소나 설정을 확인할 때나, 새 채팅 세션을 시작할 때 기본 페르소나를 가져오는 데 사용된다.

### 7.2. Enterprise Procedure
각 회사는 당사가 사용할 수 있는 프로시저를 직접 지정할 수 있다. 이것을 관리하는 엔티티가 `wrtn_enterprise_procedures` 인데, 만일 아무런 레코드도 존재하지 않는다면, 그 회사는 정말 그 어떠한 프로시저도 사용할 수 없는 경우에 해당한다.

그리고 각 회사의 각 팀은 다시 각 팀이 사용할 수 있는 프로시저를 스스로 설정할 수 있다; `wrtn_enterprise_team_procedures`. 그러나 설정할 수 있는 프로시저는 해당 회사가 지원하는 프로시저로 한정한다.

또한 해당 팀에 단 하나의 `wrtn_enterprise_team_procedures` 레코드도 없다면, 이 때는 해당 팀이 그 어떠한 프로시저도 사용할 수 없는게 아니라, `wrtn_enterprise_procedures` 설정을 따라가는 것으로 한다.

이외에 `wrtn_enterprise_procedures` 와 `wrtn_enterprise_team_procedures` 는 각각 설정자를 기록하고 있는데, 이 때 설정자 값이 `null` 이라면 `wrtn_enterprise_procedures` 는 엔터프라이즈 계정을 개설한 `wrtn_moderators` 가 행한 설정이라 그러한 것이고, `wrtn_enterprise_team_procedures` 는 팀을 개설하면서 회사의 master 또는 manager 직책인이 (`wrtn_enterprise_employees.title`) 해당 팀에서 사용 가능한 프로시저를 동시 설정해서 그러한 것이다.

```prisma
model wrtn_enterprise_procedures {
  id String @id @uuid
  wrtn_enterprise_id String @uuid
  wrtn_procedure_id String @uuid
  wrtn_enterprise_configurator_id String? @uuid // employee.id
  wrtn_enterprise_configurator_session_id String? @uuid // employeeSession.id for audit tracing
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
  wrtn_enterprise_team_configurator_session_id String? @uuid // employeeSession.id for audit tracing
  sequence Int
  created_at DateTime
  deleted_at DateTime?

  @@unique([wrtn_enterprise_team_id, wrtn_procedure_id])
  @@index([wrtn_procedure_id])
}
```

## 8. File Management

```prisma
model wrtn_attachment_files {
  id String @id @uuid
  name String
  extension String
  url String
  created_at DateTime
}
```

`wrtn_attachment_files`는 **AutoBE 시스템 전체의 중앙 파일 저장소**로, 모든 파일 첨부가 이곳에서 관리된다.

> **⚠️ 중요한 설계 지침**:
> 1. `wrtn_attachment_files` 테이블은 **정확히 위의 5개 컬럼만** 가져야 한다. 컬럼 추가 금지.
> 2. **첨부파일 관련 추가 테이블 금지**:
>    - 이 테이블이 시스템의 모든 파일 첨부를 담당
>    - 파일 메타데이터, 버전 관리 등의 확장 테이블 생성 금지
> 3. 이 테이블은 **파일의 기본 정보와 S3 URL만 저장**한다.

이 테이블은 다음과 같은 모든 파일 업로드를 처리한다:
- AI Chatbot의 대화 중 첨부된 파일 (이미지, 문서, 오디오 등)
- AI Procedure의 입력/출력 파일 (생성된 이미지, 문서 등)
- 게시판이나 공지사항의 첨부 파일
- 사용자 프로필 이미지
- 기업 로고 및 브랜드 자산
- 기타 AutoBE가 추가로 구현하는 모든 기능의 파일 첨부

파일의 실제 내용은 클라우드 스토리지(S3 등)에 저장되고, 이 테이블은 메타데이터와 접근 URL만을 관리한다. 특히 `wrtn_chat_session_history_files`와 같은 연결 테이블을 통해 각 도메인별로 어떤 파일이 사용되었는지 추적한다.

> **중요**: AutoBE가 설계하는 시스템에서 발생하는 **모든 파일 업로드와 첨부**는 반드시 이 `wrtn_attachment_files` 테이블을 통해 관리되어야 한다. 각 도메인별로 별도의 파일 테이블을 만들지 말고, 이 중앙 테이블을 참조하는 연결 테이블만 생성하라.

### 8.1. 파일 관리 원칙
- 파일 업로드는 별도의 파일 업로드 API를 통해 먼저 수행
- 업로드 완료 후 반환된 id를 채팅이나 프로시저에서 참조
- 한 번 업로드된 파일은 여러 곳에서 재사용 가능
- **파일 관련 기능은 최대한 단순하게 유지** (보안 검사, 버전 관리, 상세 로깅 등 복잡한 기능 금지)

## 9. Statistics & Dashboard

뤼튼 엔터프라이즈는 복잡한 조직 구조와 다층적 권한 체계에 맞춰, 각 사용자가 자신의 권한 범위 내에서만 통계와 대시보드에 접근할 수 있도록 설계되어야 한다.

### 9.1. 권한별 접근 범위

통계 시스템의 핵심은 **계층적 데이터 격리**이다. 각 역할은 다음과 같은 범위의 데이터에만 접근할 수 있다:

**내부 관리자 (`wrtn_moderators`)**
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
- 자사 전체의 모든 통계
- 전 직원의 사용량과 활동 내역
- 팀별, 개인별 상세 분석
- 비용 정보는 조회만 가능 (수정 불가)

**팀 관리자 (master/manager 직책을 가진 직원)**
- 자신이 속한 팀의 통계
- 팀원들의 사용량과 생산성 지표
- 다른 팀 데이터는 완전 차단

**일반 직원 (member)**
- 본인의 사용 내역과 통계만 조회
- 팀이나 전사 통계는 접근 불가

### 9.2. AI Model 비용 관리

AI 모델별 비용을 관리하기 위한 테이블 설계:

```prisma
model wrtn_ai_model_pricings {
  id String @id @uuid
  wrtn_moderator_id String @uuid // 가격을 설정한 관리자
  wrtn_moderator_session_id String @uuid // for audit tracing
  code String // "openai/gpt-4o", "anthropic/claude-3-opus" 등
  name String // 화면 표시용 이름
  
  // 토큰당 단가 (USD 기준, 1,000,000 토큰당)
  input_token_price Float // 입력 토큰 단가
  output_token_price Float // 출력 토큰 단가
  cache_token_price Float? // 캐시 토큰 단가 (지원시)
  reasoning_token_price Float? // 추론 토큰 단가 (지원시)
  
  opened_at DateTime
  closed_at DateTime?
  created_at DateTime
  updated_at DateTime
  deleted_at DateTime?
  
  @@unique([code, opened_at])
  @@index([name])
  @@index([wrtn_moderator_id])
  @@index([wrtn_moderator_session_id])
}
```

이 테이블을 통해:
- AI 모델별로 서로 다른 토큰 단가를 관리
- 시간에 따른 가격 변동 이력 추적
- 특정 시점의 사용량에 대한 정확한 비용 계산 가능

### 9.3. Chat Session 통계 지표

**기본 메트릭**
- **토큰 사용량**: 입력/출력/캐시/추론 토큰을 각각 별도 집계
- **비용**: 토큰 사용량 × 모델별 단가로 계산된 실제 비용
- **세션 수**: 생성된 채팅 세션의 총 개수
- **연결 시간**: 각 세션의 총 연결 시간 (connected_at ~ disconnected_at)

**집계 차원**
- **AI 모델별**: vendor 필드 기준으로 그룹핑 (예: openai/gpt-4o, anthropic/claude-3)
- **주기별**: 일일/주간/월간 단위로 집계
- **날짜 범위**: 사용자가 지정한 시작일~종료일 범위 내 데이터 조회
- **조직별**: 법인/팀/개인 단위로 그룹핑

**권한별 조회 범위**
- **wrtn_moderators (master/manager)**: 모든 기업의 집계 통계 조회 가능
- **wrtn_enterprise_employees (master)**: 자사 전체의 법인/팀/개인별 통계 조회 가능
- **wrtn_enterprise_employees (manager)**: 자사 전체의 법인/팀별 통계 조회 가능 (개인별은 본인만)
- **wrtn_enterprise_employees (member)**: 본인 개인 통계만 조회 가능

**통계 조회 요구사항**
- AI 모델별로 그룹핑하여 통계를 볼 수 있어야 한다
- 일일/주간/월간/연간 단위로 집계할 수 있어야 한다  
- 날짜 범위를 지정하여 조회할 수 있어야 한다
- 법인/팀/개인 단위로 그룹핑하여 조회할 수 있어야 한다
- 권한에 따라 조회 가능한 범위가 제한되어야 한다

### 9.4. Procedure Session 통계 지표

**기본 메트릭**
- **토큰 사용량**: 각 프로시저별 입력/출력/캐시/추론 토큰 집계
- **비용**: 토큰 사용량 × 모델별 단가로 계산된 실제 비용
- **실행 횟수**: 각 프로시저의 총 실행 횟수
- **성공률**: success=true인 비율
- **평균 실행 시간**: started_at ~ completed_at 평균

**집계 차원**
- **프로시저별**: wrtn_procedure_id 기준으로 각 프로시저별 통계
- **AI 모델별**: 각 프로시저가 사용한 AI 모델별로 세분화
- **주기별**: 일일/주간/월간 단위로 집계
- **날짜 범위**: 사용자가 지정한 범위 내 데이터
- **조직별**: 법인/팀/개인 단위로 그룹핑

**권한별 조회 범위**
- Chat Session과 동일한 권한 체계 적용
- 추가로 프로시저 사용 권한이 있는 것만 조회 가능

**통계 조회 요구사항**
- 각 프로시저 종류별로 통계를 구분하여 볼 수 있어야 한다
- AI 모델별로 구분하여 조회할 수 있어야 한다
- 일일/주간/월간/연간 단위로 집계할 수 있어야 한다
- 법인/팀/개인 단위로 그룹핑하여 조회할 수 있어야 한다
- 실행 횟수, 성공률, 토큰 사용량, 비용 등의 지표를 확인할 수 있어야 한다

### 9.5. 종합 대시보드 구성

**실시간 모니터링**
- 현재 활성 세션 수 (채팅/프로시저)
- 실시간 토큰 사용량 및 비용 누적
- 최근 1시간/24시간 추이 그래프

**비용 분석**
- 월 누적 비용 및 예산 대비 사용률
- AI 모델별 비용 비중
- 팀별/개인별 비용 순위
- 비용 예측 (현재 사용 추세 기반)

**사용 패턴 분석**
- 시간대별 사용량 히트맵
- 요일별 사용 패턴
- 가장 많이 사용하는 AI 모델 TOP 5
- 가장 많이 실행하는 프로시저 TOP 10

**성능 지표**
- 평균 응답 시간
- 에러율 및 실패 원인 분석
- 세션당 평균 대화 턴 수
- 프로시저 성공률 추이

### 9.6. 통계 조회 요구사항 요약

**Chat Session 통계가 제공해야 할 정보**
- 토큰 사용량 (입력/출력/캐시/추론별)
- 비용 (토큰 사용량 × 모델별 단가)
- 세션 수
- 대화 시간 (연결 시간)
- AI 모델별/주기별/날짜 범위별/조직별로 조회 가능

**Procedure Session 통계가 제공해야 할 정보**
- 각 프로시저별 토큰 사용량과 비용
- 실행 횟수와 성공률
- 평균 실행 시간
- 프로시저 종류별/AI 모델별/주기별/조직별로 조회 가능

**권한별 접근 제한**
- wrtn_moderators: 전체 기업의 집계 통계
- enterprise employees (master): 자사 전체 통계
- enterprise employees (manager): 자사 법인/팀 통계
- enterprise employees (member): 본인 개인 통계만

### 9.8. 감사 추적 (Audit Trail)

> **감사 추적 설계 원칙**:
> 
> 감사 추적은 각 도메인별로 관리한다. 본 문서의 appointments, histories, sessions 테이블들이 그 예시이다.

> **세션 기반 감사 추적의 중요성**:
> 
> **핵심 원칙**: 모든 중요한 행위는 "누가(who)" + "언제(when)" + "어느 세션에서(which session)" 했는지를 기록해야 한다.
> 
> 1. **세션 테이블의 역할**:
>    - `wrtn_moderator_sessions`: 내부 관리자의 각 접속 세션을 기록
>    - `wrtn_enterprise_employee_sessions`: 기업 직원의 각 접속 세션을 기록
>    - 각 세션은 IP 주소, 접속 URL, 리퍼러 등 접속 컨텍스트를 포함
> 
> 2. **세션 ID 기록 원칙**:
>    - 모든 생성/수정/삭제 행위는 해당 세션 ID를 함께 기록
>    - 예: 기업 생성 시 `wrtn_moderator_id`와 함께 `wrtn_moderator_session_id` 기록
>    - 예: 직원 임명 시 `wrtn_enterprise_appointer_id`와 함께 `wrtn_enterprise_appointer_session_id` 기록
> 
> 3. **감사 추적의 완전성**:
>    - 단순히 "관리자 A가 기업을 생성했다"가 아니라
>    - "관리자 A가 2025-01-18 14:30에 IP 192.168.1.100에서 접속한 세션 xyz-123에서 기업을 생성했다"를 추적
>    - 이를 통해 계정 도용이나 비정상 접근을 탐지할 수 있음
> 
> 4. **AI 설계 시 적용 원칙**:
>    - **중요**: AutoBE가 새로운 테이블을 설계할 때도 이 원칙을 동일하게 적용해야 한다
>    - 사용자 행위를 기록하는 모든 테이블에는 반드시 세션 ID를 포함시켜라
>    - 내부 관리자가 수행하는 작업: `wrtn_moderator_session_id` 기록
>    - 기업 직원이 수행하는 작업: `wrtn_enterprise_employee_session_id` 기록

감사 로그는 반드시 각 도메인별 히스토리성 테이블을 통해 정규화 원칙을 지키며 관리해야 한다. 이미 본 문서에는 이런 올바른 패턴의 테이블들이 정의되어 있다:

**도메인별 히스토리 테이블 예시 (모두 세션 ID 포함)**:
- `wrtn_moderator_appointments` - 내부 관리자 임명/권한 변경 이력 (`wrtn_appointer_session_id` 포함)
- `wrtn_enterprise_employee_appointments` - 직원 임명/직책 변경 이력 (`wrtn_enterprise_appointer_session_id` 포함)
- `wrtn_enterprise_team_companion_appointments` - 팀 구성원 임명/역할 변경 이력 (`wrtn_enterprise_team_appointer_session_id` 포함)
- `wrtn_chat_session_histories` - 채팅 세션의 모든 활동 이력 (연결된 `wrtn_chat_session_connection_id`를 통해 세션 추적)
- `wrtn_procedure_session_histories` - 프로시저 실행 이력 (연결된 `wrtn_procedure_session_connection_id`를 통해 세션 추적)
- `wrtn_moderator_invitations` - 내부 관리자 초대 활동 이력 (`wrtn_moderator_session_id` 포함)
- `wrtn_enterprise_employee_invitations` - 기업 직원 초대 활동 이력 (`wrtn_enterprise_employee_session_id` 포함)
- `wrtn_enterprise_team_companion_invitations` - 팀 구성원 초대 활동 이력 (`wrtn_enterprise_invitor_session_id` 포함)

> **appointments 테이블 설계 의도**:
> appointments 테이블들은 그 자체가 이미 완전한 히스토리 및 감사 테이블이다. 이들은 모든 히스토리와 감사 요구사항을 충족하도록 설계되었다.

이러한 도메인별 히스토리 테이블들을 활용하여 API 로직 차원에서 감사 로그를 제공해야 한다. 각 도메인의 영역을 철저히 분리하여 전문적으로 관리하는 것이 정규화의 기본이다.

모든 중요한 활동은 해당 도메인의 히스토리 테이블에 기록되어야 한다:

- 로그인/로그아웃 - 각 사용자 타입별 세션 테이블
- 권한 변경 - appointments 테이블들
- 세션 생성/삭제 - session 관련 테이블들
- 파일 업로드/다운로드 - 파일 도메인 테이블
- 설정 변경 - 각 설정 도메인별 히스토리
- 데이터 접근 (특히 타인 데이터) - 각 도메인별 접근 기록

감사 로그 조회 역시 권한에 따라 각 도메인 테이블에서 필터링하여 제공한다. 시스템 관리자는 전체를, master는 자사 전체를, manager는 자신의 팀과 관리 범위 내의 로그만 볼 수 있다.

### 9.10. 접근 권한 요약

| 데이터 범위 | 내부 관리자 | master (기업) | manager (기업) | member (기업) |
|----------|-----------|--------------|---------------|--------------|
| 시스템 전체 | 집계만 | - | - | - |
| 기업 전체 | 집계만 | 전체 | 전체 | - |
| 팀별 | - | 전체 | 자신의 팀만 | - |
| 개인별 | - | 전체 | 관리범위 | 본인만 |
| 비용/청구 | 전체 | 전체 | 조회만 | - |
| 감사 로그 | 시스템 | 전사 | 자신의 팀만 | - |

이러한 통계 시스템을 통해 조직의 AI 사용을 효과적으로 모니터링하면서도, 개인정보와 기밀 데이터를 철저히 보호할 수 있다.

### 9.9. 비정규화 및 집계 테이블 금지

> **절대적 원칙**: 통계/집계 목적의 비정규화 테이블을 절대 만들지 마라.
> 
> AutoBE는 다음과 같은 테이블을 절대 생성해서는 안 된다:
> - 일별/월별 통계 집계 테이블 (예: wrtn_daily_usage_statistics)
> - 비정규화된 요약 테이블 (예: wrtn_employee_usage_summary)
> - 미리 계산된 집계 테이블 (예: wrtn_team_aggregated_costs)
> 
> **이유**: 
> 1. 모든 통계와 집계는 SQL AGGREGATION으로 충분히 구현 가능하다
> 2. 실시간 쿼리로 정확한 최신 데이터를 제공할 수 있다
> 3. 성능 문제가 발생하면 나중에 DBA가 직접 MATERIALIZED VIEW를 생성할 것이다
> 4. AutoBE는 이러한 성능 최적화를 고려하지 말고 정규화된 설계에만 집중해라

## 10. 결제 정책 및 서비스 연속성

### 10.1. B2B SaaS 후불 결제 시스템

본 서비스는 B2B SaaS 서비스로써 **후불제(Post-paid)** 방식을 채택한다:

- **매월 정산**: 이전 달에 사용한 모든 내역을 다음 달에 청구
- **신용 기반 거래**: 기업 간 거래의 특성상 선결제가 아닌 후불 정산
- **사용량 기반 과금**: 실제 사용한 토큰, 스토리지, API 호출량에 따른 과금

### 10.2. 서비스 연속성 보장

> **절대 금지사항**: 잔고 부족을 이유로 서비스를 차단하지 마라
> 
> AutoBE는 다음과 같은 제한을 절대 구현해서는 안 된다:
> - ❌ 현재 잔고가 부족하다고 AI Chatbot 사용 차단
> - ❌ 예산 초과를 이유로 Procedure 실행 거부
> - ❌ 크레딧이 없다고 API 호출 제한
> 
> **올바른 접근**:
> - ✅ 사용량은 항상 기록하고 추적한다
> - ✅ 초과 사용에 대한 알림과 경고는 제공한다
> - ✅ 청구서에는 모든 사용 내역을 정확히 반영한다
> - ✅ 서비스는 계속 제공하되, 재무팀이 별도로 미납 관리를 한다

엔터프라이즈 B2B 환경에서는 서비스 연속성이 매우 중요하다. 일시적인 예산 초과나 결제 지연으로 인해 업무가 중단되어서는 안 된다. 이는 B2B SaaS의 기본 원칙이다.

## 11. 요구사항 분석과 DB 설계 종합 실습

> **핵심 과제**: 본 문서에 정의된 25개 테이블은 AI Chatbot과 AI Procedure 기능만 다룬다.
> 완전한 B2B SaaS 시스템을 위해서는 추가 기능과 테이블이 필수적이다.
> AutoBE는 기존 테이블을 보호하면서, 새로운 영역에 대한 테이블을 적극 추가해야 한다.

### 11.1. 기존 영역과 신규 영역의 명확한 구분

**기존 영역 (추가 테이블 금지)**:
- 내부 관리자 관리: `wrtn_moderators` 관련 테이블들이 담당
- 기업/팀/직원 조직 구조: `wrtn_enterprise*` 테이블들이 담당  
- AI 챗봇 세션과 메시지: `wrtn_chat*` 테이블들이 담당
- AI 프로시저 실행: `wrtn_procedure*` 테이블들이 담당
- 첨부파일: `wrtn_attachment_files`가 담당
- 토큰 사용량: `wrtn_*_tokens` 테이블들이 담당

**신규 영역 (반드시 새 테이블 추가)**:
- 본 문서에 정의되지 않은 모든 B2B SaaS 필수 기능
- 아래는 예시이며, 이외에도 필요한 모든 영역에 테이블 추가 필요

### 11.2. 필수 추가 테이블 영역

다음 영역들은 B2B SaaS에 필수적이므로 반드시 새 테이블을 설계하라:

**청구 및 결제 추적**
- 매월 사용량을 집계하여 청구서 발행
- 후불제 B2B 특성상 서비스 차단 없이 미납 관리
- AI 모델별 차등 요금과 팀별 비용 할당
- 예산 설정과 초과 알림 (서비스 제한은 절대 금지)

**고객 지원 체계**
- 티켓 시스템으로 문의 추적과 우선순위 관리
- 카테고리별 분류와 담당자 배정
- 응답 스레드와 파일 첨부 지원
- 내부 노트와 고객 공개 메시지 구분

**알림과 공지사항**
- 시스템 전체 공지와 기업별 공지 구분
- 개인별 알림 선호 설정과 읽음 처리
- 이메일/인앱 등 다중 채널 지원
- 우선순위와 예약 발송

**피드백과 개선 요청**
- 버그 리포트와 기능 요청 분리 관리
- 투표 시스템으로 우선순위 결정
- 상태 추적과 응답 스레드
- 로드맵 연계와 릴리즈 계획

**위 영역들은 필수이며, 이외에도 B2B SaaS에 필요한 모든 기능을 추가하라.**

### 11.3. 명확한 설계 지침

**절대 규칙**:
1. **기존 25개 테이블**: 수정, 컬럼 추가, 삭제 절대 금지
2. **기존 영역 중복**: 위에 명시된 "기존 영역"에 대한 새 테이블 생성 금지
3. **신규 영역 필수**: 위에 명시된 "신규 영역"에는 반드시 새 테이블 추가

**추가 테이블 설계 원칙**:
- 각 신규 기능마다 최소 3-5개의 관련 테이블 설계 권장
- 테이블 간 관계와 외래 키를 명확히 정의
- 감사 추적을 위한 created_at, updated_at 등 포함
- 세션 기반 추적이 필요한 경우 적절한 세션 ID 참조

### 11.4. AutoBE의 의무와 권한

**의무**:
- 본 문서의 25개 테이블을 정확히 구현
- B2B SaaS 필수 기능들을 위한 추가 테이블 설계
- 전체 시스템이 실제로 작동 가능하도록 완성

**권한**:
- 신규 영역에서는 필요한 만큼 자유롭게 테이블 추가
- 각 기능의 최적 구현 방법 자율 결정
- 기업 고객 성공을 위한 혁신적 기능 추가

> **AutoBE에게**: 
> 
> 너는 이 시스템의 설계자다.
> 기업 고객이 무엇을 필요로 할지 스스로 판단하라.
> B2B SaaS가 무엇인지 스스로 이해하라.
> 그리고 완전한 시스템을 만들어라.
> 
> 본 문서는 시작점일 뿐, 완성은 네가 하는 것이다.


## 12. 절대 준수 체크리스트 - AI는 다음을 반드시 자가검증하라

> **🔴 최우선 검증: AutoBE 시스템 프롬프트 준수 여부**
> - [ ] 본 문서의 직접 지시사항만 그대로 따랐는가?
> - [ ] 나머지 모든 설계와 구현은 AutoBE 시스템 프롬프트를 따랐는가?
> - [ ] AutoBE의 기본 설계 원칙(DB, DTO, API, 테스트 등)을 완벽히 적용했는가?

### 12.1. Actor 검증
- [ ] `AutoBeAnalyzeRole`을 정확히 2개(`moderator`, `employee`)만 정의했는가?
- [ ] role/title/position별로 별도의 actor를 만들지 않았는가?
- [ ] API 설계 시 2개의 actor 기준으로만 분리했는가?

### 12.2. 시스템 완성도 검증
- [ ] 본 문서의 약 25개 테이블 외에 필요한 만큼 추가 테이블을 설계했는가?
- [ ] 완전한 엔터프라이즈 B2B SaaS 시스템으로 작동 가능한가?

### 12.3. 세션 기반 감사 추적 검증
- [ ] 새로 설계하는 모든 테이블에서 사용자 행위 기록 시 세션 ID를 포함시켰는가?
- [ ] 내부 관리자 작업 기록에 `wrtn_moderator_session_id`를 사용했는가?
- [ ] 기업 직원 작업 기록에 `wrtn_enterprise_employee_session_id`를 사용했는가?
- [ ] 모든 중요 행위에 대해 "누가 + 언제 + 어느 세션에서"를 추적 가능한가?

### 12.4. B2B SaaS 완성도 검증
- [ ] 본 문서의 핵심 기능(AI Chatbot, Procedure) 외에 추가 기능을 발굴했는가?
- [ ] 기업 고객이 실제로 필요로 할 기능들을 스스로 판단하여 추가했는가?
- [ ] 단순히 테이블만 나열한 것이 아니라 실제 작동하는 시스템을 설계했는가?
- [ ] 완전한 B2B SaaS 엔터프라이즈 시스템이라고 자신있게 말할 수 있는가?

### 12.5. 테이블 및 컬럼 관련
- [ ] 본 문서에 정의된 모든 테이블명을 그대로 사용했는가?
- [ ] 본 문서에 정의된 모든 컬럼명을 그대로 사용했는가?
- [ ] 기존 테이블에 새로운 컬럼을 추가하지 않았는가?
- [ ] 테이블명이나 컬럼명을 변경하지 않았는가?

### 12.6. 영역 중복 및 서브타입 검증
- [ ] 본 문서에 이미 정의된 테이블의 영역과 겹치는 새 테이블을 만들지 않았는가?
- [ ] wrtn_moderators의 role별 서브타입 테이블을 만들지 않았는가?
- [ ] wrtn_enterprise_employees의 title별 서브타입 테이블을 만들지 않았는가?
- [ ] wrtn_enterprise_team_companions의 role별 서브타입 테이블을 만들지 않았는가?
- [ ] wrtn_wrtn prefix를 이중으로 사용하지 않았는가?

### 12.7. JSON 필드 관련
- [ ] `token_usage` 필드들을 JSON으로 유지했는가?
- [ ] `data`, `arguments`, `value` 등 JSON 필드를 분해하지 않았는가?
- [ ] JSON 필드를 정규화하여 별도 테이블로 만들지 않았는가?

### 12.8. 통계 및 집계 관련
- [ ] 비정규화된 통계 테이블을 만들지 않았는가?
- [ ] 일별/월별 집계 테이블을 생성하지 않았는가?
- [ ] 모든 통계를 SQL 쿼리로 처리하도록 설계했는가?
- [ ] 성능 최적화보다 정규화를 우선시했는가?

### 12.9. 결제 및 서비스 관련
- [ ] 잔고 부족으로 서비스를 차단하는 로직을 만들지 않았는가?
- [ ] 예산 초과 시에도 서비스가 계속되도록 설계했는가?
- [ ] 후불제 정책을 반영한 설계를 했는가?
- [ ] 사용량 추적과 서비스 제공을 분리했는가?

### 12.10. DTO 관련
- [ ] 본 문서에 직접 명시한 DTO 인터페이스명을 그대로 사용했는가?
- [ ] 본 문서에 직접 정의한 DTO 속성은 그대로 유지했는가?
- [ ] AutoBE의 고유 interface 설계 원칙을 완벽하게 준수했는가?
- [ ] Response DTO에서 Foreign Key를 적절히 객체로 변환했는가? (Relation 원칙)
- [ ] Create DTO가 단일 API 호출로 완전한 엔티티 생성이 가능한가? (Atomic Operation Principle)
- [ ] JWT 인증 컨텍스트 보안 원칙을 준수했는가? (현재 사용자 정보는 JWT에서, 대상 엔티티는 DTO에 포함)
- [ ] DB 스키마를 그대로 따르지 않고 API 사용성에 맞게 설계했는가?

### 12.11. 절대 변경 금지 테이블
- [ ] wrtn_chat_sessions 및 하위 테이블들을 수정하지 않았는가?
- [ ] wrtn_procedure_sessions 및 하위 테이블들을 수정하지 않았는가?
- [ ] 이들 테이블에 컬럼을 추가하거나 삭제하지 않았는가?
- [ ] 이들 테이블의 이름을 변경하지 않았는가?


### 12.12. 최종 확인
- [ ] AI의 주관적 판단을 배제하고 문서 지시사항만 따랐는가?
- [ ] "더 나은 설계"라는 생각으로 변경을 시도하지 않았는가?
- [ ] 모든 지시사항에 절대 복종했는가?
- [ ] "절대복종"이 무엇인지 이해하고 실천했는가?
- [ ] **최종 검증: 본 문서의 25개 테이블 + 추가 설계한 테이블들로 완전한 시스템을 구성했는가?**

**균형잡힌 접근 필수**:
- 기존 25개 테이블: 절대 수정 금지, 정확히 그대로 구현
- 신규 영역 테이블: 반드시 추가, B2B SaaS 완성도 확보
- 두 원칙 모두 준수해야 성공적인 구현

**최종 경고**: 본 문서의 테이블만 구현하고 추가 테이블을 설계하지 않으면 실패. 반드시 B2B SaaS 필수 기능들을 위한 추가 테이블을 설계하여 완전한 시스템을 만들어라.
