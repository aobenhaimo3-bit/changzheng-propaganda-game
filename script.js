const contexts = [
  { id: "xiangjiang", label: "湘江战役后，红军处境艰难，需要稳定士气并争取群众" },
  { id: "zunyi", label: "遵义会议后，红军战略转折，需要扩大政治影响" },
  { id: "warlordArea", label: "经过贵州、四川等地，面对地方军阀部队" },
  { id: "arrearsSoldiers", label: "面对欠饷严重、受压迫的国民党底层士兵" },
  { id: "minorityArea", label: "经过少数民族聚居地区，需要争取当地群众理解" },
  { id: "lowLiteracy", label: "遇到识字率较低的群众和士兵，需要选择更通俗的宣传形式" }
];

const targets = ["国民党底层士兵", "地方军阀士兵", "普通群众", "少数民族地区群众", "红军内部战士", "敌军军官"];
const media = ["墙体标语", "短口号", "宣传漫画", "正式布告", "童谣/歌谣", "传单"];
const contents = ["欠饷与苛捐杂税", "优待俘虏", "穷人不打穷人", "揭露军阀压迫", "民族平等与纪律严明", "红军是工农自己的队伍", "反对官长腐败", "长征理想与革命信念"];
const tones = ["通俗亲切", "激烈号召", "讽刺揭露", "正式庄重", "安抚承诺", "鼓舞动员"];

const steps = [
  {
    key: "context",
    label: "情境",
    number: "第一步",
    tag: "湘江血战之后",
    title: "选择长征情境",
    description: "先判断你所处的历史节点。不同情境中的主要矛盾不同，宣传策略也应随之变化。",
    options: contexts
  },
  {
    key: "target",
    label: "对象",
    number: "第二步",
    tag: "敌我之间",
    title: "选择宣传对象",
    description: "攻心战首先要问清楚：话是说给谁听的？对象不同，痛点和接受方式也不同。",
    options: targets
  },
  {
    key: "media",
    label: "媒介",
    number: "第三步",
    tag: "标语与图像",
    title: "选择宣传形式",
    description: "选择一种最适合传播的媒介。它决定信息能否被看见、记住和转述。",
    options: media
  },
  {
    key: "content",
    label: "内容",
    number: "第四步",
    tag: "矛盾焦点",
    title: "选择宣传内容",
    description: "内容要抓住矛盾焦点。好的宣传不是空喊口号，而是回应受众最关心的问题。",
    options: contents
  },
  {
    key: "tone",
    label: "语气",
    number: "第五步",
    tag: "号角将响",
    title: "选择宣传语气",
    description: "最后决定表达的语气。语气会影响宣传是被接受、被记住，还是被排斥。",
    options: tones
  }
];

const dimensionNames = {
  targetMatch: "对象匹配",
  contentMatch: "内容匹配",
  mediaMatch: "媒介匹配",
  toneMatch: "语气匹配"
};

const judgementByScore = {
  0: "明显偏离",
  1: "部分偏离",
  2: "基本契合",
  3: "高度契合"
};

const state = {
  context: null,
  target: null,
  media: null,
  content: null,
  tone: null
};

let currentStep = 0;

const introPanel = document.querySelector("#introPanel");
const knowledgePanel = document.querySelector("#knowledgePanel");
const selectionScreen = document.querySelector("#selectionScreen");
const resultScreen = document.querySelector("#resultScreen");
const battleReport = document.querySelector("#battleReport");
const routeList = document.querySelector("#routeList");
const stepNumber = document.querySelector("#stepNumber");
const nodeTag = document.querySelector("#nodeTag");
const stepTitle = document.querySelector("#stepTitle");
const stepDescription = document.querySelector("#stepDescription");
const stepOptions = document.querySelector("#stepOptions");
const prevButton = document.querySelector("#prevButton");
const nextButton = document.querySelector("#nextButton");
const resultButton = document.querySelector("#resultButton");
const backButton = document.querySelector("#backButton");
const apiModal = document.querySelector("#apiModal");
const closeApiModal = document.querySelector("#closeApiModal");
const apiKeyInput = document.querySelector("#deepseekApiKey");
const aiStatus = document.querySelector("#aiStatus");

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";

const ruleProfiles = {
  xiangjiang: {
    target: { best: ["红军内部战士", "普通群众"], good: ["国民党底层士兵"] },
    content: { best: ["长征理想与革命信念", "红军是工农自己的队伍"], good: ["穷人不打穷人", "民族平等与纪律严明"] },
    media: { best: ["短口号", "墙体标语", "童谣/歌谣"], good: ["传单", "正式布告"] },
    tone: { best: ["鼓舞动员", "安抚承诺", "通俗亲切"], good: ["正式庄重", "激烈号召"] },
    history: "湘江战役后，宣传的重要任务是稳定士气、恢复信心，并争取沿途群众理解。这说明红军宣传不仅面对敌军，也承担内部动员和群众沟通功能。",
    improvement: "可优先突出长征理想、革命信念与红军纪律，并使用鼓舞动员或安抚承诺的表达。"
  },
  zunyi: {
    target: { best: ["普通群众", "红军内部战士", "国民党底层士兵"], good: ["地方军阀士兵"] },
    content: { best: ["长征理想与革命信念", "红军是工农自己的队伍", "穷人不打穷人"], good: ["优待俘虏", "民族平等与纪律严明"] },
    media: { best: ["墙体标语", "短口号", "传单"], good: ["正式布告", "童谣/歌谣"] },
    tone: { best: ["鼓舞动员", "激烈号召", "通俗亲切"], good: ["正式庄重"] },
    history: "遵义会议后，红军需要把战略转折转化为更广泛的政治影响。标语、口号和传单可以让路线变化进入群众视野。",
    improvement: "可加强革命信念与工农立场表达，并选择更便于扩散的短口号、墙体标语或传单。"
  },
  warlordArea: {
    target: { best: ["地方军阀士兵", "普通群众"], good: ["国民党底层士兵"] },
    content: { best: ["揭露军阀压迫", "欠饷与苛捐杂税", "反对官长腐败"], good: ["穷人不打穷人", "优待俘虏"] },
    media: { best: ["宣传漫画", "墙体标语", "短口号"], good: ["传单"] },
    tone: { best: ["讽刺揭露", "激烈号召", "通俗亲切"], good: ["安抚承诺"] },
    history: "在地方军阀势力范围内，宣传需要抓住军阀压迫、欠饷和官长腐败等矛盾，促使士兵和群众重新理解红军立场。",
    improvement: "可把内容转向揭露军阀压迫或反对官长腐败，并用漫画、标语增强现场冲击力。"
  },
  arrearsSoldiers: {
    target: { best: ["国民党底层士兵"], good: ["地方军阀士兵"] },
    content: { best: ["欠饷与苛捐杂税", "优待俘虏", "穷人不打穷人"], good: ["反对官长腐败", "红军是工农自己的队伍"] },
    media: { best: ["短口号", "墙体标语", "传单"], good: ["宣传漫画"] },
    tone: { best: ["通俗亲切", "安抚承诺", "讽刺揭露"], good: ["激烈号召"] },
    history: "这一结果体现了红军宣传从经济痛点切入、建立阶级共情、进而瓦解敌军心理防线的攻心逻辑。",
    improvement: "如果进一步加入优待俘虏或穷人不打穷人的内容，攻心效果会更完整。"
  },
  minorityArea: {
    target: { best: ["少数民族地区群众"], good: ["普通群众"] },
    content: { best: ["民族平等与纪律严明"], good: ["红军是工农自己的队伍", "长征理想与革命信念"] },
    media: { best: ["正式布告", "墙体标语", "短口号"], good: ["传单", "童谣/歌谣"] },
    tone: { best: ["安抚承诺", "正式庄重", "通俗亲切"], good: ["鼓舞动员"] },
    history: "经过少数民族聚居地区时，宣传的关键是建立信任。纪律、平等和尊重能降低误解，使群众愿意听见红军主张。",
    improvement: "应优先强调民族平等与纪律严明，语气宜安抚、庄重，避免只做讽刺性揭露。"
  },
  lowLiteracy: {
    target: { best: ["普通群众", "国民党底层士兵"], good: ["地方军阀士兵", "少数民族地区群众"] },
    content: { best: ["穷人不打穷人", "优待俘虏", "红军是工农自己的队伍"], good: ["民族平等与纪律严明", "欠饷与苛捐杂税"] },
    media: { best: ["宣传漫画", "童谣/歌谣", "短口号"], good: ["墙体标语"] },
    tone: { best: ["通俗亲切", "鼓舞动员", "安抚承诺"], good: ["激烈号召"] },
    history: "这一情境体现了多模态宣传的价值：漫画、童谣和短口号能够降低识字门槛，让政治信息在口头和视觉传播中扩散。",
    improvement: "可选用宣传漫画、童谣/歌谣或短口号，并把内容压缩为更容易记忆的阶级共情表达。"
  }
};

function renderRoute() {
  routeList.innerHTML = steps
    .map((step, index) => {
      const status = index === currentStep ? "active" : index < currentStep ? "done" : "";
      return `
        <li class="route-item ${status}">
          <span class="route-index">${index + 1}</span>
          <span>${step.label}</span>
        </li>
      `;
    })
    .join("");
}

function renderStep() {
  const step = steps[currentStep];
  document.body.dataset.stage = step.key;
  stepNumber.textContent = step.number;
  nodeTag.textContent = step.tag;
  stepTitle.textContent = step.title;
  stepDescription.textContent = step.description;

  stepOptions.innerHTML = step.options
    .map((option) => {
      const value = typeof option === "string" ? option : option.id;
      const label = typeof option === "string" ? option : option.label;
      const selected = state[step.key] === value ? "selected" : "";
      return `<button class="option-button ${selected}" type="button" data-value="${value}">${label}</button>`;
    })
    .join("");

  stepOptions.querySelectorAll(".option-button").forEach((button) => {
    button.addEventListener("click", () => {
      state[step.key] = button.dataset.value;
      renderStep();
    });
  });

  prevButton.disabled = currentStep === 0;
  nextButton.classList.toggle("hidden", currentStep === steps.length - 1);
  resultButton.classList.toggle("hidden", currentStep !== steps.length - 1);
  nextButton.disabled = !state[step.key];
  resultButton.disabled = !state[step.key];
  renderRoute();
}

function getContextLabel(contextId) {
  const context = contexts.find((item) => item.id === contextId);
  return context ? context.label : "";
}

function getSelection() {
  return {
    context: state.context,
    contextLabel: getContextLabel(state.context),
    target: state.target,
    media: state.media,
    content: state.content,
    tone: state.tone
  };
}

function hasCompletedSelection(selection) {
  return selection.context && selection.target && selection.media && selection.content && selection.tone;
}

function matchScore(value, rule) {
  if (!value || !rule) return 0;
  if (rule.best.includes(value)) return 3;
  if (rule.good.includes(value)) return 2;
  return 1;
}

function scoreToJudgement(score) {
  return judgementByScore[Math.max(0, Math.min(3, score))];
}

function getScores(selection) {
  const profile = ruleProfiles[selection.context] || ruleProfiles.xiangjiang;
  return {
    targetMatch: matchScore(selection.target, profile.target),
    contentMatch: matchScore(selection.content, profile.content),
    mediaMatch: matchScore(selection.media, profile.media),
    toneMatch: matchScore(selection.tone, profile.tone)
  };
}

function getDimensionPoints(scores) {
  return {
    targetMatch: Math.round((scores.targetMatch / 3) * 25),
    contentMatch: Math.round((scores.contentMatch / 3) * 25),
    mediaMatch: Math.round((scores.mediaMatch / 3) * 25),
    toneMatch: Math.round((scores.toneMatch / 3) * 25)
  };
}

function getLevelByTotal(totalScore) {
  if (totalScore >= 88) return "A";
  if (totalScore >= 70) return "B";
  if (totalScore >= 50) return "C";
  return "D";
}

function getLevelTemplate(level) {
  const templates = {
    A: { resultTitle: "精准攻心，成功瓦解", success: true, statusText: "成功", summary: "策略高度匹配，宣传对象、内容、形式、语气均合理。" },
    B: { resultTitle: "宣传见效，仍需加强", success: "partial", statusText: "部分成功", summary: "总体方向正确，但仍有一处明显可优化。" },
    C: { resultTitle: "传播受阻，效果有限", success: "partial", statusText: "部分成功", summary: "内容或对象有一定合理性，但形式、语气或场景匹配不足。" },
    D: { resultTitle: "策略失当，攻心失败", success: false, statusText: "失败", summary: "选择与场景严重不匹配，难以形成有效宣传。" }
  };
  return templates[level];
}

function getDimensionJudgement(scores) {
  return {
    targetMatch: scoreToJudgement(scores.targetMatch),
    contentMatch: scoreToJudgement(scores.contentMatch),
    mediaMatch: scoreToJudgement(scores.mediaMatch),
    toneMatch: scoreToJudgement(scores.toneMatch)
  };
}

function getWeakestTip(profile, scores) {
  const weakest = Object.entries(scores).sort((a, b) => a[1] - b[1])[0][0];
  const tips = {
    targetMatch: `建议把宣传对象调整为“${profile.target.best[0]}”，先对准该情境中最需要争取的人群。`,
    contentMatch: `建议优先使用“${profile.content.best[0]}”这类内容，直接回应场景中的核心矛盾。`,
    mediaMatch: `建议改用“${profile.media.best[0]}”或“${profile.media.best[1]}”，让信息更容易被看见、记住和转述。`,
    toneMatch: `建议采用“${profile.tone.best[0]}”的语气，使表达方式更贴近受众心理。`
  };
  return scores[weakest] >= 2 ? profile.improvement : tips[weakest];
}

function judgeLocally(selection) {
  const profile = ruleProfiles[selection.context] || ruleProfiles.xiangjiang;
  const scores = getScores(selection);
  const dimensionPoints = getDimensionPoints(scores);
  const totalScore = Object.values(dimensionPoints).reduce((sum, value) => sum + value, 0);
  const resultLevel = getLevelByTotal(totalScore);
  const template = getLevelTemplate(resultLevel);

  return {
    resultLevel,
    resultTitle: template.resultTitle,
    success: template.success,
    statusText: template.statusText,
    resultSummary: template.summary,
    totalScore,
    dimensionScores: dimensionPoints,
    dimensionJudgement: getDimensionJudgement(scores),
    storyFeedback: `战报判定：你选择以“${selection.media}”面向“${selection.target}”，重点表达“${selection.content}”，语气为“${selection.tone}”。这一部署在当前情境中的综合匹配度为 ${totalScore} 分。`,
    historicalExplanation: profile.history,
    improvement: getWeakestTip(profile, scores),
    aiAdvice: "当前使用本地规则生成建议。如通过隐藏配置填入可用的 DeepSeek API Key，系统会尝试生成更具体的 AI 建议。"
  };
}

function getTemporaryApiKey() {
  return sessionStorage.getItem("deepseek_api_key") || "";
}

function setAIStatus(text) {
  aiStatus.textContent = text;
}

function buildAIPrompt(selection, localResult) {
  return `
你是一名中国近现代史纲要课程的教学展示评估助手。请根据学生在网页小游戏中的选择，生成长征时期红军宣传策略分析。
只返回 JSON，不要返回 Markdown。等级规则：A 为 88-100 分，B 为 70-87 分，C 为 50-69 分，D 为 0-49 分。
四个维度分数相加必须等于 totalScore，每项 0-25 分。四个维度文字只能使用：高度契合、基本契合、部分偏离、明显偏离。

JSON 字段：
resultLevel, resultTitle, success, statusText, resultSummary, totalScore, dimensionScores, dimensionJudgement, storyFeedback, historicalExplanation, improvement, aiAdvice

玩家选择：
长征情境：${selection.contextLabel}
宣传对象：${selection.target}
宣传形式：${selection.media}
宣传内容：${selection.content}
宣传语气：${selection.tone}

本地规则初判：
等级：${localResult.resultLevel}
总分：${localResult.totalScore}
对象：${localResult.dimensionJudgement.targetMatch}，${localResult.dimensionScores.targetMatch} 分
内容：${localResult.dimensionJudgement.contentMatch}，${localResult.dimensionScores.contentMatch} 分
媒介：${localResult.dimensionJudgement.mediaMatch}，${localResult.dimensionScores.mediaMatch} 分
语气：${localResult.dimensionJudgement.toneMatch}，${localResult.dimensionScores.toneMatch} 分
`;
}

function extractJSON(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 返回内容不是 JSON。");
  }
  return JSON.parse(text.slice(start, end + 1));
}

function normalizeAIResult(aiResult, localFallback) {
  const dimensionScores = {
    targetMatch: Number(aiResult.dimensionScores?.targetMatch ?? localFallback.dimensionScores.targetMatch),
    contentMatch: Number(aiResult.dimensionScores?.contentMatch ?? localFallback.dimensionScores.contentMatch),
    mediaMatch: Number(aiResult.dimensionScores?.mediaMatch ?? localFallback.dimensionScores.mediaMatch),
    toneMatch: Number(aiResult.dimensionScores?.toneMatch ?? localFallback.dimensionScores.toneMatch)
  };
  const totalScore = Number(aiResult.totalScore ?? Object.values(dimensionScores).reduce((sum, value) => sum + value, 0));
  const resultLevel = aiResult.resultLevel || getLevelByTotal(totalScore);
  const template = getLevelTemplate(resultLevel);

  return {
    resultLevel,
    resultTitle: aiResult.resultTitle || template.resultTitle,
    success: aiResult.success ?? template.success,
    statusText: aiResult.statusText || formatSuccess(aiResult.success ?? template.success),
    resultSummary: aiResult.resultSummary || template.summary,
    totalScore,
    dimensionScores,
    dimensionJudgement: {
      targetMatch: aiResult.dimensionJudgement?.targetMatch || localFallback.dimensionJudgement.targetMatch,
      contentMatch: aiResult.dimensionJudgement?.contentMatch || localFallback.dimensionJudgement.contentMatch,
      mediaMatch: aiResult.dimensionJudgement?.mediaMatch || localFallback.dimensionJudgement.mediaMatch,
      toneMatch: aiResult.dimensionJudgement?.toneMatch || localFallback.dimensionJudgement.toneMatch
    },
    storyFeedback: aiResult.storyFeedback || localFallback.storyFeedback,
    historicalExplanation: aiResult.historicalExplanation || localFallback.historicalExplanation,
    improvement: aiResult.improvement || localFallback.improvement,
    aiAdvice: aiResult.aiAdvice || localFallback.aiAdvice
  };
}

async function judgeWithAI(selection) {
  const localFallback = judgeLocally(selection);
  const apiKey = getTemporaryApiKey();

  try {
    setAIStatus("正在请求云端 AI 代理生成战报...");
    const proxyResponse = await fetch("/api/judge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selection, localResult: localFallback })
    });

    if (proxyResponse.ok) {
      const aiResult = await proxyResponse.json();
      setAIStatus("云端 AI 战报已生成。");
      return normalizeAIResult(aiResult, localFallback);
    }
  } catch (error) {
    console.warn("Cloud AI proxy unavailable, falling back.", error);
  }

  if (!apiKey) {
    setAIStatus("云端 AI 暂不可用：当前使用本地规则引擎。");
    return localFallback;
  }

  try {
    setAIStatus("正在请求 DeepSeek 生成 AI 战报...");
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        temperature: 0.4,
        messages: [
          { role: "system", content: "你是严谨的历史课程教学评估助手，只输出合法 JSON。" },
          { role: "user", content: buildAIPrompt(selection, localFallback) }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek 请求失败：${response.status}`);
    }

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || "";
    const aiResult = extractJSON(aiText);
    setAIStatus("AI 战报已生成。本次 API Key 仅保存在当前浏览器会话。");
    return normalizeAIResult(aiResult, localFallback);
  } catch (error) {
    console.warn(error);
    setAIStatus("AI 请求失败，已自动回退到本地规则引擎。若直接打开 HTML，浏览器可能会阻止跨域请求。");
    return localFallback;
  }
}

function formatSuccess(success) {
  if (success === true) return "成功";
  if (success === false) return "失败";
  return "部分成功";
}

function briefText(text, maxLength = 72) {
  if (!text) return "";
  const compact = String(text).replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength)}...`;
}

function renderResult(result, selection) {
  const statusClass = result.success === true ? "" : result.success === false ? "fail" : "partial";
  const dimensionCards = Object.entries(dimensionNames)
    .map(([key, label]) => {
      const score = Math.max(0, Math.min(25, Number(result.dimensionScores[key] || 0)));
      return `
        <div class="dimension-card">
          <div class="dimension-card-header">
            <span>${label}</span>
            <strong>${score}/25</strong>
          </div>
          <div>${result.dimensionJudgement[key]}</div>
          <div class="mini-track"><div class="mini-fill" style="width: ${(score / 25) * 100}%"></div></div>
        </div>
      `;
    })
    .join("");

  battleReport.innerHTML = `
    <div class="report-title-line">
      <span class="result-level">${result.resultLevel}级战报</span>
      <h2>${result.resultTitle}</h2>
      <span class="status-badge ${statusClass}">${result.statusText || formatSuccess(result.success)}</span>
    </div>
    <p><strong>结局判定：</strong>${result.resultSummary}</p>
    <div class="score-board">
      <div class="total-score">
        <div class="score-number">${result.totalScore}<span>/100</span></div>
        <div class="score-label">综合策略分</div>
      </div>
      <div class="dimension-score-grid">${dimensionCards}</div>
    </div>
    <div class="compact-summary">
      <span>${selection.target}</span>
      <span>${selection.media}</span>
      <span>${selection.content}</span>
      <span>${selection.tone}</span>
    </div>
    <div class="brief-report-grid">
      <div class="report-block"><h3>剧情反馈</h3><p>${briefText(result.storyFeedback, 76)}</p></div>
      <div class="report-block"><h3>历史解释</h3><p>${briefText(result.historicalExplanation, 72)}</p></div>
      <div class="report-block"><h3>建议</h3><p>${briefText(result.aiAdvice && !result.aiAdvice.includes("当前使用本地规则") ? result.aiAdvice : result.improvement, 72)}</p></div>
    </div>
  `;
}

function showResultScreen() {
  introPanel.classList.add("hidden");
  selectionScreen.classList.add("hidden");
  knowledgePanel.classList.add("hidden");
  resultScreen.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showSelectionScreen() {
  introPanel.classList.remove("hidden");
  selectionScreen.classList.remove("hidden");
  knowledgePanel.classList.remove("hidden");
  resultScreen.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function showResult() {
  const selection = getSelection();
  if (!hasCompletedSelection(selection)) {
    alert("请先完成五步选择，再生成宣传战报。");
    return;
  }

  resultButton.disabled = true;
  resultButton.textContent = "正在生成战报...";
  const result = await judgeWithAI(selection);
  renderResult(result, selection);
  showResultScreen();
  resultButton.disabled = false;
  resultButton.textContent = "生成宣传战报";
}

function openApiModal() {
  apiModal.classList.remove("hidden");
  apiKeyInput.focus();
}

function closeModal() {
  apiModal.classList.add("hidden");
}

prevButton.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep -= 1;
    renderStep();
  }
});

nextButton.addEventListener("click", () => {
  const step = steps[currentStep];
  if (!state[step.key]) return;
  if (currentStep < steps.length - 1) {
    currentStep += 1;
    renderStep();
  }
});

resultButton.addEventListener("click", showResult);
backButton.addEventListener("click", showSelectionScreen);
closeApiModal.addEventListener("click", closeModal);
apiModal.addEventListener("click", (event) => {
  if (event.target === apiModal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
    event.preventDefault();
    openApiModal();
  }
  if (event.key === "Escape") {
    closeModal();
  }
});

apiKeyInput.value = getTemporaryApiKey();
apiKeyInput.addEventListener("input", () => {
  const value = apiKeyInput.value.trim();
  if (value) {
    sessionStorage.setItem("deepseek_api_key", value);
    setAIStatus("已填写 API Key：生成战报时将优先尝试 AI 分析。");
  } else {
    sessionStorage.removeItem("deepseek_api_key");
    setAIStatus("未填写 API Key：当前使用本地规则引擎。");
  }
});

renderStep();
