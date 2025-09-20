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
    socketRef.current = io("http://localhost:1337", {
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
    <div className="flex w-full flex-col space-y-6 max-w-4xl mx-auto p-4 ">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Dobrodošao nazad, {userData?.username}.
        </h1>
        <div className="flex items-center justify-center gap-2 text-sm text-cyan-300">
          <span>Online korisnici: {onlineUsers.length}</span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-gradient-to-br from-blue-900/30 to-cyan-900/20 rounded-xl border border-cyan-800/30 shadow-2xl shadow-blue-950/30 backdrop-blur-sm">
        {/* Messages Area */}
        <div className="h-[500px] overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-blue-800 scrollbar-track-blue-950">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.sender === userData.username ? "justify-end" : ""
              }`}
            >
              {message.sender !== userData.username && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600"></div>
              )}

              <div
                className={`max-w-[70%] p-3 rounded-xl ${
                  message.sender === userData.username
                    ? "bg-gradient-to-br from-blue-700 to-blue-950 rounded-tr-none"
                    : "bg-blue-900/40 rounded-tl-none"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`text-xs font-medium ${
                      message.tier === "premium"
                        ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500"
                        : "text-gray-400"
                    }`}
                  >
                    {message.sender}
                  </div>
                  {message.tier === "premium" ? (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                      PREMIUM
                    </span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-500/20 text-gray-300">
                      FREE
                    </span>
                  )}
                </div>
                <p
                  className={
                    message.sender === userData.username
                      ? "text-white"
                      : "text-cyan-100"
                  }
                >
                  {message.text}
                </p>
                <div
                  className={`text-xs mt-1 ${
                    message.sender === userData.username
                      ? "text-cyan-200"
                      : "text-cyan-500"
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {message.sender === userData.username && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500"></div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-cyan-800/30 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Napišite poruku..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-blue-950/30 border border-cyan-800/40 rounded-lg px-4 py-3
                       text-cyan-100 placeholder-cyan-500 focus:outline-none focus:ring-2
                       focus:ring-cyan-500 focus:border-transparent transition-all"
              disabled={!isLoggedIn}
            />
            <button
              onClick={sendMessage}
              disabled={!isLoggedIn}
              className="bg-gradient-to-br from-cyan-600 to-blue-700 px-6 rounded-lg
                         hover:from-cyan-500 hover:to-blue-600 transition-all
                         flex items-center gap-2 shadow-lg hover:shadow-cyan-500/20
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5 text-white"
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
