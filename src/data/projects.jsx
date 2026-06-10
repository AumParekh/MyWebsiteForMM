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
      fill="rgba(94, 234, 212, 0.08)"
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

export const PROJECTS = [
  {
    id: 'socratic',
    tag: 'Live AI · Teaching instrument',
    title: 'What if an LLM and a presentation merged into one live teaching instrument?',
    summary:
      'A dual-screen Socratic co-pilot that turns a static script into a real-time, branching, AI-driven session — the room sees one question, the operator sees the answer key and a row of steering buttons.',
    icon: <SocraticIcon />,
    cta: 'Read the build',
  },
]
