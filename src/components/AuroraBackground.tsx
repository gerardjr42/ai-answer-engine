'use client'

import React from 'react'
import { motion } from 'framer-motion'

const AuroraBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#101827]">
      {[...Array(3)].map((_, index) => (
        <motion.div
          key={`wave-${index}`}
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, transparent, rgba(10, 145, 179, ${0.2 + index * 0.05}) 50%, transparent)`,
            filter: 'blur(60px)',
          }}
          initial={{
            transform: 'translate(-50%, 100%) rotate(45deg) scale(2)',
            opacity: 0,
          }}
          animate={{
            transform: [
              'translate(-50%, 100%) rotate(45deg) scale(2)',
              'translate(0%, 0%) rotate(45deg) scale(2)',
              'translate(50%, -100%) rotate(45deg) scale(2)',
            ],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 20 + index * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 7,
          }}
        />
      ))}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at bottom left, rgba(10, 145, 179, 0.2), transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  )
}

export default AuroraBackground

