import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'

export interface ChatSource {
  source: string
  date: string
}

export interface ChatResponse {
  answer: string
  sources: ChatSource[]
  crisis: boolean
}

export function useChat() {
  return useMutation({
    mutationFn: async (question: string) =>
      (await api.post<ChatResponse>('/chat', { question })).data,
  })
}

// Each hook wraps a GET endpoint with React Query, which handles caching,
// loading state, and refetching automatically.

export interface Me {
  id: number
  email: string
  name: string
  current_mood: string
  accent_theme: string
  ambient_motion: boolean
  show_mascot: boolean
  screen_time_goal_hours: number
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get<Me>('/auth/me')).data,
  })
}

export interface MedicineSummary {
  taken: number
  total: number
  adherence_pct: number | null
  next_dose_at: string | null
}

export function useMedicineSummary() {
  return useQuery({
    queryKey: ['medicine', 'summary'],
    queryFn: async () => (await api.get<MedicineSummary>('/medicine/summary')).data,
  })
}

export interface JournalEntry {
  id: number
  content: string
  sentiment_score: number | null
  mood_label: string | null
  emotion_tags: string[] | null
  created_at: string
}

export interface SentimentResult {
  sentiment_score: number
  mood_label: string
  emotion_tags: string[]
}

export function useJournalEntries(limit = 20) {
  return useQuery({
    queryKey: ['journal', 'list', limit],
    queryFn: async () => (await api.get<JournalEntry[]>(`/journal?limit=${limit}`)).data,
  })
}

export function useCreateJournal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (content: string) =>
      (await api.post<JournalEntry>('/journal', { content })).data,
    // After saving, refresh the list + mood series so charts update.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] })
    },
  })
}

export function useAnalyzeSentiment() {
  return useMutation({
    mutationFn: async (content: string) =>
      (await api.post<SentimentResult>('/journal/analyze', { content })).data,
  })
}

export interface MoodPoint {
  date: string
  avg_sentiment: number | null
}

export function useMoodSeries(days = 14) {
  return useQuery({
    queryKey: ['journal', 'mood-series', days],
    queryFn: async () => (await api.get<MoodPoint[]>(`/journal/mood-series?days=${days}`)).data,
  })
}

export interface HabitSummary {
  id: number
  name: string
  goal: string
  icon: string
  streak: number
  checked_in_today: boolean
  kept_today: boolean | null
}

export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => (await api.get<HabitSummary[]>('/habits')).data,
  })
}

export interface HabitDay {
  date: string
  kept: boolean | null
  is_today: boolean
}

export function useHabitWeek(habitId: number) {
  return useQuery({
    queryKey: ['habits', 'week', habitId],
    queryFn: async () => (await api.get<HabitDay[]>(`/habits/${habitId}/week`)).data,
  })
}

export function useCheckInHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { habitId: number; kept: boolean; trigger_note?: string }) =>
      (
        await api.post(`/habits/${args.habitId}/check-in`, {
          date: new Date().toISOString().slice(0, 10),
          kept: args.kept,
          trigger_note: args.trigger_note || null,
        })
      ).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  })
}

export function useAddHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { name: string; goal: string; icon?: string }) =>
      (await api.post('/habits', { icon: 'target', ...args })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  })
}

export interface ScreenTimeToday {
  hours: number
  goal_hours: number
  over_goal: boolean
}

export function useScreenTimeToday() {
  return useQuery({
    queryKey: ['screen-time', 'today'],
    queryFn: async () => (await api.get<ScreenTimeToday>('/screen-time/today')).data,
  })
}

export interface ScreenTimeLog {
  id: number
  date: string
  hours: number
}

export function useScreenTimeLogs(days = 7) {
  return useQuery({
    queryKey: ['screen-time', 'logs', days],
    queryFn: async () => (await api.get<ScreenTimeLog[]>(`/screen-time?days=${days}`)).data,
  })
}

export function useUpdateScreenGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (goal_hours: number) =>
      (await api.patch('/screen-time/goal', { goal_hours })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['screen-time'] }),
  })
}

export function useLogScreenTime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (hours: number) =>
      (await api.post('/screen-time', { date: new Date().toISOString().slice(0, 10), hours })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['screen-time'] }),
  })
}

// ---- Medicine ----

export interface Dose {
  id: number
  schedule_id: number
  name: string
  dosage: string
  frequency: string
  scheduled_for: string
  taken: boolean
  taken_at: string | null
}

export function useDosesToday() {
  return useQuery({
    queryKey: ['medicine', 'doses', 'today'],
    queryFn: async () => (await api.get<Dose[]>('/medicine/doses/today')).data,
  })
}

export function useMarkDoseTaken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (doseId: number) =>
      (await api.patch(`/medicine/doses/${doseId}/take`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medicine'] }),
  })
}

export interface AdherencePoint {
  date: string
  total: number
  taken: number
}

export function useAdherence(days = 14) {
  return useQuery({
    queryKey: ['medicine', 'adherence', days],
    queryFn: async () => (await api.get<AdherencePoint[]>(`/medicine/adherence?days=${days}`)).data,
  })
}

export interface RefillItem {
  schedule_id: number
  name: string
  pill_count: number
  estimated_run_out_date: string | null
}

export function useRefill() {
  return useQuery({
    queryKey: ['medicine', 'refill'],
    queryFn: async () => (await api.get<RefillItem[]>('/medicine/refill')).data,
  })
}

export interface RiskPattern {
  pattern?: null
  day_of_week?: string
  hour?: number
  missed_count_at_slot?: number
  total_missed?: number
}

export function useRiskPattern() {
  return useQuery({
    queryKey: ['medicine', 'risk-pattern'],
    queryFn: async () => (await api.get<RiskPattern>('/medicine/risk-pattern')).data,
  })
}

export interface MedicineSchedule {
  id: number
  name: string
  dosage: string
  time_of_day: string
  frequency: string
  pill_count: number
}

export function useAddSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      name: string
      dosage: string
      time_of_day: string
      frequency: string
      pill_count: number
    }) => (await api.post<MedicineSchedule>('/medicine/schedules', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medicine'] }),
  })
}

// ---- Cycle ----

export interface CycleStatus {
  cycle_day: number | null
  cycle_length_days?: number
  phase: string | null
  next_period_predicted: string | null
}

export function useCycleStatus() {
  return useQuery({
    queryKey: ['cycle', 'status'],
    queryFn: async () => (await api.get<CycleStatus>('/cycle/status')).data,
  })
}

export interface CycleEntry {
  id: number
  date: string
  period_start: boolean
  symptoms: string[] | null
  notes: string | null
}

export function useCycleEntries(days = 90) {
  return useQuery({
    queryKey: ['cycle', 'list', days],
    queryFn: async () => (await api.get<CycleEntry[]>(`/cycle?days=${days}`)).data,
  })
}

export function useLogCycle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { period_start?: boolean; symptoms?: string[]; notes?: string }) =>
      (
        await api.post('/cycle', {
          date: new Date().toISOString().slice(0, 10),
          period_start: args.period_start ?? false,
          symptoms: args.symptoms ?? null,
          notes: args.notes ?? null,
        })
      ).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cycle'] }),
  })
}

// ---- Discover ----

export interface DiscoverVideo {
  video_id: string
  title: string
  channel: string
  thumbnail_url: string
  is_stub: boolean
}

export interface DiscoverResponse {
  mood: string
  videos: DiscoverVideo[]
}

export function useDiscover(mood?: string) {
  return useQuery({
    queryKey: ['discover', mood],
    queryFn: async () =>
      (await api.get<DiscoverResponse>(`/discover${mood ? `?mood=${mood}` : ''}`)).data,
  })
}

// ---- Preferences & AI insights ----

export function useUpdatePrefs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (prefs: Record<string, unknown>) =>
      (await api.patch('/users/me', prefs)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })
}

export function useInsight(focus = 'general') {
  return useQuery({
    queryKey: ['insight', focus],
    queryFn: async () =>
      (await api.get<{ insight: string }>(`/insights/summary?focus=${focus}`)).data.insight,
    staleTime: 1000 * 60 * 10, // insights don't change minute-to-minute; cache 10 min
  })
}

export function useWeeklyReflection() {
  return useQuery({
    queryKey: ['weekly-reflection'],
    queryFn: async () =>
      (await api.get<{ reflection: string }>('/insights/weekly-reflection')).data.reflection,
    staleTime: 1000 * 60 * 10,
  })
}
