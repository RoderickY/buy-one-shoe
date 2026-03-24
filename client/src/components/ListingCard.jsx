import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { api } from '../api'
import { useState } from 'react'

const CATEGORY_EMOJI = { shoes: '👟', gloves: '🧤', earrings: '💍', socks: '🧦', contacts: '👁️' }
const CONDITION_COLOR = {
  'new':      { bg: '#D1FAE5', color: '#065F46' },
  'like-new': { bg: '#DBEAFE', color: '#1E40AF' },
  'good':     { bg: '#FEF3C7', color: '#92400E' },
  'fair':     { bg: '#F3F4F6', color: '#374151' },
}

export default function ListingCard({ listing, onMatchCreated }) {
  const { currentUserId, currentUser } = useApp()
  const navigate = useNavigate()
  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)

  const isOwn = listing.user_id === currentUserId
  const cond = CONDITION_COLOR[listing.condition] || CONDITION_COLOR['good']
  const halfPrice = listing.price ? `$${(listing.price / 2).toFixed(0)}` : null

  async function handleMatchRequest(e) {
    e.stopPropagation()
    if (!currentUser || isOwn) return
    setRequesting(true)
    try {
      const match = await api.createMatch({
        listing_id_1: listing.id,
        listing_id_2: listing.id, // placeholder until they post their own listing
        user_id_1: listing.user_id,
        user_id_2: currentUserId,
      })
      setRequested(true)
      onMatchCreated?.(match)
      setTimeout(() => navigate(`/messages/${match.id}`), 600)
    } catch (err) {
      console.error(err)
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div
      className="card"
      style={cardStyle}
      onClick={() => navigate(`/profile/${listing.user_id}`)}
    >
      {/* Category Banner */}
      <div style={{ ...bannerStyle, background: isOwn ? '#F3F4F6' : '#F0F9FF' }}>
        <span style={{ fontSize: 36 }}>{CATEGORY_EMOJI[listing.category] || '📦'}</span>
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span className="badge" style={{ ...cond, fontSize: 11 }}>{listing.condition}</span>
        </div>
        {isOwn && (
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <span className="badge badge-gray" style={{ fontSize: 10 }}>Your listing</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', lineHeight: 1.2 }}>
              {listing.brand}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
              {listing.model}
            </div>
          </div>
          {halfPrice && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1A6B8A' }}>{halfPrice}</div>
              <div style={{ fontSize: 10, color: '#9CA3AF' }}>your share</div>
            </div>
          )}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <span className="badge badge-blue">
            {listing.side === 'left' ? '← Left' : listing.side === 'right' ? 'Right →' : listing.side}
          </span>
          {listing.size && listing.size !== 'one-size' && (
            <span className="badge badge-gray">Size {listing.size}</span>
          )}
          {listing.color && (
            <span className="badge badge-gray">{listing.color}</span>
          )}
        </div>

        {/* Description */}
        {listing.description && (
          <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5, marginBottom: 12,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {listing.description}
          </p>
        )}

        {/* User + Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
            {listing.user_avatar}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{listing.user_name}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>📍 {listing.location || listing.user_location}</div>
          </div>
        </div>

        {/* Action */}
        {!isOwn && (
          <button
            className={`btn ${requested ? 'btn-secondary' : 'btn-primary'} btn-sm`}
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleMatchRequest}
            disabled={requesting || requested}
          >
            {requested ? '✓ Match Request Sent!' : requesting ? 'Sending…' : '🤝 Request Co-Buy'}
          </button>
        )}
        {isOwn && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={e => { e.stopPropagation(); navigate(`/profile/${currentUserId}`) }}
          >
            View My Profile
          </button>
        )}
      </div>
    </div>
  )
}

const cardStyle = {
  cursor: 'pointer',
  transition: 'transform 0.15s, box-shadow 0.15s',
  position: 'relative',
}

const bannerStyle = {
  height: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  borderRadius: 0,
}
