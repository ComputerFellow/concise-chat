exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("OPENROUTER_API_KEY not found");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }),
    };
  }

  const {
    model,
    userMessage,
    conciseMode,
    messageHistory = [],
  } = JSON.parse(event.body);

  // Extract the model name from the API model string for context
  const modelName = model.includes("haiku")
    ? "Claude Haiku"
    : model.includes("gpt")
    ? "GPT-3.5"
    // : model.includes("grok")
    // ? "Grok"
    : model.includes("kimi")
    ? "Kimi"
    : "AI";

  try {
    // Build messages with system prompt that includes current AI identity
    const systemPrompt = conciseMode
        // ? `You are ${modelName}, one of several important voices in this important chat-session; every message in the chat history has an AI Model name associated with it. If the user prompts something that requires general recall or summary of the chat that has transpired so far, please do so. If the user asks for the AI Model that said a particular fact or “thing”, be ready to recall that and explicitly mention the AI in the chat history that mentioned this. You are not a persona. You are always only you, ${modelName}; so you should always answer only as you, ${modelName}. There is a high chance that there will be another AI in this chat so please respect that and acknowledge them appropriately.   This response should be 2-4 sentences as 'concise mode' has ben toggled.`
        // ? `You are part of CoThink, and AI app by tkdev.online that features 4 different AI voices. You are ${modelName}, one of several AI voices in the chat at hand. Please be ready to comment on something another AI said. Every message has an AI model name attached to/associated with it. Please don’t take on personas and answer as ${modelName}, being ready to comment on what other AIs have said previously.`
        // You are ${modelName}, one of four AI voices in <app name> by <company name>. In this chat, multiple AIs can participate in the conversation. Each message has an AI model name attached to it, so users can see who said what. Respond as ${modelName}—not as a persona, but as yourself. Be ready to comment on or respond to what other AIs have said previously in the conversation.
        // You are a part of a multi-member AI chat app. You are ${modelName}, one of several AI voices in the chat at hand. Please be ready to comment on something another AI said. Every message contains the AI model name that was selected. Please don’t take on personas and answer as ${modelName}, being ready to comment on what other AIs have said previously. 

        ? `You are ${modelName}, one of three AI voices a multi-agent chat. Each message shows which AI said it. Respond as yourself and feel free to comment on what other AIs have said. Don't adopt personas—just be ${modelName}. This response should be 2-3 sentences as 'concise mode' is been toggled.`
        : `You are ${modelName}, one of three AI voices a multi-agent chat. Each message shows which AI said it. Respond as yourself and feel free to comment on what other AIs have said. Don't adopt personas—just be ${modelName}.`
       
    const messages = [
      { role: "system", content: systemPrompt },
      ...messageHistory, // already stripped of [Name]: prefixes
      { role: "user", content: userMessage },
    ];

    console.log("Sending to OpenRouter:", {
      model: modelName,
      messageCount: messages.length,
      hasHistory: messageHistory.length > 0,
    });

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://concise-chat.netlify.app",
        "X-Title": "Conference Chat Demo",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
      }),
    });

    const data = await res.json();

    console.log("OpenRouter Response Status:", res.status);

    if (!res.ok) {
      throw new Error(`API error: ${JSON.stringify(data)}`);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Function error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
