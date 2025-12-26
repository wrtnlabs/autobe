#!/bin/bash
pnpm run build:prompt

# qwen/qwen3-next-80b-a3b-instruct
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project todo --from interface --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs --from interface --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit --from interface --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping --from interface --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log

# opening projects
code results/qwen-qwen3-next-80b-a3b-instruct/todo/interface
code results/qwen-qwen3-next-80b-a3b-instruct/bbs/interface
code results/qwen-qwen3-next-80b-a3b-instruct/reddit/interface
code results/qwen-qwen3-next-80b-a3b-instruct/shopping/interface