import React, {
  useEffect,
  useState,
  useRef,
  ClipboardEvent,
  KeyboardEvent,
} from "react";
import { useSelector, useDispatch } from "react-redux"; // Added useDispatch
import { io, Socket } from "socket.io-client";
import { RootState } from "../../redux/store";
import { setUser } from "../../redux/slices/UserSlice"; // Added setUser
import { useNavigate } from "react-router"; // Added useNavigate

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: Date;
  tier: string;
}

// --- Verification Component (Verifikacija) integrated into Chatbox ---
const VerificationComponent: React.FC<{
  email: string | null;
  user: any;
  onVerificationSuccess: () => void;
}> = ({ email, user, onVerificationSuccess }) => {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"success" | "error" | "">("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const dispatch = useDispatch();
  const nav = useNavigate();

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text");
    if (paste.length === 6 && /^\d+$/.test(paste)) {
      const newOtp = paste.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    setMessage("");
    setStatus("");

    const finalCode = otp.join("");

    if (finalCode.length < 6 || !email) {
      setStatus("error");
      setMessage("Došlo je do greške. Unesite kompletan kod.");
      return;
    }

    try {
      const res = await fetch("/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: finalCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.message || "Greška pri verifikaciji.");
        return;
      }

      setStatus("success");
      setMessage("Uspešno ste verifikovali nalog!");

      // Update Redux state with isVerified: true
      dispatch(setUser({ ...user, isVerified: true }));
      onVerificationSuccess(); // Tell Chatbox parent component to re-render chat

      setTimeout(() => {
        // Navigating to "/" will trigger the chat to load since isVerified is now true
        nav("/");
      }, 1500);
    } catch (err) {
      console.error("Greška:", err);
      setStatus("error");
      setMessage("Došlo je do greške na mreži ili serveru.");
    }
  };

  const handleResend = async () => {
    // Add your logic to call the resend endpoint here
    // e.g., await fetch("/resend-verification", { method: "POST", body: JSON.stringify({ email }) });
    setMessage("Novi kod je poslat na vašu email adresu.");
    setStatus("success");
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full p-4 bg-slate-950">
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] [mask-image:linear-gradient(to_bottom,white_40%,transparent_90%)]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-blue-900/30 rounded-full blur-3xl animate-pulse-slow"></div>

      <div className="relative w-full max-w-md">
        <div className="relative bg-black/60 backdrop-blur-2xl border-2 border-blue-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 text-center">
          <div className="mx-auto w-16 h-16 mb-6 flex items-center justify-center bg-slate-900/50 border-2 border-blue-800/50 rounded-2xl shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold mb-2 text-slate-100">
            Email Verifikacija
          </h1>

          <p className="text-slate-400 text-sm mb-8">
            Unesite 6-cifreni kod poslat na{" "}
            <span className="font-semibold text-blue-300">{email}</span>.
          </p>

          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
            {otp.map((data, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold text-slate-100 
                               bg-slate-900/70 border-2 border-slate-700 rounded-xl
                               focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 
                               transition-all duration-300 ease-in-out"
              />
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleVerify}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 p-3.5 rounded-xl font-bold text-lg
                              text-white shadow-lg shadow-blue-900/40 hover:shadow-indigo-900/40
                              transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
            >
              Potvrdi
            </button>

            <button
              onClick={handleResend}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors duration-200"
            >
              Niste dobili kod?{" "}
              <span className="font-semibold text-blue-400 hover:text-blue-300">
                Pošalji ponovo
              </span>
            </button>
          </div>

          {message && (
            <div className="mt-6">
              <div
                className={`p-3 rounded-lg border text-sm flex items-center justify-center gap-2
                ${
                  status === "success"
                    ? "bg-green-900/30 border-green-700 text-green-300"
                    : "bg-red-900/30 border-red-700 text-red-300"
                }`}
              >
                <span>{message}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
// --- End of Verification Component ---

// --- Main Chatbox Component ---
export default function Chatbox(): React.ReactNode {
  const userData = useSelector((state: RootState) => state.user);
  const { isAuthenticated, username, tier, token, isVerified, email } =
    userData;

  // Use a local state change to force a re-render when verification succeeds
  const [isVerifiedLocal, setIsVerifiedLocal] = useState(isVerified);

  // The user can access the full chat only if they are logged in AND verified
  const canAccessChat = isAuthenticated && isVerifiedLocal;

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Function to call when verification is successful
  const handleVerificationSuccess = () => {
    setIsVerifiedLocal(true);
  };

  // Update local state when Redux state changes (in case it changes outside this component)
  useEffect(() => {
    setIsVerifiedLocal(isVerified);
  }, [isVerified]);

  // --- Auto-Scrolling Logic ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // This effect runs every time a new message is added to the array
    scrollToBottom();
  }, [messages]);
  // --- End of Auto-Scrolling Logic ---

  useEffect(() => {
    document.title = "Insajder | Početna";

    if (!canAccessChat) {
      // If the user can't access chat, disconnect any existing socket and clear messages
      socketRef.current?.disconnect();
      setMessages([]);
      return;
    }

    // Connect socket only if user is authenticated AND verified
    socketRef.current = io({
      auth: { token: token },
    });

    socketRef.current.on("online_users", (users: string[]) => {
      setOnlineUsers(users);
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
  }, [token, canAccessChat]);

  const sendMessage = () => {
    if (!currentMessage.trim() || !socketRef.current || !canAccessChat) return;
    const newMessage = {
      text: currentMessage,
      sender: username || "Anonymous",
      tier: tier,
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

  // --- Conditional Rendering Check ---
  if (isAuthenticated && !isVerifiedLocal) {
    return (
      <VerificationComponent
        email={email}
        user={userData}
        onVerificationSuccess={handleVerificationSuccess}
      />
    );
  }

  if (!isAuthenticated) {
    // You might want to show a login prompt instead of the chatbox if not logged in
    // For now, let's keep the original structure for unauthenticated users, but only for the main return
  }

  const welcomeMessage = `Dobrodošao nazad, ${username || "Korisniče"}.`;

  return (
    <div className="flex w-full flex-col max-w-4xl mx-auto p-4 min-h-[calc(100vh-4rem)]">
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400 drop-shadow-sm">
          {welcomeMessage}
        </h1>
      </div>

      <div className="flex-1 flex flex-col bg-slate-900/70 backdrop-blur-xl rounded-2xl border-2 border-blue-500/20 shadow-2xl shadow-black/50 overflow-hidden">
        <div className="flex-1 p-4 sm:p-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent hover:scrollbar-thumb-slate-600 transition-colors">
          {/* Messages rendered only if the user can access the chat (isVerified) */}
          {messages.map((message, index) => {
            const isOwnMessage = message.sender === username;
            const prevMessage = messages[index - 1];
            const isConsecutive =
              prevMessage && prevMessage.sender === message.sender;

            return (
              <div
                key={message.id}
                className={`flex items-end gap-3 py-1 ${
                  isOwnMessage ? "justify-end" : "justify-start"
                } ${isConsecutive ? "" : "mt-4"}`}
              >
                {!isOwnMessage && !isConsecutive && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-cyan-300 shadow-md border border-slate-600">
                    {message.sender.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div
                  className={`flex flex-col max-w-[75%] md:max-w-[60%] p-3 rounded-2xl shadow-md transition-transform hover:-translate-y-0.5
                    ${
                      isOwnMessage
                        ? "bg-gradient-to-br from-blue-600 to-cyan-700 text-white rounded-br-md rounded-l-2xl rounded-tr-2xl"
                        : "bg-slate-800 text-slate-200 rounded-bl-md rounded-r-2xl rounded-tl-2xl"
                    }
                    ${isConsecutive && !isOwnMessage ? "ml-12" : ""}
                  `}
                >
                  {!isConsecutive && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-sm font-bold ${
                          message.tier?.toLowerCase() === "premium"
                            ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400"
                            : "text-slate-300"
                        }`}
                      >
                        {message.sender}
                      </span>
                      {message.tier?.toLowerCase() === "premium" ? (
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
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600/30 text-slate-300 font-medium">
                          FREE
                        </span>
                      )}
                    </div>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap break-words">
                    {message.text}
                  </p>
                  <div className="text-xs mt-1.5 opacity-50 self-end">
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

          {/* Conditional message if NOT logged in */}
          {!isAuthenticated && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <h2 className="text-xl font-bold text-slate-100 mb-2">
                Prijavite se za Chat
              </h2>
              <p className="text-slate-400">
                Morate biti ulogovani da biste videli poruke i učestvovali u
                razgovoru.
              </p>
            </div>
          )}
        </div>

        <div className="border-t-2 border-blue-500/20 p-4 bg-slate-900/50">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={
                isAuthenticated
                  ? isVerified
                    ? "Napišite poruku..."
                    : "Molimo verifikujte vaš email da biste pisali."
                  : "Morate biti ulogovani da pišete."
              }
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-slate-800/60 border-2 border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 focus:border-cyan-500 transition-all pr-14 disabled:cursor-not-allowed"
              disabled={!canAccessChat}
            />
            <button
              onClick={sendMessage}
              disabled={!canAccessChat || !currentMessage.trim()}
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
