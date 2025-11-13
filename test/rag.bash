# PRISMA TO INTERFACE
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project todo --from prisma --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs --from prisma --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit --from prisma --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping --from prisma --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log

# TEST ONLY
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project todo --from test --to test > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs --from test --to test > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit --from test --to test > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping --from test --to test > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log