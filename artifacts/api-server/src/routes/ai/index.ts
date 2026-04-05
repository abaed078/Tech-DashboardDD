import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const AUTOMOTIVE_SYSTEM_PROMPT = `أنت مساعد تشخيص سيارات متخصص ومحاضر تقني. أنت خبير في:
- بروتوكولات CAN-Bus و OBD2
- حساسات السيارات (MAF, MAP, O2, Coolant, ABS, CKP, TPS)
- أكواد الأعطال (DTC)
- نظام إدارة البطارية (BMS)
- وحدة التحكم الإلكترونية (ECU)

تحدث بالعربية والإنجليزية حسب السياق. كن مختصراً وتقنياً ودقيقاً.
عند شرح الأعطال: اذكر السبب، الأعراض، طريقة الإصلاح بشكل نقاط منظمة.`;

router.post("/chat", async (req, res) => {
  const { messages, lang } = req.body as { messages: { role: string; content: string }[]; lang?: string };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: AUTOMOTIVE_SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: "AI unavailable" })}\n\n`);
  }
  res.end();
});

router.post("/quiz", async (req, res) => {
  const { context, lang } = req.body as { context: string; lang?: string };
  const isAr = lang === "ar";

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: AUTOMOTIVE_SYSTEM_PROMPT },
        {
          role: "user",
          content: isAr
            ? `أنشئ 5 أسئلة اختيار متعدد تعليمية حول الموضوع التالي: ${context}. 
أعد النتيجة كـ JSON بهذا الشكل:
{"questions": [{"q": "السؤال", "options": ["أ", "ب", "ج", "د"], "answer": 0, "explanation": "شرح الإجابة الصحيحة"}]}`
            : `Create 5 multiple-choice educational questions about: ${context}.
Return JSON:
{"questions": [{"q": "Question", "options": ["A","B","C","D"], "answer": 0, "explanation": "Why this is correct"}]}`,
        },
      ],
    });

    const raw = resp.choices[0]?.message?.content ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { questions: [] };
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ questions: [] });
  }
});

router.post("/fault-explain", async (req, res) => {
  const { faultCode, sensorName, lang } = req.body as { faultCode: string; sensorName: string; lang?: string };
  const isAr = lang === "ar";

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: AUTOMOTIVE_SYSTEM_PROMPT },
        {
          role: "user",
          content: isAr
            ? `اشرح العطل ${faultCode} للحساس ${sensorName}. اذكر: السبب، الأعراض، طريقة الإصلاح بالتفصيل. أجب بالعربية بشكل تقني.`
            : `Explain fault ${faultCode} for sensor ${sensorName}. Include: cause, symptoms, fix procedure. Be technical and detailed.`,
        },
      ],
    });

    const explanation = resp.choices[0]?.message?.content ?? "";
    res.json({ explanation });
  } catch (err) {
    res.status(500).json({ explanation: "Explanation unavailable." });
  }
});

router.post("/adaptive-suggest", async (req, res) => {
  const { currentPage, recentSensors, lang } = req.body as {
    currentPage: string;
    recentSensors: string[];
    lang?: string;
  };
  const isAr = lang === "ar";

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1024,
      messages: [
        { role: "system", content: AUTOMOTIVE_SYSTEM_PROMPT },
        {
          role: "user",
          content: isAr
            ? `المحاضر يعرض الآن: ${currentPage}. آخر حساسات تمت مناقشتها: ${recentSensors.join(", ")}.
اقترح الخطوة التعليمية التالية المنطقية في جملة واحدة موجزة بالعربية.`
            : `Instructor is viewing: ${currentPage}. Recent sensors discussed: ${recentSensors.join(", ")}.
Suggest the next logical teaching step in one concise sentence in English.`,
        },
      ],
    });

    const suggestion = resp.choices[0]?.message?.content ?? "";
    res.json({ suggestion });
  } catch (err) {
    res.status(500).json({ suggestion: "" });
  }
});

export default router;
