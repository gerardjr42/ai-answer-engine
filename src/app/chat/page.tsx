"use client";

import { Header } from "@/components/header";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUser } from "@clerk/nextjs";
import DOMPurify from "dompurify";
import { PlusCircle, Search } from "lucide-react";
import { marked } from "marked";
import { useEffect, useState } from "react";

type Message = {
  role: "user" | "ai";
  content: string;
  url?: string;
  references?: string[];
};

export default function Home() {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    // Set initial greeting with user's username
    if (user) {
      setMessages([
        {
          role: "ai",
          content: `Hello **@${user.username || "there"}**! \nMy name is Aether, how can I help you today?`,
        },
      ]);
    }
  }, [user]);

  const handleSend = async (url?: string) => {
    if (!message.trim()) return;
    // Add user message to the conversation
    const userMessage = {
      role: "user" as const,
      content: url ? `Analyzing URL: ${url}\n\n${message}` : message,
      url,
    };
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, url }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [
          ...prev,
          {
            role: "ai",
            content: data.message,
            references: data.references,
          },
        ]);
      } else {
        // If rate 429 (rate limit exceeded) show a message to the user
        if (response.status === 429) {
          setMessages(prev => [
            ...prev,
            {
              role: "ai",
              content:
                data.message ||
                "You've reached the maximum number of requests. Please wait a minute before trying again.",
            },
          ]);
        } else {
          throw new Error(data.error || "Something went wrong");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          content: "Sorry, I encountered an error. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMarkdown = (content: string) => {
    marked.setOptions({
      gfm: true,
      breaks: true,
    });

    return DOMPurify.sanitize(marked.parse(content, { async: false }));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <SidebarProvider>
        <div className="flex flex-1">
          {/* Sidebar */}
          <Sidebar className="w-64 border-r border-gray-700" variant="sidebar">
            <SidebarHeader className=" border-gray-700 ">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarTrigger className="md:inline-flex group-[&[data-state=collapsed]]:hidden" />
                    </TooltipTrigger>
                    <TooltipContent>Toggle Sidebar</TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-2 hover:bg-gray-700 rounded-md">
                        <Search className="h-4 w-4 text-gray-400" />
                        <span className="sr-only">Search</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Search</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="p-2 hover:bg-gray-700 rounded-md"
                        title="New Chat"
                      >
                        <PlusCircle className="h-4 w-4 text-gray-400" />
                        <span className="sr-only">New Chat</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>New Chat</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel className="text-white justify-center">
                  Recent Chats
                </SidebarGroupLabel>
                {/* TODO: Add chat history items here */}
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          {/* Main Content + Input Area Container */}
          <div className="flex-1 flex flex-col relative">
            {/* Messages Container */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <div className="flex-1 overflow-y-auto pb-32 pt-4">
                <div className="max-w-3xl mx-auto px-4">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex gap-4 mb-4 ${
                        msg.role === "ai"
                          ? "justify-start"
                          : "justify-end flex-row-reverse"
                      }`}
                    >
                      <div
                        className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                          msg.role === "ai"
                            ? "bg-gray-800 border border-gray-700 text-gray-100"
                            : "bg-cyan-600 text-white ml-auto"
                        }`}
                      >
                        <div
                          className="prose prose-invert max-w-none 
                              prose-p:my-4
                              prose-headings:my-6
                              prose-ul:my-4 
                              prose-ul:list-disc 
                              prose-ol:my-4 
                              prose-ol:list-decimal 
                              prose-li:my-2
                            prose-strong:text-[#2DAC9E]
                            [&>*:first-child]:mt-0 
                            [&>*:last-child]:mb-0"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(msg.content),
                          }}
                        />
                        {msg.role === "ai" &&
                          msg.references &&
                          msg.references.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-700 text-sm text-gray-400">
                              <div className="font-semibold mb-1">
                                References:
                              </div>
                              {msg.references.map((ref, i) => {
                                const urlMatch = ref.match(/\[(.*?)\]\s*(.*)/);
                                const number = urlMatch?.[1];
                                const url = urlMatch?.[2];
                                return (
                                  <div
                                    key={i}
                                    className="hover:text-cyan-400 transition-colors"
                                  >
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline"
                                    >
                                      {`[${number}] ${url}`}
                                    </a>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-4 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-8c.79 0 1.5-.71 1.5-1.5S8.79 9 8 9s-1.5.71-1.5 1.5S7.21 11 8 11zm8 0c.79 0 1.5-.71 1.5-1.5S16.79 9 16 9s-1.5.71-1.5 1.5.71 1.5 1.5 1.5zm-4 4c2.21 0 4-1.79 4-4h-8c0 2.21 1.79 4 4 4z" />
                        </svg>
                      </div>
                      <div className="px-4 py-2 rounded-2xl bg-gray-800 border border-gray-700 text-gray-100">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-700 bg-gray-900 py-4">
              <div className="max-w-3xl mx-auto px-4">
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="Optional: Enter URL to analyze..."
                    className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-400"
                  />
                  <div className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      onKeyPress={e => e.key === "Enter" && handleSend(url)}
                      placeholder="Type your message..."
                      className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-400"
                    />
                    <button
                      onClick={() => handleSend(url)}
                      disabled={isLoading}
                      className="bg-cyan-600 text-white px-5 py-3 rounded-xl hover:bg-cyan-700 transition-all disabled:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
