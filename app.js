const TASK_LIBRARY = [
  {
    id: "task-1",
    title: "企业官网落地页改版",
    stack: "Vue 3 / Vite / CSS 动效",
    difficulty: "medium",
    durationMin: 30,
    reward: 68,
    summary: "重做首屏、卖点区块和表单转化路径，强调首屏性能和视觉节奏。",
    focus: ["首屏加载", "响应式布局", "埋点与转化"]
  },
  {
    id: "task-2",
    title: "React 中后台表格页",
    stack: "React / TypeScript / Ant Design",
    difficulty: "hard",
    durationMin: 45,
    reward: 128,
    summary: "实现筛选、分页、批量操作和权限按钮控制，重点考察状态管理和性能。",
    focus: ["大表格性能", "权限控制", "异常兜底"]
  },
  {
    id: "task-3",
    title: "活动 H5 抽奖页",
    stack: "JavaScript / Canvas / 移动端适配",
    difficulty: "medium",
    durationMin: 25,
    reward: 88,
    summary: "做移动端活动页和抽奖弹层，要求兼容常见安卓机型。",
    focus: ["移动端适配", "动画体验", "弱网容错"]
  },
  {
    id: "task-4",
    title: "Next.js 品牌展示站",
    stack: "Next.js / Tailwind / SEO",
    difficulty: "hard",
    durationMin: 60,
    reward: 188,
    summary: "做多语言品牌站，需要兼顾首屏速度、SEO 和部署策略。",
    focus: ["SSR/SSG 选择", "SEO 结构化", "部署策略"]
  },
  {
    id: "task-5",
    title: "小程序首页重构",
    stack: "UniApp / 小程序组件",
    difficulty: "medium",
    durationMin: 40,
    reward: 118,
    summary: "重构首页模块并优化首屏白屏时间，处理埋点和异步接口。",
    focus: ["分包加载", "首屏渲染", "埋点设计"]
  },
  {
    id: "task-6",
    title: "Figma 转 React 组件页",
    stack: "React / SCSS / 组件抽象",
    difficulty: "easy",
    durationMin: 20,
    reward: 52,
    summary: "按设计稿做像素级还原，并抽出可复用组件。",
    focus: ["组件复用", "还原精度", "样式隔离"]
  }
];

const STORAGE_KEY = "vicework-simulator-state";
const TICK_MS = 1000;
const DEMO_MINUTE_MS = 1000;

const state = loadState();
let countdownTimer = null;

const els = {
  taskList: document.getElementById("taskList"),
  refreshTasksBtn: document.getElementById("refreshTasksBtn"),
  totalIncome: document.getElementById("totalIncome"),
  completedCount: document.getElementById("completedCount"),
  streakCount: document.getElementById("streakCount"),
  missionStatus: document.getElementById("missionStatus"),
  emptyMission: document.getElementById("emptyMission"),
  activeMission: document.getElementById("activeMission"),
  activeTaskTitle: document.getElementById("activeTaskTitle"),
  activeTaskMeta: document.getElementById("activeTaskMeta"),
  activeTaskReward: document.getElementById("activeTaskReward"),
  countdown: document.getElementById("countdown"),
  timerProgress: document.getElementById("timerProgress"),
  timerHint: document.getElementById("timerHint"),
  pauseTimerBtn: document.getElementById("pauseTimerBtn"),
  completeNowBtn: document.getElementById("completeNowBtn"),
  challengeForm: document.getElementById("challengeForm"),
  challengeInput: document.getElementById("challengeInput"),
  challengeList: document.getElementById("challengeList"),
  objectionForm: document.getElementById("objectionForm"),
  objectionInput: document.getElementById("objectionInput"),
  objectionList: document.getElementById("objectionList"),
  historyList: document.getElementById("historyList"),
  simMode: document.getElementById("simMode"),
  apiEndpoint: document.getElementById("apiEndpoint"),
  apiModel: document.getElementById("apiModel"),
  apiKey: document.getElementById("apiKey"),
  projectContext: document.getElementById("projectContext"),
  generateQuestionsBtn: document.getElementById("generateQuestionsBtn"),
  clearQuestionsBtn: document.getElementById("clearQuestionsBtn"),
  questionStatus: document.getElementById("questionStatus"),
  questionList: document.getElementById("questionList"),
  settlementModal: document.getElementById("settlementModal"),
  settlementTitle: document.getElementById("settlementTitle"),
  settlementText: document.getElementById("settlementText"),
  settlementIncome: document.getElementById("settlementIncome"),
  settlementTotal: document.getElementById("settlementTotal"),
  closeModalBtn: document.getElementById("closeModalBtn")
};

init();

function init() {
  bindEvents();
  hydrateSettings();
  regenerateTasks(false);
  reconcileMissionAfterReload();
  renderAll();
}

function bindEvents() {
  els.refreshTasksBtn.addEventListener("click", () => regenerateTasks(true));
  els.pauseTimerBtn.addEventListener("click", togglePauseMission);
  els.completeNowBtn.addEventListener("click", () => finishMission("manual"));
  els.challengeForm.addEventListener("submit", handleChallengeSubmit);
  els.objectionForm.addEventListener("submit", handleObjectionSubmit);
  els.generateQuestionsBtn.addEventListener("click", generateSimulationQuestions);
  els.clearQuestionsBtn.addEventListener("click", clearQuestions);
  els.closeModalBtn.addEventListener("click", closeModal);

  els.simMode.addEventListener("change", persistSettingsFromInputs);
  els.apiEndpoint.addEventListener("input", persistSettingsFromInputs);
  els.apiModel.addEventListener("input", persistSettingsFromInputs);
  els.apiKey.addEventListener("input", persistSettingsFromInputs);
  els.projectContext.addEventListener("input", persistSettingsFromInputs);
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const base = {
    tasks: [],
    activeMission: null,
    stats: {
      totalIncome: 0,
      completedCount: 0,
      streakCount: 0,
      lastCompletedDate: ""
    },
    history: [],
    settings: {
      simMode: "local",
      apiEndpoint: "https://api.deepseek.com/v1/chat/completions",
      apiModel: "deepseek-chat",
      apiKey: "",
      projectContext: ""
    },
    generatedQuestions: []
  };

  if (!raw) {
    return base;
  }

  try {
    return {
      ...base,
      ...JSON.parse(raw),
      stats: { ...base.stats, ...(JSON.parse(raw).stats || {}) },
      settings: { ...base.settings, ...(JSON.parse(raw).settings || {}) }
    };
  } catch {
    return base;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function hydrateSettings() {
  els.simMode.value = state.settings.simMode;
  els.apiEndpoint.value = state.settings.apiEndpoint;
  els.apiModel.value = state.settings.apiModel;
  els.apiKey.value = state.settings.apiKey;
  els.projectContext.value = state.settings.projectContext;
}

function persistSettingsFromInputs() {
  state.settings.simMode = els.simMode.value;
  state.settings.apiEndpoint = els.apiEndpoint.value.trim();
  state.settings.apiModel = els.apiModel.value.trim();
  state.settings.apiKey = els.apiKey.value.trim();
  state.settings.projectContext = els.projectContext.value.trim();
  saveState();
}

function regenerateTasks(reshuffle) {
  const pool = [...TASK_LIBRARY];
  const picked = [];
  while (pool.length && picked.length < 4) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  state.tasks = reshuffle || state.tasks.length === 0 ? picked : state.tasks;
  saveState();
  renderTasks();
}

function reconcileMissionAfterReload() {
  if (!state.activeMission) {
    return;
  }

  if (state.activeMission.status === "running") {
    const now = Date.now();
    const elapsed = now - state.activeMission.startedAt - state.activeMission.totalPausedMs;
    const remaining = state.activeMission.totalDurationMs - elapsed;
    state.activeMission.remainingMs = Math.max(0, remaining);
    if (state.activeMission.remainingMs <= 0) {
      finishMission("auto");
    } else {
      startTimer();
    }
  }
}

function renderAll() {
  renderTasks();
  renderStats();
  renderMission();
  renderChallengeList();
  renderObjectionList();
  renderHistory();
  renderQuestions();
}

function renderTasks() {
  els.taskList.innerHTML = "";
  state.tasks.forEach((task) => {
    const card = document.createElement("article");
    card.className = "task-card";
    const disabled = Boolean(state.activeMission);
    card.innerHTML = `
      <div class="task-card-header">
        <div>
          <p class="tiny-label">模拟项目</p>
          <h3>${task.title}</h3>
        </div>
        <div class="difficulty ${task.difficulty}">${difficultyText(task.difficulty)}</div>
      </div>
      <p class="subtle">${task.summary}</p>
      <div class="tag-row">
        <span class="tag">${task.stack}</span>
        <span class="tag">${task.durationMin} 分钟</span>
        <span class="tag">收益 ¥${task.reward}</span>
      </div>
      <div class="task-card-meta">
        <div class="subtle">${task.focus.join(" · ")}</div>
        <button class="primary-btn" ${disabled ? "disabled" : ""}>接这个单</button>
      </div>
    `;

    card.querySelector("button").addEventListener("click", () => startMission(task.id));
    els.taskList.appendChild(card);
  });
}

function renderStats() {
  els.totalIncome.textContent = `¥${state.stats.totalIncome}`;
  els.completedCount.textContent = String(state.stats.completedCount);
  els.streakCount.textContent = `${state.stats.streakCount} 天`;
}

function renderMission() {
  const mission = state.activeMission;
  const hasMission = Boolean(mission);
  els.emptyMission.classList.toggle("hidden", hasMission);
  els.activeMission.classList.toggle("hidden", !hasMission);

  if (!hasMission) {
    updateMissionStatus("待接单", "idle");
    els.pauseTimerBtn.textContent = "暂停";
    els.countdown.textContent = "00:00";
    els.timerProgress.style.width = "0%";
    return;
  }

  updateMissionStatus(mission.status === "paused" ? "已暂停" : "开发中", mission.status === "paused" ? "paused" : "running");
  els.activeTaskTitle.textContent = mission.title;
  els.activeTaskReward.textContent = `¥${mission.reward}`;
  els.activeTaskMeta.textContent = `${mission.stack} · ${difficultyText(mission.difficulty)} · ${mission.durationMin} 分钟`;
  els.countdown.textContent = formatCountdown(mission.remainingMs);
  els.timerProgress.style.width = `${missionProgress(mission)}%`;
  els.pauseTimerBtn.textContent = mission.status === "paused" ? "继续" : "暂停";
  els.timerHint.textContent = mission.status === "paused"
    ? "倒计时已暂停，可以补充难点和质疑点。"
    : `演示模式：1 秒 = 1 分钟，${mission.durationMin} 分钟任务约 ${mission.durationMin} 秒完成`;
}

function renderChallengeList() {
  const items = state.activeMission?.challengePoints || [];
  renderEditableList(els.challengeList, items, "challengePoints");
}

function renderObjectionList() {
  const items = state.activeMission?.objectionPoints || [];
  renderEditableList(els.objectionList, items, "objectionPoints");
}

function renderEditableList(container, items, key) {
  container.innerHTML = "";
  if (!items.length) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="subtle">还没填写，建议至少写 3 条，这样后面的面试模拟会更有针对性。</span>`;
    container.appendChild(li);
    return;
  }

  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${escapeHtml(item)}</span>
      <button class="remove-btn" type="button">删除</button>
    `;
    li.querySelector("button").addEventListener("click", () => {
      state.activeMission[key].splice(index, 1);
      saveState();
      key === "challengePoints" ? renderChallengeList() : renderObjectionList();
    });
    container.appendChild(li);
  });
}

function renderHistory() {
  els.historyList.innerHTML = "";
  if (!state.history.length) {
    els.historyList.innerHTML = `<div class="history-item"><div><strong>暂无记录</strong><p class="subtle">完成第一个模拟项目后，这里会显示最近收益和训练轨迹。</p></div></div>`;
    return;
  }

  state.history.slice(0, 5).forEach((item) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <div>
        <strong>${item.title}</strong>
        <p class="subtle">${item.dateLabel} · ${item.mode === "manual" ? "手动交付" : "倒计时完成"}</p>
      </div>
      <div>
        <strong>+¥${item.reward}</strong>
        <p class="subtle">${item.durationMin} 分钟</p>
      </div>
    `;
    els.historyList.appendChild(div);
  });
}

function renderQuestions() {
  els.questionList.innerHTML = "";
  if (!state.generatedQuestions.length) {
    return;
  }

  state.generatedQuestions.forEach((item, index) => {
    const article = document.createElement("article");
    article.className = "question-item";
    article.innerHTML = `
      <p class="tiny-label">第 ${index + 1} 轮追问</p>
      <h4>${escapeHtml(item.question)}</h4>
      <p class="subtle"><strong>质疑点：</strong>${escapeHtml(item.concern)}</p>
      <p class="subtle"><strong>回答提示：</strong>${escapeHtml(item.hint)}</p>
    `;
    els.questionList.appendChild(article);
  });
}

function startMission(taskId) {
  if (state.activeMission) return;
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  const projectContext = state.settings.projectContext.trim();
  state.activeMission = {
    ...task,
    status: "running",
    startedAt: Date.now(),
    totalPausedMs: 0,
    pausedAt: null,
    totalDurationMs: task.durationMin * DEMO_MINUTE_MS,
    remainingMs: task.durationMin * DEMO_MINUTE_MS,
    challengePoints: [
      `如果要在 ${task.durationMin} 分钟内完成，优先级怎么排？`,
      `这个项目最容易出问题的技术环节是什么？`
    ],
    objectionPoints: [
      "为什么你的方案比常规做法更合适？",
      "如果上线后性能不达标，你先排查哪一层？"
    ],
    contextSnapshot: projectContext
  };

  saveState();
  renderAll();
  startTimer();
}

function startTimer() {
  stopTimer();
  countdownTimer = window.setInterval(() => {
    if (!state.activeMission || state.activeMission.status !== "running") return;

    const elapsed = Date.now() - state.activeMission.startedAt - state.activeMission.totalPausedMs;
    state.activeMission.remainingMs = Math.max(0, state.activeMission.totalDurationMs - elapsed);
    renderMission();

    if (state.activeMission.remainingMs <= 0) {
      finishMission("auto");
    }
  }, TICK_MS);
}

function stopTimer() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function togglePauseMission() {
  if (!state.activeMission) return;

  if (state.activeMission.status === "running") {
    state.activeMission.status = "paused";
    state.activeMission.pausedAt = Date.now();
    stopTimer();
  } else {
    state.activeMission.status = "running";
    if (state.activeMission.pausedAt) {
      state.activeMission.totalPausedMs += Date.now() - state.activeMission.pausedAt;
      state.activeMission.pausedAt = null;
    }
    startTimer();
  }

  saveState();
  renderMission();
}

function finishMission(mode) {
  if (!state.activeMission) return;
  stopTimer();

  const mission = state.activeMission;
  state.stats.totalIncome += mission.reward;
  state.stats.completedCount += 1;
  state.stats.streakCount = computeNewStreak(state.stats.lastCompletedDate);
  state.stats.lastCompletedDate = todayKey();

  state.history.unshift({
    id: `${mission.id}-${Date.now()}`,
    title: mission.title,
    reward: mission.reward,
    durationMin: mission.durationMin,
    mode,
    dateLabel: new Date().toLocaleString("zh-CN")
  });
  state.history = state.history.slice(0, 20);

  state.generatedQuestions = [];
  state.activeMission = null;
  saveState();
  renderAll();
  openSettlementModal(mission);
}

function computeNewStreak(lastCompletedDate) {
  if (!lastCompletedDate) return 1;
  const today = new Date();
  const prev = parseDate(lastCompletedDate);
  const diffDays = Math.floor((stripTime(today) - stripTime(prev)) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return state.stats.streakCount;
  if (diffDays === 1) return state.stats.streakCount + 1;
  return 1;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function openSettlementModal(mission) {
  els.settlementTitle.textContent = `${mission.title} 已验收`;
  els.settlementText.textContent = `你刚完成了一次 ${difficultyText(mission.difficulty)} 项目模拟，这笔收益已经计入你的虚拟账户。`;
  els.settlementIncome.textContent = `¥${mission.reward}`;
  els.settlementTotal.textContent = `¥${state.stats.totalIncome}`;
  els.settlementModal.classList.remove("hidden");
}

function closeModal() {
  els.settlementModal.classList.add("hidden");
}

function handleChallengeSubmit(event) {
  event.preventDefault();
  if (!state.activeMission) return;
  const value = els.challengeInput.value.trim();
  if (!value) return;
  state.activeMission.challengePoints.push(value);
  els.challengeInput.value = "";
  saveState();
  renderChallengeList();
}

function handleObjectionSubmit(event) {
  event.preventDefault();
  if (!state.activeMission) return;
  const value = els.objectionInput.value.trim();
  if (!value) return;
  state.activeMission.objectionPoints.push(value);
  els.objectionInput.value = "";
  saveState();
  renderObjectionList();
}

async function generateSimulationQuestions() {
  persistSettingsFromInputs();

  const mission = state.activeMission;
  const context = state.settings.projectContext.trim();
  if (!mission && !context) {
    els.questionStatus.textContent = "先接一个项目，或者先写一段项目背景。";
    return;
  }

  els.generateQuestionsBtn.disabled = true;
  els.questionStatus.textContent = state.settings.simMode === "ai" ? "正在调用 AI 生成更有攻击性的追问..." : "正在本地生成免费模拟问题...";

  try {
    if (state.settings.simMode === "ai") {
      const questions = await generateQuestionsWithAI(mission, context);
      state.generatedQuestions = questions;
      els.questionStatus.textContent = `已生成 ${questions.length} 条 AI 模拟追问。`;
    } else {
      const questions = generateQuestionsLocally(mission, context);
      state.generatedQuestions = questions;
      els.questionStatus.textContent = `已生成 ${questions.length} 条本地模拟追问。`;
    }
    saveState();
    renderQuestions();
  } catch (error) {
    const fallback = generateQuestionsLocally(mission, context);
    state.generatedQuestions = fallback;
    saveState();
    renderQuestions();
    els.questionStatus.textContent = `AI 生成失败，已切换到本地免费模拟。原因：${error.message}`;
  } finally {
    els.generateQuestionsBtn.disabled = false;
  }
}

async function generateQuestionsWithAI(mission, context) {
  if (!state.settings.apiKey) {
    throw new Error("未填写 API Key");
  }
  if (!state.settings.apiEndpoint || !state.settings.apiModel) {
    throw new Error("接口地址或模型名为空");
  }

  const payload = buildPromptPayload(mission, context);
  const response = await fetch(state.settings.apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${state.settings.apiKey}`
    },
    body: JSON.stringify({
      model: state.settings.apiModel,
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content: "你是严格的技术面试官和甲方，擅长针对前端项目提出尖锐、具体、可落地的质疑，并给出回答提示。请只输出 JSON 数组。"
        },
        {
          role: "user",
          content: payload
        }
      ],
      response_format: {
        type: "json_object"
      }
    })
  });

  if (!response.ok) {
    throw new Error(`接口响应 ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("模型未返回内容");
  }

  const parsed = safeParseAIResponse(content);
  if (!parsed.length) {
    throw new Error("返回内容无法解析");
  }
  return parsed.slice(0, 6);
}

function buildPromptPayload(mission, context) {
  const challengePoints = mission?.challengePoints || [];
  const objectionPoints = mission?.objectionPoints || [];
  const projectSummary = mission
    ? `项目：${mission.title}；技术栈：${mission.stack}；难度：${difficultyText(mission.difficulty)}；目标：${mission.summary}`
    : "当前没有已接任务，请基于用户填写的项目背景生成追问。";

  return `
请围绕下面的前端项目背景，输出 6 条严格的面试/甲方质疑模拟。
每条都必须包含：
1. question：尖锐追问
2. concern：它背后的真实担忧
3. hint：候选人答题思路提示

要求：
- 追问必须具体，不能空泛
- 至少覆盖：性能、架构选择、异常场景、业务边界、协作交付
- 语气像真实面试官
- 只输出 JSON，对象格式为 {"questions":[...]}

项目信息：
${projectSummary}

用户补充背景：
${context || "无"}

用户填写的项目难点：
${challengePoints.length ? challengePoints.join("；") : "无"}

用户填写的质疑点：
${objectionPoints.length ? objectionPoints.join("；") : "无"}
  `.trim();
}

function safeParseAIResponse(content) {
  try {
    const parsed = JSON.parse(content);
    const items = Array.isArray(parsed) ? parsed : parsed.questions;
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => ({
        question: item.question || "请说明你的方案为什么成立。",
        concern: item.concern || "缺少明确论证。",
        hint: item.hint || "从背景、取舍、结果三段来回答。"
      }));
  } catch {
    return [];
  }
}

function generateQuestionsLocally(mission, context) {
  const seedText = [
    mission?.title || "",
    mission?.stack || "",
    mission?.summary || "",
    context || "",
    ...(mission?.challengePoints || []),
    ...(mission?.objectionPoints || [])
  ].join(" ");

  const challengePoints = mission?.challengePoints || extractKeywords(context);
  const objectionPoints = mission?.objectionPoints || [];

  const bank = [
    {
      concern: "你可能只是罗列了技术名词，没有真正解释取舍。",
      question: `如果这个项目必须在短时间上线，你会优先保留哪些功能，砍掉哪些功能？为什么？`,
      hint: "按业务价值、风险和上线窗口排序，说明 MVP 边界。"
    },
    {
      concern: "你的性能优化可能停留在口号层，没有落到指标。",
      question: `你提到要做性能优化，那你会看哪些指标？如果首屏超过 3 秒，你第一步查什么？`,
      hint: "从监控指标、资源体积、渲染阻塞和接口耗时四层展开。"
    },
    {
      concern: "方案选型缺少论证，可能只是跟风。",
      question: `为什么这里选 ${guessFramework(seedText)}，而不是另一套更常见的方案？你的依据是什么？`,
      hint: "从团队熟悉度、交付周期、SEO/性能、维护成本回答。"
    },
    {
      concern: "你可能忽略了边界和异常场景。",
      question: `如果接口超时、部分数据为空、用户重复点击提交，这个页面会出现什么问题？你怎么兜底？`,
      hint: "讲重试、占位、幂等、防抖、错误提示和降级策略。"
    },
    {
      concern: "你可能只会写页面，不会考虑协作交付。",
      question: `设计稿频繁改动、后端接口延迟交付时，你怎么保证项目还按时上线？`,
      hint: "从 mock、接口适配层、拆分里程碑和同步机制回答。"
    },
    {
      concern: "你可能说了难点，但没说验证结果。",
      question: `你怎么证明你做的优化真的有效？上线前后你会拿什么数据比较？`,
      hint: "回答性能监控、用户行为、错误率和业务指标。"
    },
    {
      concern: "复杂状态管理可能让代码失控。",
      question: `如果一个页面同时有筛选、分页、缓存、权限和弹窗状态，你会怎么组织状态，避免代码越来越乱？`,
      hint: "按局部状态、服务端状态、共享状态分层。"
    },
    {
      concern: "你可能没有考虑可维护性。",
      question: `项目交付给别人接手时，哪些代码结构和文档最能减少接手成本？`,
      hint: "说清组件边界、目录约定、接口类型、注释和文档。"
    }
  ];

  const dynamic = [];
  challengePoints.slice(0, 2).forEach((item) => {
    dynamic.push({
      question: `你写了“${item}”，那如果面试官继续追问：这个问题为什么会发生？你有没有更轻量的替代方案？`,
      concern: "你对自己写下的难点未必已经真正理解到根因。",
      hint: "先说成因，再说方案对比，最后说为什么选当前方案。"
    });
  });

  objectionPoints.slice(0, 2).forEach((item) => {
    dynamic.push({
      question: `你自己列了“${item}”，如果甲方要求你当场证明，你会拿什么证据说服对方？`,
      concern: "缺少证据链，只能靠主观判断。",
      hint: "从数据、案例、压测结果、线上监控和成本收益说明。"
    });
  });

  return [...dynamic, ...bank].slice(0, 6);
}

function extractKeywords(text) {
  if (!text) return [];
  return text
    .split(/[，。；、\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function guessFramework(text) {
  if (/next/i.test(text)) return "Next.js";
  if (/vue/i.test(text)) return "Vue";
  if (/react/i.test(text)) return "React";
  if (/uni|小程序/i.test(text)) return "UniApp / 小程序原生";
  return "当前技术栈";
}

function clearQuestions() {
  state.generatedQuestions = [];
  saveState();
  renderQuestions();
  els.questionStatus.textContent = "结果已清空。";
}

function updateMissionStatus(text, className) {
  els.missionStatus.textContent = text;
  els.missionStatus.className = `status-badge ${className}`;
}

function difficultyText(level) {
  return ({
    easy: "低难度",
    medium: "中难度",
    hard: "高难度"
  })[level] || "普通";
}

function formatCountdown(ms) {
  // 演示模式下 1 秒真实时间 = 1 分钟虚拟工时，这里换算成虚拟工时显示
  const virtualSeconds = Math.ceil(ms / 1000) * 60;
  const minutes = String(Math.floor(virtualSeconds / 60)).padStart(2, "0");
  const seconds = String(virtualSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function missionProgress(mission) {
  const total = mission.totalDurationMs || 1;
  const done = Math.min(1, Math.max(0, 1 - mission.remainingMs / total));
  return Math.round(done * 100);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
