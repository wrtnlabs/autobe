# 오류 히트맵 — 모델 × 시나리오 × 오류 클래스

## 범례

- `A` = 릴레이션 셀렉트 누락
- `B` = 스키마 불일치 / 유령 프로퍼티
- `C` = Null 안전성 위반
- `D` = 잘못된 Prisma 쿼리 API
- `E` = 사고과정-코드화 (LLM이 추론을 출력)
- `F` = 타입 불일치 (기타)
- `G` = 중복 / 네이밍 충돌

심각도: `.` = 0개 오류, `○` = 1-2개, `●` = 3-5개, `◉` = 6-10개, `◈` = 11개 이상

## 히트맵

```
모델                           | 시나리오 | A   B   C   D   E   F   G  | 합계
-------------------------------|----------|----------------------------|------
minimax/minimax-m2.7           | reddit   | ●   ○   ●   .   .   ○   . |  8
minimax/minimax-m2.7           | shopping | ◈   ●   ◉   ○   .   .   ○ | 11
minimax/minimax-m2.7           | erp      | ●   ○   .   ○   .   ○   . |  7
moonshotai/kimi-k2.5           | reddit   | ○   .   .   .   .   .   . |  1
moonshotai/kimi-k2.5           | shopping | .   ○   .   .   .   .   . |  1
openai/gpt-5.4-mini            | shopping | .   ○   ○   .   .   ○   . |  4
openai/gpt-5.4-mini            | erp      | ●   .   ○   ○   .   ○   . |  6
openai/gpt-5.4-nano            | shopping | .   .   .   ○   .   .   . |  1
openai/gpt-5.4-nano            | erp      | ○   .   .   .   .   .   . |  1
qwen/qwen3-coder-next          | reddit   | ○   .   .   .   .   .   ○ |  2
qwen/qwen3-coder-next          | shopping | ●   ○   ○   ○   .   .   . |  7
qwen/qwen3-coder-next          | erp      | ○   .   .   .   ○   .   . |  3
qwen/qwen3.5-122b-a10b         | erp      | .   .   .   .   ●   ○   . |  5
qwen/qwen3.5-27b               | shopping | ○   .   .   .   .   .   . |  1
qwen/qwen3.5-27b               | erp      | ○   .   .   .   .   .   . |  1
qwen/qwen3.5-35b-a3b           | reddit   | ●   ○   .   .   .   .   . |  4
qwen/qwen3.5-35b-a3b           | shopping | ●   ○   ○   ○   .   .   . |  5
qwen/qwen3.5-35b-a3b           | erp      | ○   .   .   .   ○   .   . |  3
qwen/qwen3.5-397b-a17b         | reddit   | ○   .   .   .   .   .   . |  2
qwen/qwen3.5-397b-a17b         | shopping | ○   ○   .   .   .   .   . |  2
qwen/qwen3.5-397b-a17b         | erp      | ○   .   .   .   .   .   . |  1
```

## 패턴 분석

### 시나리오 복잡도별

| 시나리오 | 평균 오류 | 지배적 오류 클래스 | 비고 |
|---------|---------|------------------|------|
| reddit   | 3.6     | A (릴레이션 누락) | 복잡: 게시물, 댓글, 투표, 커뮤니티, 구독 |
| shopping | 4.3     | A + C (릴레이션 + null) | 가장 복잡: 상품, 변형, 주문, 배송, 취소 |
| erp      | 3.0     | A + E (릴레이션 + 사고과정) | 중간: 직원, 부서, 역할, 근태 관리 |

Shopping의 오류율이 가장 높은 이유:
1. 깊은 엔티티 계층 (주문 → 항목 → 상품 → 변형 → 옵션값)
2. 많은 nullable 릴레이션 (seller.profile, customer.profile)
3. API DTO에 더 많은 계산 필드

### 오류 클래스 빈도별

```
Class A (릴레이션 누락):    ████████████████████████████████████████████████████ 55%
Class B (스키마 불일치):    ██████████████████████ 20%
Class C (Null 안전성):     ████████████ 12%
Class D (잘못된 Prisma API): █████ 5%
Class E (사고과정-코드화):  ███ 3%
Class F (타입 불일치):      ███ 3%
Class G (중복):            ██ 2%
```

### 모델별 실패 시그니처

각 모델은 특징적인 실패 패턴을 가짐:

| 모델 | 시그니처 패턴 |
|------|-------------|
| minimax-m2.7 | A + C (셀렉트 잊음, null 체인 미처리) |
| kimi-k2.5 | 거의 완벽 (재귀 자기참조 엣지 케이스만) |
| gpt-5.4-mini | A + F (셀렉트 잊음, DTO 타입과 DB 타입 혼동) |
| gpt-5.4-nano | 거의 완벽 (경미한 API 오용) |
| qwen3-coder-next | A + D (셀렉트 잊음, 잘못된 API 패턴) |
| qwen3.5-122b | E (사고과정-코드화 지배적) |
| qwen3.5-27b | 거의 완벽 (경미한 릴레이션 누락) |
| qwen3.5-35b-a3b | A + B (셀렉트 잊음, 스키마 네이밍 혼동) |
| qwen3.5-397b-a17b | 거의 완벽 (재귀 깊이 이슈만) |
