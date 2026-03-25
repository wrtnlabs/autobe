# `qwen/qwen3.5-122b-a10b` - `erp` 시나리오 컴파일 에러 진단 보고서

- **모델**: `qwen/qwen3.5-122b-a10b` (provider: qwen)
- **시나리오**: ERP (HRM Platform)
- **단계**: Realize (코드 생성)
- **컴파일 에러 파일 수**: 4개
- **개별 에러 수**: 수백 개 (대부분 동일 패턴의 연쇄 에러)

## 결과 위치

```bash
code D:/github/wrtnlabs/autobe/test/results/qwen/qwen3.5-122b-a10b/erp/realize
```

---

## 에러 파일 1: `src/providers/getHrmPlatformMemberDashboardPersonal.ts`

### 컴파일 에러 메시지 (요약)

총 8건의 에러가 발생하며, 크게 3가지 패턴으로 분류된다:

**패턴 A** - `undefined`와 `null` 타입 불일치 (4건):
```
Type 'ISummary | undefined' is not assignable to type 'ISummary | null'.
  Type 'undefined' is not assignable to type 'ISummary | null'.
```

**패턴 B** - `department` 속성의 `null` vs `undefined` 불일치 (2건):
```
Type '{ ... department: { ... } | null; } | null' is not assignable to type '{ ... department?: { ... } | undefined; } | null | undefined'.
  Type 'null' is not assignable to type '... | undefined'.
```

**패턴 C** - `ISummary` 반환 타입에서 `Promise<ISummary>` 기대 불일치 (2건):
```
Type 'ISummary' is missing the following properties from type 'Promise<ISummary>': then, catch, finally, [Symbol.toStringTag]
```

### DB 스키마 (관련 부분)

```prisma
// hrm_platform_departments
model hrm_platform_departments {
  id                     String    @id @db.Uuid
  parent_department_id   String?   @db.Uuid
  name                   String
  description            String?
  created_at             DateTime  @db.Timestamptz
  updated_at             DateTime  @db.Timestamptz
  deleted_at             DateTime? @db.Timestamptz

  parent hrm_platform_departments? @relation("recursive", fields: [parent_department_id], references: [id])
}

// hrm_platform_timers
model hrm_platform_timers {
  id          String    @id @db.Uuid
  employee_id String    @db.Uuid
  project_id  String    @db.Uuid
  task_id     String?   @db.Uuid
  started_at  DateTime  @db.Timestamptz
  stopped_at  DateTime? @db.Timestamptz
  description String?
  created_at  DateTime  @db.Timestamptz

  employee hrm_platform_employees @relation(fields: [employee_id], references: [id])
  project  hrm_platform_projects  @relation(fields: [project_id], references: [id])
  task     hrm_platform_tasks?    @relation(fields: [task_id], references: [id])
}
```

### API DTO 스펙 (관련 부분)

```typescript
// IHrmPlatformEmployee.ISummary
export type ISummary = {
  id: string & tags.Format<"uuid">;
  position: string | null;           // null 허용
  employment_type: string;
  status: string;
  user: IHrmPlatformMember.ISummary;
  role: IHrmPlatformRole.ISummary;
  department: IHrmPlatformDepartment.ISummary | null;  // null 허용 (undefined 아님!)
  created_at: string & tags.Format<"date-time">;
};

// IHrmPlatformTimer.ISummary
export type ISummary = {
  id: string & tags.Format<"uuid">;
  employee: IHrmPlatformEmployee.ISummary;
  project: IHrmPlatformProject.ISummary;
  task?: IHrmPlatformTask.ISummary | null | undefined;
  started_at: string & tags.Format<"date-time">;
  stopped_at?: (string & tags.Format<"date-time">) | null | undefined;
  description?: string | null | undefined;
  duration_minutes: number & tags.Type<"int32">;
  created_at: string & tags.Format<"date-time">;
};
```

### 문제의 코드

**문제 1**: `transformEmployee` 함수에서 `department`를 `undefined`로 반환 (572행):
```typescript
const transformEmployee = (e: { ... }): IHrmPlatformEmployee.ISummary =>
  ({
    // ...
    department: e.department ? transformDepartment(e.department) : undefined,
    //                                                             ^^^^^^^^^ 여기!
  }) satisfies IHrmPlatformEmployee.ISummary;
```

**문제 2**: `activeTimer` 객체의 `department`를 `undefined`로 설정 (888행):
```typescript
department: undefined,  // IHrmPlatformDepartment.ISummary | null 이어야 함
```

**문제 3**: `transformTimelog` 함수의 반환을 `ArrayUtil.asyncMap`에 전달할 때 (916행):
```typescript
const recentTimelogs: IHrmPlatformTimelog.ISummary[] =
  await ArrayUtil.asyncMap(recentTimelogsRecords, (tl) =>
    transformTimelog(tl),  // 동기 함수인데 asyncMap은 Promise를 기대
  );
```

**문제 4**: Prisma `select`에서 `department`에 `parent` 관계를 포함하지 않아서, 반환된 `department` 결과의 타입이 `{ ... } | null` (Prisma의 optional relation = null)인데, `transformEmployee`의 파라미터 타입에서 `department?` (optional = `undefined`)로 선언하여 타입 불일치 발생.

### 오류 원인 분석

1. **`null` vs `undefined` 혼동**: `IHrmPlatformEmployee.ISummary.department`는 `IHrmPlatformDepartment.ISummary | null`로 정의되어 있으나, 코드에서 `undefined`를 반환한다. TypeScript에서 `null`과 `undefined`는 엄격하게 구분된다.

2. **동기/비동기 혼동**: `transformTimelog`은 동기 함수(`ISummary`를 반환)이지만 `ArrayUtil.asyncMap`은 콜백에서 `Promise`를 반환할 것을 기대한다. `transformTimelog(tl)`의 반환 타입이 `ISummary`인데, `asyncMap`이 `Promise<ISummary>`로 래핑하지 않으면 타입 에러가 발생한다.

3. **Prisma select 결과와 transformer 파라미터 간 타입 불일치**: Prisma가 `department`를 `null`로 반환하지만, transformer 함수의 파라미터에서 `department?: ... | null`(optional)로 선언되면서, Prisma 결과의 `{ department: { ... } | null }`이 transformer 기대 타입 `{ department?: { ... } | undefined }`와 불일치.

### 올바른 코드

**수정 1**: `undefined` 대신 `null` 반환:
```typescript
department: e.department ? transformDepartment(e.department) : null,
```

**수정 2**: `activeTimer` 객체의 `department` 수정:
```typescript
department: null,  // undefined가 아닌 null
```

**수정 3**: `asyncMap` 대신 일반 `map` 사용, 또는 `async` 래핑:
```typescript
// 방법 1: 동기 map 사용
const recentTimelogs: IHrmPlatformTimelog.ISummary[] =
  recentTimelogsRecords.map((tl) => transformTimelog(tl));

// 방법 2: async 래핑 유지
const recentTimelogs = await ArrayUtil.asyncMap(
  recentTimelogsRecords,
  async (tl) => transformTimelog(tl),
);
```

### 권고 조치사항

- DTO에서 `| null`로 정의된 속성에는 반드시 `null`을 반환해야 하며, `undefined`를 사용하면 안 된다.
- Prisma optional relation은 `null`을 반환하므로, transformer 파라미터 타입에서 `?` (optional) 대신 `| null`을 명시해야 한다.
- `ArrayUtil.asyncMap`은 비동기 전용이므로, 동기 transformer에는 일반 `Array.map()`을 사용해야 한다.

---

## 에러 파일 2: `src/providers/patchHrmPlatformMemberProjectsProjectIdTasks.ts`

### 컴파일 에러 메시지 (요약)

총 약 100건 이상의 에러가 발생하며, 3가지 반복 패턴으로 분류된다:

**패턴 A** - `parent_department`가 `hrm_platform_departmentsSelect`에 존재하지 않음 (2건):
```
Object literal may only specify known properties, but 'parent_department' does not exist
in type 'hrm_platform_departmentsSelect<DefaultArgs>'.
Did you mean to write 'parent_department_id'?
```

**패턴 B** - `project`, `assignedEmployee`, `parent` 속성이 Prisma 결과에 존재하지 않음 (약 100건):
```
Property 'project' does not exist on type '{ id: string; description: string | null; ... }'.
Property 'assignedEmployee' does not exist on type '{ id: string; ... }'.
Property 'parent' does not exist on type '{ id: string; ... }'.
```

**패턴 C** - `ISummary[]` 반환 타입에서 `project.member_count`, `project.created_at` 등 누락 (1건):
```
Type '{ ... project: { ... organization: { ... }; }; ... }[]' is not assignable to type 'ISummary[]'.
  Types of property 'project' are incompatible.
    Type '{ ... }' is missing the following properties from type 'ISummary': member_count, created_at, updated_at
```

### DB 스키마 (관련 부분)

```prisma
model hrm_platform_departments {
  id                     String    @id @db.Uuid
  parent_department_id   String?   @db.Uuid
  name                   String
  description            String?
  created_at             DateTime  @db.Timestamptz
  updated_at             DateTime  @db.Timestamptz
  deleted_at             DateTime? @db.Timestamptz

  // 관계명이 "parent"임 (parent_department가 아님)
  parent hrm_platform_departments? @relation("recursive", fields: [parent_department_id], references: [id])
  childDepartments hrm_platform_departments[] @relation("recursive")
}

model hrm_platform_tasks {
  id                        String    @id @db.Uuid
  hrm_platform_projects_id  String    @db.Uuid
  hrm_platform_tasks_id     String?   @db.Uuid
  hrm_platform_employees_id String?   @db.Uuid
  title                     String
  // ...

  // 관계명
  project          hrm_platform_projects   @relation(fields: [hrm_platform_projects_id], references: [id])
  parent           hrm_platform_tasks?     @relation("recursive", fields: [hrm_platform_tasks_id], references: [id])
  assignedEmployee hrm_platform_employees? @relation(fields: [hrm_platform_employees_id], references: [id])
}
```

### 문제의 코드

**문제 1**: Prisma select 내에서 `parent_department` 사용 (157~166행):
```typescript
department: {
  select: {
    id: true,
    name: true,
    description: true,
    parent_department: {       // 잘못된 관계명! 스키마에서는 "parent"
      select: {
        id: true,
        name: true,
        // ...
      },
    },
    created_at: true,
    updated_at: true,
    deleted_at: true,
  },
},
```

**문제 2**: `satisfies Prisma.hrm_platform_tasksFindManyArgs`가 select 문 전체에 적용되어 있지 않아, Prisma가 relation 필드를 무시하고 스칼라 필드만 반환 타입으로 추론 (92~262행). 구체적으로 task의 `findMany` 결과에 `project`, `assignedEmployee`, `parent` 관계가 포함되지 않은 것으로 TypeScript가 추론한다.

이 문제의 근본 원인은 `hrm_platform_tasks` 테이블의 Prisma `select` 내에서 `project`, `assignedEmployee`, `parent`를 포함했지만, `department` select에서 `parent_department`(존재하지 않는 속성)를 사용하여 전체 select 타입이 무효화된 것이다. Prisma가 알 수 없는 속성을 만나면 해당 select 블록의 타입 추론이 실패하고, 연쇄적으로 상위 select의 관계 필드도 타입에서 제외된다.

**문제 3**: 변환 코드(268~470행)에서 `task.project`, `task.assignedEmployee`, `task.parent`를 참조하지만, TypeScript는 이 속성들이 존재하지 않는다고 판단한다. select에서 관계를 올바르게 포함했더라도, 위의 타입 추론 실패 문제로 인해 Prisma 반환 타입에 관계 필드가 포함되지 않았기 때문이다.

**문제 4**: `IHrmPlatformProject.ISummary`에 `member_count`, `created_at`, `updated_at` 필드가 필요하지만, 변환 코드에서 이들을 포함하지 않음 (278~297행):
```typescript
project: {
  id: task.project.id as string & tags.Format<"uuid">,
  name: task.project.name,
  color_code: task.project.color_code,
  status: task.project.status,
  budget_hours: task.project.budget_hours ?? null,
  start_date: task.project.start_date?.toISOString() ?? null,
  end_date: task.project.end_date?.toISOString() ?? null,
  organization: { ... },
  // member_count, created_at, updated_at 누락!
},
```

### 오류 원인 분석

1. **Prisma 관계명 오류**: `hrm_platform_departments` 스키마에서 부모 부서 관계는 `parent`로 정의되어 있는데, select 문에서 `parent_department`를 사용했다. 이로 인해 Prisma는 해당 속성을 인식하지 못한다.

2. **존재하지 않는 속성에 의한 연쇄 타입 추론 실패**: Prisma select에서 알 수 없는 속성(`parent_department`)을 사용하면, TypeScript가 해당 select 블록을 올바른 Prisma 타입으로 추론하지 못한다. 이 오류가 상위 블록으로 전파되어 `project`, `assignedEmployee`, `parent` 관계 필드가 결과 타입에서 제외되고, 변환 코드에서 이를 참조하는 모든 곳에서 "Property does not exist" 에러가 연쇄적으로 발생한다. 단 하나의 관계명 오류가 약 100건의 에러로 증폭된 것이다.

3. **DTO 필수 필드 누락**: `IHrmPlatformProject.ISummary`에 `member_count`, `created_at`, `updated_at`가 필수로 포함되어야 하지만, 변환 코드에서 이 필드들을 생략했다.

### 올바른 코드

**수정 1**: `parent_department` -> `parent` (Prisma 관계명에 맞춰):
```typescript
department: {
  select: {
    id: true,
    name: true,
    description: true,
    parent: {           // "parent_department"가 아닌 "parent"
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    },
    created_at: true,
    updated_at: true,
    deleted_at: true,
  },
},
```

**수정 2**: project 변환에 누락 필드 추가:
```typescript
project: {
  id: task.project.id as string & tags.Format<"uuid">,
  name: task.project.name,
  color_code: task.project.color_code,
  status: task.project.status,
  budget_hours: task.project.budget_hours ?? null,
  start_date: task.project.start_date?.toISOString() ?? null,
  end_date: task.project.end_date?.toISOString() ?? null,
  organization: { ... },
  member_count: 0,                                       // 추가
  created_at: task.project.created_at.toISOString(),     // 추가
  updated_at: task.project.updated_at.toISOString(),     // 추가
},
```

### 권고 조치사항

- Prisma select 내에서 관계를 참조할 때는 반드시 스키마에 정의된 관계명(relation property key)을 사용해야 한다. `parent_department_id`는 컬럼명이고, `parent`가 관계명이다.
- 하나의 잘못된 속성명이 Prisma 타입 추론 전체를 무효화시켜 수십~수백 건의 연쇄 에러를 유발할 수 있으므로, 관계명 정확성은 매우 중요하다.
- DTO의 필수 필드는 빠짐없이 변환 코드에서 매핑해야 한다. Prisma select에서 해당 컬럼을 포함하고, 변환 시 반드시 할당해야 한다.

---

## 에러 파일 3: `src/providers/patchHrmPlatformMemberTimers.ts`

### 컴파일 에러 메시지 (요약)

총 약 300건 이상의 에러가 발생한다. 이 파일은 **이 모델의 가장 치명적인 문제**를 보여준다.

**패턴 A** - `hrm_platform_role_permissions`가 `hrm_platform_rolesSelect`에 존재하지 않음 (약 8건):
```
Object literal may only specify known properties, and 'hrm_platform_role_permissions'
does not exist in type 'hrm_platform_rolesSelect<DefaultArgs>'.
```

**패턴 B** - `satisfies Prisma.XxxFindManyArgs` 남용으로 인한 관계 필드 미인식 (약 30건):
```
Property 'employee' does not exist on type '{ id: string; description: string | null;
  created_at: Date; ... stopped_at: Date | null; employee_id: string; project_id: string;
  task_id: string | null; }'.
```

**패턴 C** - **구문 파괴 (Syntax Corruption)** (약 200건 이상):
```
Cannot find name 'timer'.
Cannot find name 'satisfies'.
Cannot find name 'created_at'.
Cannot find name 'department'.
No value exists in scope for the shorthand property 'as'.
'string' only refers to a type, but is being used as a value here.
Property 'Format' does not exist on type 'typeof import("...")'.
Expression expected.
Left side of comma operator is unused and has no side effects.
```

**패턴 D** - 함수 반환값 누락 (1건):
```
A function whose declared type is neither 'undefined', 'void', nor 'any' must return a value.
```

### DB 스키마 (관련 부분)

```prisma
model hrm_platform_roles {
  id                          String    @id @db.Uuid
  hrm_platform_organization_id String   @db.Uuid
  code                        String
  name                        String
  description                 String?
  is_builtin                  Boolean
  created_at                  DateTime  @db.Timestamptz
  updated_at                  DateTime  @db.Timestamptz
  deleted_at                  DateTime? @db.Timestamptz

  // 관계명은 "permissions" (hrm_platform_role_permissions가 아님)
  permissions hrm_platform_role_permissions[]
}

model hrm_platform_timers {
  id          String    @id @db.Uuid
  employee_id String    @db.Uuid
  project_id  String    @db.Uuid
  task_id     String?   @db.Uuid
  started_at  DateTime  @db.Timestamptz
  stopped_at  DateTime? @db.Timestamptz
  description String?
  created_at  DateTime  @db.Timestamptz
  updated_at  DateTime  @db.Timestamptz
  deleted_at  DateTime? @db.Timestamptz

  employee hrm_platform_employees @relation(fields: [employee_id], references: [id])
  project  hrm_platform_projects  @relation(fields: [project_id], references: [id])
  task     hrm_platform_tasks?    @relation(fields: [task_id], references: [id])
}
```

### API DTO 스펙 (관련 부분)

```typescript
// IHrmPlatformTimer.ISummary
export type ISummary = {
  id: string & tags.Format<"uuid">;
  employee: IHrmPlatformEmployee.ISummary;
  project: IHrmPlatformProject.ISummary;
  task?: IHrmPlatformTask.ISummary | null | undefined;
  started_at: string & tags.Format<"date-time">;
  stopped_at?: (string & tags.Format<"date-time">) | null | undefined;
  description?: string | null | undefined;
  duration_minutes: number & tags.Type<"int32">;
  created_at: string & tags.Format<"date-time">;
};

// IHrmPlatformRole.ISummary - permissions 배열 포함
export type ISummary = {
  id: string & tags.Format<"uuid">;
  code: string;
  name: string;
  description?: string | null | undefined;
  is_builtin: boolean;
  permissions: string[];  // permission code 문자열 배열
  created_at: string & tags.Format<"date-time">;
  deleted_at?: (string & tags.Format<"date-time">) | null | undefined;
};
```

### 문제의 코드

이 파일에는 3가지 차원의 문제가 공존한다.

**문제 1**: Prisma select에서 `hrm_platform_role_permissions` 사용 (136~144행):
```typescript
role: {
  select: {
    id: true,
    code: true,
    name: true,
    description: true,
    is_builtin: true,
    hrm_platform_role_permissions: {  // 잘못! "permissions"가 올바른 관계명
      select: {
        permission: {
          select: { code: true },
        },
      },
    },
    created_at: true,
    deleted_at: true,
  },
},
```

**문제 2**: `satisfies Prisma.XxxFindManyArgs` 남용 (128, 148, 170, 173, 198, 200, 228, 280, 298행):
```typescript
user: {
  select: { ... },
} satisfies Prisma.hrm_platform_membersFindManyArgs,  // 잘못!

role: {
  select: { ... },
} satisfies Prisma.hrm_platform_rolesFindManyArgs,    // 잘못!

department: {
  select: { ... },
} satisfies Prisma.hrm_platform_departmentsFindManyArgs,  // 잘못!
```

이 `satisfies`는 중첩 관계 select에 적용되어 있다. Prisma에서 중첩 관계 include/select는 `XxxFindManyArgs` 타입이 아니라 `Xxx$relationArgs` 또는 단순 `boolean | XxxDefaultArgs`를 기대하므로, 이 `satisfies`가 타입 불일치를 일으킨다. 결과적으로 `select`가 무시되어 관계 필드가 타입에서 제외된다.

**문제 3 (가장 치명적)**: 350행부터 파일 끝까지 **구문이 완전히 파괴**됨:
```typescript
// 350행부터 - 올바른 JavaScript/TypeScript 구문이 아님
} & tags.Format<"date-time"> : ,
updated_at: timer.employee.department.parent.updated_at.toISOString(),
as, string
} & tags.Format<"date-time"> : ,
deleted_at: timer.employee.department.parent.deleted_at
    ? (timer.employee.department.parent.deleted_at.toISOString())
    :
,
as, string
} & tags.Format<"date-time">
};
});
undefined,
;
}
null,
    created_at;
timer.employee.department.created_at.toISOString() as string & tags.Format<"date-time">,
// ... 이하 수백 행이 깨진 구문
```

`as string & tags.Format<"date-time">` 타입 캐스팅이 여러 줄에 걸쳐 작성되면서, 모델이 줄바꿈 위치를 잘못 처리하여 **오브젝트 리터럴이 쪼개지고, 속성 할당이 독립 구문으로 분리**되었다. `timer.` 접두사가 포함된 변수 참조가 함수 스코프 밖에서 나타나며, `satisfies`, `as`, `string` 등의 키워드/타입이 값 위치에서 사용되고 있다.

실제 파괴된 코드의 특징적 예시 (350~365행):
```typescript
// 원래 의도: 중첩 오브젝트 리터럴 내의 타입 캐스팅
// 실제 생성된 코드:
                        } & tags.Format<"date-time"> : ,
                    updated_at: timer.employee.department.parent.updated_at.toISOString(),
                    as, string
                } & tags.Format<"date-time"> : ,
            deleted_at: timer.employee.department.parent.deleted_at
                ? (timer.employee.department.parent.deleted_at.toISOString())
                :
            ,
            as, string
        } & tags.Format<"date-time">
    };
});
undefined,
;
}
```

이 코드에서 `as string & tags.Format<"date-time">`이 `as, string`과 `} & tags.Format<"date-time">`으로 분리되어 있다. 삼항 연산자(`? :`)의 `:` 뒤에 값이 누락되고, 중괄호 매칭이 완전히 깨진 상태이다.

### 오류 원인 분석

1. **Prisma 관계명 오류**: `hrm_platform_roles`의 `hrm_platform_role_permissions[]` 관계의 프로퍼티명은 `permissions`이다. 코드는 테이블명인 `hrm_platform_role_permissions`를 select에서 사용했다.

2. **`satisfies Prisma.XxxFindManyArgs` 재앙적 남용**: 이 모델의 대표적 문제 패턴이다. 중첩 관계의 select 옵션에 `satisfies Prisma.XxxFindManyArgs`를 적용하면:
   - Prisma의 중첩 관계 select 타입은 `FindManyArgs`가 아니라 relation-specific 타입이다.
   - TypeScript가 타입 불일치를 감지하여 select 결과를 스칼라 필드만 포함하는 것으로 추론한다.
   - 이로 인해 관계 필드(`employee`, `project`, `task`)가 결과 타입에서 제외된다.
   - 변환 코드에서 이 관계 필드를 참조하면 "Property does not exist" 에러가 수십 건 발생한다.

3. **LLM 출력 토큰 한계로 인한 구문 파괴**: 이 파일의 350행 이후는 유효한 TypeScript가 아니다. LLM이 긴 코드를 생성하는 과정에서 출력이 잘리거나 줄바꿈이 잘못 처리되어, 오브젝트 리터럴의 중괄호 매칭이 깨지고 속성 할당이 독립 구문으로 분리되었다. 이는 수백 건의 `Cannot find name`, `Expression expected`, `Left side of comma operator is unused` 에러를 연쇄적으로 발생시킨다.

4. **함수가 값을 반환하지 않음**: 구문 파괴로 인해 `patchHrmPlatformMemberTimers` 함수의 반환문이 함수 본문 바깥으로 밀려나서, 함수 자체가 반환값 없이 종료된다.

### 올바른 코드 (핵심 부분)

**수정 1**: 관계명 수정 및 `satisfies` 제거:
```typescript
const timers = await MyGlobal.prisma.hrm_platform_timers.findMany({
  where: whereInput,
  skip,
  take: limit,
  orderBy: orderByInput,
  select: {
    id: true,
    employee_id: true,
    project_id: true,
    task_id: true,
    started_at: true,
    stopped_at: true,
    description: true,
    created_at: true,
    employee: {
      select: {
        id: true,
        position: true,
        employment_type: true,
        status: true,
        created_at: true,
        user: {
          select: {
            id: true,
            email: true,
            display_name: true,
            avatar_image: true,
            phone_number: true,
          },
        },
        role: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            is_builtin: true,
            permissions: {           // "hrm_platform_role_permissions" -> "permissions"
              select: {
                permission: {
                  select: { code: true },
                },
              },
            },
            created_at: true,
            deleted_at: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            description: true,
            parent_department_id: true,
            created_at: true,
            updated_at: true,
            deleted_at: true,
          },
        },
      },
    },
    // ... project, task도 satisfies 없이 계속
  },
});
```

**수정 2**: 변환 코드 전체를 올바른 구문으로 재작성 (350행 이후 전체):
```typescript
const data = await ArrayUtil.asyncMap(timers, async (timer): Promise<IHrmPlatformTimer.ISummary> => {
  const durationMs = timer.stopped_at
    ? timer.stopped_at.getTime() - timer.started_at.getTime()
    : now.getTime() - timer.started_at.getTime();
  const duration_minutes = Math.round(durationMs / 60000);
  return {
    id: timer.id as string & tags.Format<"uuid">,
    employee: {
      id: timer.employee.id as string & tags.Format<"uuid">,
      position: timer.employee.position,
      employment_type: timer.employee.employment_type,
      status: timer.employee.status,
      user: {
        id: timer.employee.user.id as string & tags.Format<"uuid">,
        email: timer.employee.user.email as string & tags.Format<"email">,
        display_name: timer.employee.user.display_name,
        avatar_image: timer.employee.user.avatar_image ?? null,
        phone_number: timer.employee.user.phone_number ?? null,
      },
      role: {
        id: timer.employee.role.id as string & tags.Format<"uuid">,
        code: timer.employee.role.code,
        name: timer.employee.role.name,
        description: timer.employee.role.description ?? null,
        is_builtin: timer.employee.role.is_builtin,
        permissions: timer.employee.role.permissions.map((rp) => rp.permission.code),
        created_at: timer.employee.role.created_at.toISOString() as string & tags.Format<"date-time">,
        deleted_at: timer.employee.role.deleted_at
          ? (timer.employee.role.deleted_at.toISOString() as string & tags.Format<"date-time">)
          : null,
      },
      department: timer.employee.department
        ? {
            id: timer.employee.department.id as string & tags.Format<"uuid">,
            name: timer.employee.department.name,
            description: timer.employee.department.description ?? null,
            parent_department: null,
            created_at: timer.employee.department.created_at.toISOString() as string & tags.Format<"date-time">,
            updated_at: timer.employee.department.updated_at.toISOString() as string & tags.Format<"date-time">,
            deleted_at: timer.employee.department.deleted_at
              ? (timer.employee.department.deleted_at.toISOString() as string & tags.Format<"date-time">)
              : null,
          }
        : null,
      created_at: timer.employee.created_at.toISOString() as string & tags.Format<"date-time">,
    },
    // ... project, task 변환도 동일 패턴으로 올바르게 작성
    started_at: timer.started_at.toISOString() as string & tags.Format<"date-time">,
    stopped_at: timer.stopped_at
      ? (timer.stopped_at.toISOString() as string & tags.Format<"date-time">)
      : null,
    description: timer.description ?? null,
    duration_minutes: duration_minutes as number & tags.Type<"int32">,
    created_at: timer.created_at.toISOString() as string & tags.Format<"date-time">,
  };
});

return {
  pagination: {
    current: page,
    limit: limit,
    records: total,
    pages: Math.ceil(total / limit),
  },
  data: data,
};
```

### 권고 조치사항

- **`satisfies Prisma.XxxFindManyArgs`를 중첩 관계 select에 사용하지 않아야 한다.** 이것이 이 모델의 가장 근본적인 문제이다. Prisma의 중첩 관계 select는 `FindManyArgs`가 아닌 relation-specific 타입을 기대한다.
- Prisma 관계명(`permissions`)과 테이블명(`hrm_platform_role_permissions`)을 혼동하면 안 된다. select 내에서는 반드시 Prisma 스키마의 관계 프로퍼티명을 사용해야 한다.
- 긴 변환 코드에서 `as string & tags.Format<"date-time">` 캐스팅이 줄바꿈 위치에서 잘려 구문이 파괴되는 문제는 Transformer 패턴을 사용하여 중복을 제거하고 코드를 간결하게 만들어야 한다.

---

## 에러 파일 4: `src/transformers/HrmPlatformTaskAtSummaryTransformer.ts`

### 컴파일 에러 메시지

```
Type '{ id: string; title: string; status: string; priority: string; estimated_hours: number | null;
  due_date: string | null; created_at: string; updated_at: string; deleted_at: string | null;
  project: undefined; assignedEmployee: undefined; parent: undefined; } | null'
is not assignable to type 'ISummary | null | undefined'.

  Type '{ ... project: undefined; assignedEmployee: undefined; parent: undefined; }'
  is not assignable to type 'ISummary'.
    Types of property 'project' are incompatible.
      Type 'undefined' is not assignable to type 'ISummary'.
```

### DB 스키마

```prisma
model hrm_platform_tasks {
  id                        String    @id @db.Uuid
  hrm_platform_projects_id  String    @db.Uuid
  hrm_platform_tasks_id     String?   @db.Uuid
  hrm_platform_employees_id String?   @db.Uuid
  title                     String
  status                    String
  priority                  String
  estimated_hours           Float?    @db.DoublePrecision
  due_date                  DateTime? @db.Timestamptz
  created_at                DateTime  @db.Timestamptz
  updated_at                DateTime  @db.Timestamptz
  deleted_at                DateTime? @db.Timestamptz

  project          hrm_platform_projects   @relation(fields: [hrm_platform_projects_id], references: [id])
  parent           hrm_platform_tasks?     @relation("recursive", fields: [hrm_platform_tasks_id], references: [id])
  assignedEmployee hrm_platform_employees? @relation(fields: [hrm_platform_employees_id], references: [id])
}
```

### API DTO 스펙

```typescript
// IHrmPlatformTask.ISummary
export type ISummary = {
  id: string & tags.Format<"uuid">;
  title: string;
  status: string;
  priority: string;
  estimated_hours?: number | null | undefined;
  due_date?: (string & tags.Format<"date-time">) | null | undefined;
  created_at: string & tags.Format<"date-time">;
  updated_at: string & tags.Format<"date-time">;
  deleted_at: (string & tags.Format<"date-time">) | null;
  project: IHrmPlatformProject.ISummary;           // 필수! undefined 불가
  assignedEmployee?: IHrmPlatformEmployee.ISummary | null | undefined;  // optional
  parent?: IHrmPlatformTask.ISummary | null | undefined;  // optional
};
```

### 문제의 코드

```typescript
// select 함수에서 parent의 중첩 select에 project, assignedEmployee를 포함하지 않음 (35~49행)
parent: {
  select: {
    id: true,
    title: true,
    status: true,
    priority: true,
    estimated_hours: true,
    due_date: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    // project, assignedEmployee가 없음!
  },
} satisfies Prisma.hrm_platform_tasksFindManyArgs,

// transform 함수에서 parent 변환 시 project를 undefined로 설정 (72~87행)
parent: input.parent
  ? {
      id: input.parent.id,
      title: input.parent.title,
      status: input.parent.status,
      priority: input.parent.priority,
      estimated_hours: input.parent.estimated_hours,
      due_date: input.parent.due_date?.toISOString() ?? null,
      created_at: input.parent.created_at.toISOString(),
      updated_at: input.parent.updated_at.toISOString(),
      deleted_at: input.parent.deleted_at?.toISOString() ?? null,
      project: undefined,           // ISummary.project는 필수! undefined 불가
      assignedEmployee: undefined,  // 이건 optional이라 undefined 가능
      parent: undefined,            // 이것도 optional이라 undefined 가능
    }
  : null,
```

또한 `select()` 함수 자체에도 `satisfies Prisma.hrm_platform_tasksFindManyArgs` 문제가 있다 (47, 49행).

### 오류 원인 분석

1. **`project` 필드가 `IHrmPlatformTask.ISummary`에서 필수(required)**: `project: IHrmPlatformProject.ISummary`로 정의되어 있어 `undefined`를 할당할 수 없다. `assignedEmployee`와 `parent`는 optional(`?`)이므로 `undefined` 할당이 가능하지만, `project`는 optional이 아니다.

2. **parent의 select에서 project 관계를 누락**: Prisma select에서 parent task를 가져올 때 `project` 관계를 포함하지 않았으므로, Prisma 결과에 `project` 필드가 없다. 그래서 `input.parent.project`를 사용할 수 없어 `undefined`를 넣은 것이다.

3. **`satisfies Prisma.hrm_platform_tasksFindManyArgs` 부적절 사용**: parent의 중첩 select에 `satisfies Prisma.hrm_platform_tasksFindManyArgs`를 적용하면, 이것이 중첩 관계의 타입과 맞지 않아 타입 추론에 영향을 준다.

### 올바른 코드

**수정 1**: parent의 select에 project 관계 포함 및 `satisfies` 제거:
```typescript
export function select() {
  return {
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      estimated_hours: true,
      due_date: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
      project: HrmPlatformProjectAtSummaryTransformer.select(),
      assignedEmployee: HrmPlatformEmployeeAtSummaryTransformer.select(),
      parent: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          estimated_hours: true,
          due_date: true,
          created_at: true,
          updated_at: true,
          deleted_at: true,
          project: HrmPlatformProjectAtSummaryTransformer.select(),  // 추가!
        },
      },
    },
  };
}
```

**수정 2**: transform 함수에서 parent.project 올바르게 변환:
```typescript
parent: input.parent
  ? {
      id: input.parent.id,
      title: input.parent.title,
      // ...
      project: await HrmPlatformProjectAtSummaryTransformer.transform(
        input.parent.project,
      ),
      assignedEmployee: null,  // undefined 대신 null 또는 생략
      parent: null,            // 재귀 중단
    }
  : null,
```

### 권고 조치사항

- `IHrmPlatformTask.ISummary.project`는 필수 속성이므로 어떤 상황에서도 `undefined`를 할당하면 안 된다. parent task를 변환할 때도 project 정보를 포함해야 한다.
- parent의 Prisma select에서 project 관계를 명시적으로 포함해야 한다.
- `satisfies Prisma.hrm_platform_tasksFindManyArgs`를 중첩 관계 select에 사용하는 것은 피해야 한다.

---

## 종합 권고사항

### 1. `satisfies Prisma.XxxFindManyArgs` 패턴의 근절

이 모델(`qwen3.5-122b-a10b`)의 **가장 치명적이고 반복적인 문제**는 `satisfies Prisma.XxxFindManyArgs`를 중첩 관계 select에 남용하는 것이다. 이 패턴은:
- Prisma의 중첩 관계 select 타입(`Xxx$relationArgs`)과 불일치하여 타입 에러 발생
- TypeScript가 관계 필드를 결과 타입에서 제외하여 수십~수백 건의 연쇄 "Property does not exist" 에러 유발
- 단 하나의 `satisfies` 오용이 50~100건의 에러로 증폭됨

**권고**: `satisfies`는 Prisma 쿼리의 최상위 옵션에만 사용하거나, 아예 사용하지 않고 Prisma의 자체 타입 추론에 의존해야 한다.

### 2. Prisma 관계명과 테이블명/컬럼명 혼동 방지

- `parent_department` (X) -> `parent` (O): 스키마에서 정의된 관계 프로퍼티명
- `hrm_platform_role_permissions` (X) -> `permissions` (O): 스키마에서 정의된 관계 프로퍼티명

Prisma select 내에서 관계를 포함할 때는 반드시 스키마의 **관계 프로퍼티명**을 사용해야 하며, 테이블명이나 컬럼명을 사용하면 안 된다.

### 3. `null` vs `undefined` 엄격 구분

- DTO에서 `| null`로 정의된 속성: 반드시 `null` 반환
- DTO에서 `?` (optional)로 정의된 속성: `undefined` 반환 가능
- Prisma의 optional relation은 항상 `null`을 반환함

이 모델은 `null`이어야 할 곳에 `undefined`를, `undefined`이면 되는 곳에 `null`을 사용하는 경향이 있다.

### 4. LLM 출력 안정성

`patchHrmPlatformMemberTimers.ts`의 350행 이후에서 발생한 **구문 파괴**는 LLM이 긴 코드를 생성할 때 출력 토큰 한계에 근접하면서 발생한 것으로 추정된다. `as string & tags.Format<"date-time">` 같은 긴 타입 캐스팅이 줄바꿈 경계에서 잘려 구문이 완전히 무효화되었다. 이는:
- Transformer 패턴을 사용하여 반복적인 변환 코드를 함수로 추출하면 코드 길이를 줄여 방지 가능
- 하나의 provider에 수백 행의 인라인 변환 코드를 넣지 않고, 별도 transformer 모듈에 위임해야 함

### 5. DTO 필수 필드 완전 매핑

`IHrmPlatformProject.ISummary`의 `member_count`, `created_at`, `updated_at`와 같은 필수 필드를 변환 코드에서 누락하는 패턴이 반복된다. DTO 정의를 참조하여 모든 필수 필드가 변환 코드에서 매핑되고 있는지 확인해야 한다.

### 요약 통계

| 에러 패턴 | 발생 횟수 (추정) | 심각도 |
|-----------|:---:|:---:|
| `satisfies Prisma.XxxFindManyArgs` 남용 | 100건+ 연쇄 에러 | 치명적 |
| 구문 파괴 (Syntax Corruption) | 200건+ | 치명적 |
| Prisma 관계명 오류 | 10건+ | 높음 |
| `null` vs `undefined` 혼동 | 10건+ | 중간 |
| DTO 필수 필드 누락 | 5건+ | 중간 |
| 동기/비동기 혼동 | 2건 | 낮음 |
