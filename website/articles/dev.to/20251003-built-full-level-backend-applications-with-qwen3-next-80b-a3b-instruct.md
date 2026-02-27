> https://www.reddit.com/r/LocalLLaMA/comments/1nhhmu6/autobe_built_fulllevel_backend_applications_with/
>
> This is an article copied from Reddit Local LLaMa channel's article of 5 months ago written. A new shocking article may come soon.

| Project | `qwen3-next-80b-a3b-instruct` | `openai/gpt-4.1-mini` | `openai/gpt-4.1` |
|---------|-------------------------------|----------------------|------------------|
| To Do List | [Qwen3 To Do](https://github.com/wrtnlabs/autobe-examples/tree/main/qwen/qwen3-next-80b-a3b-instruct/todo) | [GPT 4.1-mini To Do](https://github.com/wrtnlabs/autobe-examples/tree/main/openai/gpt-4.1-mini/todo) | [GPT 4.1 To Do](https://github.com/wrtnlabs/autobe-examples/tree/main/openai/gpt-4.1/todo) |
| Reddit Community | [Qwen3 Reddit](https://github.com/wrtnlabs/autobe-examples/tree/main/qwen/qwen3-next-80b-a3b-instruct/reddit) | [GPT 4.1-mini Reddit](https://github.com/wrtnlabs/autobe-examples/tree/main/openai/gpt-4.1-mini/reddit) | [GPT 4.1 Reddit](https://github.com/wrtnlabs/autobe-examples/tree/main/openai/gpt-4.1/reddit) |
| Economic Discussion | [Qwen3 BBS](https://github.com/wrtnlabs/autobe-examples/tree/main/qwen/qwen3-next-80b-a3b-instruct/bbs) | [GPT 4.1-mini BBS](https://github.com/wrtnlabs/autobe-examples/tree/main/openai/gpt-4.1-mini/bbs) | [GPT 4.1 BBS](https://github.com/wrtnlabs/autobe-examples/tree/main/openai/gpt-4.1/bbs) |
| E-Commerce | Qwen3 Failed | [GPT 4.1-mini Shopping](https://github.com/wrtnlabs/autobe-examples/tree/main/openai/gpt-4.1-mini/shopping) | [GPT 4.1 Shopping](https://github.com/wrtnlabs/autobe-examples/tree/main/openai/gpt-4.1/shopping) |

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/jemfh4ehy6f0d1c6zwq9.webp)

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/55u0ppqo9te2xvlvm6cs.webp)

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/yq4855adjgkndsjdkzlf.webp)

The AutoBE team recently tested the `qwen3-next-80b-a3b-instruct` model and successfully generated three full-stack backend applications: To Do List, Reddit Community, and Economic Discussion Board.

> **Note:** `qwen3-next-80b-a3b-instruct` failed during the `realize` phase, but this was due to our compiler development issues rather than the model itself. AutoBE improves backend development success rates by implementing AI-friendly compilers and providing compiler error feedback to AI agents.

While some compilation errors remained during API logic implementation (realize phase), these were easily fixable manually, so we consider these successful cases. There are still areas for improvement—AutoBE generates relatively few e2e test functions (the Reddit community project only has 9 e2e tests for 60 API operations)—but we expect these issues to be resolved soon.

Compared to `openai/gpt-4.1-mini` and `openai/gpt-4.1`, the `qwen3-next-80b-a3b-instruct` model generates fewer documents, API operations, and DTO schemas. However, in terms of cost efficiency, `qwen3-next-80b-a3b-instruct` is significantly more economical than the other models. As AutoBE is an open-source project, we're particularly interested in leveraging open-source models like `qwen3-next-80b-a3b-instruct` for better community alignment and accessibility.

For projects that don't require massive backend applications (like our e-commerce test case), `qwen3-next-80b-a3b-instruct` is an excellent choice for building full-stack backend applications with AutoBE.

We AutoBE team are actively working on fine-tuning our approach to achieve 100% success rate with `qwen3-next-80b-a3b-instruct` in the near future. We envision a future where backend application prototype development becomes fully automated and accessible to everyone through AI. Please stay tuned for what's coming next!

## Links
- **AutoBE GitHub Repository:** https://github.com/wrtnlabs/autobe
- **Documentation:** https://autobe.dev/docs