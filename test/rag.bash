################################################
# OVERALL
################################################
# FROM PRISMA
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project todo --from prisma > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs --from prisma > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit --from prisma > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping --from prisma > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log

# FROM INTERFACE
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project todo --from interface > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs --from interface > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit --from interface > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping --from interface > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log

# FROM TEST
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project todo --from test > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs --from test > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit --from test > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping --from test > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log

################################################
# PARTIAL
################################################
# PRISMA ONLY
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project todo --from prisma --to prisma > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs --from prisma --to prisma > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit --from prisma --to prisma > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping --from prisma --to prisma > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log

# INTERFACE ONLY
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project todo --from interface --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs --from interface --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit --from interface --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping --from interface --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log

# TEST ONLY
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project todo --from test --to test > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs --from test --to test > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit --from test --to test > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping --from test --to test > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log

# REALIZE ONLY
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project todo --from realize --to realize > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs --from realize --to realize > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit --from realize --to realize > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping --from realize --to realize > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log
