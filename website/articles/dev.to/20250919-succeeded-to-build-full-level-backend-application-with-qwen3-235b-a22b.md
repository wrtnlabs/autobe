> https://www.reddit.com/r/LocalLLaMA/comments/1n94n2x/succeeded_to_build_fulllevel_backend_application/
>
> This is an article copied from Reddit Local LLaMa channel's article of 5 months ago written. A new shocking article may come soon.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/tf3qr53nqbudltain1jq.png)

https://github.com/wrtnlabs/autobe-examples/tree/main/qwen/qwen3-next-80b-a3b-instruct/todo

Although what I've built with qwen3-235b-a22b (2507) is just a simple backend application composed of 10 API functions and 37 DTO schemas, this marks the first time I've successfully generated a full-level backend application without any compilation errors.

I'm continuously testing larger backend applications while enhancing AutoBE (an open-source project for building full-level backend applications using AI-friendly compilers) system prompts and its AI-friendly compilers. I believe it may be possible to generate more complex backend applications like a Reddit-style community (with around 200 API functions) by next month.

I also tried the qwen3-30b-a3b model, but it struggles with defining DTO types. However, one amazing thing is that its requirement analysis report and database design were quite professional. Since it's a smaller model, I won't invest much effort in it, but I was surprised by the quality of its requirements definition and DB design.

Currently, AutoBE requires about 150 million tokens using gpt-4.1 to create an Amazon like shopping mall-level backend application, which is very expensive (approximately $450). In addition to RAG tuning, using local LLM models like qwen3-235b-a22b could be a viable alternative.

The results from qwen3-235b-a22b were so interesting and promising that our AutoBE hackathon, originally planned to support only gpt-4.1 and gpt-4.1-mini, urgently added the qwen3-235b-a22b model to the contest. If you're interested in building full-level backend applications with AI and local LLMs like qwen3, we'd love to have you join our hackathon and share this exciting experience.

We will test as many local LLMs as possible with AutoBE and report our findings to this channel whenever we discover promising results. Furthermore, whenever we find a model that excels at backend coding, we will regularly host hackathons to share experiences and collect diverse case studies.

Hackathon Contest: https://autobe.dev/articles/autobe-hackathon-20250912.html

Github Repository: https://github.com/wrtnlabs/autobe