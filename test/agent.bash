#!/bin/bash
pnpm run build:prompt

######################################################
# INTERFACE
######################################################
# endpoint
pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.endpoint.todo.log
pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.endpoint.bbs.log
pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.endpoint.reddit.log
pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.endpoint.shopping.log

# operation
pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.operation.todo.log
pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.operation.bbs.log
pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.operation.reddit.log
pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.operation.shopping.log

# schema
pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.schema.todo.log
pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.schema.bbs.log
pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.schema.reddit.log
pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.schema.shopping.log

# prerequisite
pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.prerequisite.todo.log
pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.prerequisite.bbs.log
pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.prerequisite.reddit.log
pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.prerequisite.shopping.log

######################################################
# TEST
######################################################
# prepare
pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.prepare.todo.log
pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.prepare.bbs.log
pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.prepare.reddit.log
pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.prepare.shopping.log

# generate
pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.generate.todo.log
pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.generate.bbs.log
pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.generate.reddit.log
pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.generate.shopping.log