import { motion } from "framer-motion";
import { CheckCircle2, Copy, RefreshCw, Server, TerminalSquare, KeyRound } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

interface SessionResultProps {
  sessionId: string;
  onReset: () => void;
}

export function SessionResult({ sessionId, onReset }: SessionResultProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      toast({
        title: "Session ID Copied!",
        description: "Ready to be pasted in your environment variables.",
      });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#25D366', '#ffffff']
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please select the text and copy manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex flex-col items-center w-full"
    >
      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="w-8 h-8 text-primary" />
      </div>
      
      <h3 className="text-2xl font-display font-bold text-foreground mb-2">Connected!</h3>
      <p className="text-muted-foreground mb-8 text-center max-w-sm">
        Your WhatsApp session has been successfully linked. Keep your session ID safe.
      </p>

      <div className="w-full bg-black/40 border border-primary/20 rounded-2xl p-1 relative group mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 opacity-50" />
        <div className="flex items-center gap-3 relative z-10 p-3 pl-5">
          <KeyRound className="w-5 h-5 text-primary shrink-0" />
          <code className="text-foreground font-mono flex-1 truncate text-lg">
            {sessionId}
          </code>
          <button
            onClick={handleCopy}
            className="shrink-0 bg-secondary hover:bg-secondary/80 text-foreground p-3 rounded-xl transition-all active:scale-95 group-hover:shadow-lg"
            title="Copy Session ID"
          >
            {copied ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="w-full bg-secondary/30 rounded-2xl p-6 mb-8 text-left border border-white/5">
        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <TerminalSquare className="w-5 h-5 text-primary" />
          How to use this Session ID:
        </h4>
        <ol className="space-y-4">
          <li className="flex gap-3 text-sm text-muted-foreground">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-background flex items-center justify-center text-xs font-bold text-foreground border border-white/10">1</span>
            <div><strong className="text-foreground">Copy</strong> the Session ID above.</div>
          </li>
          <li className="flex gap-3 text-sm text-muted-foreground">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-background flex items-center justify-center text-xs font-bold text-foreground border border-white/10">2</span>
            <div>Go to your host (<strong className="text-foreground">Railway, Render, Koyeb</strong> etc).</div>
          </li>
          <li className="flex gap-3 text-sm text-muted-foreground">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-background flex items-center justify-center text-xs font-bold text-foreground border border-white/10">3</span>
            <div>Paste it into the <strong className="text-primary font-mono text-xs px-1.5 py-0.5 rounded bg-primary/10">SESSION_ID</strong> environment variable.</div>
          </li>
          <li className="flex gap-3 text-sm text-muted-foreground">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-background flex items-center justify-center text-xs font-bold text-foreground border border-white/10">4</span>
            <div><strong className="text-foreground">Deploy</strong> your bot! ✅</div>
          </li>
        </ol>
      </div>

      <button
        onClick={onReset}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium text-sm"
      >
        <RefreshCw className="w-4 h-4" />
        Generate New Session
      </button>
    </motion.div>
  );
}
