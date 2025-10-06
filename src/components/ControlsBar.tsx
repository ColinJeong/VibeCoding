import type { RecommendMode } from '../types'

interface ControlsBarProps {
  mode: RecommendMode
  onModeChange: (mode: RecommendMode) => void
  onAddParticipant: () => void
}

const modeOptions: { label: string; value: RecommendMode; description: string }[] = [
  { label: 'Median', value: 'median', description: '총 이동거리 최소화' },
  { label: 'Mean', value: 'mean', description: '평균 중심' },
  { label: 'Minimax', value: 'minimax', description: '최장거리 최소화' },
]

export function ControlsBar({ mode, onModeChange, onAddParticipant }: ControlsBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white/5 p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="label-text">추천 기준</p>
        <select
          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 shadow-inner shadow-black/10 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 md:w-60"
          value={mode}
          onChange={(event) => onModeChange(event.target.value as RecommendMode)}
        >
          {modeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} · {option.description}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={onAddParticipant}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/30 transition hover:bg-amber-300"
      >
        <span aria-hidden>＋</span>
        참여자 추가
      </button>
    </div>
  )
}
