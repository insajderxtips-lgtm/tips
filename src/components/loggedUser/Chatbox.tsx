import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { RootState } from "../../redux/store";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: Date;
  tier: string;
}

export default function Chatbox() {
  const userData = useSelector((state: RootState) => state.user);
  const { isAuthenticated, username, tier, token } = userData;

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Scroll only chat div, not whole page
  const scrollToBottom = () => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isAuthenticated) return;

    socketRef.current = io({
      auth: { token },
    });

    socketRef.current.on("previous_messages", (msgs: Message[]) => {
      setMessages(msgs);
    });

    socketRef.current.on("new_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token, isAuthenticated]);

  const sendMessage = () => {
    if (!currentMessage.trim() || !socketRef.current) return;
    socketRef.current.emit("send_message", {
      text: currentMessage,
      sender: username || "Anonymous",
      tier,
    });
    setCurrentMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen text-center">
        <p className="text-xl text-gray-400">
          Prijavite se da biste koristili chat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto h-screen p-4">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
        Dobrodosli, {userData.username}.
      </h1>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-slate-900/70 backdrop-blur-xl rounded-2xl p-4 space-y-2 shadow-inner scrollbar-thin scrollbar-thumb-cyan-700/50 scrollbar-track-transparent"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isOwn = msg.sender === username;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-2xl shadow-md break-words ${
                    isOwn
                      ? "bg-gradient-to-br from-blue-600 to-cyan-700 text-white rounded-br-md rounded-l-2xl rounded-tr-2xl"
                      : "bg-slate-800 text-slate-200 rounded-bl-md rounded-r-2xl rounded-tl-2xl"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {!isOwn && (
                      <span
                        className={`font-bold ${
                          msg.tier?.toLowerCase() === "premium"
                            ? "text-amber-300"
                            : "text-gray-300"
                        }`}
                      >
                        {msg.sender}
                      </span>
                    )}
                    {msg.tier?.toLowerCase() === "premium" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                        PREMIUM
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div className="text-xs mt-1 opacity-50 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="Napišite poruku..."
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-slate-800/60 border-2 border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        />
        <button
          onClick={sendMessage}
          disabled={!currentMessage.trim()}
          className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl text-white font-bold shadow-lg hover:scale-105 transform transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
