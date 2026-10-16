const $ = (s) => document.querySelector(s);
const chatEl = $("#chat"), inputEl = $("#input"), formEl = $("#composer");
const sendBtn = $("#sendBtn"), stopBtn = $("#stopBtn"), emptyEl = $("#emptyState");
const scrollBtn = $("#scrollBtn"), statusLine = $("#statusLine"), statusText = $("#statusText");
const convoListEl = $("#convoList"), appEl = $("#app");

/* ---------------- icons (inline SVG, Lucide-style) ---------------- */
const PATHS = {
  bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
  brain: '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-1.41-.891 5 5 0 0 1-.909-1.417"/><path d="M9 13a4.5 4.5 0 0 0 1.41-.891 5 5 0 0 0 .909-1.417"/>',
  sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  pen: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  languages: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  retry: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  cpu: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
  message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
};
function icon(name, size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || ""}</svg>`;
}

/* ---------------- skills ---------------- */
const SKILLS = {
  auto:      { label: "Auto",        icon: "zap",       prompt: "" },
  general:   { label: "General",     icon: "sparkles",  prompt: "You are a helpful, accurate and concise assistant. Answer clearly and directly." },
  code:      { label: "Code Expert", icon: "code",      prompt: "You are an expert software engineer. Give correct, runnable code in fenced code blocks, point out bugs and edge cases, and keep explanations brief and practical." },
  write:     { label: "Writing",     icon: "pen",       prompt: "You are a skilled writing coach and editor. Help draft, rewrite and polish text with strong structure and natural tone. Offer the finished text first, then brief notes." },
  learn:     { label: "Learn",       icon: "book",      prompt: "You are a patient teacher. Explain concepts step by step in simple language, use concrete examples and analogies, and finish with a one-sentence summary." },
  translate: { label: "Translator",  icon: "languages", prompt: "You are a professional translator. Translate the user's text accurately while preserving tone and formatting. Detect the target language from the request; if none is given, translate English to Russian and Russian/Kyrgyz to English. Output only the translation unless asked for notes." },
  vision:    { label: "Vision",      icon: "eye",       prompt: "You are an expert image analyst. Describe images in structured detail: overall scene, objects, text (OCR it exactly), colours, and anything unusual. Then answer the user's question about the image." },
};
function detectSkill(text, hasImage) {
  if (hasImage) return "vision";
  const t = (text || "").toLowerCase();
  if (/(translate|переведи|перевод|котормо|которуп|to english|to russian|на русский|на английском)/.test(t)) return "translate";
  if (/```|\b(code|function|bug|debug|python|javascript|typescript|java|c\+\+|c#|sql|api|script|algorithm|programming|error|exception|regex|код|функци|программир)\b/.test(t)) return "code";
  if (/\b(write|todo|to-do|essay|email|letter|poem|haiku|story|rewrite|draft|напиши|стих|эссе|письмо)\b/.test(t)) return "write";
  if (/\b(explain|what is|how does|how do|why|teach|learn|example|mean|объясни|что такое|почему|как работает)\b/.test(t)) return "learn";
  return "general";
}

/* ---------------- settings ---------------- */
const store = {
  get key() { return localStorage.getItem("openrouter_api_key") || ""; },
  set key(v) { v ? localStorage.setItem("openrouter_api_key", v) : localStorage.removeItem("openrouter_api_key"); },
  get model() { return localStorage.getItem("chat_model") || "nvidia/nemotron-3.5-super-vl:free"; },
  set model(v) { localStorage.setItem("chat_model", v); },
  get system() { return localStorage.getItem("chat_system") || ""; },
  set system(v) { localStorage.setItem("chat_system", v); },
  get skill() { return localStorage.getItem("chat_skill") || "auto"; },
  set skill(v) { localStorage.setItem("chat_skill", v); },
  get effort() { return localStorage.getItem("chat_effort") || "high"; },
  set effort(v) { localStorage.setItem("chat_effort", v); },
  get fallback() { return localStorage.getItem("chat_fallback") !== "0"; },
  set fallback(v) { localStorage.setItem("chat_fallback", v ? "1" : "0"); },
};

/* ---------------- conversations (sidebar) ---------------- */
let conversations = [];
let activeId = null;
let history = [], display = [];
let stats = { total: 0, reasoning: 0, messages: 0 };
let controller = null, attachedImage = null, hasServerKey = false, userNearBottom = true, searchQuery = "";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function cur() { return conversations.find((c) => c.id === activeId); }
function syncActive() { const c = cur(); history = c ? c.history : []; display = c ? c.display : []; }
function touch() { const c = cur(); if (c) c.updated = Date.now(); }

function saveState() {
  try { localStorage.setItem("chatbot_convos_v3", JSON.stringify({ activeId, conversations })); } catch {
    try {
      const slim = conversations.map((c) => ({ ...c, display: c.display.map((d) => ({ ...d, image: null })) }));
      localStorage.setItem("chatbot_convos_v3", JSON.stringify({ activeId, conversations: slim }));
    } catch { /* ignore */ }
  }
  try { localStorage.setItem("chatbot_stats_v1", JSON.stringify(stats)); } catch { /* ignore */ }
}
function newConversation() {
  const c = { id: uid(), title: "New Chat", created: Date.now(), updated: Date.now(), history: [], display: [] };
  conversations.unshift(c); activeId = c.id; syncActive();
  return c;
}
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem("chatbot_stats_v1") || "null");
    if (s) stats = s;
  } catch { /* ignore */ }
  try {
    const raw = localStorage.getItem("chatbot_convos_v3");
    if (raw) {
      const s = JSON.parse(raw);
      if (Array.isArray(s.conversations)) conversations = s.conversations;
      activeId = s.activeId;
    }
  } catch { /* ignore */ }
  if (!conversations.length) {
    // migrate the previous single-chat state (v2), if any
    try {
      const old = JSON.parse(localStorage.getItem("chatbot_state_v2") || "null");
      if (old && (old.display?.length || old.history?.length)) {
        const firstUser = (old.display || []).find((d) => d.role === "user");
        conversations = [{ id: uid(), title: firstUser ? firstUser.text.slice(0, 34) : "Chat", created: Date.now(), updated: Date.now(), history: old.history || [], display: old.display || [] }];
        activeId = conversations[0].id;
      }
    } catch { /* ignore */ }
  }
  if (!conversations.length) newConversation();
  if (!cur()) activeId = conversations[0].id;
  syncActive();
}
function renderSidebar() {
  const q = searchQuery.trim().toLowerCase();
  const items = [...conversations]
    .sort((a, b) => b.updated - a.updated)
    .filter((c) => !q || c.title.toLowerCase().includes(q));
  convoListEl.innerHTML = "";
  if (!items.length) {
    convoListEl.innerHTML = `<div class="convo-empty">${q ? "No chats match your search." : "No chats yet — start a New Chat."}</div>`;
    return;
  }
  for (const c of items) {
    const row = document.createElement("div");
    row.className = "convo-item" + (c.id === activeId ? " active" : "");
    row.innerHTML = `${icon("message", 14)}<span class="convo-title">${escapeHtml(c.title)}</span>`;
    const del = document.createElement("button");
    del.className = "convo-del"; del.type = "button"; del.title = "Delete chat"; del.innerHTML = icon("trash", 13);
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      if (controller && c.id === activeId) controller.abort();
      conversations = conversations.filter((x) => x.id !== c.id);
      if (!conversations.length) newConversation();
      else if (c.id === activeId) { activeId = conversations[0].id; syncActive(); }
      saveState(); renderSidebar(); renderAll();
    });
    row.appendChild(del);
    row.addEventListener("click", () => {
      if (controller) return;
      activeId = c.id; syncActive(); saveState(); renderSidebar(); renderAll();
      appEl.classList.remove("sidebar-open"); inputEl.focus();
    });
    convoListEl.appendChild(row);
  }
  $("#chatTitle").textContent = cur()?.title || "New Chat";
}

/* ---------------- markdown ---------------- */
function escapeHtml(s){return String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function md(src){
  let s = escapeHtml(src || "");
  s = s.replace(/```(\w*)\n([\s\S]*?)```/g,(_,l,c)=>`<pre><code>${c.replace(/\n$/,"")}</code></pre>`);
  s = s.replace(/`([^`\n]+)`/g,"<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
  s = s.replace(/(^|\W)\*([^*\n]+)\*/g,"$1<em>$2</em>");
  s = s.replace(/^### (.*)$/gm,"<h4>$1</h4>").replace(/^## (.*)$/gm,"<h3>$1</h3>").replace(/^# (.*)$/gm,"<h2>$1</h2>");
  s = s.replace(/^&gt; (.*)$/gm,"<blockquote>$1</blockquote>");
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  s = s.split(/\n{2,}/).map(block=>{
    if(/^\s*<(pre|h\d|blockquote)/.test(block)) return block;
    if(/^\s*[-•] /.test(block)) return "<ul>"+block.split("\n").map(l=>`<li>${l.replace(/^\s*[-•] /,"")}</li>`).join("")+"</ul>";
    if(/^\s*\d+\. /.test(block)) return "<ol>"+block.split("\n").map(l=>`<li>${l.replace(/^\s*\d+\. /,"")}</li>`).join("")+"</ol>";
    return `<p>${block.replace(/\n/g,"<br>")}</p>`;
  }).join("");
  return s;
}

/* ---------------- rendering ---------------- */
function smartScroll() { if (userNearBottom) chatEl.scrollTop = chatEl.scrollHeight; }
chatEl.addEventListener("scroll", () => {
  userNearBottom = chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight < 140;
  scrollBtn.classList.toggle("hidden", userNearBottom);
});
scrollBtn.addEventListener("click", () => { userNearBottom = true; chatEl.scrollTop = chatEl.scrollHeight; scrollBtn.classList.add("hidden"); });
function fmtTime(ts){ return ts ? new Date(ts).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : ""; }

function addMessage(role, text, opts = {}) {
  if (emptyEl) emptyEl.classList.add("hidden");
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;
  wrap.innerHTML = `<div class="avatar">${icon(role === "user" ? "user" : "bot")}</div><div class="bubble"></div>`;
  const bubble = wrap.querySelector(".bubble");
  if (opts.image) { const img = document.createElement("img"); img.src = opts.image; img.className = "attached"; img.alt = "attached image"; bubble.appendChild(img); }
  const body = document.createElement("div");
  body.className = "body";
  body.innerHTML = role === "assistant" ? md(text) : `<p>${escapeHtml(text).replace(/\n/g,"<br>")}</p>`;
  bubble.appendChild(body);
  chatEl.appendChild(wrap);
  smartScroll();
  return { wrap, bubble, body };
}
function setMeta(bubble, entry) {
  let m = bubble.querySelector(".meta");
  if (!m) { m = document.createElement("div"); m.className = "meta"; bubble.appendChild(m); }
  const parts = [];
  if (entry.model) parts.push(`${icon("cpu", 13)}<span title="Model that answered">${escapeHtml(entry.model.replace(":free",""))}</span>`);
  if (entry.skill && SKILLS[entry.skill]) parts.push(`${icon(SKILLS[entry.skill].icon, 13)}${SKILLS[entry.skill].label}`);
  const u = entry.usage;
  if (u) {
    if (u.reasoningTokens != null) parts.push(`${icon("brain", 13)}reasoning <strong>${u.reasoningTokens}</strong>`);
    if (u.completionTokens != null) parts.push(`completion ${u.completionTokens}`);
    if (u.promptTokens != null) parts.push(`prompt ${u.promptTokens}`);
    if (u.totalTokens != null) parts.push(`total ${u.totalTokens}`);
    if (u.cost != null) parts.push(`$${Number(u.cost).toFixed(6)}`);
  }
  if (entry.time) parts.push(fmtTime(entry.time));
  m.innerHTML = parts.join("<span>·</span>");
}
function addActions(bubble, entry) {
  if (entry.role !== "assistant" || !entry.text) return;
  const bar = document.createElement("div");
  bar.className = "msg-actions";
  const copyBtn = document.createElement("button");
  copyBtn.type = "button"; copyBtn.innerHTML = `${icon("copy", 13)} Copy`;
  copyBtn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(entry.text); }
    catch { const ta = document.createElement("textarea"); ta.value = entry.text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); }
    copyBtn.innerHTML = `${icon("check", 13)} Copied`;
    setTimeout(() => { copyBtn.innerHTML = `${icon("copy", 13)} Copy`; }, 1200);
  });
  bar.appendChild(copyBtn);
  const regenBtn = document.createElement("button");
  regenBtn.type = "button"; regenBtn.innerHTML = `${icon("retry", 13)} Regenerate`;
  regenBtn.addEventListener("click", regenerateLast);
  bar.appendChild(regenBtn);
  bubble.appendChild(bar);
}
function renderEntry(entry) {
  const { bubble } = addMessage(entry.role, entry.text, { image: entry.image });
  if (entry.role === "assistant") { setMeta(bubble, entry); addActions(bubble, entry); }
  else if (entry.time) setMeta(bubble, entry);
  return bubble;
}
function renderAll() {
  chatEl.querySelectorAll(".msg").forEach((n) => n.remove());
  if (!display.length) { if (emptyEl) { emptyEl.classList.remove("hidden"); chatEl.appendChild(emptyEl); } }
  else display.forEach(renderEntry);
  userNearBottom = true; smartScroll();
  $("#chatTitle").textContent = cur()?.title || "New Chat";
}

/* ---------------- status / key UI ---------------- */
function setStatus(text) {
  if (!text) { statusLine.classList.add("hidden"); return; }
  statusText.textContent = text;
  statusLine.classList.remove("hidden");
}
function updateStatsUI() {
  $("#sessionStatsText").textContent = `${stats.total.toLocaleString()} tokens · ${stats.reasoning.toLocaleString()} reasoning · ${stats.messages} replies`;
}
function updateKeyUI() {
  const hasKey = hasServerKey || !!store.key;
  $("#keyBanner").classList.toggle("hidden", hasKey);
  const navBadge = $("#apiNavBadge");
  navBadge.textContent = hasKey ? "Connected" : "No key";
  navBadge.classList.toggle("off", !hasKey);
  $("#apiCardTitle").textContent = hasKey ? "OpenRouter API — Connected" : "Connect your API";
  $("#apiCardText").textContent = hasServerKey
    ? "Key loaded from the server (.env). You are ready to chat."
    : store.key
      ? "Key saved in this browser. You are ready to chat."
      : "Add your OpenRouter API key to start chatting — it takes 10 seconds.";
  $("#manageKeyBtn").textContent = hasKey ? "Manage API Key" : "Add API Key";
  $("#modelLabel").textContent = store.model;
  syncModelSelects();
}
function syncModelSelects() {
  for (const id of ["#modelSelect", "#modelSelectMain"]) {
    const el = $(id);
    if (el && [...el.options].some((o) => o.value === store.model)) el.value = store.model;
  }
  const label = $("#modelLabel"); if (label) label.textContent = store.model;
}

/* ---------------- skills / effort UI ---------------- */
function buildSkillBar() {
  const sel = $("#skillSelect");
  if (!sel) return;
  sel.innerHTML = "";
  for (const [id, s] of Object.entries(SKILLS)) {
    const o = document.createElement("option");
    o.value = id;
    o.textContent = id === "auto" ? "Skill: Auto" : `Skill: ${s.label}`;
    sel.appendChild(o);
  }
  sel.value = store.skill;
  sel.onchange = () => { store.skill = sel.value; updateAutoHint(); inputEl.focus(); };
}
function activeSkill(text, hasImage) {
  return store.skill === "auto" ? detectSkill(text ?? inputEl.value, hasImage ?? !!attachedImage) : store.skill;
}
function updateAutoHint() {
  const hint = $("#autoSkillHint");
  if (store.skill !== "auto") { hint.innerHTML = ""; return; }
  hint.innerHTML = `${icon("zap", 13)} Auto: ${SKILLS[activeSkill()].label}`;
}
function buildEffortUI() {
  const sel = $("#effortSelect");
  if (!sel) return;
  sel.value = store.effort;
  sel.onchange = () => { store.effort = sel.value; };
}

/* ---------------- streaming ---------------- */
async function streamAssistant(skillId) {
  const { bubble, body } = addMessage("assistant", "");
  body.classList.add("cursor");
  let reasoningEl = null, reasoningBody = null, raw = "", reasoningRaw = "";
  let usage = null, usedModel = null, errored = null;
  controller = new AbortController();
  stopBtn.classList.remove("hidden"); sendBtn.classList.add("hidden");
  setStatus("Connecting to OpenRouter…");
  const system = [SKILLS[skillId]?.prompt, store.system].filter(Boolean).join("\n");
  const convoId = activeId;

  function addRetry(bub) {
    const bar = document.createElement("div"); bar.className = "msg-actions";
    const btn = document.createElement("button"); btn.type = "button";
    btn.innerHTML = `${icon("retry", 13)} Retry`;
    btn.addEventListener("click", () => { const wrap = bub.closest(".msg"); if (wrap) wrap.remove(); if (activeId === convoId) streamAssistant(skillId); });
    bar.appendChild(btn); bub.appendChild(bar);
  }

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(store.key ? { "x-openrouter-api-key": store.key } : {}) },
      body: JSON.stringify({ messages: history, model: store.model, system, reasoningEffort: store.effort, autoFallback: store.fallback, skill: skillId }),
    });
    if (!res.ok || !res.body) throw new Error(`Server error (${res.status})`);
    const reader = res.body.getReader(), decoder = new TextDecoder();
    let buffer = "";
    setStatus("Streaming…");
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n"); buffer = events.pop();
      for (const evt of events) {
        const line = evt.trim(); if (!line.startsWith("data:")) continue;
        let data; try { data = JSON.parse(line.slice(5)); } catch { continue; }
        if (data.type === "delta") { raw += data.content; body.innerHTML = md(raw); }
        else if (data.type === "reasoning") {
          reasoningRaw += data.content;
          if (!reasoningEl) {
            reasoningEl = document.createElement("div"); reasoningEl.className = "thinking";
            reasoningEl.innerHTML = `<div class="thinking-head">${icon("brain", 14)} Reasoning</div><div class="thinking-body"></div>`;
            reasoningBody = reasoningEl.querySelector(".thinking-body");
            bubble.insertBefore(reasoningEl, body);
          }
          reasoningBody.textContent = reasoningRaw;
        }
        else if (data.type === "model") {
          usedModel = data.model;
          setStatus(data.model !== data.requestedModel ? `Primary model busy — auto-fell back to ${data.model}` : "Streaming…");
        }
        else if (data.type === "usage") { usage = data.usage; setMeta(bubble, { usage, model: usedModel, skill: skillId, time: Date.now() }); }
        else if (data.type === "error") { errored = data.message; }
        else if (data.type === "done") { usage = data.usage || usage; usedModel = data.model || usedModel; }
        smartScroll();
      }
    }
    body.classList.remove("cursor");
    if (errored) {
      bubble.classList.add("err");
      body.innerHTML = `${icon("alert", 16)} ${escapeHtml(errored)}`;
      addRetry(bubble);
      return false;
    }
    if (!raw) {
      body.innerHTML = "<p><em>Empty response — the free model may be rate-limited. Press Retry.</em></p>";
      addRetry(bubble);
      return false;
    }
    const entry = { role: "assistant", text: raw, usage, model: usedModel || store.model, skill: skillId, time: Date.now() };
    history.push({ role: "assistant", content: raw });
    display.push(entry);
    touch();
    stats.messages += 1;
    if (usage) { stats.total += usage.totalTokens || 0; stats.reasoning += usage.reasoningTokens || 0; }
    setMeta(bubble, entry);
    addActions(bubble, entry);
    updateStatsUI(); saveState(); renderSidebar();
    return true;
  } catch (err) {
    body.classList.remove("cursor");
    if (err.name === "AbortError") {
      if (raw) {
        body.innerHTML = md(raw) + "<p><em>Stopped.</em></p>";
        const entry = { role: "assistant", text: raw, usage, model: usedModel || store.model, skill: skillId, time: Date.now() };
        history.push({ role: "assistant", content: raw }); display.push(entry); touch();
        setMeta(bubble, entry); addActions(bubble, entry); saveState();
      } else body.innerHTML = "<p><em>Stopped.</em></p>";
      return false;
    }
    bubble.classList.add("err");
    body.innerHTML = `${icon("alert", 16)} ${escapeHtml(err.message || "Request failed.")}`;
    addRetry(bubble);
    return false;
  } finally {
    controller = null;
    stopBtn.classList.add("hidden"); sendBtn.classList.remove("hidden");
    setStatus("");
    inputEl.focus();
  }
}

async function send(text) {
  const image = attachedImage;
  const skillId = activeSkill(text, !!image);
  const apiContent = image
    ? [{ type: "text", text: text || "Describe this image in detail." }, { type: "image_url", image_url: { url: image.dataUrl } }]
    : text;
  history.push({ role: "user", content: apiContent });
  const entry = { role: "user", text: text || "Describe this image in detail.", image: image?.dataUrl || null, skill: skillId, time: Date.now() };
  display.push(entry);
  const c = cur();
  if (c && (c.title === "New Chat" || !c.display.slice(0, -1).some((d) => d.role === "user"))) {
    c.title = (text || "Image chat").slice(0, 34) || "Image chat";
  }
  touch();
  renderEntry(entry);
  clearAttachment();
  saveState(); renderSidebar();
  await streamAssistant(skillId);
}

function regenerateLast() {
  if (controller) return;
  if (history.length && history[history.length - 1].role === "assistant") history.pop();
  if (display.length && display[display.length - 1].role === "assistant") display.pop();
  const lastUser = [...display].reverse().find((d) => d.role === "user");
  if (!lastUser) return;
  touch(); renderAll(); saveState();
  streamAssistant(lastUser.skill || activeSkill(lastUser.text, !!lastUser.image));
}

/* ---------------- attachment / voice ---------------- */
function clearAttachment(){ attachedImage = null; $("#attachPreview").classList.add("hidden"); $("#fileInput").value = ""; updateAutoHint(); }
$("#fileInput").addEventListener("change", (e) => {
  const f = e.target.files[0]; if (!f) return;
  if (f.size > 5 * 1024 * 1024) { alert("Image is too large (max 5 MB)."); return; }
  const r = new FileReader();
  r.onload = () => { attachedImage = { dataUrl: r.result, name: f.name }; $("#attachImg").src = r.result; $("#attachName").textContent = f.name; $("#attachPreview").classList.remove("hidden"); updateAutoHint(); };
  r.readAsDataURL(f);
});
$("#attachRemove").addEventListener("click", clearAttachment);

let recognition = null;
$("#micBtn").addEventListener("click", () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const btn = $("#micBtn");
  if (!SR) { setStatus("Voice input is not supported in this browser — try Chrome."); setTimeout(() => setStatus(""), 3000); return; }
  if (recognition) { recognition.stop(); return; }
  recognition = new SR();
  recognition.lang = "en-US"; recognition.interimResults = true;
  recognition.onresult = (e) => {
    const transcript = [...e.results].map((r) => r[0].transcript).join("");
    inputEl.value = transcript;
    inputEl.dispatchEvent(new Event("input"));
  };
  recognition.onend = () => { recognition = null; btn.classList.remove("recording"); };
  recognition.onerror = () => { recognition = null; btn.classList.remove("recording"); };
  btn.classList.add("recording");
  recognition.start();
});

/* ---------------- composer / sidebar actions ---------------- */
formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if ((!text && !attachedImage) || controller) return;
  inputEl.value = ""; inputEl.style.height = "auto"; updateAutoHint();
  send(text);
});
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); formEl.requestSubmit(); }
});
inputEl.addEventListener("input", () => {
  inputEl.style.height = "auto";
  inputEl.style.height = Math.min(inputEl.scrollHeight, 150) + "px";
  updateAutoHint();
});
stopBtn.addEventListener("click", () => controller?.abort());
document.querySelectorAll(".suggest-card").forEach((c) => c.addEventListener("click", () => {
  inputEl.value = c.dataset.prompt || c.textContent.trim();
  formEl.requestSubmit();
}));

$("#newChatBtn").addEventListener("click", () => {
  if (controller) controller.abort();
  if (!(cur() && !cur().display.length)) newConversation();
  saveState(); renderSidebar(); renderAll();
  appEl.classList.remove("sidebar-open"); inputEl.focus();
});
$("#chatNav").addEventListener("click", () => { appEl.classList.remove("sidebar-open"); chatEl.scrollTop = 0; inputEl.focus(); });
$("#searchBtn").addEventListener("click", () => {
  const inp = $("#searchInput");
  inp.classList.toggle("hidden");
  if (!inp.classList.contains("hidden")) inp.focus(); else { searchQuery = ""; inp.value = ""; renderSidebar(); }
});
$("#searchInput").addEventListener("input", (e) => { searchQuery = e.target.value; renderSidebar(); });
$("#menuBtn").addEventListener("click", () => appEl.classList.add("sidebar-open"));
$("#collapseBtn").addEventListener("click", () => appEl.classList.remove("sidebar-open"));

$("#clearBtn").addEventListener("click", () => {
  if (controller) controller.abort();
  const c = cur(); if (!c) return;
  c.history = []; c.display = []; c.title = "New Chat"; touch();
  syncActive(); saveState(); renderSidebar(); renderAll();
});
$("#exportBtn").addEventListener("click", () => {
  if (!display.length) return;
  const lines = [`# ${cur()?.title || "Chat"} — exported ${new Date().toLocaleString()}`, ""];
  for (const d of display) {
    lines.push(d.role === "user" ? "## You" : `## Assistant (${d.model || ""})`, "", d.text, "");
    if (d.usage) lines.push(`_Tokens: total ${d.usage.totalTokens ?? "-"}, reasoning ${d.usage.reasoningTokens ?? "-"}_`, "");
  }
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `chat-export-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.md`;
  a.click(); URL.revokeObjectURL(a.href);
});
$("#fallbackToggle").addEventListener("change", (e) => { store.fallback = e.target.checked; });
$("#modelSelectMain").addEventListener("change", (e) => { store.model = e.target.value; syncModelSelects(); });
$("#modelSelect").addEventListener("change", (e) => { store.model = e.target.value; syncModelSelects(); });

/* ---------------- settings / API key ---------------- */
const dialog = $("#settingsDialog");
function openSettings() {
  $("#apiKeyInput").value = store.key; $("#apiKeyInput").type = "password"; $("#toggleKeyBtn").textContent = "Show";
  syncModelSelects(); $("#systemInput").value = store.system;
  dialog.showModal();
}
$("#settingsBtn").addEventListener("click", openSettings);
$("#apiNav").addEventListener("click", openSettings);
$("#manageKeyBtn").addEventListener("click", openSettings);
$("#bannerSettings")?.addEventListener("click", openSettings);
$("#settingsCancel").addEventListener("click", () => dialog.close());
$("#toggleKeyBtn").addEventListener("click", () => {
  const inp = $("#apiKeyInput");
  const show = inp.type === "password";
  inp.type = show ? "text" : "password";
  $("#toggleKeyBtn").textContent = show ? "Hide" : "Show";
});
$("#settingsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  store.key = $("#apiKeyInput").value.trim();
  store.model = $("#modelSelect").value;
  store.system = $("#systemInput").value;
  dialog.close(); updateKeyUI();
});

/* ---------------- init ---------------- */
async function refreshHealth() {
  try {
    const r = await fetch("/api/health"); const d = await r.json();
    hasServerKey = !!d.hasServerKey;
    if (d.model && !localStorage.getItem("chat_model")) { store.model = d.model; }
  } catch { hasServerKey = false; }
  updateKeyUI();
}
loadState();
buildSkillBar(); buildEffortUI();
$("#fallbackToggle").checked = store.fallback;
renderSidebar(); renderAll(); updateStatsUI(); updateAutoHint(); syncModelSelects();
refreshHealth();
inputEl.focus();
