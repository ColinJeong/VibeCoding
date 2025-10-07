type Tab = 'subway' | 'bus' | 'parking'

function Chip({ active, label, onClick, icon }: { active: boolean; label: string; onClick: () => void; icon: JSX.Element }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
        active ? 'bg-amber-400 text-slate-900' : 'bg-white/5 text-slate-300 hover:text-white'
      }`}
      aria-pressed={active}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  )
}

const IconTrain = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="4" y="3" width="16" height="13" rx="2" />
    <path d="M8 21l2-2 4 0 2 2" />
    <path d="M8 6h8M8 10h8" />
    <circle cx="8.5" cy="16.5" r="1.5" />
    <circle cx="15.5" cy="16.5" r="1.5" />
  </svg>
)
const IconBus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="4" y="3" width="16" height="13" rx="2" />
    <path d="M6 16v2M18 16v2M6 19h12" />
    <circle cx="8.5" cy="14.5" r="1.5" />
    <circle cx="15.5" cy="14.5" r="1.5" />
  </svg>
)
const IconParking = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 4h8a5 5 0 010 10H8v6H4z" />
  </svg>
)

export function TransitChips({ value, onChange }: { value: Tab; onChange: (tab: Tab) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip active={value === 'subway'} label="지하철" onClick={() => onChange('subway')} icon={<IconTrain />} />
      <Chip active={value === 'bus'} label="버스" onClick={() => onChange('bus')} icon={<IconBus />} />
      <Chip active={value === 'parking'} label="주차장" onClick={() => onChange('parking')} icon={<IconParking />} />
    </div>
  )
}

