/* Project registry. Copy is canonical — do not edit text. */

export const SocraticIcon = () => (
  <svg
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="5"
      y="9"
      width="38"
      height="26"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <line x1="5" y1="15" x2="43" y2="15" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="9" cy="12" r="0.9" fill="currentColor" />
    <circle cx="12" cy="12" r="0.9" fill="currentColor" />
    <path
      d="M19 22.5c0-2.2 1.7-4 4-4s4 1.8 4 4c0 1.7-1.2 2.3-2.3 3.1-1.1.8-1.5 1.6-1.5 2.6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle cx="23" cy="32" r="1" fill="currentColor" />
    <rect
      x="22"
      y="28"
      width="37"
      height="25"
      rx="2"
      fill="rgba(255, 255, 255, 0.08)"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <line x1="22" y1="34" x2="59" y2="34" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="26" cy="31" r="0.9" fill="currentColor" />
    <circle cx="29" cy="31" r="0.9" fill="currentColor" />
    <line
      x1="27"
      y1="40"
      x2="50"
      y2="40"
      stroke="currentColor"
      strokeWidth="1.4"
      opacity="0.75"
    />
    <line
      x1="27"
      y1="44"
      x2="46"
      y2="44"
      stroke="currentColor"
      strokeWidth="1.4"
      opacity="0.75"
    />
    <line
      x1="27"
      y1="48"
      x2="40"
      y2="48"
      stroke="currentColor"
      strokeWidth="1.4"
      opacity="0.75"
    />
  </svg>
)

export const FrmPortalIcon = () => (
  <svg
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    aria-hidden="true"
  >
    {/* open book / syllabus */}
    <path
      d="M32 16c-4-2.4-9-3.4-14-3v30c5-.4 10 .6 14 3 4-2.4 9-3.4 14-3V13c-5-.4-10 .6-14 3Z"
      fill="rgba(255, 255, 255, 0.08)"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <line x1="32" y1="16" x2="32" y2="46" stroke="currentColor" strokeWidth="1.6" />
    {/* spaced-repetition ladder ticks */}
    <line x1="23" y1="23" x2="27" y2="23" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />
    <line x1="23" y1="29" x2="27" y2="29" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />
    <line x1="37" y1="23" x2="41" y2="23" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />
    <line x1="37" y1="29" x2="41" y2="29" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />
    {/* retrieval node + vector links */}
    <circle cx="48" cy="50" r="6" stroke="currentColor" strokeWidth="1.6" />
    <path d="M48 47.5v5M45.5 50h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="18" y1="50" x2="42" y2="50" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
  </svg>
)

export const PROJECTS = [
  {
    id: 'socratic',
    tag: 'Live AI · Teaching instrument',
    title: 'What if an LLM and a presentation merged into one live teaching instrument?',
    summary:
      'A dual-screen Socratic co-pilot that turns a static script into a real-time, branching, AI-driven session: the room sees one question, the operator sees the answer key and a row of steering buttons.',
    icon: <SocraticIcon />,
    image: 'aum-socratic.webp',
    imageAlt: 'Aum at a desk with a notebook',
    cta: 'Read the build',
  },
  {
    id: 'frm-portal',
    tag: 'RAG · Spaced repetition · Exam prep',
    title: 'What if a study portal made every scheduling decision, and the AI only ever taught?',
    summary:
      'A single-user FRM Part II portal where deterministic code owns the registrar work — due-queues, pacing, error counting, mode routing — and a RAG-grounded LLM does only what varies: explain, quiz, grade, and reteach against six textbooks.',
    icon: <FrmPortalIcon />,
    image: 'aum-frm.jpg',
    imageAlt: 'Aum in a suit against a city skyline',
    cta: 'Read the build',
  },
]
