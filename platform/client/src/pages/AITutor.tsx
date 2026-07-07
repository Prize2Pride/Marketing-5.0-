import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { getLoginUrl } from "@/const";
import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Bot, User, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function AITutor() {
  const { t, language, dir } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: history, isLoading: historyLoading } = trpc.ai.getChatHistory.useQuery({ limit: 50 }, { enabled: isAuthenticated });
  const chatMutation = trpc.ai.chat.useMutation();
  const clearMutation = trpc.ai.clearHistory.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, chatMutation.isPending]);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const msg = input.trim();
    setInput("");
    chatMutation.mutate(
      { message: msg, language },
      { onSuccess: () => utils.ai.getChatHistory.invalidate() }
    );
  };

  const handleClear = () => {
    clearMutation.mutate(undefined, {
      onSuccess: () => {
        utils.ai.getChatHistory.invalidate();
        toast.success(language === "ar" ? "تم مسح السجل" : language === "fr" ? "Historique effacé" : "History cleared");
      },
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen" dir={dir}>
        <Navbar />
        <div className="pt-24 container max-w-2xl text-center py-24">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-primary mx-auto mb-6 flex items-center justify-center">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">{t("ai.title")}</h2>
          <p className="text-muted-foreground mb-8">{t("auth.loginRequired")}</p>
          <Button onClick={() => window.location.href = getLoginUrl()} className="bg-primary text-primary-foreground font-semibold px-8">
            {t("auth.loginBtn")}
          </Button>
        </div>
      </div>
    );
  }

  const allMessages = [
    ...(history ?? []),
    ...(chatMutation.isPending ? [{ id: -1, role: "user" as const, content: chatMutation.variables?.message ?? "", createdAt: new Date(), userId: 0, language: language, chapterId: null }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col" dir={dir}>
      <Navbar />
      <div className="flex-1 flex flex-col pt-16">
        <div className="container max-w-4xl flex-1 flex flex-col py-6 h-[calc(100vh-4rem)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg">{t("ai.title")}</h1>
                <p className="text-xs text-muted-foreground">{t("ai.subtitle")}</p>
              </div>
            </div>
            {(history?.length ?? 0) > 0 && (
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive" onClick={handleClear}>
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:block">{t("ai.clear")}</span>
              </Button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
            {historyLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!historyLoading && allMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/30 to-primary/30 flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{t("ai.title")}</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  {language === "ar"
                    ? "مرحباً! أنا هنا لمساعدتك في رحلة التسويق الرقمي. اسألني أي شيء!"
                    : language === "fr"
                    ? "Bonjour! Je suis là pour vous aider dans votre parcours de marketing digital. Posez-moi n'importe quelle question!"
                    : "Hello! I'm here to help you on your digital marketing journey. Ask me anything!"}
                </p>
              </div>
            )}

            {allMessages.map((msg, idx) => (
              <div key={`${msg.id}-${idx}`} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-1">
                    R
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-card border border-border rounded-tl-none text-foreground/90"
                }`}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center mt-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {chatMutation.isPending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
                  R
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t("ai.thinking")}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0">
            <div className="flex gap-3 glass-card rounded-2xl p-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={t("ai.placeholder")}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none px-2"
                dir={dir}
              />
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4"
                onClick={handleSend}
                disabled={!input.trim() || chatMutation.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

