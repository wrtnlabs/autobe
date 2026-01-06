/**
 * Union type representing AI models available for hackathon competitions.
 *
 * This type enumerates the specific AI models that participants can use during
 * AutoBE hackathon events. The model selection is curated to provide a fair and
 * diverse competition environment, offering both high-performance and
 * cost-effective options for different strategic approaches.
 *
 * **Available Models**:
 *
 * - **openai/gpt-4.1**: OpenAI's GPT-4.1 model providing state-of-the-art
 *   language understanding and generation capabilities with enhanced reasoning
 *   and extended context
 * - **openai/gpt-4.1-mini**: OpenAI's GPT-4.1 Mini model offering a
 *   cost-effective balance between performance and efficiency, suitable for
 *   resource-conscious strategies
 * - **qwen/qwen3-next-80b-a3b-instruct**: Qwen's 80B parameter instruction-tuned
 *   model providing competitive performance with different architectural
 *   characteristics
 *
 * **Hackathon Context**:
 *
 * During hackathon competitions, participants compete to generate the best
 * backend applications using AutoBE. The model choice affects:
 *
 * 1. **Generation Quality**: Different models have varying capabilities in code
 *    generation, reasoning, and following complex instructions
 * 2. **Cost Efficiency**: Token costs vary significantly between models,
 *    affecting overall resource consumption
 * 3. **Performance**: Response times and throughput differ across models
 * 4. **Strategy**: Teams can optimize for quality, speed, or cost based on model
 *    selection
 *
 * The limited model selection ensures fair competition by preventing advantages
 * from unrestricted model access while still providing strategic diversity.
 *
 * @author Samchon
 */
export type AutoBeHackathonModel =
  | "openai/gpt-4.1"
  | "openai/gpt-4.1-mini"
  | "qwen/qwen3-next-80b-a3b-instruct";
