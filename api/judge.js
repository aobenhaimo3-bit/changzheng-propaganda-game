export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    response.status(500).json({ error: "DEEPSEEK_API_KEY is not configured." });
    return;
  }

  try {
    const { selection, localResult } = request.body || {};

    if (!selection || !localResult) {
      response.status(400).json({ error: "Missing selection or localResult." });
      return;
    }

    const prompt = `
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

    const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.4,
        messages: [
          { role: "system", content: "你是严谨的历史课程教学评估助手，只输出合法 JSON。" },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      response.status(deepseekResponse.status).json({ error: errorText });
      return;
    }

    const data = await deepseekResponse.json();
    const aiText = data.choices?.[0]?.message?.content || "";
    const start = aiText.indexOf("{");
    const end = aiText.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      response.status(502).json({ error: "AI response is not valid JSON." });
      return;
    }

    response.status(200).json(JSON.parse(aiText.slice(start, end + 1)));
  } catch (error) {
    response.status(500).json({ error: error.message || "Unknown server error." });
  }
}
