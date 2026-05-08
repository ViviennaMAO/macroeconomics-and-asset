import Taro from '@tarojs/taro'

export interface ChapterStat {
  num: number
  firstOpenedAt: number
  lastOpenedAt: number
  predictAttempts: number
  predictCorrect: number
  quizScore?: number
  quizTakenAt?: number
  completed: boolean
  completedAt?: number
}

export interface ReviewItem {
  num: number
  dueAt: number
  level: number // 0-5
}

export interface ProgressData {
  chapters: Record<number, ChapterStat>
  reviews: ReviewItem[]
  streakDays: number
  lastActiveDate: string // YYYY-MM-DD
}

const STORAGE_KEY = 'MACRO_ASSET_PROGRESS'

// Ebbinghaus review intervals in minutes
const REVIEW_INTERVALS: Record<number, number> = {
  0: 20,
  1: 1440,    // 1 day
  2: 4320,    // 3 days
  3: 10080,   // 1 week
  4: 20160,   // 2 weeks
  5: 43200,   // 1 month
}

const MAX_LEVEL = 5

function getDefaultProgress(): ProgressData {
  return {
    chapters: {},
    reviews: [],
    streakDays: 0,
    lastActiveDate: '',
  }
}

function todayString(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function updateStreak(data: ProgressData): ProgressData {
  const today = todayString()

  if (data.lastActiveDate === today) {
    // Already active today, no change
    return data
  }

  if (data.lastActiveDate === '') {
    // First time ever
    return { ...data, streakDays: 1, lastActiveDate: today }
  }

  // Check if lastActiveDate was yesterday
  const last = new Date(data.lastActiveDate)
  const todayDate = new Date(today)
  const diffMs = todayDate.getTime() - last.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return { ...data, streakDays: data.streakDays + 1, lastActiveDate: today }
  }

  // Gap of more than 1 day — reset streak
  return { ...data, streakDays: 1, lastActiveDate: today }
}

function scheduleDue(level: number): number {
  const intervalMinutes = REVIEW_INTERVALS[Math.min(level, MAX_LEVEL)] ?? REVIEW_INTERVALS[MAX_LEVEL]
  return Date.now() + intervalMinutes * 60 * 1000
}

export function loadProgress(): ProgressData {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY)
    if (raw && typeof raw === 'object') {
      return raw as ProgressData
    }
    if (typeof raw === 'string' && raw.length > 0) {
      return JSON.parse(raw) as ProgressData
    }
  } catch (_e) {
    // Fall through to defaults
  }
  return getDefaultProgress()
}

export function saveProgress(data: ProgressData): void {
  Taro.setStorageSync(STORAGE_KEY, data)
}

export function markOpened(chNum: number): ProgressData {
  let data = loadProgress()
  const now = Date.now()

  const existing = data.chapters[chNum]
  const updated: ChapterStat = existing
    ? { ...existing, lastOpenedAt: now }
    : {
        num: chNum,
        firstOpenedAt: now,
        lastOpenedAt: now,
        predictAttempts: 0,
        predictCorrect: 0,
        completed: false,
      }

  data = updateStreak(data)
  data = {
    ...data,
    chapters: { ...data.chapters, [chNum]: updated },
  }

  saveProgress(data)
  return data
}

export function markPredicted(chNum: number, correct: boolean): ProgressData {
  let data = loadProgress()

  const existing = data.chapters[chNum]
  const base: ChapterStat = existing ?? {
    num: chNum,
    firstOpenedAt: Date.now(),
    lastOpenedAt: Date.now(),
    predictAttempts: 0,
    predictCorrect: 0,
    completed: false,
  }

  const updated: ChapterStat = {
    ...base,
    predictAttempts: base.predictAttempts + 1,
    predictCorrect: base.predictCorrect + (correct ? 1 : 0),
    lastOpenedAt: Date.now(),
  }

  data = {
    ...data,
    chapters: { ...data.chapters, [chNum]: updated },
  }

  saveProgress(data)
  return data
}

export function markQuiz(chNum: number, score: number): ProgressData {
  let data = loadProgress()
  const now = Date.now()

  const existing = data.chapters[chNum]
  const base: ChapterStat = existing ?? {
    num: chNum,
    firstOpenedAt: now,
    lastOpenedAt: now,
    predictAttempts: 0,
    predictCorrect: 0,
    completed: false,
  }

  const updated: ChapterStat = {
    ...base,
    quizScore: score,
    quizTakenAt: now,
    lastOpenedAt: now,
  }

  data = { ...data, chapters: { ...data.chapters, [chNum]: updated } }

  // If score >= 60, add/reset review queue entry at L0
  if (score >= 60) {
    const otherReviews = data.reviews.filter((r) => r.num !== chNum)
    const newReview: ReviewItem = {
      num: chNum,
      dueAt: scheduleDue(0),
      level: 0,
    }
    data = { ...data, reviews: [...otherReviews, newReview] }
  }

  saveProgress(data)
  return data
}

export function markCompleted(chNum: number): ProgressData {
  let data = loadProgress()
  const now = Date.now()

  const existing = data.chapters[chNum]
  const base: ChapterStat = existing ?? {
    num: chNum,
    firstOpenedAt: now,
    lastOpenedAt: now,
    predictAttempts: 0,
    predictCorrect: 0,
    completed: false,
  }

  const updated: ChapterStat = {
    ...base,
    completed: true,
    completedAt: base.completedAt ?? now,
    lastOpenedAt: now,
  }

  data = { ...data, chapters: { ...data.chapters, [chNum]: updated } }

  saveProgress(data)
  return data
}

export function reviewDone(chNum: number, success: boolean): ProgressData {
  let data = loadProgress()

  const reviewIndex = data.reviews.findIndex((r) => r.num === chNum)
  if (reviewIndex === -1) {
    // No review item found; nothing to update
    return data
  }

  const current = data.reviews[reviewIndex]

  let newLevel: number
  if (success) {
    newLevel = Math.min(current.level + 1, MAX_LEVEL)
  } else {
    newLevel = Math.max(current.level - 1, 0)
  }

  const updatedReview: ReviewItem = {
    ...current,
    level: newLevel,
    dueAt: scheduleDue(newLevel),
  }

  const updatedReviews = [
    ...data.reviews.slice(0, reviewIndex),
    updatedReview,
    ...data.reviews.slice(reviewIndex + 1),
  ]

  data = { ...data, reviews: updatedReviews }

  saveProgress(data)
  return data
}

export function dueReviews(data: ProgressData): ReviewItem[] {
  const now = Date.now()
  return data.reviews.filter((r) => r.dueAt <= now)
}

export function completionRate(data: ProgressData, total: number): number {
  if (total <= 0) return 0
  const completedCount = Object.values(data.chapters).filter((ch) => ch.completed).length
  return Math.min(100, Math.round((completedCount / total) * 100))
}
