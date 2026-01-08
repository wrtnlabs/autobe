#!/bin/bash
pnpm run build:prompt

# todo
pnpm ts-node src/agent/test.scenario.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.scenario.todo.log
pnpm ts-node src/agent/test.authorize.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.authorize.todo.log
pnpm ts-node src/agent/test.prepare.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.prepare.todo.log
pnpm ts-node src/agent/test.generate.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.generate.todo.log
pnpm ts-node src/agent/test.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.operation.todo.log

# all in one
pnpm ts-node src/agent/test.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.operation.todo.log
pnpm ts-node src/agent/test.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.operation.bbs.log
pnpm ts-node src/agent/test.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.operation.reddit.log
pnpm ts-node src/agent/test.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.operation.shopping.log
