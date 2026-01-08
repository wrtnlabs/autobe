#!/bin/bash
pnpm run build:prompt

######################################################
# qwen/qwen3-next-80b-a3b-instruct
######################################################
# individual testing
pnpm ts-node src/agent/test.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.qwen-qwen3-next-80b-a3b-instruct.operation-todo.log
pnpm ts-node src/agent/test.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.qwen-qwen3-next-80b-a3b-instruct.operation-bbs.log
pnpm ts-node src/agent/test.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.qwen-qwen3-next-80b-a3b-instruct.operation-reddit.log
pnpm ts-node src/agent/test.operation.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.qwen-qwen3-next-80b-a3b-instruct.operation-shopping.log

######################################################
# qwen/qwen3-30b-a3b-thinking-2507
######################################################
# individual testing
pnpm ts-node src/agent/test.operation.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.qwen-qwen3-30b-a3b-thinking-2507.operation-todo.log
pnpm ts-node src/agent/test.operation.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.qwen-qwen3-30b-a3b-thinking-2507.operation-bbs.log
pnpm ts-node src/agent/test.operation.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.qwen-qwen3-30b-a3b-thinking-2507.operation-reddit.log
pnpm ts-node src/agent/test.operation.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.qwen-qwen3-30b-a3b-thinking-2507.operation-shopping.log