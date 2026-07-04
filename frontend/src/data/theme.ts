// Mood definitions — emoji, tint colour, ambient glow colour, and mascot motion speeds.
// Values come straight from the design handoff's "mood language" table.
export type MoodKey = 'excited' | 'good' | 'calm' | 'sleepy' | 'sad' | 'anxious'

export interface Mood {
  key: MoodKey
  label: string
  emoji: string
  tint: string
  glow: string
  float: string
  breathe: string
}

export const MOODS: Record<MoodKey, Mood> = {
  excited: { key: 'excited', label: 'Excited', emoji: '🤩', tint: '#EFFBE9', glow: '#9BE24A', float: '3.6s', breathe: '3.2s' },
  good:    { key: 'good',    label: 'Good',    emoji: '😄', tint: '#E4F6F5', glow: '#3FD0C4', float: '5s',   breathe: '4s' },
  calm:    { key: 'calm',    label: 'Calm',    emoji: '😌', tint: '#EDF4FB', glow: '#6FC0E8', float: '6.5s', breathe: '4.8s' },
  sleepy:  { key: 'sleepy',  label: 'Sleepy',  emoji: '😴', tint: '#E9F2FD', glow: '#5AA8F0', float: '9s',   breathe: '6.5s' },
  sad:     { key: 'sad',     label: 'Sad',     emoji: '😔', tint: '#EDEFFB', glow: '#8E9BE8', float: '8s',   breathe: '6s' },
  anxious: { key: 'anxious', label: 'Anxious', emoji: '😟', tint: '#F2ECFA', glow: '#B58BE6', float: '4.2s', breathe: '3.6s' },
}

export const MOOD_ORDER: MoodKey[] = ['excited', 'good', 'calm', 'sleepy', 'sad', 'anxious']

// Accent themes — user-switchable primary colour.
export type AccentKey = 'sky' | 'periwinkle' | 'aqua'

export interface Accent {
  key: AccentKey
  label: string
  accent: string
  deep: string
  soft: string
}

export const ACCENTS: Record<AccentKey, Accent> = {
  sky:        { key: 'sky',        label: 'Sky blue',   accent: '#4F93D9', deep: '#2F6DB0', soft: '#E7F0FB' },
  periwinkle: { key: 'periwinkle', label: 'Periwinkle', accent: '#7B8CE8', deep: '#5566CC', soft: '#ECEEFC' },
  aqua:       { key: 'aqua',       label: 'Aqua',       accent: '#3FB6C4', deep: '#2A8A96', soft: '#E3F5F6' },
}
