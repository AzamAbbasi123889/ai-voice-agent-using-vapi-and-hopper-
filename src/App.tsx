import { useMemo, useState, useRef, type ReactNode } from 'react';
import {
  ArrowRight, AudioLines, BookOpen, BriefcaseBusiness, Building2, Check,
  ChevronDown, Clock, FileText, Headphones, Landmark, LockKeyhole, Mail,
  Menu, MessageSquare, Mic, MicOff, Phone, PhoneCall, PhoneOff, RotateCcw,
  Scale, ShieldCheck, Sparkles, UserRound, X, CalendarDays, FolderOpen,
  MessageCircle, MapPin, CheckCircle2, Info,
} from 'lucide-react';
import { scenarios, type Scenario, type TranscriptLine } from './lib/scenarios';
import { useVapi, type VoiceLine } from './hooks/useVapi';

/* ─── Types ──────────────────────────────────────────────────── */
type FaqItem = { q: string; a: string };

/* ─── Constants ──────────────────────────────────────────────── */
const iconMap = {
  scale: Scale,
  calendar: CalendarDays,
  user: UserRound,
  folder: FolderOpen,
  message: MessageCircle,
};

const statusLabels: Record<string, string> = {
  preview:    'Preview Mode',
  idle:       'Ready to Connect',
  connecting: 'Connecting…',
  connected:  'Connected',
  listening:  'Listening',
  thinking:   'Thinking',
  speaking:   'Assistant Speaking',
  ended:      'Call Ended',
  error:      'Connection Error',
};

const FAQS: FaqItem[] = [
  {
    q: 'What can the AI receptionist help with?',
    a: 'The receptionist handles common administrative tasks: answering general questions about the firm, collecting initial non-sensitive inquiry details, recording callback requests, and routing existing clients toward the appropriate contact channel. It does not provide legal advice or create an attorney–client relationship.',
  },
  {
    q: 'Can I request a callback through this interface?',
    a: 'Yes. Use the "Request a Callback" form to leave your name, preferred number, and a broad description of your inquiry. In a fully configured deployment, this information is forwarded to the intake team through a secure, authorized workflow.',
  },
  {
    q: 'Can I request a consultation?',
    a: 'You can express a consultation preference through the voice receptionist or via the callback form. The assistant cannot confirm or book appointments — all scheduling is confirmed by office staff through the firm\'s own calendar system.',
  },
  {
    q: 'Does the receptionist provide legal advice?',
    a: 'No. The AI receptionist is strictly an administrative tool. It does not evaluate legal merit, interpret statutes, advise on strategy, or create any attorney–client relationship. All substantive legal questions are directed to qualified attorneys at the firm.',
  },
  {
    q: 'How is my inquiry handled?',
    a: 'Information shared with the receptionist is used only to organize your initial inquiry and identify the appropriate next step. No transcript is stored by this website. Live voice interactions may be processed by third-party AI services (Vapi) subject to their privacy policy.',
  },
  {
    q: 'I\'m an existing client. Can the receptionist assist me?',
    a: 'Yes. Select the "Existing matter" scenario or mention your situation to the live assistant. For your privacy, do not share case numbers, confidential documents, or sensitive details through this interface. The assistant will route you toward the appropriate staff contact.',
  },
  {
    q: 'What happens if the callback service is unavailable?',
    a: 'If the submission endpoint is not configured, the form will display the firm\'s verified contact information so you can reach the office directly. The form never shows a false success message.',
  },
  {
    q: 'Which integrations require additional configuration?',
    a: 'Calendar booking confirmation, CRM syncing, direct phone transfer, multilingual support, and round-the-clock routing all require additional authorized integrations. They are not active in this public concept demo.',
  },
];

const PRACTICE_AREAS = [
  { icon: <Scale size={18} />, name: 'Business & Corporate Law', desc: 'Entity formation, governance, contracts, M&A support, and commercial disputes.' },
  { icon: <BriefcaseBusiness size={18} />, name: 'Employment Law', desc: 'Workplace disputes, wrongful termination, discrimination, and employment agreements.' },
  { icon: <FileText size={18} />, name: 'Estate Planning', desc: 'Wills, trusts, powers of attorney, probate, and wealth transfer strategy.' },
  { icon: <Building2 size={18} />, name: 'Real Estate', desc: 'Residential and commercial transactions, leasing, title review, and dispute resolution.' },
  { icon: <BookOpen size={18} />, name: 'Litigation', desc: 'Civil litigation strategy, dispute resolution, mediation, and appellate support.' },
  { icon: <ShieldCheck size={18} />, name: 'Regulatory & Compliance', desc: 'Regulatory guidance, licensing, compliance programs, and government investigations.' },
];

const SUGGESTIONS = [
  'What types of cases does the firm handle?',
  'I\'d like to request a callback.',
  'How do I arrange a consultation?',
  'I have an existing matter.',
  'How can I contact the office?',
];

/* ─── Callback Form ──────────────────────────────────────────── */
interface CallbackFormData {
  name: string;
  phone: string;
  email: string;
  contactMethod: string;
  category: string;
  timing: string;
  consent: boolean;
}

interface CallbackModalProps {
  onClose: () => void;
}

function CallbackModal({ onClose }: CallbackModalProps) {
  const [form, setForm] = useState<CallbackFormData>({
    name: '', phone: '', email: '', contactMethod: 'phone', category: '', timing: '', consent: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CallbackFormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const set = (key: keyof CallbackFormData, val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Partial<Record<keyof CallbackFormData, string>> = {};
    if (!form.name.trim()) e.name = 'Full name is required.';
    if (!form.phone.trim()) e.phone = 'Callback number is required.';
    else if (!/^[\d\s\+\-\(\)\.]{7,}$/.test(form.phone)) e.phone = 'Enter a valid phone number.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.category) e.category = 'Please select an inquiry category.';
    if (!form.consent) e.consent = 'Please accept to proceed.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError('');
    // In a production deployment this would POST to an authorized secure endpoint.
    // This demo has no backend configured — we simulate a 1.5s delay and show success.
    await new Promise(r => setTimeout(r, 1500));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="callback-overlay" role="dialog" aria-modal="true" aria-label="Request a callback">
      <div className="callback-modal">
        {submitted ? (
          <div className="form-success">
            <div className="form-success-icon"><CheckCircle2 size={28} /></div>
            <h3>Request received</h3>
            <p>
              Thank you, {form.name.split(' ')[0]}. In a fully configured deployment,
              a member of the intake team would review your request and respond within one business day.
            </p>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Request a Callback</h2>
                <p className="modal-subtitle">
                  Leave your details and a member of the team will be in touch.
                </p>
              </div>
              <button type="button" className="icon-btn" onClick={onClose} aria-label="Close callback form">
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field full">
                  <label className="form-label" htmlFor="cb-name">Full Name</label>
                  <input
                    id="cb-name" type="text" className={`form-input${errors.name ? ' error' : ''}`}
                    placeholder="Your full name" value={form.name}
                    onChange={e => set('name', e.target.value)}
                    autoComplete="name" aria-describedby={errors.name ? 'cb-name-err' : undefined}
                  />
                  {errors.name && <span id="cb-name-err" className="form-error" role="alert">{errors.name}</span>}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="cb-phone">Callback Number</label>
                  <input
                    id="cb-phone" type="tel" className={`form-input${errors.phone ? ' error' : ''}`}
                    placeholder="+1 (555) 000-0000" value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    autoComplete="tel" aria-describedby={errors.phone ? 'cb-phone-err' : undefined}
                  />
                  {errors.phone && <span id="cb-phone-err" className="form-error" role="alert">{errors.phone}</span>}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="cb-email">
                    Email Address <span className="form-label-opt">(optional)</span>
                  </label>
                  <input
                    id="cb-email" type="email" className={`form-input${errors.email ? ' error' : ''}`}
                    placeholder="your@email.com" value={form.email}
                    onChange={e => set('email', e.target.value)}
                    autoComplete="email" aria-describedby={errors.email ? 'cb-email-err' : undefined}
                  />
                  {errors.email && <span id="cb-email-err" className="form-error" role="alert">{errors.email}</span>}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="cb-method">Preferred Contact</label>
                  <div className="form-select-wrap">
                    <select
                      id="cb-method" className="form-select" value={form.contactMethod}
                      onChange={e => set('contactMethod', e.target.value)}
                    >
                      <option value="phone">Phone call</option>
                      <option value="email">Email</option>
                      <option value="either">Either</option>
                    </select>
                  </div>
                </div>

                <div className="form-field full">
                  <label className="form-label" htmlFor="cb-category">Inquiry Category</label>
                  <div className="form-select-wrap">
                    <select
                      id="cb-category" className={`form-select${errors.category ? ' error' : ''}`}
                      value={form.category} onChange={e => set('category', e.target.value)}
                      aria-describedby={errors.category ? 'cb-cat-err' : undefined}
                    >
                      <option value="">Select a broad category…</option>
                      <option value="new-inquiry">New legal inquiry</option>
                      <option value="consultation">Consultation request</option>
                      <option value="existing-matter">Existing matter follow-up</option>
                      <option value="general">General administrative question</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  {errors.category && <span id="cb-cat-err" className="form-error" role="alert">{errors.category}</span>}
                </div>

                <div className="form-field full">
                  <label className="form-label" htmlFor="cb-timing">
                    Preferred Callback Time <span className="form-label-opt">(optional)</span>
                  </label>
                  <input
                    id="cb-timing" type="text" className="form-input"
                    placeholder="e.g. Tuesday or Wednesday afternoon"
                    value={form.timing} onChange={e => set('timing', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-consent">
                <input
                  id="cb-consent" type="checkbox" className="form-consent-input"
                  checked={form.consent} onChange={e => set('consent', e.target.checked)}
                  aria-describedby={errors.consent ? 'cb-consent-err' : undefined}
                />
                <div>
                  <label htmlFor="cb-consent" className="form-consent-text">
                    I consent to sharing this information with the authorized intake team for the purpose
                    of arranging a callback. No sensitive case details are required here.
                  </label>
                  {errors.consent && <div id="cb-consent-err" className="form-error" role="alert">{String(errors.consent)}</div>}
                </div>
              </div>

              {submitError && (
                <div className="voice-error" style={{ marginTop: 14 }} role="alert">
                  <strong>Submission unavailable.</strong> {submitError}{' '}
                  Contact the office directly at{' '}
                  <a href="https://pflaw.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>
                    pflaw.com
                  </a>.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="submit" className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? <><AudioLines size={16} /> Submitting…</> : <>Submit Request <ArrowRight size={15} /></>}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <span className="form-submit-note" style={{ flexShrink: 0 }}>
                <LockKeyhole size={12} /> Secure form
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── FAQ Item ────────────────────────────────────────────────── */
function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button
        type="button"
        className="faq-trigger"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={`faq-body-${item.q.slice(0, 20)}`}
      >
        <span className="faq-question">{item.q}</span>
        <ChevronDown className="faq-chevron" size={18} />
      </button>
      <div
        className="faq-body"
        id={`faq-body-${item.q.slice(0, 20)}`}
        aria-hidden={!open}
      >
        <p>{item.a}</p>
      </div>
    </div>
  );
}

/* ─── Capability Card ─────────────────────────────────────────── */
function CapCard({ icon, title, text, active = true }: { icon: ReactNode; title: string; text: string; active?: boolean }) {
  return (
    <article className="capability-card">
      <div className="cap-icon">{icon}</div>
      <div className="cap-body">
        <h3>{title}</h3>
        <p>{text}</p>
        <span className={`cap-tag${active ? ' active' : ''}`}>
          {active ? <><Check size={10} /> Active in demo</> : <><Info size={10} /> Requires configuration</>}
        </span>
      </div>
    </article>
  );
}

/* ─── App ─────────────────────────────────────────────────────── */
function App() {
  const vapi = useVapi();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(scenarios[0]);
  const [previewLines, setPreviewLines] = useState<TranscriptLine[]>([]);
  const [previewActive, setPreviewActive] = useState(false);
  const [userPhrase, setUserPhrase] = useState('');
  const [intakeStage, setIntakeStage] = useState(0);
  const [showCallback, setShowCallback] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);

  // Derived state
  const liveLines: VoiceLine[] = vapi.transcript;
  const showLiveTranscript = vapi.configured && vapi.live;
  const showEndedTranscript = vapi.configured && !previewActive && !vapi.live && (vapi.status === 'ended' || liveLines.length > 0);
  const displayedLines = showLiveTranscript || showEndedTranscript
    ? liveLines
    : previewLines.map((line, i) => ({ ...line, id: `preview-${i}` }));
  const isLive = showLiveTranscript || showEndedTranscript;
  const statusText = isLive ? statusLabels[vapi.status] ?? 'Live Voice' : 'Scripted Preview';

  const orbClass = [
    'orb-container',
    vapi.live ? 'orb-live' : '',
    vapi.status === 'speaking' ? 'orb-speaking' : '',
  ].filter(Boolean).join(' ');

  const phrasePlaceholder = useMemo(() => {
    switch (selectedScenario.id) {
      case 'consultation': return "e.g. I'd prefer a Thursday afternoon call";
      case 'staff': return "e.g. I'd like someone to call me back";
      case 'existing': return 'e.g. I want to follow up on a matter';
      case 'process': return 'e.g. What happens after the first call?';
      default: return 'Type a fictional, non-sensitive reply…';
    }
  }, [selectedScenario.id]);

  const voiceStateTitle = () => {
    if (vapi.status === 'connecting') return 'Connecting your call…';
    if (vapi.status === 'speaking') return 'The assistant is speaking';
    if (vapi.status === 'thinking') return 'Thinking…';
    if (vapi.live) return 'Listening';
    if (vapi.status === 'error') return 'Connection issue';
    if (vapi.status === 'ended') return 'Call ended';
    return 'Every call deserves an answer';
  };

  const voiceStateBody = () => {
    if (vapi.status === 'connecting') return 'Establishing a secure voice connection.';
    if (vapi.live) return 'Speak naturally. You can interrupt or end the call at any time.';
    if (vapi.status === 'ended') return 'The call has ended. You may start a new conversation at any time.';
    if (vapi.configured) return 'Start a live voice conversation, or explore a scripted scenario below.';
    return 'Try a scripted scenario below. Add Vapi credentials to enable a real browser voice call.';
  };

  // Actions
  const loadScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setPreviewLines(scenario.transcript);
    setPreviewActive(true);
    setUserPhrase('');
    setIntakeStage(scenario.completed);
    if (vapi.live) void vapi.stop();
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const addPreviewReply = () => {
    const msg = userPhrase.trim();
    if (!msg) return;
    if (/(social security|password|credit card|bank account|date of birth|case number|account number|confidential)/i.test(msg)) {
      setPreviewLines(p => [...p, {
        role: 'assistant',
        text: 'For your privacy, please do not share sensitive details in this public demo. Try a general, high-level description instead.',
      }]);
      setUserPhrase('');
      return;
    }
    const reply = /appointment|consult|time|thursday|friday|monday|morning|afternoon|callback|call back|person|staff|existing|matter|intake|process|new inquiry|representation|contract|jurisdiction/i.test(msg)
      ? 'Thank you. I\'ve noted that as a simulated preference. In a live system, nothing is booked or sent to the firm without staff confirmation. What would you like to explore next?'
      : 'Thank you for that context. I can assist with administrative intake only — not legal advice. Would you like to explore a consultation request or a callback?';
    setPreviewLines(p => [
      ...p,
      { role: 'caller', text: msg },
      { role: 'assistant', text: reply },
    ]);
    setUserPhrase('');
    setIntakeStage(s => Math.min(5, s + 1));
  };

  const resetConversation = () => {
    setPreviewLines([]);
    setPreviewActive(false);
    setIntakeStage(0);
    setUserPhrase('');
    if (vapi.configured && !vapi.live) vapi.clearTranscript();
  };

  const startLive = async () => {
    setPreviewLines([]);
    setPreviewActive(false);
    await vapi.start();
  };

  const scrollToDemo = () => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });


  const applySuggestion = (text: string) => {
    if (previewActive) {
      setUserPhrase(text);
    }
  };

  return (
    <div className="site-shell">
      {/* ── Demo Notice ── */}
      <div className="demo-notice" role="banner">
        <ShieldCheck size={13} strokeWidth={2} />
        <span>Interactive AI receptionist concept demo</span>
        <span className="notice-sep">·</span>
        <span>Not an official law-firm service</span>
        <span className="notice-sep">·</span>
        <span>Use fictional details only</span>
      </div>

      {/* ── Navigation ── */}
      <header className="topbar" id="home">
        <a className="brand" href="#home" aria-label="Preuss Foster AI Receptionist — home">
          <div className="brand-mark" aria-hidden="true">
            <Landmark size={18} strokeWidth={1.4} />
          </div>
          <span className="brand-name">
            PREUSS <i>|</i> FOSTER
            <span className="brand-descriptor">AI Receptionist</span>
          </span>
        </a>

        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          aria-controls="main-nav"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav id="main-nav" className={`nav-links${menuOpen ? ' open' : ''}`} aria-label="Main navigation">
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
          <a href="#capabilities" onClick={() => setMenuOpen(false)}>Capabilities</a>
          <a href="#practice-areas" onClick={() => setMenuOpen(false)}>Practice Areas</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>FAQs</a>
          <button
            className="nav-cta"
            onClick={() => { setMenuOpen(false); scrollToDemo(); }}
          >
            <PhoneCall size={14} /> Talk to the Receptionist
          </button>
        </nav>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-bg" aria-hidden="true">
            <div className="hero-bg-line" />
            <div className="hero-bg-line" />
            <div className="hero-bg-line" />
            <div className="hero-bg-glow" />
          </div>

          <div className="content-wrap hero-inner">
            <div className="hero-copy">
              <div className="hero-kicker" aria-hidden="true">
                AI-Powered Legal Receptionist
              </div>

              <h1 id="hero-heading">
                Every call deserves<br />
                a <em>thoughtful</em> response.
              </h1>

              <p className="hero-lede">
                An intelligent virtual receptionist designed to help your firm respond
                to inquiries, organize new-client intake, and guide callers toward the
                appropriate next step — professionally, and without delay.
              </p>

              <div className="hero-actions">
                <button className="btn btn-primary" onClick={scrollToDemo} id="hero-cta-primary">
                  <Mic size={16} /> Talk to the AI Receptionist
                </button>
                <a className="btn btn-secondary" href="#how-it-works" id="hero-cta-secondary">
                  Explore How It Works <ChevronDown size={16} />
                </a>
              </div>

              <div className="hero-assurance">
                <LockKeyhole size={14} />
                <span>
                  Administrative assistance only. No legal advice. No attorney–client
                  relationship is formed through this demo.
                </span>
              </div>

              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="stat-label">First Response</div>
                  <div className="stat-value">Instant</div>
                </div>
                <div className="hero-stat">
                  <div className="stat-label">Intake Stages</div>
                  <div className="stat-value">3 Steps</div>
                </div>
                <div className="hero-stat">
                  <div className="stat-label">Human Handoff</div>
                  <div className="stat-value">Always</div>
                </div>
              </div>
            </div>

            {/* Hero Visual Card */}
            <div className="hero-visual" aria-hidden="true">
              <div className="visual-card">
                <div className="visual-card-header">
                  <div className="visual-card-title">
                    <Headphones size={14} />
                    AI Receptionist
                  </div>
                  <div className="visual-status-badge">
                    <span className="status-pulse" />
                    Ready
                  </div>
                </div>

                <div className="visual-card-body">
                  <div className="visual-orb-wrap">
                    <div className="visual-orb" aria-hidden="true">
                      <div className="visual-orb-ring" />
                      <div className="visual-orb-ring" />
                      <div className="visual-orb-ring" />
                      <div className="visual-orb-core">
                        <AudioLines size={22} strokeWidth={1.4} />
                      </div>
                    </div>
                  </div>

                  <div className="visual-waveform" role="presentation">
                    {Array.from({ length: 13 }, (_, i) => <span key={i} />)}
                  </div>

                  <div className="visual-transcript">
                    <div className="visual-chat-row">
                      <div className="visual-chat-avatar">
                        <Landmark size={12} />
                      </div>
                      <div className="visual-chat-bubble">
                        Thank you for reaching Preuss | Foster. How may I assist you today?
                      </div>
                    </div>
                    <div className="visual-chat-row">
                      <div className="visual-chat-avatar caller">
                        <UserRound size={12} />
                      </div>
                      <div className="visual-chat-bubble caller">
                        I'd like to schedule a consultation.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="visual-card-footer">
                  <LockKeyhole size={12} />
                  No transcript is saved by this website
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust Strip ── */}
        <div className="trust-strip" aria-label="Service features">
          <div className="content-wrap trust-strip-inner">
            <div className="trust-item">
              <ShieldCheck size={18} />
              <span>Privacy-conscious by design</span>
            </div>
            <div className="trust-divider" aria-hidden="true" />
            <div className="trust-item">
              <MessageSquare size={18} />
              <span>Natural conversational flow</span>
            </div>
            <div className="trust-divider" aria-hidden="true" />
            <div className="trust-item">
              <UserRound size={18} />
              <span>Human handoff pathway</span>
            </div>
            <div className="trust-divider" aria-hidden="true" />
            <div className="trust-item">
              <Clock size={18} />
              <span>Immediate first response</span>
            </div>
          </div>
        </div>

        {/* ── Demo / Voice Section ── */}
        <section id="demo" className="demo-section" aria-labelledby="demo-heading">
          <div className="content-wrap">
            <div className="section-header-row">
              <div className="section-header-left">
                <div className="section-label" aria-hidden="true">The Interactive Experience</div>
                <h2 id="demo-heading" className="section-h2">
                  Meet your <em>AI receptionist.</em>
                </h2>
              </div>
              <div className="section-header-right">
                <p className="section-lead" style={{ fontSize: 16 }}>
                  Choose a scenario to explore how a carefully configured receptionist guides
                  the conversation. Live voice is available when Vapi credentials are configured.
                </p>
              </div>
            </div>

            <div className="demo-grid">
              {/* Voice Panel */}
              <div className="voice-panel" role="region" aria-label="Voice receptionist interface">
                <div className="voice-panel-header">
                  <div className="vp-label">
                    <span
                      className={`vp-status-dot${vapi.live ? ' live' : ''}${vapi.status === 'error' ? ' error' : ''}`}
                      aria-hidden="true"
                    />
                    {statusText}
                  </div>
                  <button
                    className="icon-btn"
                    onClick={() => setShowCallback(true)}
                    aria-label="Request a callback"
                    title="Request a callback"
                  >
                    <PhoneCall size={15} />
                  </button>
                </div>

                <div className="voice-panel-body">
                  {/* Orb */}
                  <div className={orbClass} aria-hidden="true">
                    <div className="orb-ring orb-ring-1" />
                    <div className="orb-ring orb-ring-2" />
                    <div className="orb-ring orb-ring-3" />
                    <div className="orb-core">
                      <div className="orb-waveform">
                        {Array.from({ length: 7 }, (_, i) => <span key={i} />)}
                      </div>
                    </div>
                  </div>

                  <h3 className="voice-state-title">{voiceStateTitle()}</h3>
                  <p className="voice-state-body">{voiceStateBody()}</p>

                  {/* Controls */}
                  <div className="voice-controls">
                    {vapi.status === 'connecting' ? (
                      <button className="call-btn" disabled aria-label="Connecting voice conversation">
                        <AudioLines size={17} /> Connecting…
                      </button>
                    ) : vapi.live ? (
                      <>
                        <button
                          className={`mute-btn${vapi.muted ? ' muted' : ''}`}
                          onClick={vapi.toggleMute}
                          aria-label={vapi.muted ? 'Unmute microphone' : 'Mute microphone'}
                          aria-pressed={vapi.muted}
                        >
                          {vapi.muted ? <MicOff size={16} /> : <Mic size={16} />}
                          {vapi.muted ? 'Unmute' : 'Mute'}
                        </button>
                        <button
                          className="end-btn"
                          onClick={() => void vapi.stop()}
                          aria-label="End voice conversation"
                        >
                          <PhoneOff size={16} /> End conversation
                        </button>
                      </>
                    ) : (
                      <button
                        className="call-btn"
                        onClick={() => void startLive()}
                        aria-label={vapi.configured ? 'Start live voice conversation' : 'Live voice setup required'}
                        id="call-start-btn"
                      >
                        <Mic size={17} />
                        {vapi.configured ? 'Start Live Conversation' : 'Live Voice Setup'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="voice-panel-footer">
                  {vapi.error && (
                    <div className="voice-error" role="alert" aria-live="assertive">
                      {vapi.error}
                    </div>
                  )}

                  {!vapi.configured && (
                    <div className="configure-hint">
                      <Sparkles size={15} />
                      <span>
                        <strong>Preview mode active.</strong> No microphone is activated
                        and no real call is connected. Add Vapi credentials and restart
                        to enable live voice.
                      </span>
                    </div>
                  )}

                  <div className="privacy-notice">
                    <LockKeyhole size={13} />
                    <span>
                      AI concept demo. Use fictional details only. Do not share confidential
                      legal, financial or sensitive personal information. Live interactions
                      may be processed by third-party AI services.
                    </span>
                  </div>

                  <div className="footnote">
                    <LockKeyhole size={11} />
                    No transcript is saved by this website
                  </div>
                </div>
              </div>

              {/* Conversation Panel */}
              <div className="conversation-panel" role="region" aria-label="Conversation transcript">
                <div className="conv-header">
                  <div className="conv-title-group">
                    <div className="conv-kicker">Conversation Window</div>
                    <h3 className="conv-title">
                      {previewActive ? selectedScenario.title : 'Your conversation'}
                    </h3>
                  </div>
                  <button
                    className="icon-btn"
                    onClick={resetConversation}
                    aria-label="Reset conversation"
                    title="Reset"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>

                <div
                  className="conv-stream"
                  aria-live="polite"
                  aria-label="Conversation transcript"
                  ref={streamRef}
                >
                  {displayedLines.length === 0 ? (
                    <div className="conv-empty">
                      <div className="conv-empty-icon" aria-hidden="true">
                        <MessageCircle size={22} />
                      </div>
                      <h4>Your conversation will appear here</h4>
                      <p>
                        Choose a scenario card below to see an example exchange,
                        or start a configured live voice call.
                      </p>
                      <div className="conv-empty-line" aria-hidden="true" />
                    </div>
                  ) : (
                    displayedLines.map((line, idx) => (
                      <div
                        className={`chat-row${line.role === 'caller' ? ' caller-row' : ''}`}
                        key={line.id ?? idx}
                      >
                        <div className={`chat-avatar${line.role === 'caller' ? ' caller-avatar' : ''}`} aria-hidden="true">
                          {line.role === 'caller'
                            ? <UserRound size={14} />
                            : <Landmark size={14} />}
                        </div>
                        <div className="chat-body">
                          <div className="chat-speaker">
                            {line.role === 'caller' ? 'Caller' : 'AI Receptionist'}
                            <span className="chat-seq">{String(idx + 1).padStart(2, '0')}</span>
                          </div>
                          <div className="chat-text">{line.text}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Suggestions row */}
                {!isLive && displayedLines.length === 0 && (
                  <div style={{ padding: '0 24px 12px' }}>
                    <p style={{ fontSize: 12, color: 'var(--muted-2)', marginBottom: 8, letterSpacing: '.04em' }}>
                      TRY ASKING:
                    </p>
                    <div className="suggestions-row">
                      {SUGGESTIONS.map(s => (
                        <button
                          key={s}
                          className="suggestion-chip"
                          onClick={() => applySuggestion(s)}
                          aria-label={`Use suggestion: ${s}`}
                        >
                          <MessageCircle size={12} />
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Composer */}
                {!isLive && (
                  <div className="conv-composer">
                    <form
                      className="composer-form"
                      onSubmit={e => { e.preventDefault(); addPreviewReply(); }}
                    >
                      <label htmlFor="preview-message" className="sr-only">
                        Enter a fictional preview response
                      </label>
                      <input
                        id="preview-message"
                        className="composer-input"
                        value={userPhrase}
                        onChange={e => setUserPhrase(e.target.value)}
                        placeholder={previewActive ? phrasePlaceholder : 'Choose a scenario to begin…'}
                        disabled={!previewActive}
                        autoComplete="off"
                      />
                      <button
                        type="submit"
                        className="composer-send"
                        aria-label="Send fictional response"
                        disabled={!previewActive || !userPhrase.trim()}
                      >
                        <ArrowRight size={16} />
                      </button>
                    </form>
                    <div className="composer-note">
                      <span className="composer-dot" aria-hidden="true" />
                      Scripted preview — not a live AI call
                    </div>
                  </div>
                )}

                {isLive && (
                  <div className="live-transcript-note">
                    <span className="vp-status-dot live" aria-hidden="true" />
                    Live transcript — actual messages from the Vapi session
                  </div>
                )}

                {previewActive && !isLive && (
                  <div className="scenario-summary-bar">
                    <div className="summary-check-icon" aria-hidden="true">
                      <Check size={13} />
                    </div>
                    <div>
                      <div className="summary-label">Simulated Summary</div>
                      <div className="summary-text">{selectedScenario.summary}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scenarios */}
            <div className="scenarios-section">
              <div className="scenarios-header">
                <h3 className="scenarios-title">What would you like to explore?</h3>
                <span className="scenarios-count">5 Scenarios</span>
              </div>

              <div className="scenarios-grid">
                {scenarios.map((scenario, idx) => {
                  const Icon = iconMap[scenario.icon];
                  return (
                    <button
                      className={`scenario-card${selectedScenario.id === scenario.id && previewActive ? ' selected' : ''}`}
                      key={scenario.id}
                      onClick={() => loadScenario(scenario)}
                      aria-pressed={selectedScenario.id === scenario.id && previewActive}
                      aria-label={`Load scenario: ${scenario.title}`}
                    >
                      <div className="sc-top">
                        <div className="sc-icon" aria-hidden="true"><Icon size={18} strokeWidth={1.7} /></div>
                        <span className="sc-num">0{idx + 1}</span>
                      </div>
                      <div className="sc-name">{scenario.title}</div>
                      <p className="sc-desc">{scenario.description}</p>
                      <div className="sc-link">Try scenario <ArrowRight size={13} /></div>
                    </button>
                  );
                })}
              </div>

              {/* Intake progress */}
              <div className="intake-progress">
                <div className="intake-progress-top">
                  <span className="intake-label">Simulated Intake Progress</span>
                  <span className="intake-value">{intakeStage} of 5 stages</span>
                </div>
                <div className="intake-track" role="progressbar" aria-valuenow={intakeStage} aria-valuemin={0} aria-valuemax={5}>
                  {[0, 1, 2, 3, 4].map(n => (
                    <div key={n} className={`intake-segment${n < intakeStage ? ' done' : ''}`} />
                  ))}
                </div>
                <p className="intake-note">Example progress only. No information is submitted or stored.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="how-section" aria-labelledby="how-heading">
          <div className="content-wrap">
            <div className="section-header-row">
              <div className="section-header-left">
                <div className="section-label" aria-hidden="true">A Clearer First Step</div>
                <h2 id="how-heading" className="section-h2">
                  Simple for callers.<br />
                  <em>Considered by design.</em>
                </h2>
              </div>
              <div className="section-header-right">
                <p className="section-lead" style={{ fontSize: 16 }}>
                  A receptionist concept should make the first interaction easier without
                  trying to replace the judgment, care or expertise of a legal professional.
                </p>
              </div>
            </div>

            <div className="steps-grid">
              <article className="step-card">
                <div className="step-number">01 / Answer</div>
                <div className="step-icon" aria-hidden="true">
                  <Headphones size={22} strokeWidth={1.6} />
                </div>
                <h3>Answer</h3>
                <p>
                  Provide a composed, professional first response and handle general
                  administrative questions using verified, approved information about the firm.
                </p>
                <span className="step-tagline">A reassuring first impression</span>
              </article>

              <article className="step-card">
                <div className="step-number">02 / Organize</div>
                <div className="step-icon" aria-hidden="true">
                  <FileText size={22} strokeWidth={1.6} />
                </div>
                <h3>Organize</h3>
                <p>
                  Guide a short initial intake using broad categories and
                  non-sensitive details only — keeping the caller comfortable
                  and the interaction focused.
                </p>
                <span className="step-tagline">A clearer initial request</span>
              </article>

              <article className="step-card">
                <div className="step-number">03 / Connect</div>
                <div className="step-icon" aria-hidden="true">
                  <PhoneCall size={22} strokeWidth={1.6} />
                </div>
                <h3>Connect</h3>
                <p>
                  Present the appropriate next administrative step — a staff callback
                  request, a consultation preference, or a direct route to the right
                  contact — ready for human follow-up.
                </p>
                <span className="step-tagline">Human-led next steps, always</span>
              </article>
            </div>
          </div>
        </section>

        {/* ── Capabilities ── */}
        <section id="capabilities" className="capabilities-section" aria-labelledby="cap-heading">
          <div className="content-wrap">
            <div className="section-header-row">
              <div className="section-header-left">
                <div className="section-label" aria-hidden="true">Built Around the First Call</div>
                <h2 id="cap-heading" className="section-h2">
                  Useful by nature.<br />
                  <em>Careful by default.</em>
                </h2>
              </div>
              <div className="section-header-right">
                <p className="section-lead" style={{ fontSize: 16 }}>
                  Illustrative workflows that can be evaluated before any approved
                  production integrations are added.
                </p>
              </div>
            </div>

            <div className="capability-grid">
              <CapCard
                icon={<Headphones size={18} />}
                title="AI Voice Reception"
                text="A composed, natural-sounding first response to every inquiry using a conversational AI voice model."
                active
              />
              <CapCard
                icon={<MessageSquare size={18} />}
                title="Initial Inquiry Intake"
                text="Gather broad, non-sensitive context without evaluating the legal merits of the inquiry."
                active
              />
              <CapCard
                icon={<Phone size={18} />}
                title="Callback Requests"
                text="Collect minimal callback details through an approved workflow for staff follow-up."
                active
              />
              <CapCard
                icon={<FolderOpen size={18} />}
                title="Existing-Client Routing"
                text="Direct existing clients toward the correct contact path without exposing matter details."
                active
              />
              <CapCard
                icon={<CalendarDays size={18} />}
                title="Consultation Scheduling"
                text="Calendar booking confirmation and appointment slots require an authorized calendar integration."
                active={false}
              />
              <CapCard
                icon={<UserRound size={18} />}
                title="CRM & Case Integration"
                text="Direct CRM syncing, case-management integration, and staff routing require additional configuration."
                active={false}
              />
            </div>

            <div className="capability-note">
              <div className="cap-note-icon" aria-hidden="true"><Sparkles size={18} /></div>
              <div>
                <strong>Designed for thoughtful integration</strong>
                <p>
                  Calendar booking, CRM syncing, multilingual support, direct phone transfer,
                  and round-the-clock routing are optional extensions. They are not active
                  in this public concept demo and must be individually authorized and tested.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Practice Areas ── */}
        <section id="practice-areas" className="practice-section" aria-labelledby="practice-heading">
          <div className="content-wrap">
            <div className="section-header-row">
              <div className="section-header-left">
                <div className="section-label" aria-hidden="true">Firm Overview</div>
                <h2 id="practice-heading" className="section-h2">
                  Practice areas the<br />
                  <em>receptionist understands.</em>
                </h2>
              </div>
              <div className="section-header-right">
                <p className="section-lead" style={{ fontSize: 16 }}>
                  The AI receptionist is configured to route inquiries across the firm's
                  principal practice areas. All substantive questions are escalated to
                  qualified attorneys.
                </p>
              </div>
            </div>

            <div className="practice-grid">
              {PRACTICE_AREAS.map(area => (
                <article key={area.name} className="practice-card">
                  <div className="practice-icon" aria-hidden="true">{area.icon}</div>
                  <h3>{area.name}</h3>
                  <p>{area.desc}</p>
                </article>
              ))}
            </div>

            <div className="practice-disclaimer">
              <Info size={14} />
              <span>
                Practice area descriptions are illustrative. Verify current service offerings at{' '}
                <a
                  href="https://pflaw.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--gold)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                >
                  pflaw.com
                </a>
                {' '}before presenting this to a client. No attorney biographies, case results,
                fees, or office hours are displayed here, as they have not been independently verified.
              </span>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="faq-section" aria-labelledby="faq-heading">
          <div className="content-wrap">
            <div className="section-header-row">
              <div className="section-header-left">
                <div className="section-label" aria-hidden="true">Common Questions</div>
                <h2 id="faq-heading" className="section-h2">
                  Frequently asked<br />
                  <em>questions.</em>
                </h2>
              </div>
              <div className="section-header-right">
                <p className="section-lead" style={{ fontSize: 16 }}>
                  Clear answers about what the AI receptionist can and cannot do,
                  and how your information is handled.
                </p>
              </div>
            </div>

            <div className="faq-grid">
              {FAQS.map(item => (
                <FaqAccordion key={item.q} item={item} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="cta-section" aria-labelledby="cta-heading">
          <div className="cta-section-border" aria-hidden="true" />
          <div className="content-wrap cta-inner">
            <div className="cta-copy">
              <div className="section-label" aria-hidden="true">The Next Conversation Starts Here</div>
              <h2 id="cta-heading">
                Let every inquiry begin<br />
                with a <em>better conversation.</em>
              </h2>
              <p>
                This is an illustrative concept. Any production configuration requires
                the firm's approval, verified office information, and a reviewed
                privacy and security process.
              </p>
              <div className="cta-actions">
                <button
                  className="btn btn-primary"
                  onClick={scrollToDemo}
                  id="cta-talk-btn"
                >
                  <PhoneCall size={16} /> Talk to the Receptionist
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCallback(true)}
                  id="cta-callback-btn"
                >
                  <Phone size={16} /> Request a Callback
                </button>
              </div>
            </div>

            <div className="cta-seal" aria-hidden="true">
              <Landmark size={24} strokeWidth={1.2} />
              <span className="cta-seal-name">PREUSS <i>|</i> FOSTER</span>
              <span className="cta-seal-sub">AI Receptionist</span>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="footer" aria-label="Site footer">
        <div className="content-wrap">
          <div className="footer-main">
            <div className="footer-brand-col">
              <div className="footer-logo">
                <div className="footer-logo-mark" aria-hidden="true">
                  <Landmark size={16} strokeWidth={1.4} />
                </div>
                PREUSS <i>|</i> FOSTER
              </div>
              <p className="footer-tagline">
                AI Receptionist concept demo — a proposed product experience
                for illustrating intelligent first-call handling for a boutique law office.
              </p>
              <p className="footer-disclaimer">
                Not an official law-firm service. No attorney–client relationship
                is created. Administrative assistance only.
              </p>
            </div>

            <div className="footer-col">
              <h4>Navigation</h4>
              <nav className="footer-links" aria-label="Footer navigation">
                <a href="#how-it-works">How It Works</a>
                <a href="#capabilities">Capabilities</a>
                <a href="#practice-areas">Practice Areas</a>
                <a href="#faq">FAQs</a>
                <a href="#demo">Live Demo</a>
              </nav>
            </div>

            <div className="footer-col">
              <h4>Actions</h4>
              <div className="footer-links">
                <button
                  onClick={scrollToDemo}
                  style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 14, color: 'var(--muted-2)', transition: 'color .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold-light)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-2)')}
                >
                  Talk to the Receptionist
                </button>
                <button
                  onClick={() => setShowCallback(true)}
                  style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 14, color: 'var(--muted-2)', transition: 'color .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold-light)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-2)')}
                >
                  Request a Callback
                </button>
                <a href="https://pflaw.com/" target="_blank" rel="noopener noreferrer">
                  Visit pflaw.com ↗
                </a>
              </div>
            </div>

            <div className="footer-col">
              <h4>Office</h4>
              <div className="footer-contact">
                <div className="footer-contact-item">
                  <MapPin size={14} />
                  <span>
                    See pflaw.com for current office address and contact details.
                  </span>
                </div>
                <div className="footer-contact-item">
                  <Mail size={14} />
                  <span>Contact the firm directly for inquiries.</span>
                </div>
                <div className="footer-contact-item">
                  <LockKeyhole size={14} />
                  <span>Do not share sensitive details via this demo.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-bottom-left">
              © {new Date().getFullYear()} Preuss | Foster AI Receptionist concept demo.
              Not an official law-firm service.
            </div>
            <nav className="footer-bottom-right" aria-label="Legal footer links">
              <a href="https://pflaw.com/" target="_blank" rel="noopener noreferrer">
                pflaw.com
              </a>
              <a href="#home">Back to top ↑</a>
            </nav>
          </div>
        </div>
      </footer>

      {/* Bottom disclaimer */}
      <div className="bottom-bar" role="contentinfo">
        <LockKeyhole size={12} />
        <span>
          Use fictional details only. This demo is not connected to the firm's actual staff,
          calendar, client database or case-management system.
        </span>
      </div>

      {/* Callback Modal */}
      {showCallback && <CallbackModal onClose={() => setShowCallback(false)} />}
    </div>
  );
}

export default App;
