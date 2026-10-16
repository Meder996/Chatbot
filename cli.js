import "dotenv/config";
import { OpenRouter } from "@openrouter/sdk";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// CLI version of the snippet — run with:  npm run cli
// One-shot:  node cli.js "How many r's are in the word 'strawberry'?"
// Loaded from the environment: export OPENROUTER_API_KEY=... or put it in .env
const apiKey = process.env["OPEN" + "ROUTER_API_KEY"];
if (!apiKey) {
  console.error(
    "\nMissing OPENROUTER_API_KEY.\n" +
      "  export OPENROUTER_API_KEY=sk-or-v1-...\n" +
      "or put it in a .env file (see .env.example). Get a free key: https://openrouter.ai/keys\n"
  );
  process.exit(1);
}

const openrouter = new OpenRouter({ apiKey, appTitle: "Nemotron Chat CLI" });
const MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-super-vl:free";
// Reasoning effort: high by default, set REASONING_EFFORT=auto|medium|low to change
const EFFORT = process.env.REASONING_EFFORT || "high";
const FALLBACKS = [
  "nvidia/nemotron-3.5-super-vl:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-120b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

async function ask(messages) {
  // Stream the response to get reasoning tokens in usage
  const stream = await openrouter.chat.send({
    chatRequest: {
      model: MODEL,
      models: [MODEL, ...FALLBACKS.filter((m) => m !== MODEL)],
      messages,
      stream: true,
      ...(EFFORT !== "auto" ? { reasoning: { effort: EFFORT } } : {}),
    },
  });

  let response = "";
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      response += content;
      process.stdout.write(content);
    }

    // Usage information comes in the final chunk
    if (chunk.usage) {
      console.log(
        "\nReasoning tokens:",
        chunk.usage.completionTokensDetails?.reasoningTokens
      );
    }
  }
  console.log();
  return response;
}

const oneShot = process.argv.slice(2).join(" ").trim();
if (oneShot) {
  await ask([{ role: "user", content: oneShot }]);
  process.exit(0);
}

console.log(`[Nemotron Chat] ${MODEL} (reasoning: ${EFFORT}, auto-fallback on) - type "exit" to quit\n`);
const rl = readline.createInterface({ input, output });
const messages = [];
for (;;) {
  const question = (await rl.question("You: ")).trim();
  if (!question || ["exit", "quit"].includes(question.toLowerCase())) break;
  messages.push({ role: "user", content: question });
  process.stdout.write("Bot: ");
  const answer = await ask(messages);
  messages.push({ role: "assistant", content: answer });
}
rl.close();
