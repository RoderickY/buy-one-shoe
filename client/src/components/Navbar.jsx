import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { useState } from 'react'

export default function Navbar() {
  const { currentUser, currentUserId, users, switchUser } = useApp()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <div style={styles.logo} onClick={() => navigate('/')}>
          <span style={{ fontSize: 24 }}>👟</span>
          <div>
            <div style={styles.logoText}>Buy One Shoe</div>
            <div style={styles.logoSub}>Co-buy marketplace</div>
          </div>
        </div>

        {/* Nav Links */}
        <div style={styles.links}>
          <NavLink to="/" end style={({ isActive }) => ({
            ...styles.link, ...(isActive ? styles.linkActive : {})
          })}>Browse</NavLink>
          <NavLink to="/post" style={({ isActive }) => ({
            ...styles.link, ...(isActive ? styles.linkActive : {})
          })}>+ Post Listing</NavLink>
          <NavLink to="/matches" style={({ isActive }) => ({
            ...styles.link, ...(isActive ? styles.linkActive : {})
          })}>My Matches</NavLink>
          <NavLink to="/messages" style={({ isActive }) => ({
            ...styles.link, ...(isActive ? styles.linkActive : {})
          })}>Messages</NavLink>
        </div>

        {/* User Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            style={styles.userBtn}
            onClick={() => setShowUserMenu(v => !v)}
          >
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
              {currentUser?.avatar || '?'}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
              {currentUser?.name?.split(' ')[0] || 'Loading…'}
            </span>
            <span style={{ color: '#9CA3AF', fontSize: 12 }}>▾</span>
          </button>

          {showUserMenu && (
            <div style={styles.dropdown}>
              <div style={styles.dropdownHeader}>Demo Users — click to switch</div>
              {users.map(u => (
                <button
                  key={u.id}
                  style={{
                    ...styles.dropdownItem,
                    background: u.id === currentUserId ? '#EFF6FF' : 'transparent',
                  }}
                  onClick={() => { switchUser(u.id); setShowUserMenu(false) }}
                >
                  <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{u.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{u.location}</div>
                  </div>
                  {u.id === currentUserId && <span style={{ marginLeft: 'auto', color: '#1A6B8A', fontSize: 16 }}>✓</span>}
                </button>
              ))}
              <div style={styles.dropdownFooter}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', marginTop: 4, justifyContent: 'center' }}
                  onClick={() => { navigate(`/profile/${currentUserId}`); setShowUserMenu(false) }}
                >
                  View My Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    background: '#fff',
    borderBottom: '1px solid #E5E7EB',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  },
  inner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 20px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    gap: 32,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    cursor: 'pointer', flexShrink: 0,
  },
  logoText: { fontSize: 17, fontWeight: 800, color: '#1A6B8A', lineHeight: 1.1 },
  logoSub:  { fontSize: 10, color: '#9CA3AF', fontWeight: 400 },
  links: {
    display: 'flex', gap: 4, flex: 1,
  },
  link: {
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: '#6B7280',
    transition: 'all 0.15s',
    border: 'none',
    background: 'transparent',
  },
  linkActive: {
    background: '#EFF6FF',
    color: '#1A6B8A',
    fontWeight: 600,
  },
  userBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#F9FAFB',
    border: '1.5px solid #E5E7EB',
    borderRadius: 10,
    padding: '5px 12px 5px 6px',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  dropdown: {
    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
    background: '#fff',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    width: 240,
    overflow: 'hidden',
    zIndex: 200,
  },
  dropdownHeader: {
    padding: '10px 14px 8px',
    fontSize: 11,
    fontWeight: 600,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #F3F4F6',
  },
  dropdownItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '8px 14px',
    border: 'none', cursor: 'pointer',
    transition: 'background 0.1s',
    textAlign: 'left',
  },
  dropdownFooter: { padding: '8px 14px 10px', borderTop: '1px solid #F3F4F6' },
}
