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
pnpm ts-node src/agent/interface.complement.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > test.complement.todo.log
pnpm ts-node src/agent/interface.complement.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > test.complement.bbs.log
pnpm ts-node src/agent/interface.complement.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > test.complement.reddit.log
pnpm ts-node src/agent/interface.complement.ts --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > test.complement.shopping.log

######################################################
# qwen/qwen3-235b-a22b-2507
######################################################
# archiving
pnpm run archive:go --vendor qwen/qwen3-235b-a22b-2507 --project todo --from interface --to interface > archive.qwen-qwen3-235b-a22b-2507.todo.log
pnpm run archive:go --vendor qwen/qwen3-235b-a22b-2507 --project bbs --from interface --to interface > archive.qwen-qwen3-235b-a22b-2507.bbs.log
pnpm run archive:go --vendor qwen/qwen3-235b-a22b-2507 --project reddit --from interface --to interface > archive.qwen-qwen3-235b-a22b-2507.reddit.log
pnpm run archive:go --vendor qwen/qwen3-235b-a22b-2507 --project shopping --from interface --to interface > archive.qwen-qwen3-235b-a22b-2507.shopping.log

# opening projects
code results/qwen/qwen3-235b-a22b-2507/todo/interface
code results/qwen/qwen3-235b-a22b-2507/bbs/interface
code results/qwen/qwen3-235b-a22b-2507/reddit/interface
code results/qwen/qwen3-235b-a22b-2507/shopping/interface

# individual testings
pnpm ts-node src/agent/interface.complement.ts --vendor qwen/qwen3-235b-a22b-2507 --project todo > test.complement.todo.log
pnpm ts-node src/agent/interface.complement.ts --vendor qwen/qwen3-235b-a22b-2507 --project bbs > test.complement.bbs.log
pnpm ts-node src/agent/interface.complement.ts --vendor qwen/qwen3-235b-a22b-2507 --project reddit > test.complement.reddit.log
pnpm ts-node src/agent/interface.complement.ts --vendor qwen/qwen3-235b-a22b-2507 --project shopping > test.complement.shopping.log