import "dotenv/config";
import express from "express";
import { OpenRouter } from "@openrouter/sdk";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3000;
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-super-vl:free";
// Loaded from the environment: export OPENROUTER_API_KEY=... or put it in .env (git-ignored)
const SERVER_API_KEY = process.env["OPEN" + "ROUTER_API_KEY"] || "";

// Auto-fallback chain: if the selected free model is busy / rate-limited,
// OpenRouter automatically routes to the next model in the `models` list.
const FALLBACK_MODELS = [
  "nvidia/nemotron-3.5-super-vl:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-120b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
];

const EFFORTS = new Set(["auto", "high", "medium", "low", "minimal", "none", "max", "xhigh"]);

const app = express();
app.use(express.json({ limit: "12mb" }));
app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders(res, filePath) {
      // Always revalidate page assets so UI updates show up immediately in previews.
      if (/\.(html|css|js)$/.test(filePath)) res.setHeader("Cache-Control", "no-cache");
    },
  })
);

// Health / config — never returns the key itself, only whether one is set.
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    hasServerKey: Boolean(SERVER_API_KEY),
    model: DEFAULT_MODEL,
    fallbackModels: FALLBACK_MODELS,
    defaultReasoningEffort: "high",
  });
});

app.get("/api/models", (_req, res) => {
  res.json({ model: DEFAULT_MODEL, fallbackModels: FALLBACK_MODELS });
});

function sse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

app.post("/api/chat", async (req, res) => {
  // Key priority: per-request key (from the UI settings) > server env var.
  const apiKey =
    req.get("x-openrouter-api-key") || req.body?.apiKey || SERVER_API_KEY;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const { messages, model, system, reasoningEffort, autoFallback } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    sse(res, { type: "error", code: "bad_request", message: "messages[] is required." });
    return res.end();
  }

  if (!apiKey) {
    sse(res, {
      type: "error",
      code: "missing_api_key",
      message:
        "No OpenRouter API key found. Set OPENROUTER_API_KEY in your .env / environment, or paste a key in Settings. Get a free key at https://openrouter.ai/keys",
    });
    return res.end();
  }

  // Normalise messages, optionally prepending a system prompt (skill + custom).
  const chatMessages = [];
  if (system && typeof system === "string" && system.trim()) {
    chatMessages.push({ role: "system", content: system.trim() });
  }
  for (const m of messages) {
    if (!m || typeof m !== "object") continue;
    // content is either a string, or multimodal parts [{type:"text"...},{type:"image_url"...}]
    chatMessages.push({ role: m.role || "user", content: m.content });
  }

  const selectedModel = typeof model === "string" && model ? model : DEFAULT_MODEL;
  const effort =
    typeof reasoningEffort === "string" && EFFORTS.has(reasoningEffort)
      ? reasoningEffort
      : "high";

  const chatRequest = {
    model: selectedModel,
    messages: chatMessages,
    stream: true,
  };
  // Auto model fallback (OpenRouter routes to the next model on provider errors)
  if (autoFallback !== false) {
    chatRequest.models = [selectedModel, ...FALLBACK_MODELS.filter((m) => m !== selectedModel)];
  }
  // Reasoning effort: "auto" lets the model decide, otherwise constrain it (default: high)
  if (effort !== "auto") {
    chatRequest.reasoning = { effort };
  }

  const openrouter = new OpenRouter({
    apiKey,
    appTitle: "Nemotron Chat",
    retryConfig: {
      strategy: "backoff",
      backoff: { initialInterval: 500, maxInterval: 4000, exponent: 2, maxElapsedTime: 20000 },
      retryConnectionErrors: false,
    },
  });

  let aborted = false;
  // Note: listen on the response, not the request — req "close" fires as soon
  // as the request body has been read, which would cancel the stream early.
  res.on("close", () => {
    aborted = true;
  });

  try {
    const stream = await openrouter.chat.send({ chatRequest });

    let usage = null;
    let announcedModel = null;
    for await (const chunk of stream) {
      if (aborted) break;
      if (chunk.model && chunk.model !== announcedModel) {
        announcedModel = chunk.model;
        sse(res, { type: "model", model: chunk.model, requestedModel: selectedModel });
      }
      const delta = chunk.choices?.[0]?.delta;
      const content = delta?.content;
      const reasoning = delta?.reasoning ?? delta?.reasoningContent;

      if (content) sse(res, { type: "delta", content });
      if (reasoning) sse(res, { type: "reasoning", content: reasoning });

      // Usage information comes in the final chunk
      if (chunk.usage) {
        usage = {
          promptTokens: chunk.usage.promptTokens ?? null,
          completionTokens: chunk.usage.completionTokens ?? null,
          totalTokens: chunk.usage.totalTokens ?? null,
          reasoningTokens:
            chunk.usage.completionTokensDetails?.reasoningTokens ?? null,
          cost: chunk.usage.cost ?? null,
        };
        sse(res, { type: "usage", usage });
      }
    }
    sse(res, { type: "done", usage, model: announcedModel || selectedModel });
  } catch (err) {
    const status = err?.status || err?.statusCode || err?.response?.status;
    const raw = err?.message || "OpenRouter request failed.";
    const message =
      status === 401 || /unauthorized|invalid.*key/i.test(raw)
        ? "OpenRouter rejected the API key (401). Check the key in Settings / .env and try again."
        : status === 429 || /rate.?limit/i.test(raw)
          ? "Rate-limited by the free model provider. Auto-fallback was attempted — wait a moment and press Retry."
          : /fetch failed|ECONN|ENOTFOUND|ETIMEDOUT|TLS|socket/i.test(raw)
            ? "Could not reach OpenRouter (network error). Check your internet connection / firewall — restricted sandboxes may block openrouter.ai — then press Retry."
            : raw;
    sse(res, { type: "error", code: "upstream_error", status: status ?? null, message });
  } finally {
    res.end();
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Chatbot running at http://0.0.0.0:${PORT}`);
  console.log(`   Model: ${DEFAULT_MODEL} (auto-fallback: ${FALLBACK_MODELS.length} free models)`);
  console.log(`   Reasoning effort default: high (Auto / High / Medium / Low selectable in UI)`);
  console.log(
    SERVER_API_KEY
      ? "   API key: loaded from OPENROUTER_API_KEY [OK]"
      : "   API key: NOT set - set OPENROUTER_API_KEY or paste one in the UI Settings"
  );
});
