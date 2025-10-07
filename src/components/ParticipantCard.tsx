import { useMemo, useState, type ChangeEvent } from 'react'
import type { Participant, PlaceCandidate } from '../types'
import { AddressSearchModal } from './AddressSearchModal'

interface ParticipantCardProps {
  participant: Participant
  onChange: (value: Participant) => void
  onDelete: () => void
  onKeywordSearch?: (keyword: string) => Promise<PlaceCandidate[]>
  onAddressSearch?: (query: string) => Promise<PlaceCandidate[]>
  kakaoReady?: boolean
}

const formatNumber = (value: number) => (Number.isFinite(value) ? value.toFixed(6) : '')

export function ParticipantCard({ participant, onChange, onDelete, onKeywordSearch, onAddressSearch, kakaoReady }: ParticipantCardProps) {
  const placeholderName = useMemo(() => `참여자 ${participant.id.slice(-4)}`, [participant.id])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...participant, name: event.target.value })
  }

  const handleAddressChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    onChange({ ...participant, address: value })
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

  const handlePickFromModal = (place: PlaceCandidate) => {
    onChange({ ...participant, address: place.address || place.name, loc: { ...place.latlng } })
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
      <div className="relative">
        <label className="label-text" htmlFor={`address-${participant.id}`}>
          주소
        </label>
        <input
          id={`address-${participant.id}`}
          className="input-field mt-1"
          placeholder="주소를 입력하면 검색 모달이 열립니다"
          value={participant.address ?? ''}
          onChange={handleAddressChange}
          onFocus={(e) => {
            e.currentTarget.blur()
            setAddressModalOpen(true)
          }}
        />
        <AddressSearchModal
          open={addressModalOpen}
          kakaoReady={!!kakaoReady}
          onClose={() => setAddressModalOpen(false)}
          onSelect={handlePickFromModal}
          keywordSearch={async (kw, _opts) => (onKeywordSearch ? onKeywordSearch(kw) : [])}
          addressSearch={async (kw) => (onAddressSearch ? onAddressSearch(kw) : [])}
          center={participant.loc}
          initialQuery={participant.address || ''}
        />
      </div>
      <div>
        <button
          type="button"
          className="text-xs text-amber-200 underline underline-offset-4 hover:text-amber-100"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced ? '고급 옵션 숨기기' : '고급 옵션'}
        </button>
      </div>
      {showAdvanced ? (
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
            <div className="flex items-center gap-2">
              <label className="label-text" htmlFor={`weight-${participant.id}`}>가중치</label>
              <span className="cursor-help text-xs text-slate-400" title="가중치 ↑ = 해당 사용자의 위치를 더 우선적으로 고려합니다">ⓘ</span>
            </div>
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
      ) : null}
      <p className="text-xs text-slate-400">
        현재 좌표: {formatNumber(participant.loc.lat)}, {formatNumber(participant.loc.lng)}
      </p>
    </div>
  )
}

