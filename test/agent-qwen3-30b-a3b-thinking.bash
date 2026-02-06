#!/bin/bash
pnpm run build:prompt

######################################################
# INTERFACE
######################################################
# endpoint
pnpm run build:prompt && pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.endpoint.todo.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.endpoint.bbs.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.endpoint.reddit.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.endpoint.shopping.qwen3-30b-a3b-thinking.log

# operation
pnpm run build:prompt && pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.operation.todo.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.operation.bbs.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.operation.reddit.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.operation.shopping.qwen3-30b-a3b-thinking.log

# schema
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.schema.todo.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.schema.bbs.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.schema.reddit.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.schema.shopping.qwen3-30b-a3b-thinking.log

# schema.write
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.write.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.schema.write.todo.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.write.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.schema.write.bbs.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.write.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.schema.write.reddit.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.write.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.schema.write.shopping.qwen3-30b-a3b-thinking.log

# prerequisite
pnpm run build:prompt && pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.prerequisite.todo.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.prerequisite.bbs.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.prerequisite.reddit.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.prerequisite.shopping.qwen3-30b-a3b-thinking.log

######################################################
# TEST
######################################################
# prepare
pnpm run build:prompt && pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.prepare.todo.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.prepare.bbs.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.prepare.reddit.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.prepare.shopping.qwen3-30b-a3b-thinking.log

# generate
pnpm run build:prompt && pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.generate.todo.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.generate.bbs.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.generate.reddit.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.generate.shopping.qwen3-30b-a3b-thinking.log

# authorize
pnpm run build:prompt && pnpm ts-node src/agent/test.authorize.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.authorize.todo.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/test.authorize.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.authorize.bbs.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/test.authorize.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.authorize.reddit.qwen3-30b-a3b-thinking.log
pnpm run build:prompt && pnpm ts-node src/agent/test.authorize.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.authorize.shopping.qwen3-30b-a3b-thinking.log
