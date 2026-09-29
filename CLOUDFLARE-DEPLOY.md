export type Period = 'morning' | 'evening'
export type BrushStatus = 'completed' | 'ended_early' | 'missed'
export type ParentName = 'Mor' | 'Far'

export interface ChildProfile {
  id: 'aya' | 'ellie'
  name: string
  emoji: string
}

export interface BrushingSession {
  id?: string
  childId: string
  date: string
  period: Period
  startedAt?: string
  completedAt?: string
  requiredSeconds: number
  actualSeconds: number
  status: BrushStatus
  adultRequired: boolean
  adultApproved: boolean
  approvedBy?: ParentName
  starsEarned: number
  rewardEligible?: boolean
  manual?: boolean
  createdByParent?: ParentName
}

export interface Reward {
  id: string
  title: string
  emoji: string
  cost: number
  description?: string
  active: boolean
}

export interface Redemption {
  id: string
  childId: string
  rewardId: string
  rewardTitle: string
  rewardEmoji: string
  cost: number
  approvedBy: ParentName
  createdAt: string
}
