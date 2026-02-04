#!/bin/bash
pnpm run build:prompt

######################################################
# INTERFACE
######################################################
# endpoint
pnpm run build:prompt && pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.endpoint.todo.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.endpoint.bbs.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.endpoint.reddit.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.endpoint.shopping.log

# operation
pnpm run build:prompt && pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.operation.todo.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.operation.bbs.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.operation.reddit.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.operation.shopping.log

# schema
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.schema.todo.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.schema.bbs.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.schema.reddit.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.schema.shopping.log

# prerequisite
pnpm run build:prompt && pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.prerequisite.todo.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.prerequisite.bbs.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.prerequisite.reddit.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.prerequisite.shopping.log

######################################################
# TEST
######################################################
# prepare
pnpm run build:prompt && pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.prepare.todo.log
pnpm run build:prompt && pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.prepare.bbs.log
pnpm run build:prompt && pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.prepare.reddit.log
pnpm run build:prompt && pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.prepare.shopping.log

# generate
pnpm run build:prompt && pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.generate.todo.log
pnpm run build:prompt && pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.generate.bbs.log
pnpm run build:prompt && pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.generate.reddit.log
pnpm run build:prompt && pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.generate.shopping.log

# authorize
pnpm run build:prompt && pnpm ts-node src/agent/test.authorize.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.authorize.todo.log
pnpm run build:prompt && pnpm ts-node src/agent/test.authorize.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.authorize.bbs.log
pnpm run build:prompt && pnpm ts-node src/agent/test.authorize.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.authorize.reddit.log
pnpm run build:prompt && pnpm ts-node src/agent/test.authorize.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.authorize.shopping.log
