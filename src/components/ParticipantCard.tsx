import { useMemo, type ChangeEvent } from 'react'
import type { Participant } from '../types'

interface ParticipantCardProps {
  participant: Participant
  onChange: (value: Participant) => void
  onDelete: () => void
  onRequestMap: () => void
}

const formatNumber = (value: number) => (Number.isFinite(value) ? value.toFixed(6) : '')

export function ParticipantCard({ participant, onChange, onDelete, onRequestMap }: ParticipantCardProps) {
  const placeholderName = useMemo(() => `참여자 ${participant.id.slice(-4)}`, [participant.id])

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...participant, name: event.target.value })
  }

  const handleAddressChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...participant, address: event.target.value })
  }

  const handleWeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextWeight = Number(event.target.value)
    if (Number.isNaN(nextWeight) || nextWeight <= 0) {
      return
    }
    onChange({ ...participant, weight: Math.min(99, Number(nextWeight.toFixed(2))) })
  }

  const handleLatChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value)
    if (Number.isNaN(value) || value < -90 || value > 90) {
      return
    }
    onChange({ ...participant, loc: { ...participant.loc, lat: value } })
  }

  const handleLngChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value)
    if (Number.isNaN(value) || value < -180 || value > 180) {
      return
    }
    onChange({ ...participant, loc: { ...participant.loc, lng: value } })
  }

  return (
    <div className="card-surface flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <label className="label-text" htmlFor={`name-${participant.id}`}>
            이름
          </label>
          <input
            id={`name-${participant.id}`}
            className="input-field mt-1"
            placeholder={placeholderName}
            value={participant.name}
            onChange={handleNameChange}
          />
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full border border-white/10 bg-slate-900/60 p-2 text-xs text-slate-400 transition hover:border-red-400/50 hover:text-red-300"
          aria-label="참여자 삭제"
        >
          ✕
        </button>
      </div>
      <div>
        <label className="label-text" htmlFor={`address-${participant.id}`}>
          주소
        </label>
        <input
          id={`address-${participant.id}`}
          className="input-field mt-1"
          placeholder="지도에서 선택하거나 직접 입력"
          value={participant.address ?? ''}
          onChange={handleAddressChange}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="label-text" htmlFor={`lat-${participant.id}`}>
            위도
          </label>
          <input
            id={`lat-${participant.id}`}
            type="number"
            className="input-field mt-1"
            step="0.000001"
            value={participant.loc.lat}
            onChange={handleLatChange}
          />
        </div>
        <div>
          <label className="label-text" htmlFor={`lng-${participant.id}`}>
            경도
          </label>
          <input
            id={`lng-${participant.id}`}
            type="number"
            className="input-field mt-1"
            step="0.000001"
            value={participant.loc.lng}
            onChange={handleLngChange}
          />
        </div>
        <div>
          <label className="label-text" htmlFor={`weight-${participant.id}`}>
            가중치
          </label>
          <input
            id={`weight-${participant.id}`}
            type="number"
            min={0.1}
            step="0.1"
            className="input-field mt-1"
            value={participant.weight}
            onChange={handleWeightChange}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onRequestMap}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-400/20"
      >
        <span aria-hidden>📍</span>
        지도에서 선택
      </button>
      <p className="text-xs text-slate-400">
        현재 좌표: {formatNumber(participant.loc.lat)}, {formatNumber(participant.loc.lng)}
      </p>
    </div>
  )
}
