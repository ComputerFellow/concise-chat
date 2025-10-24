import React, { useState, useRef, useEffect } from "react";
import { Send, Trash2, Sparkles, User } from "lucide-react";

const ChatUI = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatMessages");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            type: "bot",
            text: "Hi, I’m Grok! How can I help you today?",
            model: "grok",
          },
        ];
  });

  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("grok");
  const [conciseMode, setConciseMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const modelConfig = {
    grok: { name: "Grok", icon: "⚡", color: "purple" },
    gpt35: { name: "ChatGPT", icon: "🤖", color: "green" },
  };

    // Ensure intro message appears if no saved history
  useEffect(() => {
    const saved = localStorage.getItem("chatMessages");
    if (!saved || JSON.parse(saved).length === 0) {
      const introMessage = {
        id: 1,
        type: "bot",
        text: "Hi, I’m Grok! How can I help you today?",
        model: "grok",
      };
      setMessages([introMessage]);
    }
  }, []);


  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessagesForAPI = (msgs, limit = 15) => {
    const recentMessages = msgs.slice(-limit);
    return recentMessages.map((msg) => ({
      role: msg.type === "user" ? "user" : "assistant",
      content: msg.text,
    }));
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessageText = inputValue;
    setInputValue("");
    setIsLoading(true);

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: userMessageText,
      model: selectedModel,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const model =
        selectedModel === "gpt35"
          ? "openai/gpt-3.5-turbo"
          : "x-ai/grok-3-mini";

      const messageHistory = formatMessagesForAPI(messages, 30);

      const res = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          userMessage: userMessageText,
          conciseMode,
          messageHistory,
        }),
      });

      if (!res.ok) throw new Error("API error " + res.status);

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "No reply";

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        text: reply,
        model: selectedModel,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: "bot",
        text: "Sorry, there was an error processing your request.",
        model: selectedModel,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // const handleClearChat = () => {
  //   setMessages([]);
  //   localStorage.removeItem("chatMessages");
  // };
  const handleClearChat = () => {
  const introMessage = {
    id: Date.now(),
    type: "bot",
    text: "Hi, I’m Grok! How can I help you today?",
    model: "grok",
  };

  setMessages([introMessage]);
  localStorage.setItem("chatMessages", JSON.stringify([introMessage]));
};


  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ height: "90vh" }}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Chat</h1>
                <p className="text-sm text-gray-500">
                  {messages.length} messages
                </p>
              </div>
            </div>
            <button
              onClick={handleClearChat}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Chat
            </button>
          </div>

          {/* Model Selection */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedModel("grok")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedModel === "grok"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                ⚡ Grok
              </button>
              <button
                onClick={() => setSelectedModel("gpt35")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedModel === "gpt35"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                🤖 ChatGPT
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                Concise Mode
              </span>
              <button
                onClick={() => setConciseMode(!conciseMode)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  conciseMode ? "bg-purple-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    conciseMode ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.type === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  message.type === "user" ? "bg-blue-500" : "bg-purple-500"
                }`}
              >
                {message.type === "user" ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Sparkles className="w-5 h-5 text-white" />
                )}
              </div>
              <div
                className={`flex flex-col ${
                  message.type === "user" ? "items-end" : "items-start"
                } max-w-[70%]`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    message.type === "user"
                      ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
                {message.type === "bot" && (
                  <span
                    className={`text-xs mt-1 px-2 py-1 rounded-full ${
                      message.model === "grok"
                        ? "text-purple-600 bg-purple-50"
                        : "text-green-600 bg-green-50"
                    }`}
                  >
                    {message.model === "grok" ? "Grok" : "ChatGPT"}
                  </span>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-6 bg-white">
          <div className="flex gap-3 items-end">
            <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-purple-500 transition-colors">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="w-full px-4 py-3 bg-transparent resize-none outline-none text-gray-800 placeholder-gray-400"
                rows="2"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-lg shadow-purple-500/30"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
