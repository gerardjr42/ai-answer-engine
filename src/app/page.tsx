"use client";

import AuroraBackground from "@/components/AuroraBackground";
import { Button } from "@/components/ui/button";
import { useAuth, UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen text-gray-100 overflow-hidden">
      {/* Animated Background */}
      <AuroraBackground />
      <div className="relative z-10">
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="fixed w-full z-50 border-b border-[#0A91B3]/20 bg-[#101827]/50 backdrop-blur-sm"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Image
                  src="/Images/dodecahedron.png"
                  alt="AetherScribe"
                  width={25}
                  height={25}
                  className="mr-2"
                />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl font-bold text-[#0A91B3]"
                >
                  AetherScribe
                </motion.span>
              </div>
              <div>
                {isSignedIn ? (
                  <UserButton afterSignOutUrl="/" />
                ) : (
                  <Link href="/sign-in">
                    <Button className="bg-[#0A91B3] text-white hover:bg-[#0A91B3]/80">
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </motion.nav>

        <div className="relative">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
            <div className="text-center space-y-10">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-7xl font-bold tracking-tight"
              >
                Unveil the Web with
                <br />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="text-[#0A91B3]"
                >
                  AetherScribe
                </motion.span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="max-w-2xl mx-auto text-xl md:text-2xl text-gray-300"
              >
                Harness the power of AI to extract, analyze, and interpret web
                content. AetherScribe brings intelligent web scraping to your
                fingertips.
              </motion.p>
            </div>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {[
              {
                title: "Ethereal Extraction",
                description:
                  "Advanced AI algorithms delve deep into web content, bringing forth precise and relevant information",
              },
              {
                title: "Instant Insights",
                description:
                  "Transform raw web data into actionable insights with real-time analysis and summaries",
              },
              {
                title: "Intuitive Interaction",
                description:
                  "Engage in natural conversations with AI to sculpt your web scraping experience",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * index, duration: 0.5 }}
                className="p-5 rounded-2xl bg-[#101827]/50 backdrop-blur-sm border border-[#0A91B3]/20"
              >
                <h3 className="text-lg font-semibold mb-2 text-[#0A91B3]">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="relative bg-[#101827]/50 backdrop-blur-sm py-12 mt-12"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.h2
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="text-2xl font-extrabold text-white sm:text-3xl"
              >
                Ready to transcend web scraping?
              </motion.h2>
              <motion.p
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ delay: 1.4, duration: 0.5 }}
                className="mt-3 text-lg text-gray-300"
              >
                Join AetherScribe today and elevate your web data extraction
                experience.
              </motion.p>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.5 }}
                className="mt-6 flex justify-center"
              >
                <Link href="/sign-up">
                  <Button className="text-lg px-8 py-3 bg-[#0A91B3] hover:bg-[#0A91B3]/80">
                    Begin Your Journey
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
