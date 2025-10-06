import type { Participant } from '../types'
import { ParticipantCard } from './ParticipantCard'

interface ParticipantListProps {
  participants: Participant[]
  onUpdate: (id: string, next: Participant) => void
  onDelete: (id: string) => void
  onRequestMap: (id: string) => void
}

export function ParticipantList({ participants, onUpdate, onDelete, onRequestMap }: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div className="card-surface text-sm text-slate-300">
        참여자를 추가하고 지도에서 위치를 지정하면 추천이 시작됩니다.
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
          onRequestMap={() => onRequestMap(participant.id)}
        />
      ))}
    </div>
  )
}
