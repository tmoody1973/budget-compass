import { useState, useEffect, useRef } from "react";

// ─── Milwaukee "Civic Modernism" Design System ───
// Cream City brick warmth + Lake Michigan depth + Industrial boldness
// Not a generic chatbot — an interactive civic exhibit

const COLORS = {
  // Primary: Lake Michigan depth
  lakeDark: "#0C2340",
  lakeDeep: "#13375B",
  lakeMid: "#1B5E8A",
  lakeLight: "#2B7FB5",
  lakeGlow: "#4DA8DA",
  
  // Accent: Cream City warmth
  cream: "#F5E6C8",
  creamLight: "#FBF3E4",
  creamDark: "#D4BC8A",
  brick: "#C4956A",
  
  // Signal colors
  mint: "#34D399",
  coral: "#F87171",
  amber: "#FBBF24",
  violet: "#A78BFA",
  
  // Neutrals
  ink: "#0F1720",
  slate: "#374151",
  fog: "#94A3B8",
  mist: "#E2E8F0",
  snow: "#F8FAFC",
  white: "#FFFFFF",
};

const MODE_CONFIG = {
  ask: {
    icon: "💬",
    label: "Ask",
    tagline: "Your budget questions, answered instantly",
    color: COLORS.lakeLight,
    gradient: `linear-gradient(135deg, ${COLORS.lakeDark}, ${COLORS.lakeMid})`,
    description: "Ask anything about Milwaukee's $1.4B budget. Get verified numbers, interactive charts, and plain-language explanations.",
    personas: ["Everyone"],
  },
  hear: {
    icon: "🎙️",
    label: "Hear",
    tagline: "Budget briefings you can listen to",
    color: COLORS.mint,
    gradient: `linear-gradient(135deg, #065F46, #059669)`,
    description: "Get personalized audio briefings about what matters to your neighborhood. Like NPR for your city budget.",
    personas: ["Commuters", "Accessibility"],
  },
  see: {
    icon: "📊",
    label: "See",
    tagline: "Complex data, made visual",
    color: COLORS.amber,
    gradient: `linear-gradient(135deg, #92400E, #D97706)`,
    description: "AI-generated infographics that turn 208 pages of budget data into shareable visual stories.",
    personas: ["Journalists", "Educators"],
  },
  remix: {
    icon: "🎛️",
    label: "Remix",
    tagline: "Redesign the budget yourself",
    color: COLORS.violet,
    gradient: `linear-gradient(135deg, #4C1D95, #7C3AED)`,
    description: "Move money between departments and see real consequences. What would YOU fund?",
    personas: ["Students", "Advocates"],
  },
};

// ─── Animated Background Pattern (Cream City Brick subtle) ───
function BrickPattern() {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      opacity: 0.025, pointerEvents: "none", zIndex: 0,
      backgroundImage: `
        repeating-linear-gradient(90deg, ${COLORS.brick} 0px, ${COLORS.brick} 2px, transparent 2px, transparent 60px),
        repeating-linear-gradient(0deg, ${COLORS.brick} 0px, ${COLORS.brick} 1px, transparent 1px, transparent 28px)
      `,
    }} />
  );
}

// ─── Floating Orb (Lake Michigan glow) ───
function LakeOrb({ active }) {
  return (
    <div style={{
      position: "absolute", top: "-20%", right: "-10%",
      width: 600, height: 600, borderRadius: "50%",
      background: `radial-gradient(circle, ${COLORS.lakeGlow}15, ${COLORS.lakeMid}08, transparent 70%)`,
      filter: "blur(80px)",
      transition: "all 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
      transform: active ? "scale(1.2)" : "scale(1)",
      opacity: active ? 0.8 : 0.4,
    }} />
  );
}

// ─── Mode Card ───
function ModeCard({ mode, isActive, onClick, index }) {
  const [hovered, setHovered] = useState(false);
  const config = MODE_CONFIG[mode];
  const isExpanded = isActive;
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        flex: isExpanded ? "2.5" : "1",
        minWidth: isExpanded ? 320 : 140,
        height: isExpanded ? 220 : 180,
        borderRadius: 20,
        background: isExpanded ? config.gradient : hovered ? `${COLORS.white}` : `${COLORS.snow}`,
        border: `1.5px solid ${isExpanded ? "transparent" : hovered ? config.color : COLORS.mist}`,
        cursor: "pointer",
        transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: isExpanded ? "flex-end" : "center",
        alignItems: isExpanded ? "flex-start" : "center",
        padding: isExpanded ? "28px 32px" : "20px 16px",
        boxShadow: isExpanded
          ? `0 20px 60px ${config.color}30, 0 8px 24px rgba(0,0,0,0.15)`
          : hovered
            ? `0 8px 32px ${config.color}20`
            : "0 2px 8px rgba(0,0,0,0.04)",
        transform: hovered && !isExpanded ? "translateY(-4px)" : "translateY(0)",
        animationDelay: `${index * 0.1}s`,
      }}
    >
      {/* Glow effect for active */}
      {isExpanded && (
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 200, height: 200, borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          filter: "blur(40px)",
        }} />
      )}
      
      <div style={{
        fontSize: isExpanded ? 36 : 32,
        marginBottom: isExpanded ? 12 : 8,
        transition: "all 0.4s ease",
        filter: isExpanded ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" : "none",
      }}>
        {config.icon}
      </div>
      
      <div style={{
        fontFamily: "'Instrument Serif', Georgia, serif",
        fontSize: isExpanded ? 28 : 18,
        fontWeight: isExpanded ? 400 : 500,
        color: isExpanded ? COLORS.white : COLORS.ink,
        letterSpacing: isExpanded ? "-0.02em" : "-0.01em",
        transition: "all 0.4s ease",
        textAlign: isExpanded ? "left" : "center",
      }}>
        {config.label}
      </div>
      
      {isExpanded && (
        <div style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 14,
          color: "rgba(255,255,255,0.85)",
          marginTop: 4,
          lineHeight: 1.5,
          maxWidth: 280,
        }}>
          {config.tagline}
        </div>
      )}
      
      {isExpanded && (
        <div style={{
          display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap",
        }}>
          {config.personas.map(p => (
            <span key={p} style={{
              fontSize: 11, fontFamily: "'DM Sans', system-ui, sans-serif",
              padding: "3px 10px", borderRadius: 20,
              background: "rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.9)",
              fontWeight: 500,
            }}>{p}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sample Budget Data for Demo ───
const SAMPLE_DEPARTMENTS = [
  { name: "Police", amount: 311.2, pct: 38.4, color: COLORS.lakeDark },
  { name: "Fire", amount: 128.5, pct: 15.8, color: COLORS.lakeDeep },
  { name: "DPW", amount: 98.3, pct: 12.1, color: COLORS.lakeMid },
  { name: "Health", amount: 62.1, pct: 7.7, color: COLORS.lakeLight },
  { name: "Library", amount: 31.7, pct: 3.9, color: COLORS.lakeGlow },
  { name: "Parks", amount: 27.4, pct: 3.4, color: COLORS.mint },
  { name: "Other", amount: 151.5, pct: 18.7, color: COLORS.fog },
];

// ─── Budget Bar Chart (inline) ───
function BudgetBars({ data, animateIn }) {
  const maxVal = Math.max(...data.map(d => d.amount));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map((d, i) => (
        <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 72, textAlign: "right", fontSize: 13,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            color: COLORS.slate, fontWeight: 500, flexShrink: 0,
          }}>{d.name}</div>
          <div style={{
            flex: 1, height: 28, background: COLORS.mist, borderRadius: 6, overflow: "hidden",
            position: "relative",
          }}>
            <div style={{
              height: "100%", borderRadius: 6,
              background: `linear-gradient(90deg, ${d.color}, ${d.color}CC)`,
              width: animateIn ? `${(d.amount / maxVal) * 100}%` : "0%",
              transition: `width 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.08}s`,
              display: "flex", alignItems: "center", justifyContent: "flex-end",
              paddingRight: 10,
            }}>
              <span style={{
                fontSize: 11, fontWeight: 600, color: COLORS.white,
                fontFamily: "'DM Mono', monospace, sans-serif",
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}>${d.amount}M</span>
            </div>
          </div>
          <div style={{
            width: 40, fontSize: 12, color: COLORS.fog,
            fontFamily: "'DM Mono', monospace, sans-serif",
          }}>{d.pct}%</div>
        </div>
      ))}
    </div>
  );
}

// ─── Chat Message Bubble ───
function ChatMessage({ role, content, chart, typing }) {
  const isUser = role === "user";
  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 16, animation: "fadeSlideUp 0.4s ease",
    }}>
      {!isUser && (
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: COLORS.lakeDark, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, marginRight: 10, marginTop: 2,
          boxShadow: `0 2px 8px ${COLORS.lakeDark}40`,
        }}>🏛️</div>
      )}
      <div style={{
        maxWidth: "80%", padding: chart ? "16px 20px" : "12px 18px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser ? COLORS.lakeDark : COLORS.white,
        color: isUser ? COLORS.white : COLORS.ink,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: 14.5, lineHeight: 1.6,
        boxShadow: isUser ? "none" : "0 2px 12px rgba(0,0,0,0.06)",
        border: isUser ? "none" : `1px solid ${COLORS.mist}`,
      }}>
        {typing ? (
          <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 7, height: 7, borderRadius: "50%",
                background: COLORS.fog,
                animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        ) : (
          <>
            <div>{content}</div>
            {chart && (
              <div style={{
                marginTop: 16, padding: 16,
                background: COLORS.snow, borderRadius: 12,
                border: `1px solid ${COLORS.mist}`,
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: COLORS.lakeDark,
                  marginBottom: 12, fontFamily: "'DM Sans', system-ui, sans-serif",
                }}>General City Purposes Budget — FY 2025</div>
                <BudgetBars data={SAMPLE_DEPARTMENTS} animateIn={true} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Remix Slider ───
function RemixSlider({ dept, value, onChange, maxVal, originalVal }) {
  const delta = value - originalVal;
  const deltaColor = delta > 0 ? COLORS.mint : delta < 0 ? COLORS.coral : COLORS.fog;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6,
      }}>
        <span style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 14, fontWeight: 600, color: COLORS.ink,
        }}>{dept.name}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "'DM Mono', monospace, sans-serif",
            fontSize: 14, fontWeight: 600, color: COLORS.ink,
          }}>${value.toFixed(1)}M</span>
          {delta !== 0 && (
            <span style={{
              fontFamily: "'DM Mono', monospace, sans-serif",
              fontSize: 12, color: deltaColor, fontWeight: 600,
              padding: "2px 8px", borderRadius: 6,
              background: `${deltaColor}15`,
            }}>{delta > 0 ? "+" : ""}{delta.toFixed(1)}M</span>
          )}
        </div>
      </div>
      <input
        type="range" min={0} max={maxVal} step={0.1} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          width: "100%", height: 6, borderRadius: 3, appearance: "none",
          background: `linear-gradient(90deg, ${dept.color} ${(value/maxVal)*100}%, ${COLORS.mist} ${(value/maxVal)*100}%)`,
          cursor: "pointer", outline: "none",
        }}
      />
    </div>
  );
}

// ─── Audio Waveform Visualization ───
function AudioWave({ playing }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 2, height: 40,
      justifyContent: "center",
    }}>
      {Array.from({ length: 32 }).map((_, i) => {
        const h = playing
          ? 8 + Math.sin(i * 0.6 + Date.now() * 0.004) * 16
          : 4;
        return (
          <div key={i} style={{
            width: 3, borderRadius: 2,
            height: playing ? `${h}px` : "4px",
            background: playing
              ? `linear-gradient(180deg, ${COLORS.mint}, ${COLORS.lakeLight})`
              : COLORS.mist,
            transition: playing ? "height 0.15s ease" : "height 0.5s ease",
          }} />
        );
      })}
    </div>
  );
}

// ─── Suggested Questions ───
function QuickPrompts({ onSelect, mode }) {
  const prompts = {
    ask: [
      "What's the total city budget?",
      "How much goes to police vs. fire?",
      "What changed from last year?",
      "Show me DPW spending breakdown",
    ],
    hear: [
      "Brief me on my neighborhood",
      "What's new in this year's budget?",
      "Explain the tax levy",
      "5-minute budget overview",
    ],
    see: [
      "Compare top 5 departments",
      "Show spending trends 2020-2025",
      "Where do my tax dollars go?",
      "Capital projects map",
    ],
    remix: [
      "What if we increase parks 20%?",
      "Shift $10M from police to health",
      "Double the library budget",
      "Show me community proposals",
    ],
  };
  
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 8, padding: "0 4px",
    }}>
      {(prompts[mode] || prompts.ask).map((q, i) => (
        <button key={i} onClick={() => onSelect(q)} style={{
          padding: "8px 16px", borderRadius: 20,
          border: `1px solid ${COLORS.mist}`,
          background: COLORS.white,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 13, color: COLORS.slate,
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
        onMouseEnter={e => {
          e.target.style.borderColor = MODE_CONFIG[mode]?.color || COLORS.lakeLight;
          e.target.style.color = COLORS.ink;
          e.target.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={e => {
          e.target.style.borderColor = COLORS.mist;
          e.target.style.color = COLORS.slate;
          e.target.style.transform = "translateY(0)";
        }}>
          {q}
        </button>
      ))}
    </div>
  );
}

// ─── Main App ───
export default function MKEBudgetCompass() {
  const [activeMode, setActiveMode] = useState("ask");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [remixValues, setRemixValues] = useState(
    Object.fromEntries(SAMPLE_DEPARTMENTS.map(d => [d.name, d.amount]))
  );
  const [showWelcome, setShowWelcome] = useState(true);
  const [animateWave, setAnimateWave] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Wave animation loop for audio
  useEffect(() => {
    if (!audioPlaying) return;
    const id = setInterval(() => setAnimateWave(p => !p), 150);
    return () => clearInterval(id);
  }, [audioPlaying]);

  const totalBudget = Object.values(remixValues).reduce((s, v) => s + v, 0);
  const originalTotal = SAMPLE_DEPARTMENTS.reduce((s, d) => s + d.amount, 0);
  const budgetDelta = totalBudget - originalTotal;

  const handleSend = (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setShowWelcome(false);
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setInput("");
    setIsTyping(true);
    
    // Simulate agent response
    setTimeout(() => {
      setIsTyping(false);
      const isChartQ = msg.toLowerCase().includes("budget") || msg.toLowerCase().includes("department") || msg.toLowerCase().includes("spend");
      setMessages(prev => [...prev, {
        role: "assistant",
        content: isChartQ
          ? "Here's the General City Purposes breakdown for FY 2025. The Police Department receives the largest allocation at $311.2M (38.4%), followed by Fire at $128.5M (15.8%). The total General City Purposes budget is $810.7M."
          : "Milwaukee's 2025 budget totals $1.4 billion across all funds. The General City Purposes fund — which covers core services like police, fire, and public works — is $810.7 million. Want me to break down any specific department?",
        chart: isChartQ,
      }]);
    }, 1800);
  };

  const handleModeSwitch = (mode) => {
    setActiveMode(mode);
    setMessages([]);
    setShowWelcome(true);
    setAudioPlaying(false);
  };

  return (
    <div style={{
      width: "100%", minHeight: "100vh",
      background: `linear-gradient(180deg, ${COLORS.creamLight} 0%, ${COLORS.snow} 30%, ${COLORS.white} 100%)`,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap');
        
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: ${COLORS.lakeDark};
          border: 3px solid ${COLORS.white};
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          cursor: pointer;
        }
        * { box-sizing: border-box; }
        ::selection { background: ${COLORS.lakeGlow}40; }
      `}</style>
      
      <BrickPattern />
      <LakeOrb active={!showWelcome} />
      
      {/* ─── Top Navigation Bar ─── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: `${COLORS.white}E8`,
        backdropFilter: "blur(16px) saturate(180%)",
        borderBottom: `1px solid ${COLORS.mist}50`,
        padding: "12px 24px",
      }}>
        <div style={{
          maxWidth: 960, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: COLORS.lakeDark,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
              boxShadow: `0 2px 8px ${COLORS.lakeDark}30`,
            }}>🏛️</div>
            <div>
              <div style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 20, color: COLORS.lakeDark,
                letterSpacing: "-0.02em", lineHeight: 1.1,
              }}>Budget Compass</div>
              <div style={{
                fontSize: 11, color: COLORS.fog, fontWeight: 500,
                letterSpacing: "0.04em", textTransform: "uppercase",
              }}>Milwaukee, WI</div>
            </div>
          </div>
          
          {/* Budget ticker */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{
              textAlign: "right", display: "flex", flexDirection: "column",
            }}>
              <span style={{
                fontSize: 11, color: COLORS.fog, fontWeight: 500,
                textTransform: "uppercase", letterSpacing: "0.03em",
              }}>FY 2025 Total Budget</span>
              <span style={{
                fontFamily: "'DM Mono', monospace, sans-serif",
                fontSize: 18, fontWeight: 600, color: COLORS.lakeDark,
              }}>$1.4B</span>
            </div>
            <div style={{
              width: 1, height: 32, background: COLORS.mist,
            }} />
            <div style={{ textAlign: "right" }}>
              <span style={{
                fontSize: 11, color: COLORS.fog, fontWeight: 500,
                textTransform: "uppercase", letterSpacing: "0.03em",
              }}>208 Pages → 4 Modes</span>
              <div style={{
                fontSize: 12, color: COLORS.lakeLight, fontWeight: 600,
              }}>Powered by AI</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div style={{
        maxWidth: 960, margin: "0 auto", padding: "24px 24px 0",
        position: "relative", zIndex: 1,
      }}>
        
        {/* ─── Mode Selector Cards ─── */}
        <div style={{
          display: "flex", gap: 12, marginBottom: 24,
        }}>
          {Object.keys(MODE_CONFIG).map((mode, i) => (
            <ModeCard
              key={mode}
              mode={mode}
              isActive={activeMode === mode}
              onClick={() => handleModeSwitch(mode)}
              index={i}
            />
          ))}
        </div>

        {/* ─── Content Area ─── */}
        <div style={{
          background: COLORS.white,
          borderRadius: 24,
          border: `1px solid ${COLORS.mist}`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02)",
          overflow: "hidden",
          minHeight: 480,
          display: "flex",
          flexDirection: "column",
        }}>
          
          {/* ─── ASK MODE ─── */}
          {activeMode === "ask" && (
            <>
              <div style={{
                flex: 1, padding: "24px 24px 0", overflowY: "auto",
                maxHeight: 420, minHeight: 300,
              }}>
                {showWelcome ? (
                  <div style={{
                    textAlign: "center", padding: "48px 20px",
                    animation: "slideIn 0.6s ease",
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                    <div style={{
                      fontFamily: "'Instrument Serif', Georgia, serif",
                      fontSize: 28, color: COLORS.lakeDark,
                      marginBottom: 8, letterSpacing: "-0.02em",
                    }}>What do you want to know?</div>
                    <div style={{
                      fontSize: 15, color: COLORS.fog,
                      maxWidth: 400, margin: "0 auto 28px",
                      lineHeight: 1.6,
                    }}>
                      Ask anything about Milwaukee's $1.4 billion budget. 
                      Every number is verified — no AI guesswork.
                    </div>
                    <QuickPrompts mode="ask" onSelect={handleSend} />
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => (
                      <ChatMessage key={i} {...msg} />
                    ))}
                    {isTyping && <ChatMessage role="assistant" typing />}
                    <div ref={chatEndRef} />
                  </>
                )}
              </div>
              
              {/* Input bar */}
              <div style={{
                padding: "16px 24px 20px",
                borderTop: showWelcome ? "none" : `1px solid ${COLORS.mist}50`,
              }}>
                <div style={{
                  display: "flex", gap: 10, alignItems: "center",
                  background: COLORS.snow,
                  borderRadius: 16, padding: "6px 6px 6px 20px",
                  border: `1.5px solid ${COLORS.mist}`,
                  transition: "border-color 0.2s ease",
                }}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    onFocus={e => e.target.parentElement.style.borderColor = COLORS.lakeLight}
                    onBlur={e => e.target.parentElement.style.borderColor = COLORS.mist}
                    placeholder="Ask about Milwaukee's budget..."
                    style={{
                      flex: 1, border: "none", outline: "none",
                      background: "transparent", fontSize: 15,
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      color: COLORS.ink,
                    }}
                  />
                  <button
                    onClick={() => handleSend()}
                    style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: input.trim() ? COLORS.lakeDark : COLORS.mist,
                      border: "none", cursor: input.trim() ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s ease",
                      color: COLORS.white, fontSize: 18,
                    }}
                  >↑</button>
                </div>
              </div>
            </>
          )}

          {/* ─── HEAR MODE ─── */}
          {activeMode === "hear" && (
            <div style={{
              padding: "40px 32px", textAlign: "center",
              animation: "slideIn 0.5s ease",
            }}>
              <div style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 28, color: COLORS.lakeDark,
                marginBottom: 8, letterSpacing: "-0.02em",
              }}>Budget Briefing</div>
              <div style={{
                fontSize: 14, color: COLORS.fog,
                marginBottom: 32, maxWidth: 360, margin: "0 auto 32px",
                lineHeight: 1.5,
              }}>
                Personalized audio summaries of what's changing in Milwaukee's budget. 
                Like NPR, but just for your city.
              </div>
              
              {/* Audio player card */}
              <div style={{
                maxWidth: 440, margin: "0 auto",
                background: `linear-gradient(135deg, #065F46, #059669)`,
                borderRadius: 20, padding: "32px 28px",
                boxShadow: `0 16px 48px ${COLORS.mint}25`,
              }}>
                <div style={{
                  fontSize: 15, color: "rgba(255,255,255,0.7)",
                  fontWeight: 500, marginBottom: 4,
                }}>Now Playing</div>
                <div style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: 22, color: COLORS.white,
                  marginBottom: 24,
                }}>Your 2025 Budget Overview</div>
                
                <AudioWave playing={audioPlaying} />
                
                <div style={{
                  display: "flex", justifyContent: "center", gap: 16, marginTop: 24,
                  alignItems: "center",
                }}>
                  <button style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)", border: "none",
                    color: COLORS.white, fontSize: 16, cursor: "pointer",
                  }}>⏮</button>
                  <button
                    onClick={() => setAudioPlaying(!audioPlaying)}
                    style={{
                      width: 64, height: 64, borderRadius: "50%",
                      background: COLORS.white, border: "none",
                      color: "#065F46", fontSize: 24, cursor: "pointer",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >{audioPlaying ? "⏸" : "▶"}</button>
                  <button style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)", border: "none",
                    color: COLORS.white, fontSize: 16, cursor: "pointer",
                  }}>⏭</button>
                </div>
                
                {/* Progress bar */}
                <div style={{
                  marginTop: 24, height: 4, background: "rgba(255,255,255,0.2)",
                  borderRadius: 2, overflow: "hidden",
                }}>
                  <div style={{
                    width: audioPlaying ? "35%" : "0%",
                    height: "100%", background: COLORS.white,
                    borderRadius: 2,
                    transition: audioPlaying ? "width 10s linear" : "width 0.3s ease",
                  }} />
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.5)",
                }}>
                  <span>1:42</span><span>4:58</span>
                </div>
              </div>
              
              {/* Topic pills */}
              <div style={{ marginTop: 28 }}>
                <div style={{
                  fontSize: 12, color: COLORS.fog, fontWeight: 500,
                  textTransform: "uppercase", letterSpacing: "0.04em",
                  marginBottom: 12,
                }}>Choose a Topic</div>
                <QuickPrompts mode="hear" onSelect={() => setAudioPlaying(true)} />
              </div>
            </div>
          )}

          {/* ─── SEE MODE ─── */}
          {activeMode === "see" && (
            <div style={{
              padding: "32px", animation: "slideIn 0.5s ease",
            }}>
              <div style={{
                textAlign: "center", marginBottom: 28,
              }}>
                <div style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: 28, color: COLORS.lakeDark,
                  marginBottom: 8, letterSpacing: "-0.02em",
                }}>Budget Visualizer</div>
                <div style={{
                  fontSize: 14, color: COLORS.fog,
                  maxWidth: 380, margin: "0 auto",
                  lineHeight: 1.5,
                }}>
                  AI-generated infographics that turn complex budget data into shareable visual stories.
                </div>
              </div>
              
              {/* Sample infographic preview */}
              <div style={{
                background: COLORS.snow, borderRadius: 16,
                padding: 24, border: `1px solid ${COLORS.mist}`,
                marginBottom: 20,
              }}>
                <div style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: 20, color: COLORS.lakeDark,
                  marginBottom: 4,
                }}>Where Your Tax Dollars Go</div>
                <div style={{
                  fontSize: 12, color: COLORS.fog, marginBottom: 20,
                }}>General City Purposes Fund — $810.7M</div>
                
                <BudgetBars data={SAMPLE_DEPARTMENTS} animateIn={true} />
                
                <div style={{
                  marginTop: 20, padding: "12px 16px",
                  background: `${COLORS.lakeGlow}10`,
                  borderRadius: 10, border: `1px solid ${COLORS.lakeGlow}20`,
                  fontSize: 13, color: COLORS.lakeMid,
                  lineHeight: 1.5,
                }}>
                  💡 <strong>Key insight:</strong> Public safety (Police + Fire) accounts for 54.2% of the General City Purposes budget — more than all other departments combined.
                </div>
              </div>
              
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: 12, color: COLORS.fog, fontWeight: 500,
                  textTransform: "uppercase", letterSpacing: "0.04em",
                  marginBottom: 12,
                }}>Generate an Infographic</div>
                <QuickPrompts mode="see" onSelect={() => {}} />
              </div>
            </div>
          )}

          {/* ─── REMIX MODE ─── */}
          {activeMode === "remix" && (
            <div style={{
              padding: "32px", animation: "slideIn 0.5s ease",
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                marginBottom: 24,
              }}>
                <div>
                  <div style={{
                    fontFamily: "'Instrument Serif', Georgia, serif",
                    fontSize: 28, color: COLORS.lakeDark,
                    letterSpacing: "-0.02em",
                  }}>Budget Remix</div>
                  <div style={{
                    fontSize: 14, color: COLORS.fog, marginTop: 4,
                  }}>Drag sliders to reallocate. See real consequences.</div>
                </div>
                
                {/* Budget balance indicator */}
                <div style={{
                  textAlign: "right", padding: "10px 16px",
                  borderRadius: 12,
                  background: Math.abs(budgetDelta) < 0.1 ? `${COLORS.mint}10` : `${COLORS.coral}10`,
                  border: `1px solid ${Math.abs(budgetDelta) < 0.1 ? COLORS.mint : COLORS.coral}30`,
                }}>
                  <div style={{
                    fontSize: 11, color: COLORS.fog, fontWeight: 500,
                    textTransform: "uppercase", letterSpacing: "0.03em",
                  }}>Budget Balance</div>
                  <div style={{
                    fontFamily: "'DM Mono', monospace, sans-serif",
                    fontSize: 18, fontWeight: 700,
                    color: Math.abs(budgetDelta) < 0.1 ? COLORS.mint : COLORS.coral,
                  }}>
                    {budgetDelta > 0 ? "+" : ""}{budgetDelta.toFixed(1)}M
                  </div>
                </div>
              </div>
              
              {/* Sliders */}
              <div style={{ marginBottom: 20 }}>
                {SAMPLE_DEPARTMENTS.filter(d => d.name !== "Other").map(dept => (
                  <RemixSlider
                    key={dept.name}
                    dept={dept}
                    value={remixValues[dept.name]}
                    originalVal={dept.amount}
                    maxVal={dept.amount * 2}
                    onChange={val => setRemixValues(p => ({ ...p, [dept.name]: val }))}
                  />
                ))}
              </div>
              
              {/* Consequence panel */}
              <div style={{
                background: `linear-gradient(135deg, ${COLORS.lakeDark}, ${COLORS.lakeDeep})`,
                borderRadius: 16, padding: "20px 24px",
                color: COLORS.white,
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.04em",
                  color: "rgba(255,255,255,0.6)", marginBottom: 8,
                }}>🤖 AI Consequence Analysis</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.9)" }}>
                  {Math.abs(budgetDelta) < 0.1
                    ? "Your budget is balanced. Move the sliders to see how reallocation would affect city services, staffing levels, and response times."
                    : budgetDelta > 0
                      ? `Your budget is $${budgetDelta.toFixed(1)}M over. This would require a ${(budgetDelta / 6.1).toFixed(1)}% property tax increase — about $${(budgetDelta * 0.47).toFixed(0)} per year for the median Milwaukee homeowner.`
                      : `You've freed up $${Math.abs(budgetDelta).toFixed(1)}M. This could fund ${Math.floor(Math.abs(budgetDelta) / 0.065)} potholes filled, or ${Math.floor(Math.abs(budgetDelta) / 0.85)} summer youth jobs.`
                  }
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div style={{
          textAlign: "center", padding: "24px 0 32px",
          fontSize: 12, color: COLORS.fog,
          lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 600 }}>MKE Budget Compass</span> — Built for Milwaukee residents, by Milwaukee.
          <br />
          Data sourced from the City of Milwaukee 2025 Adopted Budget (208 pages, verified).
          <br />
          <span style={{ color: COLORS.lakeLight }}>Amazon Nova AI Hackathon 2026</span>
        </div>
      </div>
    </div>
  );
}
