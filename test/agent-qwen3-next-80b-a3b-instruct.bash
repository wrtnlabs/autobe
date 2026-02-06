#!/bin/bash
pnpm run build:prompt

######################################################
# INTERFACE
######################################################
# endpoint
pnpm run build:prompt && pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.endpoint.todo.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.endpoint.bbs.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.endpoint.reddit.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.endpoint.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.endpoint.shopping.qwen3-next-80b-a3b-instruct.log

# operation
pnpm run build:prompt && pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.operation.todo.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.operation.bbs.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.operation.reddit.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.operation.shopping.qwen3-next-80b-a3b-instruct.log

# schema
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.schema.todo.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.schema.bbs.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.schema.reddit.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.schema.shopping.qwen3-next-80b-a3b-instruct.log

# schema.write
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.write.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.schema.write.todo.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.write.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.schema.write.bbs.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.write.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.schema.write.reddit.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.write.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.schema.write.shopping.qwen3-next-80b-a3b-instruct.log

# schema.refine
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.refine.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.schema.refine.todo.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.refine.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.schema.refine.bbs.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.refine.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.schema.refine.reddit.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.schema.refine.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.schema.refine.shopping.qwen3-next-80b-a3b-instruct.log

# prerequisite
pnpm run build:prompt && pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.prerequisite.todo.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.prerequisite.bbs.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.prerequisite.reddit.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.prerequisite.shopping.qwen3-next-80b-a3b-instruct.log

######################################################
# TEST
######################################################
# prepare
pnpm run build:prompt && pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.prepare.todo.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.prepare.bbs.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.prepare.reddit.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.prepare.shopping.qwen3-next-80b-a3b-instruct.log

# generate
pnpm run build:prompt && pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.generate.todo.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.generate.bbs.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.generate.reddit.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.generate.shopping.qwen3-next-80b-a3b-instruct.log

# authorize
pnpm run build:prompt && pnpm ts-node src/agent/test.authorize.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.authorize.todo.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/test.authorize.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.authorize.bbs.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/test.authorize.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.authorize.reddit.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/test.authorize.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.authorize.shopping.qwen3-next-80b-a3b-instruct.log

# scenario
pnpm run build:prompt && pnpm ts-node src/agent/test.scenario.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.scenario.todo.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/test.scenario.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.scenario.bbs.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/test.scenario.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.scenario.reddit.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/test.scenario.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.scenario.shopping.qwen3-next-80b-a3b-instruct.log

# operation
pnpm run build:prompt && pnpm ts-node src/agent/test.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.operation.todo.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/test.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.operation.bbs.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/test.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.operation.reddit.qwen3-next-80b-a3b-instruct.log
pnpm run build:prompt && pnpm ts-node src/agent/test.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.operation.shopping.qwen3-next-80b-a3b-instruct.log
