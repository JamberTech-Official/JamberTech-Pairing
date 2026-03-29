import { useState } from "react";
import { motion } from "framer-motion";
import { QrCode, Phone, ShieldCheck } from "lucide-react";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { QrGenerator } from "@/components/qr-generator";
import { PairGenerator } from "@/components/pair-generator";

export default function Home() {
  const [activeTab, setActiveTab] = useState("qr");

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 py-12 overflow-x-hidden">
      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat pointer-events-none mix-blend-screen"
        style={{ backgroundImage: `url('${import.meta.env.BASE_URL}images/abstract-bg.png')` }}
      />
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <main className="w-full max-w-xl relative z-10">
        {/* Header Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-2xl mb-4 border border-primary/20">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 mb-3">
            JamberTech Pair
          </h1>
          <p className="text-lg text-muted-foreground">
            Official WhatsApp Session Generator
          </p>
        </motion.div>

        {/* Main Glass Panel */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="glass-panel rounded-3xl p-6 md:p-8"
        >
          <AnimatedTabs
            tabs={[
              { id: "qr", label: "QR Code", icon: <QrCode className="w-4 h-4" /> },
              { id: "pair", label: "Phone Number", icon: <Phone className="w-4 h-4" /> },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
            className="mb-8"
          />

          <div className="relative">
            {activeTab === "qr" ? <QrGenerator /> : <PairGenerator />}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-sm text-muted-foreground/60 font-medium"
        >
          <p>Powered by Baileys • Secure & Encrypted</p>
        </motion.div>
      </main>
    </div>
  );
}
