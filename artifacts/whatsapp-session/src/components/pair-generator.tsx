import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Loader2, AlertCircle, Hash, ArrowRight } from "lucide-react";
import { useGeneratePairCode, usePollPairStatus } from "@workspace/api-client-react";
import { SessionResult } from "./session-result";

export function PairGenerator() {
  const [number, setNumber] = useState("");
  const [activeToken, setActiveToken] = useState<string | null>(null);
  
  const generateMut = useGeneratePairCode();
  
  const pollQuery = usePollPairStatus(activeToken || "", {
    query: {
      enabled: !!activeToken,
      refetchInterval: (query) => {
        if (query.state.data?.status === "waiting") return 2000;
        return false;
      },
    }
  });

  const handleGenerate = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!number || number.length < 10) return;
    
    // Clean number
    const cleanNumber = number.replace(/[^0-9]/g, "");
    
    setActiveToken(null);
    generateMut.mutate({ data: { number: cleanNumber } }, {
      onSuccess: (data) => {
        setActiveToken(data.sessionId);
      }
    });
  };

  const isConnected = pollQuery.data?.status === "connected";
  const isExpired = pollQuery.data?.status === "expired";
  const pairCode = generateMut.data?.pairCode;

  if (isConnected && pollQuery.data?.sessionID) {
    return <SessionResult sessionId={pollQuery.data.sessionID} onReset={() => setActiveToken(null)} />;
  }

  return (
    <div className="flex flex-col items-center w-full min-h-[350px] justify-center">
      <AnimatePresence mode="wait">
        {!activeToken && !generateMut.isPending ? (
          <motion.div
            key="input-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-sm"
          >
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-secondary/50 rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-white/5">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">Use Phone Number</h3>
              <p className="text-muted-foreground text-sm">
                Enter your WhatsApp number with country code to get an 8-character pairing code.
              </p>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-muted-foreground font-medium">+</span>
                </div>
                <input
                  type="tel"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="923001234567"
                  className="w-full pl-8 pr-4 py-4 rounded-xl glass-input text-foreground placeholder:text-white/20 font-medium text-lg"
                  required
                />
              </div>
              
              {generateMut.isError && (
                <div className="text-destructive text-sm flex items-center gap-2 p-2 bg-destructive/10 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span>{generateMut.error?.message || "Failed to generate code"}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={number.length < 10}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary disabled:cursor-not-allowed text-primary-foreground font-semibold py-4 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
              >
                Generate Pair Code
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        ) : generateMut.isPending ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-12"
          >
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground animate-pulse">Generating your pair code...</p>
          </motion.div>
        ) : (
          <motion.div
            key="code-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center w-full"
          >
            {isExpired ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 flex flex-col items-center text-center w-full max-w-sm mb-6">
                <AlertCircle className="w-10 h-10 text-destructive mb-3" />
                <h4 className="text-destructive font-semibold mb-1">Code Expired</h4>
                <p className="text-muted-foreground text-sm mb-4">This session request has timed out.</p>
                <button
                  onClick={() => setActiveToken(null)}
                  className="bg-background hover:bg-secondary text-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border border-white/5"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">Your Pairing Code</p>
                <div className="bg-black/50 border border-primary/30 rounded-2xl px-8 py-6 mb-8 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                  <h2 className="text-4xl md:text-5xl font-mono font-bold tracking-[0.2em] text-white relative z-10">
                    {pairCode || "--------"}
                  </h2>
                </div>

                <div className="text-left w-full max-w-sm bg-secondary/30 rounded-2xl p-5 border border-white/5">
                  <div className="flex items-center gap-2 mb-4 text-foreground font-semibold">
                    <Hash className="w-5 h-5 text-primary" />
                    How to enter code:
                  </div>
                  <ol className="space-y-3">
                    <li className="flex gap-3 text-sm text-muted-foreground">
                      <span className="font-bold text-foreground">1.</span>
                      <div>Open WhatsApp → <strong className="text-foreground">Linked Devices</strong></div>
                    </li>
                    <li className="flex gap-3 text-sm text-muted-foreground">
                      <span className="font-bold text-foreground">2.</span>
                      <div>Tap <strong className="text-foreground">Link a device</strong></div>
                    </li>
                    <li className="flex gap-3 text-sm text-muted-foreground">
                      <span className="font-bold text-foreground">3.</span>
                      <div>Tap <strong className="text-primary border-b border-primary/30">Link with phone number instead</strong> at the bottom</div>
                    </li>
                    <li className="flex gap-3 text-sm text-muted-foreground">
                      <span className="font-bold text-foreground">4.</span>
                      <div>Enter the 8-character code shown above</div>
                    </li>
                  </ol>
                </div>
                
                <div className="mt-8 flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm">Waiting for connection...</span>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
