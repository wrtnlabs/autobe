import { orchestrateRealizeIntegrator } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeIntegrator";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeEvent, AutoBeOpenApi } from "@autobe/interface";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_realize } from "./prepare_agent_realize";

export const validate_agent_realize_integrator = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent, interface: interface_ } = await prepare_agent_realize(
    factory,
    project,
  );

  const map = new Map<string, true>();
  const events: AutoBeEvent[] = [];
  const enroll = (event: AutoBeEvent) => {
    if (!map.has(event.type)) {
      map.set(event.type, true);
      console.log(event.type);
    }

    events.push(event);
  };

  agent.on("realizeStart", enroll);
  agent.on("realizeProgress", enroll);
  agent.on("realizeIntegrator", enroll);
  agent.on("realizeValidate", enroll);
  agent.on("realizeComplete", enroll);

  const operations = interface_.document.operations;

  const lockController = (() => {
    const locks = new Map<string, Promise<any>>();

    async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
      const prev = locks.get(key) ?? Promise.resolve();

      let release: () => void;
      const current = new Promise<void>((res) => {
        release = res;
      });

      locks.set(
        key,
        prev.then(() => current),
      );

      try {
        await prev;
        return await fn();
      } finally {
        release!();
        if (locks.get(key) === current) {
          locks.delete(key);
        }
      }
    }

    return {
      withLock,
    };
  })();

  // DO TEST GENERATION
  const go = (operation: AutoBeOpenApi.IOperation) =>
    orchestrateRealizeIntegrator(
      agent.getContext(),
      {
        functionName: "patch_core_users",
        implementationCode: `
async function patch_core_users({ filters, sort, page, pageSize, requester }) {
  // 1. 권한 체크
  if (!requester || !['administrator', 'moderator'].includes(requester.role)) {
    throw {
      status: 403,
      message: 'Access denied: insufficient permissions.'
    };
  }

  // 2. 필터 쿼리 구성
  const query = {};
  if (filters) {
    if (filters.username) {
      query.username = { $regex: filters.username, $options: 'i' };
    }
    if (filters.email) {
      query.email = { $regex: filters.email, $options: 'i' };
    }
    if (filters.role) {
      query.role = filters.role;
    }
    if (filters.status) {
      query.status = filters.status;
    }
  }

  // 3. 정렬 조건 구성
  const sortObj = {};
  if (sort && sort.field) {
    sortObj[sort.field] = sort.order === 'desc' ? -1 : 1;
  } else {
    sortObj.createdAt = -1; // 기본 정렬: 생성일 내림차순
  }

  // 4. 페이지네이션 계산
  const skip = (page > 0 ? page - 1 : 0) * (pageSize || 20);
  const limit = pageSize || 20;

  // 5. 사용자 목록과 총 개수 조회
  const [users, total] = await Promise.all([
    db.users.find(query).sort(sortObj).skip(skip).limit(limit).toArray(),
    db.users.countDocuments(query)
  ]);

  // 6. 사용자 요약 정보 생성 (민감정보 제외 + 역할 이름 매핑)
  const summaries = await Promise.all(
    users.map(async user => {
      const roleInfo = await db.user_roles.findOne({ id: user.role });
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        role: {
          id: user.role,
          name: roleInfo ? roleInfo.name : undefined
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        status: user.status
      };
    })
  );

  // 7. 최종 응답 반환
  return {
    data: summaries,
    page,
    pageSize: limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
}    
    `,
      },
      operation,
      lockController.withLock,
    );

  const result = await Promise.all(
    operations.map((operation) => go(operation)),
  );

  typia.assert(result);

  const histories = agent.getHistories();

  // REPORT RESULT
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${project}/realize/integrator`,
    files: {
      ...(await agent.getFiles()),
      "logs/events.json": typia.json.stringify(events),
      "logs/result.json": typia.json.stringify(result),
      "logs/histories.json": typia.json.stringify(histories),
    },
  });
};
