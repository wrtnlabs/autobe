#!/bin/bash
pnpm run build:prompt

######################################################
# INTERFACE
######################################################
# endpoint
pnpm run build:prompt && pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.endpoint.todo.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.endpoint.bbs.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.endpoint.reddit.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.endpoint.shopping.log

# operation
pnpm run build:prompt && pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.operation.todo.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.operation.bbs.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.operation.reddit.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.operation.shopping.log

# schema
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.schema.todo.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.schema.bbs.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.schema.reddit.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.schema.shopping.log

# schema.write
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.write.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.schema.write.todo.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.write.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.schema.write.bbs.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.write.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.schema.write.reddit.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.write.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.schema.write.shopping.log

# prerequisite
pnpm run build:prompt && pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.prerequisite.todo.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.prerequisite.bbs.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.prerequisite.reddit.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.prerequisite.shopping.log

######################################################
# TEST
######################################################
# prepare
pnpm run build:prompt && pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.prepare.todo.log
pnpm run build:prompt && pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.prepare.bbs.log
pnpm run build:prompt && pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.prepare.reddit.log
pnpm run build:prompt && pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.prepare.shopping.log

# generate
pnpm run build:prompt && pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.generate.todo.log
pnpm run build:prompt && pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.generate.bbs.log
pnpm run build:prompt && pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.generate.reddit.log
pnpm run build:prompt && pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.generate.shopping.log

# authorize
pnpm run build:prompt && pnpm ts-node src/agent/test.authorize.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.authorize.todo.log
pnpm run build:prompt && pnpm ts-node src/agent/test.authorize.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.authorize.bbs.log
pnpm run build:prompt && pnpm ts-node src/agent/test.authorize.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.authorize.reddit.log
pnpm run build:prompt && pnpm ts-node src/agent/test.authorize.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.authorize.shopping.log
