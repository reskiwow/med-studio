"use client";

import { motion } from "framer-motion";

export default function AnimatedProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-neon-blue to-neon-purple"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
      />
    </div>
  );
}
