import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { RootState } from "../../redux/store";

interface Message {
  id: number; // Changed from string to number to match Date.now()
  text: string;
  sender: string;
  timestamp: Date;
  tier: string;
}

export default function Chatbox(): React.ReactNode {
  const isLoggedIn = useSelector(
    (state: RootState) => state.user.isAuthenticated
  );
  const userData = useSelector((state: RootState) => state.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    document.title = "Insajder | Početna";

    // Initialize socket connection
    // This is the corrected code
    socketRef.current = io({
      auth: {
        token: userData.token,
      },
    });

    socketRef.current?.on("online_users", (users: string[]) => {
      setOnlineUsers(users);
    });

    // Changed from "all_messages" to "previous_messages" to match your server
    socketRef.current.on("previous_messages", (msgs: Message[]) => {
      setMessages(msgs);
    });

    socketRef.current.on("new_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userData.token]); // Added dependency

  const sendMessage = () => {
    if (!currentMessage.trim() || !socketRef.current || !isLoggedIn) return;

    const newMessage = {
      text: currentMessage,
      sender: userData.username || "Anonymous",
      tier: userData.tier,
    };

    socketRef.current.emit("send_message", newMessage);
    setCurrentMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex w-full flex-col max-w-4xl mx-auto p-4 min-h-[calc(100vh-4rem)]">
      {/* Header Section */}
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400 drop-shadow-sm">
          Dobrodošao nazad, {userData?.username || "Korisniče"}.
        </h1>
        <div className="flex items-center justify-center gap-2 text-sm text-cyan-300 mt-2">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </div>
          <span>{onlineUsers.length} Korisnika Online</span>
        </div>
      </div>

      {/* Chat Container with NEW BORDER PULSE ANIMATION */}
      <div className="flex-1 flex flex-col bg-gray-900/50 backdrop-blur-xl rounded-2xl border-2 border-cyan-500/40 shadow-2xl shadow-cyan-500/10 overflow-hidden animate-border-pulse">
        {/* Messages Area */}
        <div className="flex-1 p-4 sm:p-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-700/50 scrollbar-track-transparent hover:scrollbar-thumb-cyan-600 transition-colors">
          {messages.map((message, index) => {
            const isOwnMessage = message.sender === userData.username;
            const prevMessage = messages[index - 1];
            const isConsecutive =
              prevMessage && prevMessage.sender === message.sender;

            return (
              <div
                key={message.id}
                className={`flex items-end gap-3 py-1 ${
                  isOwnMessage ? "justify-end" : "justify-start"
                } ${isConsecutive ? "" : "mt-3"}`}
              >
                {!isOwnMessage && !isConsecutive && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center font-bold text-white shadow-md">
                    {message.sender.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div
                  className={`flex flex-col max-w-[75%] md:max-w-[60%] p-3 rounded-2xl shadow-md transition-transform hover:-translate-y-0.5
                  ${
                    isOwnMessage
                      ? `bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-br-lg ml-12`
                      : `bg-gray-800/80 text-cyan-100 rounded-bl-lg mr-12`
                  }
                  ${
                    isConsecutive
                      ? isOwnMessage
                        ? "rounded-br-lg"
                        : "rounded-bl-lg"
                      : ""
                  }`}
                  style={{
                    marginLeft: !isOwnMessage && isConsecutive ? "3.5rem" : "",
                  }}
                >
                  {!isConsecutive && (
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-sm font-bold ${
                          message.tier === "premium"
                            ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400"
                            : "text-gray-300"
                        }`}
                      >
                        {message.sender}
                      </span>
                      {message.tier === "premium" ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          PREMIUM
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-600/30 text-gray-300 font-medium">
                          FREE
                        </span>
                      )}
                    </div>
                  )}
                  <p className="leading-relaxed">{message.text}</p>
                  <div className="text-xs mt-1.5 opacity-60 self-end">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-cyan-500/20 p-4 bg-gray-900/30">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Napišite poruku..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-gray-800/50 border border-transparent rounded-xl px-4 py-3 text-cyan-100 placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all pr-14"
              disabled={!isLoggedIn}
            />
            <button
              onClick={sendMessage}
              disabled={!isLoggedIn || !currentMessage.trim()}
              className="absolute right-2 bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg transition-all duration-300 transform hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
