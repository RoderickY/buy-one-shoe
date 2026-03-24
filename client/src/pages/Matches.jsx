import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useApp } from '../App'

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'badge-yellow' },
  accepted:  { label: 'Active',    color: 'badge-green' },
  completed: { label: 'Completed', color: 'badge-gray' },
  declined:  { label: 'Declined',  color: 'badge-red' },
}

const CATEGORY_EMOJI = { shoes: '👟', gloves: '🧤', earrings: '💍', socks: '🧦', contacts: '👁️' }

export default function Matches() {
  const { currentUserId } = useApp()
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!currentUserId) return
    setLoading(true)
    api.getMatches(currentUserId).then(setMatches).finally(() => setLoading(false))
  }, [currentUserId])

  async function handleAction(matchId, status) {
    await api.updateMatch(matchId, status)
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status } : m))
  }

  const filtered = filter === 'all' ? matches : matches.filter(m => m.status === filter)

  return (
    <div className="page" style={{ maxWidth: 780 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 6 }}>My Matches</h1>
        <p style={{ color: '#6B7280', fontSize: 15 }}>Co-buy requests and active partnerships.</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'pending', 'accepted', 'completed'].map(f => (
          <button
            key={f}
            style={{
              padding: '7px 16px', borderRadius: 8,
              border: '1.5px solid',
              borderColor: filter === f ? '#1A6B8A' : '#E5E7EB',
              background: filter === f ? '#EFF6FF' : '#fff',
              color: filter === f ? '#1A6B8A' : '#6B7280',
              fontWeight: filter === f ? 600 : 400,
              fontSize: 13, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `All (${matches.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">⏳ Loading matches…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">🤝</div>
          <h3>No matches yet</h3>
          <p>Browse listings and request a co-buy to get your first match!</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Browse Listings</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              currentUserId={currentUserId}
              onAction={handleAction}
              onMessage={() => navigate(`/messages/${match.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MatchCard({ match, currentUserId, onAction, onMessage }) {
  const isUser1 = match.user_id_1 === currentUserId
  const partner = isUser1
    ? { name: match.user2_name, avatar: match.user2_avatar, location: match.user2_location }
    : { name: match.user1_name, avatar: match.user1_avatar, location: match.user1_location }

  const myListing    = isUser1 ? { brand: match.l1_brand, model: match.l1_model, size: match.l1_size, side: match.l1_side, color: match.l1_color, price: match.l1_price } : { brand: match.l2_brand, model: match.l2_model, size: match.l2_size, side: match.l2_side, color: match.l2_color, price: match.l2_price }
  const theirListing = isUser1 ? { brand: match.l2_brand, model: match.l2_model, size: match.l2_size, side: match.l2_side, color: match.l2_color, price: match.l2_price } : { brand: match.l1_brand, model: match.l1_model, size: match.l1_size, side: match.l1_side, color: match.l1_color, price: match.l1_price }

  const cfg = STATUS_CONFIG[match.status] || STATUS_CONFIG.pending
  const emoji = CATEGORY_EMOJI[match.category] || '📦'
  const halfPrice = (myListing.price || theirListing.price) ? `$${((myListing.price || theirListing.price) / 2).toFixed(0)} each` : null

  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {/* Emoji icon */}
        <div style={{ fontSize: 36, flexShrink: 0, background: '#F0F9FF', borderRadius: 12, width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {emoji}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>
              {myListing.brand || theirListing.brand} {myListing.model || theirListing.model}
            </div>
            <span className={`badge ${cfg.color}`}>{cfg.label}</span>
            {halfPrice && <span style={{ fontSize: 13, fontWeight: 700, color: '#1A6B8A' }}>{halfPrice}</span>}
          </div>

          {/* Items */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span className="badge badge-blue" style={{ fontSize: 11 }}>
              You: {myListing.side === 'left' ? '← Left' : 'Right →'} {myListing.size && `sz ${myListing.size}`}
            </span>
            <span style={{ color: '#9CA3AF', fontSize: 11, alignSelf: 'center' }}>+</span>
            <span className="badge badge-green" style={{ fontSize: 11 }}>
              Them: {theirListing.side === 'left' ? '← Left' : 'Right →'} {theirListing.size && `sz ${theirListing.size}`}
            </span>
            <span style={{ color: '#9CA3AF', fontSize: 11, alignSelf: 'center' }}>= Full Pair ✓</span>
          </div>

          {/* Partner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{partner.avatar}</div>
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{partner.name}</span>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>📍 {partner.location}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-primary btn-sm" onClick={onMessage}>
            💬 Message
          </button>
          {match.status === 'accepted' && (
            <button className="btn btn-secondary btn-sm" onClick={() => onAction(match.id, 'completed')}>
              ✓ Mark Done
            </button>
          )}
          {match.status === 'pending' && !isUser1 && (
            <>
              <button className="btn btn-primary btn-sm" style={{ background: '#10B981' }} onClick={() => onAction(match.id, 'accepted')}>Accept</button>
              <button className="btn btn-danger btn-sm" onClick={() => onAction(match.id, 'declined')}>Decline</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
