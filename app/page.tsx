'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { InterviewSession, Message } from '@/types';

// Interview timing constants
const TARGET_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const IDLE_NUDGE_MS = 2 * 60 * 1000; // 2 minutes
const MIN_EXCHANGES_FOR_COMPLETION = 8;

export default function Home() {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Timing state
  const [interviewStartTime, setInterviewStartTime] = useState<number | null>(null);
  const [showWrapUpPrompt, setShowWrapUpPrompt] = useState(false);
  const [showIdleNudge, setShowIdleNudge] = useState(false);
  const [isWrapUpMode, setIsWrapUpMode] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.transcript]);

  // Idle detection - reset timer on new messages or when loading
  useEffect(() => {
    if (!session || session.status !== 'interviewing' || loading) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }

    // Clear existing timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // Set new idle timer
    idleTimerRef.current = setTimeout(() => {
      setShowIdleNudge(true);
    }, IDLE_NUDGE_MS);

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [session, loading]);

  // Check if we should trigger wrap-up mode
  const shouldWrapUp = useCallback((): boolean => {
    if (!interviewStartTime || !session) return false;

    const elapsed = Date.now() - interviewStartTime;
    const userMessages = session.transcript.filter(m => m.role === 'user').length;

    // Wrap up if: time >= 10 min OR exchanges >= 8
    return elapsed >= TARGET_DURATION_MS || userMessages >= MIN_EXCHANGES_FOR_COMPLETION;
  }, [interviewStartTime, session]);

  const startSurvey = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'student' }),
      });

      const data = await response.json();
      setSession(data.session);
      setInterviewStartTime(Date.now());
    } catch (error) {
      console.error('Error starting survey:', error);
      alert('Failed to start survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !session) return;

    const userMessage = message.trim();
    setMessage('');
    setLoading(true);
    setShowIdleNudge(false);

    // Check if we should enter wrap-up mode
    const enterWrapUp = !isWrapUpMode && shouldWrapUp();
    if (enterWrapUp) {
      setIsWrapUpMode(true);
    }

    const tempUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    setSession({
      ...session,
      transcript: [...session.transcript, tempUserMessage],
    });

    try {
      const response = await fetch('/api/interview/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          message: userMessage,
          isWrapUp: enterWrapUp,
        }),
      });

      const data = await response.json();
      setSession(data.session);

      // Show wrap-up prompt after bot's closing message
      if (enterWrapUp) {
        setShowWrapUpPrompt(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setSession({
        ...session,
        transcript: session.transcript.slice(0, -1),
      });
      // Reset wrap-up mode if message failed
      if (enterWrapUp) {
        setIsWrapUpMode(false);
      }
    } finally {
      setLoading(false);
      // Focus input after bot responds
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const completeSurvey = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const response = await fetch('/api/interview/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      });

      const data = await response.json();
      setAnalysis(data.analysis);
      setSession(data.session);
    } catch (error) {
      console.error('Error completing survey:', error);
      alert('Failed to complete survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startNewSurvey = () => {
    setSession(null);
    setAnalysis(null);
    setMessage('');
    setInterviewStartTime(null);
    setShowWrapUpPrompt(false);
    setShowIdleNudge(false);
    setIsWrapUpMode(false);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Karla:wght@400;500;600;700&family=Fira+Code:wght@400;600&display=swap');

        :root {
          --illinois-blue: #13294B;
          --illinois-orange: #E84A27;
          --illinois-orange-light: #FF6B47;
          --cream: #fef9f3;
          --sage: #9db4a8;
          --sage-light: #c4d5cc;
          --text-primary: #13294B;
          --text-secondary: #5a6b7d;
        }

        body {
          background:
            radial-gradient(circle at 20% 80%, rgba(232, 74, 39, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(19, 41, 75, 0.08) 0%, transparent 50%),
            linear-gradient(135deg, #fef9f3 0%, #fff5f0 50%, #fef9f3 100%);
          font-family: 'Karla', sans-serif;
          margin: 0;
          padding: 0;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        body::before {
          content: '';
          position: fixed;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background-image:
            repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(19, 41, 75, 0.02) 60px, rgba(19, 41, 75, 0.02) 61px);
          animation: rotate 120s linear infinite;
          pointer-events: none;
          z-index: 0;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        .expectations-list li {
          position: relative;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .expectations-list li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: var(--illinois-orange);
          font-weight: 600;
        }

        .expectations-list li:last-child {
          margin-bottom: 0;
        }

        .expectations-list strong {
          color: var(--illinois-blue);
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .mobile-container {
            padding: 1.5rem 1rem !important;
          }

          .mobile-card {
            padding: 1.5rem !important;
            border-radius: 16px !important;
          }

          .mobile-title {
            font-size: 1.75rem !important;
          }

          .mobile-subtitle {
            font-size: 1rem !important;
          }

          .mobile-chat-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }

          .mobile-chat-title {
            font-size: 1.5rem !important;
          }

          .mobile-chat-status {
            flex-wrap: wrap !important;
          }

          .mobile-input-group {
            flex-wrap: wrap !important;
          }

          .mobile-message-input {
            width: 100% !important;
            flex: none !important;
          }

          .mobile-button {
            padding: 0.875rem 1.25rem !important;
            font-size: 0.9rem !important;
          }

          .mobile-send-button {
            flex: 1 !important;
          }

          .mobile-complete-button {
            flex: 1 !important;
          }

          .mobile-message {
            max-width: 90% !important;
            padding: 1rem 1.25rem !important;
          }

          .mobile-analysis {
            padding: 1.5rem !important;
          }

          .mobile-analysis-title {
            font-size: 1.5rem !important;
          }

          .mobile-expectations-box {
            padding: 1.25rem 1.5rem !important;
          }

          .mobile-wrap-up {
            flex-direction: column !important;
            gap: 0.75rem !important;
            text-align: center !important;
          }

          .mobile-wrap-up button {
            margin-left: 0 !important;
            width: 100% !important;
          }

          .mobile-nudge {
            flex-direction: column !important;
            gap: 0.5rem !important;
            text-align: center !important;
          }

          .mobile-new-survey-btn {
            padding: 0.75rem 1rem !important;
            font-size: 0.85rem !important;
          }
        }

        @media (max-width: 480px) {
          .mobile-title {
            font-size: 1.5rem !important;
          }

          .mobile-chat-title {
            font-size: 1.25rem !important;
          }

          .mobile-button {
            padding: 0.75rem 1rem !important;
          }
        }
      `}</style>

      <main style={styles.container} className="mobile-container">
        <div style={styles.card} className="mobile-card">
          <div style={styles.header}>
            <div style={styles.courseBadge}>BADM554</div>
            <h1 style={styles.title} className="mobile-title">Enterprise Database Management</h1>
            <p style={styles.subtitle} className="mobile-subtitle">
              Spring 2026 Pre-Course Survey
            </p>
          </div>

          {!session ? (
            <div style={styles.startSection}>
              <div style={styles.expectationsBox} className="mobile-expectations-box">
                <h3 style={styles.expectationsTitle}>Welcome!</h3>
                <p style={styles.welcomeText}>
                  This conversational survey helps us understand your background and tailor the course to your needs.
                </p>
                <ul style={styles.expectationsList} className="expectations-list">
                  <li>Takes about <strong>10 minutes</strong></li>
                  <li>Questions about your experience with databases and data tools</li>
                  <li>Share your learning goals and any concerns</li>
                  <li>Get a personalized profile summary at the end</li>
                </ul>
              </div>
              <button
                onClick={startSurvey}
                disabled={loading}
                className="mobile-button"
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(232, 74, 39, 0.45)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(232, 74, 39, 0.35)';
                }}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  width: '100%',
                  maxWidth: '320px',
                  margin: '0 auto',
                  display: 'block',
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {loading ? 'Starting...' : 'Start Survey'}
              </button>
            </div>
          ) : (
            <div style={styles.chatSection}>
              <div style={styles.chatHeader} className="mobile-chat-header">
                <div>
                  <h2 style={styles.chatTitle} className="mobile-chat-title">Course Survey</h2>
                  <p style={styles.chatStatus} className="mobile-chat-status">
                    <span style={styles.statusBadge}>{session.status}</span>
                    {session.cost && (
                      <>
                        <span style={styles.statusDivider}>•</span>
                        <span style={styles.monospace}>
                          ${session.cost.cost.toFixed(4)} • {session.cost.tokens} tokens
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={startNewSurvey}
                  className="mobile-new-survey-btn"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 18px rgba(157, 180, 168, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(157, 180, 168, 0.3)';
                  }}
                  style={{ ...styles.button, ...styles.secondaryButton }}
                >
                  New Survey
                </button>
              </div>

              <div style={styles.messagesContainer}>
                {session.transcript.map((msg, idx) => (
                  <div
                    key={idx}
                    className="mobile-message"
                    style={{
                      ...styles.message,
                      ...(msg.role === 'user' ? styles.userMessage : styles.assistantMessage),
                      animation: `${msg.role === 'user' ? 'slideInRight' : 'slideInLeft'} 0.4s ease-out`,
                      animationDelay: `${idx * 0.05}s`,
                      animationFillMode: 'both',
                    }}
                  >
                    <div style={styles.messageRole}>
                      {msg.role === 'user' ? 'You' : 'Survey Bot'}
                    </div>
                    <div style={styles.messageContent}>{msg.content}</div>
                  </div>
                ))}
                {loading && (
                  <div style={{ ...styles.message, ...styles.assistantMessage }} className="mobile-message">
                    <div style={styles.messageRole}>Survey Bot</div>
                    <div style={{ ...styles.messageContent, animation: 'pulse 1.5s ease-in-out infinite' }}>
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {session.status === 'interviewing' && (
                <div style={styles.inputGroup} className="mobile-input-group">
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    className="mobile-message-input"
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (e.target.value.length > 0) {
                        setShowIdleNudge(false);
                      }
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--illinois-orange)';
                      e.target.style.boxShadow = '0 4px 16px rgba(232, 74, 39, 0.15), 0 0 0 3px rgba(232, 74, 39, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--sage-light)';
                      e.target.style.boxShadow = '0 2px 8px rgba(19, 41, 75, 0.04)';
                    }}
                    placeholder="Share your thoughts..."
                    style={styles.messageInput}
                    disabled={loading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !message.trim()}
                    className="mobile-button mobile-send-button"
                    onMouseEnter={(e) => {
                      if (!loading && message.trim()) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(232, 74, 39, 0.45)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(232, 74, 39, 0.35)';
                    }}
                    style={{
                      ...styles.button,
                      ...styles.primaryButton,
                      opacity: loading || !message.trim() ? 0.5 : 1,
                      cursor: loading || !message.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Send
                  </button>
                  <button
                    onClick={completeSurvey}
                    disabled={loading}
                    className="mobile-button mobile-complete-button"
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.background = 'var(--illinois-blue)';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = 'var(--illinois-blue)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--illinois-blue)';
                      e.currentTarget.style.borderColor = 'var(--illinois-blue)';
                    }}
                    style={{
                      ...styles.button,
                      ...styles.tertiaryButton,
                      opacity: loading ? 0.5 : 1,
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Complete
                  </button>
                </div>
              )}

              {/* Idle nudge */}
              {showIdleNudge && session.status === 'interviewing' && !loading && (
                <div style={styles.nudgeBar} className="mobile-nudge">
                  <span>Still there? Take your time—when you&apos;re ready, continue or press Complete to finish.</span>
                  <button
                    onClick={() => setShowIdleNudge(false)}
                    style={styles.nudgeDismiss}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Wrap-up prompt */}
              {showWrapUpPrompt && session.status === 'interviewing' && !loading && (
                <div style={styles.wrapUpPrompt} className="mobile-wrap-up">
                  <span>Ready to complete the survey?</span>
                  <button
                    onClick={completeSurvey}
                    className="mobile-button"
                    style={{ ...styles.button, ...styles.primaryButton, marginLeft: '12px', padding: '8px 16px' }}
                  >
                    Complete Survey
                  </button>
                  <button
                    onClick={() => setShowWrapUpPrompt(false)}
                    className="mobile-button"
                    style={{ ...styles.button, ...styles.secondaryButton, marginLeft: '8px', padding: '8px 16px' }}
                  >
                    Continue
                  </button>
                </div>
              )}

              {analysis && (
                <div
                  className="mobile-analysis"
                  style={{
                    ...styles.analysisSection,
                    animation: 'fadeInUp 0.6s ease-out',
                  }}
                >
                  <h3 style={styles.analysisTitle} className="mobile-analysis-title">Your Profile Summary</h3>
                  <div style={styles.analysisContent}>
                    <div style={styles.analysisItem}>
                      <strong style={styles.analysisLabel}>Summary</strong>
                      <p style={styles.analysisParagraph}>{analysis.summary}</p>
                    </div>
                    {analysis.technicalSkillLevel && (
                      <div style={styles.analysisItem}>
                        <strong style={styles.analysisLabel}>Technical Skill Level</strong>
                        <p style={styles.analysisParagraph}>{analysis.technicalSkillLevel}</p>
                      </div>
                    )}
                    {analysis.priorExperienceProfile && (
                      <div style={styles.analysisItem}>
                        <strong style={styles.analysisLabel}>Prior Experience</strong>
                        <p style={styles.analysisParagraph}>{analysis.priorExperienceProfile}</p>
                      </div>
                    )}
                    <div style={styles.analysisItem}>
                      <strong style={styles.analysisLabel}>Key Insights</strong>
                      <ul style={styles.analysisList}>
                        {analysis.keyInsights?.map((insight: string, idx: number) => (
                          <li key={idx} style={styles.analysisListItem}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                    {analysis.topicsOfInterest && analysis.topicsOfInterest.length > 0 && (
                      <div style={styles.analysisItem}>
                        <strong style={styles.analysisLabel}>Topics of Interest</strong>
                        <ul style={styles.analysisList}>
                          {analysis.topicsOfInterest.map((topic: string, idx: number) => (
                            <li key={idx} style={styles.analysisListItem}>{topic}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysis.areasNeedingSupport && analysis.areasNeedingSupport.length > 0 && (
                      <div style={styles.analysisItem}>
                        <strong style={styles.analysisLabel}>Areas for Growth</strong>
                        <ul style={styles.analysisList}>
                          {analysis.areasNeedingSupport.map((area: string, idx: number) => (
                            <li key={idx} style={styles.analysisListItem}>{area}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                      <div style={styles.analysisItem}>
                        <strong style={styles.analysisLabel}>Recommendations</strong>
                        <ul style={styles.analysisList}>
                          {analysis.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} style={styles.analysisListItem}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <p style={styles.thankYou}>
                    Thank you for completing the survey! Your responses will help us tailor BADM554 to the class.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '3rem 1.5rem',
    minHeight: '100vh',
    position: 'relative',
    zIndex: 1,
  },
  card: {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 100%)',
    backdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '24px',
    padding: '3rem',
    boxShadow: '0 30px 90px rgba(19, 41, 75, 0.12), 0 0 0 1px rgba(232, 74, 39, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(232, 74, 39, 0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2.5rem',
    animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'relative',
  },
  courseBadge: {
    display: 'inline-block',
    fontFamily: "'Fira Code', monospace",
    fontSize: '0.9rem',
    fontWeight: '600',
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, var(--illinois-blue) 0%, #1e3a5f 100%)',
    color: 'white',
    borderRadius: '8px',
    marginBottom: '1rem',
    letterSpacing: '0.05em',
  },
  title: {
    fontFamily: "'Libre Baskerville', serif",
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '0.75rem',
    color: 'var(--illinois-blue)',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
  },
  subtitle: {
    fontFamily: "'Karla', sans-serif",
    color: 'var(--text-secondary)',
    fontSize: '1.15rem',
    fontWeight: '500',
    letterSpacing: '0.02em',
  },
  startSection: {
    animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
  },
  expectationsBox: {
    background: 'linear-gradient(135deg, rgba(19, 41, 75, 0.05) 0%, rgba(232, 74, 39, 0.05) 100%)',
    border: '1px solid rgba(19, 41, 75, 0.1)',
    borderRadius: '16px',
    padding: '1.75rem 2rem',
    marginBottom: '2rem',
    maxWidth: '520px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  expectationsTitle: {
    fontFamily: "'Libre Baskerville', serif",
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: 'var(--illinois-blue)',
    marginBottom: '0.75rem',
    marginTop: 0,
  },
  welcomeText: {
    fontFamily: "'Karla', sans-serif",
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    marginBottom: '1rem',
  },
  expectationsList: {
    fontFamily: "'Karla', sans-serif",
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.7',
    margin: 0,
    paddingLeft: '1.25rem',
    listStyleType: 'none',
  },
  inputGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  messageInput: {
    flex: 1,
    padding: '1rem 1.25rem',
    border: '2px solid var(--sage-light)',
    borderRadius: '12px',
    fontSize: '1rem',
    fontFamily: "'Karla', sans-serif",
    outline: 'none',
    background: 'white',
    color: 'var(--text-primary)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 8px rgba(19, 41, 75, 0.04)',
  },
  button: {
    padding: '1rem 2rem',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1rem',
    fontFamily: "'Karla', sans-serif",
    fontWeight: '700',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    letterSpacing: '0.02em',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, var(--illinois-orange) 0%, var(--illinois-orange-light) 100%)',
    color: 'white',
    boxShadow: '0 6px 20px rgba(232, 74, 39, 0.35)',
  },
  secondaryButton: {
    background: 'var(--sage)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(157, 180, 168, 0.3)',
  },
  tertiaryButton: {
    background: 'transparent',
    border: '2px solid var(--illinois-blue)',
    color: 'var(--illinois-blue)',
    boxShadow: 'none',
  },
  chatSection: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '60vh',
    animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  chatHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '2px solid rgba(232, 74, 39, 0.15)',
    position: 'relative',
  },
  chatTitle: {
    fontFamily: "'Libre Baskerville', serif",
    fontSize: '1.75rem',
    marginBottom: '0.5rem',
    color: 'var(--illinois-blue)',
    fontWeight: 'bold',
  },
  chatStatus: {
    fontFamily: "'Karla', sans-serif",
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  statusBadge: {
    fontFamily: "'Fira Code', monospace",
    fontSize: '0.75rem',
    padding: '0.3rem 0.75rem',
    background: 'linear-gradient(135deg, var(--illinois-orange) 0%, var(--illinois-orange-light) 100%)',
    color: 'white',
    borderRadius: '6px',
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  statusDivider: {
    opacity: 0.3,
  },
  monospace: {
    fontFamily: "'Fira Code', monospace",
    fontSize: '0.8rem',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  message: {
    padding: '1.25rem 1.5rem',
    borderRadius: '16px',
    maxWidth: '80%',
    boxShadow: '0 4px 16px rgba(19, 41, 75, 0.08)',
    position: 'relative',
  },
  userMessage: {
    background: 'linear-gradient(135deg, var(--illinois-blue) 0%, #1e3a5f 100%)',
    color: 'white',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
    boxShadow: '0 6px 20px rgba(19, 41, 75, 0.15)',
  },
  assistantMessage: {
    background: 'white',
    color: 'var(--text-primary)',
    alignSelf: 'flex-start',
    border: '2px solid rgba(232, 74, 39, 0.15)',
    borderBottomLeftRadius: '4px',
  },
  messageRole: {
    fontFamily: "'Fira Code', monospace",
    fontSize: '0.7rem',
    opacity: 0.6,
    marginBottom: '0.5rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  messageContent: {
    fontFamily: "'Karla', sans-serif",
    fontSize: '1rem',
    lineHeight: '1.65',
  },
  analysisSection: {
    marginTop: '2.5rem',
    padding: '2rem',
    background: 'linear-gradient(145deg, rgba(19, 41, 75, 0.03) 0%, rgba(232, 74, 39, 0.03) 100%)',
    borderRadius: '16px',
    border: '2px solid rgba(19, 41, 75, 0.1)',
  },
  analysisTitle: {
    fontFamily: "'Libre Baskerville', serif",
    fontSize: '1.5rem',
    marginBottom: '1.5rem',
    color: 'var(--illinois-blue)',
    fontWeight: 'bold',
  },
  analysisContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  analysisItem: {
    marginBottom: '0.5rem',
  },
  analysisLabel: {
    fontFamily: "'Karla', sans-serif",
    fontWeight: '700',
    marginBottom: '0.5rem',
    display: 'block',
    color: 'var(--illinois-orange)',
    fontSize: '1rem',
  },
  analysisParagraph: {
    fontFamily: "'Karla', sans-serif",
    lineHeight: '1.7',
    color: 'var(--text-primary)',
    margin: '0.5rem 0 0 0',
    fontSize: '0.95rem',
  },
  analysisList: {
    margin: '0.5rem 0 0 0',
    paddingLeft: '1.5rem',
  },
  analysisListItem: {
    fontFamily: "'Karla', sans-serif",
    lineHeight: '1.7',
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
    fontSize: '0.95rem',
  },
  thankYou: {
    fontFamily: "'Karla', sans-serif",
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid rgba(19, 41, 75, 0.1)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  nudgeBar: {
    background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
    border: '1px solid #ffd54f',
    borderRadius: '10px',
    padding: '10px 14px',
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: '#5d4037',
  },
  nudgeDismiss: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#8d6e63',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  wrapUpPrompt: {
    background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
    border: '1px solid var(--sage)',
    borderRadius: '10px',
    padding: '14px 18px',
    marginTop: '14px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.9rem',
    color: 'var(--illinois-blue)',
    fontWeight: '500',
  },
};
