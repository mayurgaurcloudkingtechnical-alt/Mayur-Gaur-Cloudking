"use client";

import * as React from "react";
import { MessageCircle, Phone, X, Bot, Send, Sparkles, User, ArrowRight, HelpCircle, BookOpen } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants/site";
import { openCareerCounselingModal } from "@/components/public/career-counseling-modal";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  options?: Array<{ label: string; action: string }>;
}

export function FloatingWhatsApp() {
  const [activeTab, setActiveTab] = React.useState<"chat" | "whatsapp" | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "1",
      sender: "bot",
      text: "Namaste! Welcome to SoftLab Global. I am your 24/7 AI Admission & Academic Assistant. How can I guide you today?",
      options: [
        { label: "AI & ML Master Course Details", action: "aiml" },
        { label: "Fee Structure & ₹5,000 Down Payment", action: "fee" },
        { label: "Book Free 1-on-1 Counseling", action: "counseling" },
        { label: "Chat Directly on WhatsApp", action: "whatsapp" },
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const whatsappNumber = "919196596975";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Hello SoftLab Global, I want to inquire about IT courses, AI/ML master program, and fee details."
  )}`;

  React.useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const handleAction = (action: string) => {
    if (action === "aiml") {
      addUserMessage("Tell me about the AI & ML Master Course.");
      setTimeout(() => {
        addBotMessage(
          "Our AI & ML Master Course (Cohort 2026) covers Python, PyTorch, TensorFlow, Deep Learning, NLP, Generative AI (LLMs & RAG), and Autonomous Agents. It includes 100% placement assurance, real-world project portfolios, and verifiable ISO certification!",
          [
            { label: "Check Fee & Installments", action: "fee" },
            { label: "Book Free Counseling Session", action: "counseling" },
            { label: "Speak to Counselor on WhatsApp", action: "whatsapp" },
          ]
        );
      }, 500);
    } else if (action === "fee") {
      addUserMessage("What is the fee structure and down payment?");
      setTimeout(() => {
        addBotMessage(
          "For our Master Programs (e.g. AI & ML): Total Course Fee is ₹90,000. You can book your seat with a Down Payment of just ₹5,000. The remaining balance of ₹85,000 can be paid in convenient monthly installments (₹42,500 x 2). Transparent receipts and LMS access are provided immediately upon enrollment!",
          [
            { label: "Book Seat with ₹5,000 Down Payment", action: "counseling" },
            { label: "Talk to Accounts Desk on WhatsApp", action: "whatsapp" },
          ]
        );
      }, 500);
    } else if (action === "counseling") {
      addUserMessage("I want to book free career counseling.");
      setTimeout(() => {
        addBotMessage("Opening the Career Counseling Appointment window for you right now...");
        openCareerCounselingModal();
      }, 400);
    } else if (action === "whatsapp") {
      window.open(whatsappUrl, "_blank");
    } else if (action === "other_courses") {
      addUserMessage("What other courses are available?");
      setTimeout(() => {
        addBotMessage(
          "We offer Flagship Certification Programs in:\n1. Full Stack Web Development (MERN / Next.js)\n2. Cloud Computing & DevOps (AWS / Docker / K8s)\n3. Cyber Security & Ethical Hacking\n4. Data Science & Big Data Analytics",
          [
            { label: "Book Free Counseling", action: "counseling" },
            { label: "WhatsApp Admissions Desk", action: "whatsapp" },
          ]
        );
      }, 500);
    }
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: "user", text },
    ]);
  };

  const addBotMessage = (text: string, options?: Array<{ label: string; action: string }>) => {
    setMessages((prev) => [
      ...prev,
      { id: (Date.now() + 1).toString(), sender: "bot", text, options },
    ]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const query = inputMessage.trim();
    addUserMessage(query);
    setInputMessage("");

    const lower = query.toLowerCase();
    setTimeout(() => {
      if (lower.includes("fee") || lower.includes("cost") || lower.includes("price") || lower.includes("installment") || lower.includes("payment")) {
        addBotMessage(
          "Total fee for our AI/ML Master program is ₹90,000 with a starting Down Payment of ₹5,000. Balance ₹85,000 is payable in two equal monthly installments of ₹42,500.",
          [
            { label: "Book Free Counseling", action: "counseling" },
            { label: "WhatsApp Chat", action: "whatsapp" },
          ]
        );
      } else if (lower.includes("ai") || lower.includes("ml") || lower.includes("machine learning") || lower.includes("data")) {
        addBotMessage(
          "Our AI & Machine Learning program covers Deep Learning, PyTorch, Large Language Models (LLMs), LangChain, and Computer Vision with 100% Placement Support.",
          [
            { label: "Book Free Demo Session", action: "counseling" },
            { label: "Ask Counselor on WhatsApp", action: "whatsapp" },
          ]
        );
      } else if (lower.includes("admission") || lower.includes("counsel") || lower.includes("contact") || lower.includes("phone") || lower.includes("number")) {
        addBotMessage(
          `You can reach our Admissions Helpline directly at +91 9196596975 or info@softlabglobal.com. Would you like to book a free 1-on-1 counseling call?`,
          [
            { label: "Book Free Counseling", action: "counseling" },
            { label: "WhatsApp Direct", action: "whatsapp" },
          ]
        );
      } else if (lower.includes("srishti")) {
        addBotMessage(
          "Srishti Sharma is enrolled in our AI & ML Complete Master Cohort (Batch AIML-2026-B1) with Enrollment Number SLG-2026-AIML-001. Her fee plan has ₹5,000 Down Payment received and verified receipt REC-2026-AIML-001 issued.",
          [
            { label: "Check Other Courses", action: "other_courses" },
            { label: "Chat on WhatsApp", action: "whatsapp" },
          ]
        );
      } else {
        addBotMessage(
          "Thank you for reaching out! For detailed guidance, syllabus brochures, or immediate seat reservations, you can book free counseling or talk to our counselor directly on WhatsApp.",
          [
            { label: "Book Free Counseling", action: "counseling" },
            { label: "Chat on WhatsApp (+91 9196596975)", action: "whatsapp" },
          ]
        );
      }
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* 1. AI Chatbot Popup Window */}
      {activeTab === "chat" && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 sm:w-96 h-[480px] flex flex-col mb-2 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 text-white p-3.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span>SoftLab AI Assistant</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                </h4>
                <p className="text-[10px] text-emerald-100">Online • 24/7 Admissions & LMS Desk</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab(null)}
              className="text-white/80 hover:text-white rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>

                {/* Quick Action Chips from Bot */}
                {msg.options && msg.options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                    {msg.options.map((opt) => (
                      <button
                        key={opt.action}
                        type="button"
                        onClick={() => handleAction(opt.action)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-semibold py-1 px-2.5 rounded-full transition-all text-left shadow-xs"
                      >
                        {opt.label} &rarr;
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-2.5 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              placeholder="Ask about AI/ML, fees, counseling..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition-all shadow-sm"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* 2. WhatsApp Direct Popup Box */}
      {activeTab === "whatsapp" && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-72 mb-2 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center font-bold text-xs">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">SoftLab Official WhatsApp</p>
                <span className="text-[10px] text-emerald-600 font-medium">● Counselor Active Now</span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            Chat directly with our academic counselors regarding course brochures, down payment, and batch timings!
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Open WhatsApp Chat</span>
          </a>

          <div className="mt-2 text-center">
            <a
              href={`tel:${SITE_CONFIG.contact.phoneTel}`}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-700"
            >
              <Phone className="w-3 h-3 text-emerald-600" />
              <span>Or call: {SITE_CONFIG.contact.phone}</span>
            </a>
          </div>
        </div>
      )}

      {/* 3. Floating Action Buttons (WhatsApp + AI Chatbot) */}
      <div className="flex items-center gap-2">
        {/* AI Chatbot Button */}
        <button
          onClick={() => setActiveTab(activeTab === "chat" ? null : "chat")}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:scale-105 active:scale-95 transition-all border border-emerald-500/40 focus:outline-none focus:ring-4 focus:ring-emerald-300"
          title="Ask AI Assistant"
        >
          <Bot className="w-5 h-5 text-emerald-400 animate-pulse" />
          <span className="text-xs font-bold hidden sm:inline">AI Help Assistant</span>
        </button>

        {/* WhatsApp Direct Connect Button */}
        <button
          onClick={() => setActiveTab(activeTab === "whatsapp" ? null : "whatsapp")}
          className="flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xl hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-200"
          title="Chat on WhatsApp (+91 9196596975)"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}
