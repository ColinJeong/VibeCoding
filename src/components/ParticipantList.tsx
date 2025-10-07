import type { Participant, PlaceCandidate } from '../types'
import { ParticipantCard } from './ParticipantCard'

interface ParticipantListProps {
  participants: Participant[]
  onUpdate: (id: string, next: Participant) => void
  onDelete: (id: string) => void
  onKeywordSearch?: (keyword: string) => Promise<PlaceCandidate[]>
  onAddressSearch?: (query: string) => Promise<PlaceCandidate[]>
  kakaoReady?: boolean
}

export function ParticipantList({ participants, onUpdate, onDelete, onKeywordSearch, onAddressSearch, kakaoReady }: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div className="card-surface text-sm text-slate-300">
        참여자를 추가하고 지점의 위치를 지정하면 추천을 시작해요.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {participants.map((participant) => (
        <ParticipantCard
          key={participant.id}
          participant={participant}
          onChange={(next) => onUpdate(participant.id, next)}
          onDelete={() => onDelete(participant.id)}
          onKeywordSearch={onKeywordSearch}
          onAddressSearch={onAddressSearch}
          kakaoReady={kakaoReady}
        />
      ))}
    </div>
  )
}
