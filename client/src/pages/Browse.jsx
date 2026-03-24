import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import ListingCard from '../components/ListingCard'
import { useApp } from '../App'

const CATEGORIES = [
  { value: 'all',      label: 'All Items',  emoji: '🛍️' },
  { value: 'shoes',    label: 'Shoes',      emoji: '👟' },
  { value: 'gloves',   label: 'Gloves',     emoji: '🧤' },
  { value: 'earrings', label: 'Earrings',   emoji: '💍' },
  { value: 'socks',    label: 'Socks',      emoji: '🧦' },
  { value: 'contacts', label: 'Contacts',   emoji: '👁️' },
]

export default function Browse() {
  const { currentUserId } = useApp()
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [side, setSide] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { category, side }
      if (search) params.search = search
      const data = await api.getListings(params)
      setListings(data)
    } finally {
      setLoading(false)
    }
  }, [category, side, search])

  useEffect(() => { load() }, [load])

  function handleSearch(e) {
    e.preventDefault()
    setSearch(searchInput)
  }

  const myListings = listings.filter(l => l.user_id === currentUserId)
  const otherListings = listings.filter(l => l.user_id !== currentUserId)

  return (
    <div className="page-wide">
      {/* Hero */}
      <div style={heroStyle}>
        <div style={{ maxWidth: 600 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 10 }}>
            Find your perfect co-buyer 🤝
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 24 }}>
            Browse listings from people who need the other half of a pair. Split the cost, both get what you need.
          </p>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-input"
              style={{ flex: 1, background: 'rgba(255,255,255,0.95)', borderColor: 'transparent' }}
              placeholder="Search by brand, model, color…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-lg" style={{ background: '#0F4A63', whiteSpace: 'nowrap' }}>
              Search
            </button>
          </form>
        </div>

        {/* Stats */}
        <div style={statsStyle}>
          <Stat n={listings.length} label="Active listings" />
          <Stat n="50%" label="Average savings" />
          <Stat n="5" label="Categories" />
        </div>
      </div>

      {/* Filters */}
      <div style={filterBarStyle}>
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              style={{
                ...tabStyle,
                ...(category === c.value ? tabActiveStyle : {}),
              }}
              onClick={() => setCategory(c.value)}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Side Filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'left', 'right'].map(s => (
            <button
              key={s}
              style={{
                ...tabStyle,
                ...(side === s ? tabActiveStyle : {}),
                fontSize: 12,
              }}
              onClick={() => setSide(s)}
            >
              {s === 'all' ? 'Both sides' : s === 'left' ? '← Left' : 'Right →'}
            </button>
          ))}
        </div>

        {(search || category !== 'all' || side !== 'all') && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setSearch(''); setSearchInput(''); setCategory('all'); setSide('all') }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="loading">⏳ Loading listings…</div>
      ) : listings.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">🔍</div>
          <h3>No listings found</h3>
          <p>Try adjusting your filters, or be the first to post in this category!</p>
          <button className="btn btn-primary" onClick={() => navigate('/post')}>
            + Post a Listing
          </button>
        </div>
      ) : (
        <>
          {/* Other users' listings */}
          {otherListings.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div className="section-title">Available Listings</div>
                  <div className="section-subtitle">{otherListings.length} listing{otherListings.length !== 1 ? 's' : ''} from other co-buyers</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/post')}>
                  + Post Your Listing
                </button>
              </div>
              <div style={gridStyle}>
                {otherListings.map(l => (
                  <ListingCard key={l.id} listing={l} onMatchCreated={() => {}} />
                ))}
              </div>
            </>
          )}

          {/* Your own listings */}
          {myListings.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <div className="section-title">Your Active Listings</div>
              <div className="section-subtitle">Listed as {myListings[0]?.user_name}</div>
              <div style={gridStyle}>
                {myListings.map(l => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Stat({ n, label }) {
  return (
    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 24px' }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{n}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

const heroStyle = {
  background: 'linear-gradient(135deg, #1A6B8A 0%, #0F4A63 100%)',
  borderRadius: 20,
  padding: '40px 40px 32px',
  marginBottom: 24,
  display: 'flex',
  gap: 32,
  alignItems: 'flex-end',
  flexWrap: 'wrap',
}

const statsStyle = {
  display: 'flex',
  gap: 12,
  flexShrink: 0,
  flexWrap: 'wrap',
}

const filterBarStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 24,
  padding: '14px 18px',
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  flexWrap: 'wrap',
}

const tabStyle = {
  padding: '6px 14px',
  borderRadius: 8,
  border: '1.5px solid #E5E7EB',
  background: '#fff',
  fontSize: 13,
  fontWeight: 500,
  color: '#6B7280',
  cursor: 'pointer',
  transition: 'all 0.15s',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}

const tabActiveStyle = {
  background: '#EFF6FF',
  borderColor: '#1A6B8A',
  color: '#1A6B8A',
  fontWeight: 600,
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: 18,
}
