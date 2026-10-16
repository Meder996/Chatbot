# Chatbot

A streaming chatbot built with the [OpenRouter SDK](https://www.npmjs.com/package/@openrouter/sdk), using the free vision model **`nvidia/nemotron-3.5-super-vl:free`**.

It streams answers token-by-token and shows **reasoning tokens** (plus prompt/completion/total usage) from the final streamed chunk — exactly as in the original snippet. The UI uses proper SVG icons (Lucide-style), not emojis.

## Features

- **Web chat UI** — live streaming, multi-turn history, Stop / Retry / Regenerate, Copy per answer, Export to Markdown, suggestion prompts
- **Skills** — Auto, General, Code Expert, Writing, Learn, Translator, Vision. In **Auto** mode the skill is detected as you type (code questions, translations, explanations, image uploads…) and shown in the toolbar
- **Reasoning effort** — Auto / **High** (default) / Medium / Low, sent as `reasoning: { effort }` to OpenRouter; reasoning-token usage is displayed under every answer
- **Auto model fallback** — requests include a `models: [...]` fallback chain of free models, so if one provider is busy or rate-limited OpenRouter automatically answers with the next model (the model that actually answered is shown under the reply)
- **Auto-save** — the conversation, token session stats and settings persist in the browser and restore on reload; smart auto-scroll stays put when you scroll up to read
- **Vision** — attach an image and ask about it (the default model is vision-capable)
- **CLI chatbot** (`npm run cli`) mirroring the original snippet, with the same fallback + reasoning defaults

## 1. Get an API key

Free at https://openrouter.ai/keys

## 2. Provide the key — either way

**Option A — environment variable (recommended for the server):**

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npm start
```

**Option B — `.env` file:**

```bash
cp .env.example .env   # then paste your key into .env
npm start
```

**Option C — in the browser:** open the app → **Settings** → paste the key.
It's stored only in your browser's `localStorage` and sent per-request; it never touches the server's disk. (A server-side key takes no setup in the UI at all.)

> Never commit a real key. `.env` is already in `.gitignore`. If you have shared a key publicly, rotate it at openrouter.ai/keys.

## 3. Run

```bash
npm install
npm start        # http://localhost:3000
```

### CLI instead of the web UI

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npm run cli                                       # interactive chat
node cli.js "How many r's are in the word 'strawberry'?"   # one-shot, prints reasoning tokens
REASONING_EFFORT=auto npm run cli                 # let the model decide reasoning effort
```

## How it works

`server.js` uses the same call shape as the snippet (plus reasoning effort and the auto-fallback model list) and forwards the stream to the browser over Server-Sent Events:

```js
import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({ apiKey }); // key loaded from OPENROUTER_API_KEY

const stream = await openrouter.chat.send({
  chatRequest: {
    model: "nvidia/nemotron-3.5-super-vl:free",
    models: ["nvidia/nemotron-3.5-super-vl:free", "openai/gpt-oss-120b:free", /* …fallbacks */],
    messages,
    stream: true,
    reasoning: { effort: "high" }, // omit when effort = "auto"
  },
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) { /* -> SSE "delta" to the browser */ }
  if (chunk.usage) {
    console.log("Reasoning tokens:", chunk.usage.completionTokensDetails?.reasoningTokens);
  }
}
```

### Endpoints

| Route | Description |
|---|---|
| `GET /api/health` | `{ ok, hasServerKey, model, fallbackModels, defaultReasoningEffort }` — never exposes the key |
| `GET /api/models` | `{ model, fallbackModels }` |
| `POST /api/chat` | Body `{ messages, model?, system?, reasoningEffort?, autoFallback? }`, optional header `x-openrouter-api-key`. Responds with SSE events: `delta`, `reasoning`, `model`, `usage`, `done`, `error` |

## Project layout

```
server.js        Express server + OpenRouter streaming -> SSE (auto-fallback, reasoning effort)
cli.js           Terminal chatbot (the original snippet, interactive)
public/          Chat web UI — SVG icons, skills, auto-save (no build step)
.env.example     Copy to .env and add your key
```
