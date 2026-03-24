import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useApp } from '../App'

const CATEGORY_EMOJI = { shoes: '👟', gloves: '🧤', earrings: '💍', socks: '🧦', contacts: '👁️' }
const CONDITION_COLOR = {
  'new':      { bg: '#D1FAE5', color: '#065F46' },
  'like-new': { bg: '#DBEAFE', color: '#1E40AF' },
  'good':     { bg: '#FEF3C7', color: '#92400E' },
  'fair':     { bg: '#F3F4F6', color: '#374151' },
}

function Stars({ rating, size = 16 }) {
  const r = Math.round(rating || 0)
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= r ? '#F59E0B' : '#D1D5DB' }}>★</span>
      ))}
    </span>
  )
}

export default function Profile() {
  const { id } = useParams()
  const { currentUserId } = useApp()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('listings')

  useEffect(() => {
    setLoading(true)
    api.getUser(id).then(setUser).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading">⏳ Loading profile…</div>
  if (!user) return <div className="empty-state"><div className="emoji">😕</div><h3>User not found</h3></div>

  const isMe = parseInt(id) === currentUserId
  const activeListings = user.listings?.filter(l => l.status === 'active') || []
  const pastListings   = user.listings?.filter(l => l.status !== 'active') || []

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      {/* Profile Header */}
      <div className="card" style={{ padding: '28px 32px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div className="avatar" style={{ width: 80, height: 80, fontSize: 28, flexShrink: 0,
            boxShadow: '0 0 0 4px #D5EAF2' }}>
            {user.avatar}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827' }}>{user.name}</h1>
              {isMe && <span className="badge badge-blue">You</span>}
            </div>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Stars rating={user.avg_rating} size={18} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                {user.avg_rating ? user.avg_rating.toFixed(1) : '—'}
              </span>
              <span style={{ fontSize: 13, color: '#9CA3AF' }}>
                ({user.review_count} review{user.review_count !== 1 ? 's' : ''})
              </span>
            </div>

            {user.location && (
              <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
                📍 {user.location}
              </div>
            )}

            {user.bio && (
              <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6, maxWidth: 480 }}>
                {user.bio}
              </p>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
            <StatBox n={activeListings.length} label="Active" color="#1A6B8A" />
            <StatBox n={pastListings.length} label="Completed" color="#10B981" />
            <StatBox n={user.review_count} label="Reviews" color="#F59E0B" />
          </div>
        </div>

        {!isMe && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              🤝 View Their Listings
            </button>
          </div>
        )}
        {isMe && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => navigate('/post')}>+ Post a Listing</button>
            <button className="btn btn-ghost" onClick={() => navigate('/matches')}>My Matches</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#fff', borderRadius: 10, padding: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {[
          { key: 'listings', label: `Active Listings (${activeListings.length})` },
          { key: 'reviews',  label: `Reviews (${user.review_count})` },
          { key: 'history',  label: `History (${pastListings.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            style={{
              flex: 1, padding: '9px 16px', borderRadius: 7,
              border: 'none', cursor: 'pointer',
              fontWeight: activeTab === tab.key ? 600 : 400,
              fontSize: 14,
              background: activeTab === tab.key ? '#1A6B8A' : 'transparent',
              color: activeTab === tab.key ? '#fff' : '#6B7280',
              transition: 'all 0.15s',
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Listings Tab */}
      {activeTab === 'listings' && (
        activeListings.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">📭</div>
            <h3>No active listings</h3>
            <p>{isMe ? "Post your first listing to find a co-buyer!" : `${user.name} hasn't posted any listings yet.`}</p>
            {isMe && <button className="btn btn-primary" onClick={() => navigate('/post')}>+ Post a Listing</button>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeListings.map(l => <ListingRow key={l.id} listing={l} currentUserId={currentUserId} navigate={navigate} />)}
          </div>
        )
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        (user.reviews || []).length === 0 ? (
          <div className="empty-state">
            <div className="emoji">⭐</div>
            <h3>No reviews yet</h3>
            <p>Complete a co-buy transaction to earn your first review.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(user.reviews || []).map(r => (
              <div key={r.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                  <div className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>{r.reviewer_avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{r.reviewer_name}</div>
                    <Stars rating={r.rating} size={14} />
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>
                    {new Date(r.created_at + 'Z').toLocaleDateString()}
                  </div>
                </div>
                {r.comment && <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        )
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        pastListings.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">📦</div>
            <h3>No history yet</h3>
            <p>Completed co-buys will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pastListings.map(l => <ListingRow key={l.id} listing={l} currentUserId={currentUserId} navigate={navigate} dim />)}
          </div>
        )
      )}
    </div>
  )
}

function StatBox({ n, label, color }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 60 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{n}</div>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function ListingRow({ listing, currentUserId, navigate, dim }) {
  const cond = CONDITION_COLOR[listing.condition] || CONDITION_COLOR['good']
  return (
    <div className="card" style={{ padding: '14px 18px', opacity: dim ? 0.7 : 1 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ fontSize: 28, background: '#F0F9FF', borderRadius: 10, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {CATEGORY_EMOJI[listing.category] || '📦'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{listing.brand} {listing.model}</span>
            <span className="badge" style={cond}>{listing.condition}</span>
            <span className="badge badge-blue">{listing.side === 'left' ? '← Left' : 'Right →'} · Sz {listing.size}</span>
            {listing.status !== 'active' && (
              <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{listing.status}</span>
            )}
          </div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>
            {listing.color && `${listing.color} · `}
            {listing.location}
            {listing.price && <span style={{ color: '#1A6B8A', fontWeight: 600, marginLeft: 8 }}>Full pair: ${listing.price}</span>}
          </div>
        </div>
        {listing.user_id === currentUserId && listing.status === 'active' && (
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>Edit</button>
        )}
      </div>
      {listing.description && (
        <div style={{ fontSize: 13, color: '#4B5563', marginTop: 10, lineHeight: 1.5, paddingLeft: 66 }}>
          {listing.description}
        </div>
      )}
    </div>
  )
}
