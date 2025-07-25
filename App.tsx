
import React, { useState, useRef, useEffect } from 'react';
import { Chat } from '@google/genai';
import { Message, Role } from './types';
import { geminiService } from './services/geminiService';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import TypingIndicator from './components/TypingIndicator';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: Role.Model,
      content: "Hello! I'm WalkyNine, your AI assistant. How can I help you today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize the chat session
    chatRef.current = geminiService.startChat();
  }, []);

  useEffect(() => {
    // Scroll to the bottom of the chat container when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (userInput: string) => {
    if (isLoading || !userInput.trim()) return;

    setIsLoading(true);
    const userMessage: Message = { role: Role.User, content: userInput };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    
    // Add a placeholder for the streaming response
    setMessages((prevMessages) => [...prevMessages, { role: Role.Model, content: '' }]);

    try {
      if (!chatRef.current) {
        throw new Error('Chat session not initialized.');
      }
      
      const stream = await chatRef.current.sendMessageStream({ message: userInput });

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1].content += chunkText;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      const errorMessage: Message = {
        role: Role.Error,
        content: 'Sorry, something went wrong. Please try again.',
      };
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        // Replace the placeholder with the error message
        newMessages[newMessages.length - 1] = errorMessage;
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-base-100 text-white font-sans">
      <Header />
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
      >
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
      </div>
      <div className="p-4 md:p-6 bg-neutral/50 border-t border-neutral">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        <p className="text-center text-xs text-gray-400 mt-2">
            WalkyNine can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};

export default App;
