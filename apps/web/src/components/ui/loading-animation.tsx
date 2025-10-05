"use client"

import { motion } from "framer-motion"
import Image from "next/image"

type LoadingAnimationProps = {
  label?: string
  size?: number
}

export function LoadingAnimation({ label = "Loading…", size = 64 }: LoadingAnimationProps) {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1, rotateY: [0, 360] }}
        transition={{
          opacity: { duration: 0.6, ease: "easeOut" },
          scale: { duration: 0.6, ease: "easeOut" },
          rotateY: { duration: 2.5, ease: [0.25, 0.1, 0.25, 1], repeat: Infinity },
        }}
        style={{ transformStyle: "preserve-3d" }}
        aria-busy
        aria-label={label}
        role="status"
      >
        <motion.div
          className="absolute inset-0 rounded-full blur-xl opacity-30"
          style={{ background: "radial-gradient(circle, rgba(3, 2, 19, 0.4) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}>
          <Image src="/trellis-light.svg" alt={label} width={size} height={size} priority className="relative z-10" />
        </motion.div>
      </motion.div>
    </div>
  )
}

export default LoadingAnimation


