import { format, formatDistanceToNow } from 'date-fns'
import { clsx } from 'clsx'
import { SCORE_BANDS } from './constants.js'

// ─── Class Names ─────────────────────────────────────────────────────────────
export { clsx as cn }

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function formatDate(ts) {
  if (!ts) return '—'
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return format(d, 'dd MMM yyyy')
}

export function formatDateTime(ts) {
  if (!ts) return '—'
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return format(d, 'dd MMM yyyy, HH:mm')
}

export function timeAgo(ts) {
  if (!ts) return '—'
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return formatDistanceToNow(d, { addSuffix: true })
}

// ─── Score helpers ────────────────────────────────────────────────────────────
export function getScoreBand(score) {
  return SCORE_BANDS.find(b => score >= b.min && score <= b.max)
    || SCORE_BANDS[SCORE_BANDS.length - 1]
}

export function getScoreColor(score) {
  if (score >= 90) return 'text-green-400'
  if (score >= 75) return 'text-blue-400'
  if (score >= 60) return 'text-cyan-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-rose-400'
}

export function getScoreRingColor(score) {
  if (score >= 90) return '#10b981'
  if (score >= 75) return '#3b82f6'
  if (score >= 60) return '#06b6d4'
  if (score >= 40) return '#f59e0b'
  return '#f43f5e'
}

export function getEvidenceLevelColor(level) {
  switch (level) {
    case 'A': return 'text-green-400'
    case 'B': return 'text-blue-400'
    case 'C': return 'text-amber-400'
    case 'D': return 'text-rose-400'
    default:  return 'text-gray-400'
  }
}

export function getEvidenceLevelBadge(level) {
  switch (level) {
    case 'A': return { label: 'Verified',    bg: 'bg-green-400/10 text-green-400 border-green-400/20' }
    case 'B': return { label: 'Documented',  bg: 'bg-blue-400/10 text-blue-400 border-blue-400/20'   }
    case 'C': return { label: 'Described',   bg: 'bg-amber-400/10 text-amber-400 border-amber-400/20'}
    case 'D': return { label: 'Claimed',     bg: 'bg-rose-400/10 text-rose-400 border-rose-400/20'   }
    default:  return { label: 'Unknown',     bg: 'bg-gray-400/10 text-gray-400 border-gray-400/20'   }
  }
}

export function getConfidenceStyle(confidence) {
  switch (confidence) {
    case 'HIGH':   return { color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' }
    case 'MEDIUM': return { color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' }
    case 'LOW':    return { color: 'text-rose-400',  bg: 'bg-rose-400/10 border-rose-400/20'   }
    default:       return { color: 'text-gray-400',  bg: 'bg-gray-400/10 border-gray-400/20'   }
  }
}

// ─── Match percentage color ───────────────────────────────────────────────────
export function getMatchColor(pct) {
  if (pct >= 85) return 'text-green-400'
  if (pct >= 65) return 'text-blue-400'
  if (pct >= 45) return 'text-amber-400'
  return 'text-gray-400'
}

// ─── Truncate text ───────────────────────────────────────────────────────────
export function truncate(str, len = 120) {
  if (!str) return ''
  return str.length <= len ? str : str.slice(0, len).trimEnd() + '…'
}

// ─── Initials ────────────────────────────────────────────────────────────────
export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

// ─── File size ───────────────────────────────────────────────────────────────
export function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ─── Technology tag color (deterministic by string) ───────────────────────────
const TAG_COLORS = [
  'bg-blue-400/10 text-blue-300 border-blue-400/20',
  'bg-purple-400/10 text-purple-300 border-purple-400/20',
  'bg-cyan-400/10 text-cyan-300 border-cyan-400/20',
  'bg-green-400/10 text-green-300 border-green-400/20',
  'bg-amber-400/10 text-amber-300 border-amber-400/20',
]
export function getTechTagColor(tech) {
  let hash = 0
  for (let i = 0; i < tech.length; i++) hash = tech.charCodeAt(i) + ((hash << 5) - hash)
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

// ─── Role label ───────────────────────────────────────────────────────────────
export function getRoleLabel(role) {
  switch (role) {
    case 'student':       return 'Student'
    case 'mentor':        return 'Mentor'
    case 'investor':      return 'Investor'
    case 'industrialist': return 'Industrialist'
    case 'admin':         return 'Admin'
    default:              return role || 'Unknown'
  }
}

// ─── Lifecycle stage index ────────────────────────────────────────────────────
export function getLifecycleIndex(stages, currentStage) {
  return stages.indexOf(currentStage)
}

// ─── Generate unique ID (client-side only fallback) ──────────────────────────
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
