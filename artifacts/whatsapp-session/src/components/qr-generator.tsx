import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, RefreshCcw, AlertCircle, Loader2 } from "lucide-react";
import { useGenerateQr, usePollQrStatus } from "@workspace/api-client-react";
import { SessionResult } from "./session-result";

export function QrGenerator() {
  const [activeToken, setActiveToken] = useState<string | null>(null);
  
  const generateMut = useGenerateQr();
  
  const pollQuery = usePollQrStatus(activeToken || "", {
    query: {
      enabled: !!activeToken,
      refetchInterval: (query) => {
        // Poll every 2 seconds if waiting
        if (query.state.data?.status === "waiting") return 2000;
        return false;
      },
    }
  });

  const handleGenerate = () => {
    setActiveToken(null);
    generateMut.mutate(undefined, {
      onSuccess: (data) => {
        setActiveToken(data.sessionId);
      }
    });
  };

  const isConnected = pollQuery.data?.status === "connected";
  const isExpired = pollQuery.data?.status === "expired";
  const currentQr = pollQuery.data?.qr || generateMut.data?.qr;

  if (isConnected && pollQuery.data?.sessionID) {
    return <SessionResult sessionId={pollQuery.data.sessionID} onReset={() => setActiveToken(null)} />;
  }

  return (
    <div className="flex flex-col items-center w-full min-h-[350px] justify-center">
      <AnimatePresence mode="wait">
        {!activeToken && !generateMut.isPending ? (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center w-full"
          >
            <div className="w-20 h-20 bg-secondary/50 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-white/5">
              <QrCode className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-display font-semibold mb-2">Scan QR Code</h3>
            <p className="text-muted-foreground text-center text-sm mb-8 max-w-xs">
              Generate a unique QR code to link your WhatsApp account instantly.
            </p>
            <button
              onClick={handleGenerate}
              className="w-full max-w-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            >
              Generate QR Code
            </button>
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
            <p className="text-muted-foreground animate-pulse">Requesting QR Code...</p>
          </motion.div>
        ) : (
          <motion.div
            key="qr-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center w-full"
          >
            {isExpired ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 flex flex-col items-center text-center w-full max-w-sm mb-6">
                <AlertCircle className="w-10 h-10 text-destructive mb-3" />
                <h4 className="text-destructive font-semibold mb-1">QR Code Expired</h4>
                <p className="text-muted-foreground text-sm mb-4">Please generate a new one to continue.</p>
                <button
                  onClick={handleGenerate}
                  className="bg-background hover:bg-secondary text-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border border-white/5"
                >
                  Generate New QR
                </button>
              </div>
            ) : (
              <>
                <div className="relative p-4 bg-white rounded-3xl mb-8 shadow-2xl shadow-primary/10">
                  {currentQr ? (
                    <img src={currentQr} alt="WhatsApp QR Code" className="w-64 h-64 object-contain rounded-xl" />
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-xl">
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    </div>
                  )}
                  
                  {/* Scanning scanline animation */}
                  <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                    <motion.div 
                      className="w-full h-1 bg-primary/50 shadow-[0_0_15px_rgba(37,211,102,0.8)]"
                      animate={{ y: ["0%", "2400%", "0%"] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    />
                  </div>
                </div>

                <div className="text-left w-full max-w-sm bg-secondary/30 rounded-2xl p-5 border border-white/5">
                  <ol className="space-y-3">
                    <li className="flex gap-3 text-sm text-muted-foreground">
                      <span className="font-bold text-foreground">1.</span>
                      <div>Open WhatsApp on your phone</div>
                    </li>
                    <li className="flex gap-3 text-sm text-muted-foreground">
                      <span className="font-bold text-foreground">2.</span>
                      <div>Tap Menu <strong className="text-foreground">⋮</strong> or Settings and select <strong className="text-foreground">Linked Devices</strong></div>
                    </li>
                    <li className="flex gap-3 text-sm text-muted-foreground">
                      <span className="font-bold text-foreground">3.</span>
                      <div>Tap on <strong className="text-foreground">Link a device</strong> and point your phone to this screen</div>
                    </li>
                  </ol>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
