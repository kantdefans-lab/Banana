'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, User, Bot, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Message {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIChatInterfaceProps {
  onClose: () => void;
}

export default function AIChatInterface({ onClose }: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hello! I'm your Nano Banana AI assistant. How can I help you create amazing visuals today?",
      sender: 'ai',
      timestamp: new Date(Date.now() - 300000)
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 模拟AI回复
    setTimeout(() => {
      const aiResponses = [
        "I understand you want to create a cyberpunk cityscape. Would you like me to generate some variations with neon lights and futuristic architecture?",
        "Great idea! For a fantasy landscape, I recommend using the 'Mystical Forest' style preset. Would you like me to adjust the color palette to be more vibrant?",
        "I can help you refine that concept. How about adding some magical elements like glowing crystals or floating islands?",
        "Based on your description, I suggest using the Nano Banana Pro model for maximum detail and consistency. Would you like to proceed with these settings?"
      ];

      const aiMessage: Message = {
        id: messages.length + 2,
        content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-4xl h-[600px] bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Nano Banana AI Assistant</h2>
              <p className="text-sm text-gray-400">Your creative partner for visual generation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 聊天内容 */}
        <div className="flex-1 h-[400px] overflow-y-auto p-6 space-y-6">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                message.sender === 'user'
                  ? 'bg-yellow-500/10 border border-yellow-500/20'
                  : 'bg-gray-800/50 border border-gray-700'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`p-1.5 rounded ${
                    message.sender === 'user'
                      ? 'bg-yellow-500/20'
                      : 'bg-blue-500/20'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Bot className="w-3 h-3" />
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {message.sender === 'user' ? 'You' : 'Nano Banana AI'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-gray-200">{message.content}</p>
                
                {message.sender === 'ai' && (
                  <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-700/50">
                    <button className="p-1.5 hover:bg-gray-700 rounded">
                      <Copy className="w-3 h-3" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-700 rounded">
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-700 rounded">
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                    <button className="text-xs px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30">
                      Use for Generation
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl p-4 bg-gray-800/50 border border-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded bg-blue-500/20">
                    <Bot className="w-3 h-3" />
                  </div>
                  <span className="text-sm font-medium">Nano Banana AI is thinking...</span>
                </div>
                <div className="flex space-x-1 mt-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 快速提示 */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex flex-wrap gap-2 mb-4">
            {['Create a fantasy landscape', 'Cyberpunk city at night', 'Anime character portrait'].map(prompt => (
              <button
                key={prompt}
                onClick={() => handleQuickPrompt(prompt)}
                className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* 输入框 */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about AI image generation..."
              className="flex-1 p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-white flex items-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}