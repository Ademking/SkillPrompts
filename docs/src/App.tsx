import React, { useState } from "react";
import Confetti from "confetti-react";
import { useWindowSize } from "@uidotdev/usehooks";

import Logo from "./Logo";

const theme = {
  "--bg": "#0a0a0c",
  "--surface": "#111113",
  "--border": "rgba(255,255,255,0.06)",
  "--text": "rgba(255,255,255,0.94)",
  "--muted": "rgba(255,255,255,0.56)",
  "--dim": "rgba(255,255,255,0.32)",
} as const;

const features = [
  "Create and manage a library of AI skill prompts with customizable variables.",
  "Quickly insert prompts into ChatGPT and other supported sites.",
  "Contains a variety of pre-built prompts for different use cases.",
];

const supportedSites = ["chatgpt.com", "gemini.google.com"];

const roadmapSites = [
  "copilot.microsoft.com",
  "huggingface.co/chat",
  "chat.mistral.ai",
  "poe.com",
  "perplexity.ai",
  "chat.deepseek.com",
  "kimi.com",
  "v0.app",
  "github.com/copilot",
  "grok.com",
  "cursor.com/agents",
  "claude.ai",
];

const installationSteps = [
  "Clone the repository or download the source code.",
  "Open your browser's extensions page (e.g., chrome://extensions for Chrome).",
  "Enable Developer mode (usually a toggle in the top right).",
  "Click Load unpacked and select the directory where you cloned/downloaded the extension.",
  "The extension should now be installed and ready to use.",
  "Open a supported AI chat platform and type / to see your prompts in action.",
  "Customize and manage your prompts through the extension's options page. Just click on the extension icon in your browser toolbar.",
];

const howItWorks = [
  {
    num: "01",
    title: "Install the extension",
    desc: "Add SkillPrompts to your browser.",
  },
  {
    num: "02",
    title: "Open an AI chat",
    desc: "Go to ChatGPT, Gemini, or any supported platform.",
  },
  {
    num: "03",
    title: "Type / and pick a Skill",
    desc: "Your full prompt appears instantly.",
  },
];

export default function App() {
  const [run] = useState(true);
  const size = useWindowSize();
  const confettiWidth = Math.max((size.width ?? 0) - 20, 0);



  return (
    <>
      <Confetti width={confettiWidth} recycle={false} run={run} />
      <div
        style={
          {
            ...theme,
            background: "var(--bg)",
            color: "var(--text)",
            minHeight: "100vh",
          } as React.CSSProperties
        }
      >
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="flex justify-center mb-10">
            <Logo className="w-20 h-20" />
          </div>

          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
              Welcome To <span style={{ color: "#0b78ff" }}>SkillPrompts</span>
            </h1>
            <p
              className="text-lg leading-relaxed max-w-2xl mx-auto"
              style={{ color: "var(--muted)" }}
            >
              A browser extension to create, organize, and reuse customizable AI
              prompts across multiple AI chat platforms for faster, more efficient
              interactions.
            </p>
          </div>

          <div
            className="rounded-[28px] overflow-hidden border mb-20"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface)",
            }}
          >
            <div className="aspect-video">
              <iframe
                src="https://www.youtube-nocookie.com/embed/0Y1KJdW1noI"
                title="SkillPrompts Demo"
                allowFullScreen
                className="w-full h-full"
                style={{ border: "none" }}
              />
            </div>
          </div>

          <section className="mb-20">
            <h2 className="text-2xl font-semibold mb-10 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {howItWorks.map((step, i) => (
                <div
                  key={i}
                  className="rounded-[24px] p-6 border"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface)",
                  }}
                >
                  <div
                    className="text-sm font-mono mb-6"
                    style={{ color: "var(--dim)" }}
                  >
                    {step.num}
                  </div>
                  <h3 className="text-lg font-medium mb-3">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-6">Features</h2>
            <div className="space-y-4">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex gap-4"
                  style={{ color: "var(--muted)" }}
                >
                  <span style={{ color: "var(--dim)" }}>•</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-6">Supported Sites</h2>
            <div className="space-y-6">
              <div>
                <p className="text-sm mb-3" style={{ color: "var(--dim)" }}>
                  Currently supported:
                </p>
                <div className="flex flex-wrap gap-2">
                  {supportedSites.map((s, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl border text-sm"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--surface)",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm mb-3" style={{ color: "var(--dim)" }}>
                  On the roadmap:
                </p>
                <div className="flex flex-wrap gap-2">
                  {roadmapSites.map((s, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl border text-sm"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--muted)",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-6">Installation</h2>
            <div className="space-y-4">
              {installationSteps.map((step, i) => (
                <div
                  key={i}
                  className="flex gap-4"
                  style={{ color: "var(--muted)" }}
                >
                  <span
                    className="font-mono text-xs w-6 flex-shrink-0"
                    style={{ color: "var(--dim)" }}
                  >
                    {i + 1}.
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-6">Contributing</h2>
            <p style={{ color: "var(--muted)" }}>
              Contributions are welcome! If you have ideas for new features,
              improvements, or bug fixes, please open an issue or submit a pull
              request.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-6">License</h2>
            <p style={{ color: "var(--muted)" }}>
              This project is licensed under the MIT License.
            </p>
          </section>

          <section
            className="mb-16"
          >
            <div
              className="rounded-[32px] border p-10 text-center"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
              }}
            >
              <h2 className="text-2xl font-semibold mb-4">
                Found an issue? Have a feature idea?
              </h2>
              <p className="mb-8" style={{ color: "var(--muted)" }}>
                Help make SkillPrompts better.
              </p>
              <a
                href="https://github.com/Ademking/SkillPrompts"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button
                  className="px-7 py-3 rounded-2xl text-sm font-medium active:scale-[0.98]"
                  style={{
                    background: "white",
                    color: "black",
                  }}
                >
                  Open an Issue / Feature Request
                </button>
              </a>
            </div>
          </section>

          <footer
            className="py-8 border-t flex flex-col md:flex-row items-center justify-between gap-5"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="text-sm" style={{ color: "var(--dim)" }}>
              SkillPrompts
            </div>
            <div className="flex items-center gap-5 text-sm">
              <a
                href="https://github.com/Ademking/SkillPrompts"
                className="hover:text-white transition-colors"
                style={{ color: "var(--muted)" }}
              >
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/ademkouki"
                className="hover:text-white transition-colors"
                style={{ color: "var(--muted)" }}
              >
                LinkedIn
              </a>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
