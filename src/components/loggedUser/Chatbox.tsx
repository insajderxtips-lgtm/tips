import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { RootState } from "../../redux/store";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare } from "lucide-react";

export default function Chatbox() {
  const { isAuthenticated, username, tier } = useSelector((state: RootState) => state.user);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem("insajder_token");
    socketRef.current = io({ auth: { token } });
    socketRef.current.on("previous_messages", (msgs: any[]) => setMessages(msgs));
    socketRef.current.on("new_message", (msg: any) => setMessages((prev) => [...prev, msg]));
    return () => {
      socketRef.current?.disconnect();
    };
  }, [isAuthenticated]);

  // Auto-scroll to the latest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!currentMessage.trim() || !socketRef.current) return;
    socketRef.current.emit("send_message", { text: currentMessage, sender: username, tier });
    setCurrentMessage("");
  };

  if (!isAuthenticated) {
    return <div className="flex h-full items-center justify-center p-4 text-center text-slate-400">Prijavite se.</div>;
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#07131f]">
      {/* Messages */}
      <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center opacity-40">
            <MessageSquare className="h-8 w-8 text-slate-500" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Započnite razgovor</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isOwn = msg.sender === username;
              const isPremium = msg.tier === "premium";
              return (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                >
                  <span className="mb-1 px-1 text-[10px] font-bold">
                    <span className={isPremium ? "text-amber-400" : isOwn ? "text-blue-300" : "text-slate-400"}>
                      {isPremium && "★ "}
                      {msg.sender}
                    </span>
                  </span>
                  <div
                    className={`max-w-[80%] break-words rounded-2xl px-3.5 py-2 text-sm shadow-md ${
                      isOwn
                        ? "rounded-br-md bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                        : "rounded-bl-md border border-[#1a3050] bg-[#0b1c2e] text-slate-200"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex shrink-0 items-center gap-2 border-t border-[#1a3050] bg-[#0b1c2e] p-3">
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Napišite poruku..."
          className="flex-1 rounded-xl border border-[#1a3050] bg-[#07131f] px-3.5 py-2.5 text-sm text-white outline-none transition-all focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
        />
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          onClick={sendMessage}
          aria-label="Pošalji poruku"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30 transition-shadow hover:shadow-[0_0_18px_rgba(59,130,246,0.4)]"
        >
          <Send className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}
