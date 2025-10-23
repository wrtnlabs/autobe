# Best Practices

## System Prompt Editing

**This is the most important and sensitive task.**

### Absolute Principle
User instructions are absolute. If unclear, ask questions. If clear, execute unconditionally. Claude Code must never modify, reduce, or omit user commands based on its own judgment.

### Mandatory Tasks Before Editing
1. Read [AGENT_SYSTEM_PROMPTS.md](AGENT_SYSTEM_PROMPTS.md) thoroughly
2. Fully read and understand the target prompt file
3. Read related Orchestrator code (`packages/agent/src/orchestrate/`)
4. Check related Tool definitions
5. Check related History Transformers

### Guidelines When Editing
- Integrate naturally into existing storyline
- Write clear and specific instructions
- Include rich examples
- Specify constraints
- Prioritize positive directives ("do" over "don't")

### Verification After Editing
1. Run `pnpm run build:prompt`
2. Resolve compilation errors
3. Validate by running actual pipeline
4. Verify generated code quality

### Things You Must Never Do
- Edit `AutoBeSystemPromptConstant.ts` directly (it's auto-generated)
- Commit prompt changes without testing
- Ignore impact on other agents
- Use inconsistent conventions

## Performance Optimization

### Maximize Prompt Caching
- Place repeatedly used context at beginning of messages
- Place request-specific content at end
- Maintain consistent message ordering
- Monitor cache hit rates

### Utilize Parallel Processing
- Run independent tasks in parallel
- Utilize `executeCachedBatch`
- Set appropriate concurrency limits
- Consider rate limits

### Context Optimization
- Selectively include only necessary information
- Summarize lengthy content
- Remove duplication
- Monitor token usage

## Error Handling

### Responding to Compilation Errors
1. Read error messages accurately
2. Identify error location
3. Identify agent that generated the code
4. Improve System Prompt or History

### Responding to LLM API Errors
- Trust retry logic
- Monitor rate limits
- Check API keys and quotas
- Analyze logs

### Debugging Strategy
- Trace event logs
- Analyze compiler diagnostics
- Verify History content
- Check System Prompt clarity

## Code Quality

### Maintain Type Safety
- Declare explicit types for all functions
- Absolutely prohibit `any` type
- Utilize `@autobe/interface` types
- Resolve compilation errors immediately

### Maintain Consistency
- Follow naming conventions
- File structure consistency
- Unified coding style
- Match documentation with code

### Write Tests
- Add tests for new features
- Include edge cases
- Maintain regression tests
- Run integration tests periodically

## Documentation

### Keep Documentation Current
- Update documentation when code changes
- Documents in `.ai/` folder are especially important
- Always keep CLAUDE.md up-to-date
- Verify examples and links

### Documentation Writing Style
- Clear and concise
- Include specific examples
- Balance narrative and lists
- Write in Korean (code and technical terms in English)

## Git Workflow

### Commit Messages
- Clear and specific
- Explain reason for change
- Reference related issues
- Recommend using Conventional Commits

### Pull Requests
- Include sufficient explanation
- Update related documentation
- Confirm all tests pass
- Actively accept review feedback

### Branch Strategy
- Work in Feature branches
- main is always stable
- Hotfixes proceed quickly

## Common Pitfalls

### System Prompt Related
- Ambiguous instructions → Make clear and specific
- Lack of examples → Include rich examples
- Missing constraints → Specify required constraints
- Context mismatch → Synchronize with History Transformer

### Performance Related
- Unnecessary context → Optimize with selective inclusion
- Not utilizing caching → Actively use Prompt Caching
- Sequential processing → Parallel processing when possible

### Code Quality Related
- Using any type → Explicit type declarations
- Missing tests → Write required tests
- Documentation debt → Document immediately

## Monitoring and Analytics

### Track Performance Metrics
- LLM call time
- Token usage
- Cache hit rate
- Compilation success rate

### Track Quality Metrics
- Compilation success rate of generated code
- Retry count
- User satisfaction
- Error occurrence frequency

### Continuous Improvement
- Identify bottlenecks by analyzing metrics
- Verify improvement effects with A/B testing
- Reflect user feedback
- Regular prompt reviews

## Security

### API Key Management
- Manage with environment variables
- Never commit to Git
- Periodic rotation

### Validate Generated Code
- Prohibit hardcoded passwords
- Prevent SQL Injection
- Prevent XSS
- Appropriate authentication/authorization

## Collaboration

### Discord Community
- Welcome questions and discussions
- Share experiences
- Report bugs
- Suggest features

### Code Review
- Constructive feedback
- Emphasize code quality
- Use as learning opportunity

### Knowledge Sharing
- Write documentation
- Blog posts
- Conference presentations
- Open source contributions

---

AutoBE is a continuously evolving project. These Best Practices are also continuously updated based on experience and feedback. Add new insights to this document so everyone can benefit.
