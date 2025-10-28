`test/scripts/chat.md` 에 몇 가지 내용을 더 추가하려고 한다. 다만 내가 이야기 한 그대로 쓰지 말고, 내가 한 이야기들을 너가 재분류하여 `test/scripts/chat.md` 에 가장 자연스러운 흐름이 되도록 각각 적절한 위치에 추가하거나 중간 단원을 신설하거나 해 줘. 그리고 이렇게 수정한 문서는 세상 아름다운 흐름을 가지며, 또한 세계 최고 품질의 시나리오 프롬프트가 되어야 해.

## Actor 추가 기능
### 회원 가입 절차에 관하여
본 시스템에서는 `wrtn_moderators` 와 `wrtn_enterprise_employees` 모두 자체적으로 회원 가입을 신청하여 계정을 생성한 후, 높은 권한을 가진 다른 유저의 승인을 득하여 정식 회원이 되는 방법이 있다. 그리고 초대장을 받아서 그 즉시 회원 가입과 동시에 정식 회원이 되는 방법도 있다.

여기서 초대장을 받아 회원 가입을 한 유저는 이메일 인증이 필요없다. 왜냐하면 이메일을 통하여 초대장을 받아 가입을 진행하였기 때문이다. 그러나 자체적으로 회원 가입을 신청하여 계정을 생성한 유저는 이메일 인증을 반드시 거쳐야 한다. 이메일 인증이 완료되지 않으면, 해당 유저는 회원 가입을 진행할 수 없다.

따라서 회원 가입 API 는, 초대장의 유무에 따라 그 동작을 달리해야하며, 자체 가입하는 회원의 경우에는 이메일 인증 내역 레코드를 회원 가입 DTO 에 포함시켜 전달해야만 하는 구조이어야 한다.

이외에 `wrtn_enterprise_employees` 가 자체 회원 가입한 경우, `wrtn_enterprise_employees.title` 이 `master` 나 `manager` 인 employee 가 이를 승인해주는게 일반적이다. 그러나 본 시스템에서는 `wrtn_moderators` 도 엔터프라이즈의 최초 가입 직원에 한하여 (이 경우 `title` 은 반드시 `master`), 이를 승인해줄 수 있다.

따라서 이 최초 가입한 직원에 대한 승인 처리를 위한, moderator 용 API 들을 만들어야 할 것이다.

### 비밀번호 관리 기능
첫째로, 모든 유저는 `wrtn_moderators` 와 `wrtn_enterprise_employees` 불문 비밀번호 변경이 가능해야한다. 그러나 이 중에는 비밀번호를 잊어버린 유저도 있을 수 있다. 따라서 비밀번호를 잊어버린 유저가 이를 찾을 수 있는 기능도 반드시 구현되어야 한다. 

이 기능은, 비밀번호를 알려주는 방식이 아니라, 리셋하고 새 비밀번호를 해당 유저의 이메일로 보내주는 방식이어야 한다. 유저는 새 비밀번호로 로그인한 후, 비밀번호 변경 기능을 이용하여 새로이 설정할 수 있어야 한다.

### 이메일 변경
회원의 이메일 변경 시에도 이메일 인증을 필수적으로 거치게 해야함.

### 약관 관리
회원 가입시 약관 동의 절차가 필요하며, 각 약관은 버전 관리가 되어야한다.

그리고 약관 개정시, 기존 회원들에게도 개정된 약관에 대한 동의 절차를 거치게 할 수도 있다.

각각 `wrtn_moderator_terms` 와 `wrtn_enterprise_employee_terms` 테이블을 만들어 이들과 맵핑을 시키게 하여라. 물론, 맵핑 대상은 `wrtn_membership_terms` 가 아닌 `wrtn_membership_term_snapshots` 가 되어 어느 버전의 약관에 동의했는지 기록할 수 있게 해야 한다.

```prisma
model wrtn_membership_terms {
  id String @id @uuid
  code String // identifier code like "privacy-policy"
  title String // human friendly title like "Privacy Policy"
  created_at DateTime
  updated_at DateTime
  deleted_at DateTime?

  @@unique([code])
}
model wrtn_membership_term_snapshots {
  id String @id @uuid
  wrtn_membership_term_id String @uuid
  version String // version like "1.0.0", "2.1.3"
  url String // URL to the full text of the terms
  created_at DateTime
}
```

## Moderator 용 관리 테이블
### `wrtn_persona_avatars`
`wrtn_enterprise_employee_personas` 를 보면 avatar_image_url 과 avatar_name 을 설정할 수 있다. 그리고 이들 avatar image 와 name 리스트를 제공해주는 API 와 테이블이 필요한데, 이 중 테이블이 바로 `wrtn_persona_avatars` 다.

단, `wrtn_enterprise_employee_personas` 에서 `avatar_image_url` 과 `avatar_name` 를 없애고 이를 `wrtn_enterprise_employee_personas.wrtn_persona_avatar_id` 로 대체하는 일은 하지 말아라. 실제로 아바타 이미지는 유저가 자신이 원하는 것으로 임의 대체 가능하고, 아바타 이름도 자기 마음대로 지을 수 있다.

즉, `wrtn_persona_avatars` 는 일종의 템플릿 역할만 하는 테이블이니, `wrtn_enterprise_employee_personas` 에서는 여전히 `avatar_image_url` 과 `avatar_name` 을 그대로 유지해야 한다.

대신, `wrtn_moderators` 가 `wrtn_persona_avatars` 에 새로운 아바타 이미지를 추가하거나, 기존 이미지를 삭제 또는 수정할 수 있는 API 를 제공해야 한다.

```prisma
model wrtn_persona_avatars {
  id String @id @uuid
  wrtn_moderator_id String @uuid // 생성한 모더레이터
  wrtn_moderator_session_id String @uuid // for audit tracing
  image_url String // 아바타 이미지
  name String // 아바타 이름
  created_at DateTime
  updated_at DateTime
  deleted_at DateTime?

  @@index([wrtn_moderator_id])
  @@index([wrtn_moderator_session_id])
  @@unique([name])
}
```

### `wrtn_persona_tones`
`wrtn_enterprise_employee_personas` 에는 `tone` 과 `prompt` 라는 컬럼이 있다. 이는 챗봇의 톤 앤 매너를 지정하고 이에 대한 시스템 프롬프트를 정의하는 역할을 하는데, 이 역시 미리 정의된 톤 앤 매너와 시스템 프롬프트 리스트를 제공해주는 API 와 테이블이 필요하다. 이 테이블이 바로 `wrtn_persona_tones` 다.

거듭 반복컨데, 이 테이블은 템플릿 컨텐츠 저장용이니, 절대로 `wrtn_enterprise_employee_personas.tone` 컬럼을 `wrtn_persona_tones` 테이블의 FK 로 바꾸지 말아라. 유저는 템플릿을 다만 참고하기만 할 뿐, 자기 마음대로 톤 앤 매너를 지정할 수 있어야 한다.

```prisma
model wrtn_persona_tones {
  id String @id @uuid
  wrtn_moderator_id String @uuid // 생성한 모더레이터
  wrtn_moderator_session_id String @uuid // for audit tracing
  name String
  prompt String
  example String
  created_at DateTime
  updated_at DateTime
  deleted_at DateTime?

  @@index([wrtn_moderator_id])
  @@index([wrtn_moderator_session_id])
  @@unique([name])
}
```

## Enterprise 용 관리 테이블
### LLM 한도 관리
Enterprise 는 master 혹은 manager 직책을 가진 (`wrtn_enterprise_employees.title`) 직원이 각 팀 및 개인별로 LLM 총비용 한도를 설정할 수 있다. 월 단위의 한도이며, 토큰 소모량이 아닌 비용 (달러) 기준으로 설정한다.

따라서 만들어야 할 테이블은 `wrtn_enterprise_team_quotas`  와 `wrtn_enterprise_employee_quotas` 이다. 재량껏 잘 만들어보도록.

## API Operation, 최대한 발굴하여 설계하기
API operation 은 가능한 한 최대한 많이 그리고 공격적으로 발굴하여 설계한다. 단순히 CRUD 수준에서 그치지 말고, 실무에서 필요할 만한 모든 operation 들을 빠짐없이 설계하여라.

그리고 enterprise 가 주로 사용하는 엔티티일지라도, 그것을 moderator 가 관리하고 열람해야 할 필요성이 있는지 적극 검토하여, 일말의 여지라도 있다면 그 또한 만들어라.

즉, 최대한 공격적으로 API operation 들을 발굴하여 설계할 것. 지나치게 API 가 많은 것을 걱정하지 말아라. 어차피 프론트엔드/클라이언트 개발자가 리뷰하고 필요없으면 안 쓸 것이다. API 를 너무 많이 설계하는 것을 걱정할 게 아니라, 너무 적게 설계하여 요구사항을 충족시키지 못하는 것을 걱정하고 수치스러워해야한다.

-----------------

지금 내용들을 잘 정리하여 `test/scripts/chat.md` 에 최대한 자연스러운 흐름이자 최고 품질의 시나리오 프롬프트가 되도록 개정해 줘.