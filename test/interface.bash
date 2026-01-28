#!/bin/bash
pnpm run build:prompt

######################################################
# qwen/qwen3-next-80b-a3b-instruct
######################################################
# archiving
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project todo --from interface --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs --from interface --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit --from interface --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping --from interface --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log

# opening projects
code results/qwen/qwen3-next-80b-a3b-instruct/todo/interface
code results/qwen/qwen3-next-80b-a3b-instruct/bbs/interface
code results/qwen/qwen3-next-80b-a3b-instruct/reddit/interface
code results/qwen/qwen3-next-80b-a3b-instruct/shopping/interface

# individual testings
pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.prerequisite.todo.log
pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.prerequisite.bbs.log
pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.prerequisite.reddit.log
pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.prerequisite.shopping.log

pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.schema.todo.log
pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.schema.bbs.log
pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.schema.reddit.log
pnpm ts-node src/agent/interface.schema.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.schema.shopping.log

######################################################
# qwen/qwen3-30b-a3b-thinking-2507
######################################################
# archiving
pnpm run archive:go --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo --from interface --to interface > archive.qwen-qwen3-30b-a3b-thinking-2507.todo.log
pnpm run archive:go --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs --from interface --to interface > archive.qwen-qwen3-30b-a3b-thinking-2507.bbs.log
pnpm run archive:go --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit --from interface --to interface > archive.qwen-qwen3-30b-a3b-thinking-2507.reddit.log
pnpm run archive:go --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping --from interface --to interface > archive.qwen-qwen3-30b-a3b-thinking-2507.shopping.log

# opening projects
code results/qwen/qwen3-30b-a3b-thinking-2507/todo/interface
code results/qwen/qwen3-30b-a3b-thinking-2507/bbs/interface
code results/qwen/qwen3-30b-a3b-thinking-2507/reddit/interface
code results/qwen/qwen3-30b-a3b-thinking-2507/shopping/interface

# individual testings
pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > test.prerequisite.todo.log
pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > test.prerequisite.bbs.log
pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > test.prerequisite.reddit.log
pnpm ts-node src/agent/interface.prerequisite.ts --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > test.prerequisite.shopping.log