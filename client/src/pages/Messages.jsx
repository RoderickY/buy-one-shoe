import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useApp } from '../App'

const CATEGORY_EMOJI = { shoes: '👟', gloves: '🧤', earrings: '💍', socks: '🧦', contacts: '👁️' }

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   bg: '#FEF3C7', color: '#92400E' },
  accepted:  { label: 'Active',    bg: '#D1FAE5', color: '#065F46' },
  completed: { label: 'Completed', bg: '#E5E7EB', color: '#374151' },
}

export default function Messages() {
  const { matchId } = useParams()
  const { currentUserId } = useApp()
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [reviewSent, setReviewSent] = useState(false)
  const bottomRef = useRef(null)
  const pollRef = useRef(null)

  const activeMatchId = matchId ? parseInt(matchId) : null
  const activeMatch = matches.find(m => m.id === activeMatchId)
  const isUser1 = activeMatch?.user_id_1 === currentUserId

  // Load matches list
  useEffect(() => {
    if (!currentUserId) return
    api.getMatches(currentUserId).then(setMatches)
  }, [currentUserId])

  // Navigate to first match if no matchId
  useEffect(() => {
    if (!matchId && matches.length > 0) {
      navigate(`/messages/${matches[0].id}`, { replace: true })
    }
  }, [matchId, matches, navigate])

  // Load messages for active match
  const loadMessages = useCallback(async () => {
    if (!activeMatchId) return
    const msgs = await api.getMessages(activeMatchId)
    setMessages(msgs)
  }, [activeMatchId])

  useEffect(() => {
    if (!activeMatchId) return
    setLoadingMsgs(true)
    loadMessages().finally(() => setLoadingMsgs(false))

    // Poll for new messages every 3 seconds
    pollRef.current = setInterval(loadMessages, 3000)
    return () => clearInterval(pollRef.current)
  }, [activeMatchId, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e) {
    e.preventDefault()
    if (!text.trim() || !activeMatchId || sending) return
    setSending(true)
    const t = text.trim()
    setText('')
    try {
      const msg = await api.sendMessage(activeMatchId, { sender_id: currentUserId, content: t })
      setMessages(prev => [...prev, msg])
      // Refresh match status
      const updated = await api.getMatches(currentUserId)
      setMatches(updated)
    } catch (err) {
      setText(t)
    } finally {
      setSending(false)
    }
  }

  async function submitReview() {
    if (!activeMatch || reviewSent) return
    const partnerId = isUser1 ? activeMatch.user_id_2 : activeMatch.user_id_1
    await api.createReview({ reviewer_id: currentUserId, reviewed_id: partnerId, match_id: activeMatchId, rating, comment: reviewText })
    setReviewSent(true)
    setShowReview(false)
  }

  const partner = activeMatch
    ? isUser1
      ? { name: activeMatch.user2_name, avatar: activeMatch.user2_avatar, location: activeMatch.user2_location, id: activeMatch.user_id_2 }
      : { name: activeMatch.user1_name, avatar: activeMatch.user1_avatar, location: activeMatch.user1_location, id: activeMatch.user_id_1 }
    : null

  return (
    <div style={layoutStyle}>
      {/* ── Left: Match List ── */}
      <div style={sidebarStyle}>
        <div style={sidebarHeader}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Messages</div>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{matches.length} conversation{matches.length !== 1 ? 's' : ''}</span>
        </div>

        {matches.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
            No conversations yet.<br />
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/')}>Browse Listings</button>
          </div>
        ) : (
          matches.map(m => {
            const isMine = m.user_id_1 === currentUserId
            const pName = isMine ? m.user2_name : m.user1_name
            const pAvatar = isMine ? m.user2_avatar : m.user1_avatar
            const item = m.l1_brand + ' ' + (m.l1_model || '')
            const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.pending
            const emoji = CATEGORY_EMOJI[m.category] || '📦'

            return (
              <button
                key={m.id}
                style={{
                  ...matchItemStyle,
                  ...(m.id === activeMatchId ? matchItemActiveStyle : {}),
                }}
                onClick={() => navigate(`/messages/${m.id}`)}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div className="avatar" style={{ width: 40, height: 40, fontSize: 14 }}>{pAvatar || '?'}</div>
                  <div style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 14, lineHeight: 1 }}>{emoji}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pName}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: cfg.bg, color: cfg.color, flexShrink: 0, marginLeft: 4 }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {emoji} {item.trim() || 'Co-buy item'}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* ── Right: Chat ── */}
      <div style={chatAreaStyle}>
        {!activeMatch ? (
          <div className="empty-state" style={{ flex: 1 }}>
            <div className="emoji">💬</div>
            <h3>Select a conversation</h3>
            <p>Choose a match from the left to start chatting.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div style={chatHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <div className="avatar avatar-lg" style={{ width: 44, height: 44, fontSize: 16 }}>{partner?.avatar}</div>
                  <div style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 18, lineHeight: 1 }}>
                    {CATEGORY_EMOJI[activeMatch.category]}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{partner?.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    {activeMatch.l1_brand} {activeMatch.l1_model} ·{' '}
                    <span style={{ color: '#1A6B8A', fontWeight: 600 }}>
                      {isUser1 ? activeMatch.l1_side : activeMatch.l2_side} + {isUser1 ? activeMatch.l2_side : activeMatch.l1_side} = Full Pair ✓
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {activeMatch.status === 'completed' && !reviewSent && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowReview(v => !v)}>⭐ Leave Review</button>
                )}
                {reviewSent && <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>✓ Review sent!</span>}
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/profile/${partner?.id}`)}>
                  View Profile
                </button>
              </div>
            </div>

            {/* Review Panel */}
            {showReview && (
              <div style={{ padding: '16px 20px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>⭐ Leave a Review for {partner?.name}</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setRating(n)} style={{ fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', opacity: n <= rating ? 1 : 0.3 }}>⭐</button>
                  ))}
                </div>
                <textarea className="form-input" rows={2} placeholder="How was the experience?" value={reviewText} onChange={e => setReviewText(e.target.value)} style={{ marginBottom: 10 }} />
                <button className="btn btn-primary btn-sm" onClick={submitReview}>Submit Review</button>
              </div>
            )}

            {/* Co-buy Context Banner */}
            <div style={contextBanner}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: '#374151' }}>
                  <strong>Co-buying:</strong> {activeMatch.l1_brand} {activeMatch.l1_model || ''} ·{' '}
                  Full pair {activeMatch.l1_price ? `$${activeMatch.l1_price}` : ''} → <strong style={{ color: '#1A6B8A' }}>
                    {activeMatch.l1_price ? `$${(activeMatch.l1_price/2).toFixed(0)} each` : 'split cost'}
                  </strong>
                </span>
                {(() => {
                  const cfg = STATUS_CONFIG[activeMatch.status] || STATUS_CONFIG.pending
                  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                })()}
              </div>
            </div>

            {/* Messages */}
            <div style={messagesStyle}>
              {loadingMsgs && messages.length === 0 ? (
                <div className="loading">Loading messages…</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 20px', fontSize: 14 }}>
                  No messages yet. Say hi to {partner?.name}! 👋
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => {
                    const isMine = msg.sender_id === currentUserId
                    const showAvatar = !isMine && (i === 0 || messages[i-1]?.sender_id !== msg.sender_id)
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 8, gap: 8, alignItems: 'flex-end' }}>
                        {!isMine && (
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, visibility: showAvatar ? 'visible' : 'hidden', flexShrink: 0 }}>
                            {msg.sender_avatar}
                          </div>
                        )}
                        <div style={{
                          maxWidth: '65%', padding: '10px 14px',
                          borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: isMine ? '#1A6B8A' : '#F3F4F6',
                          color: isMine ? '#fff' : '#111827',
                          fontSize: 14, lineHeight: 1.5,
                          wordBreak: 'break-word',
                        }}>
                          {msg.content}
                          <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6, textAlign: isMine ? 'right' : 'left' }}>
                            {new Date(msg.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Input */}
            <form onSubmit={send} style={inputAreaStyle}>
              <input
                className="form-input"
                style={{ flex: 1, borderRadius: 24, paddingLeft: 18 }}
                placeholder={`Message ${partner?.name}…`}
                value={text}
                onChange={e => setText(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ borderRadius: 24, paddingLeft: 20, paddingRight: 20 }}
                disabled={!text.trim() || sending}
              >
                {sending ? '…' : '➤'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

const layoutStyle = {
  display: 'flex',
  height: 'calc(100vh - 64px)',
  maxWidth: 1100,
  margin: '0 auto',
  padding: '20px 20px 0',
  gap: 0,
}
const sidebarStyle = {
  width: 300,
  flexShrink: 0,
  background: '#fff',
  borderRadius: '16px 0 0 0',
  border: '1px solid #E5E7EB',
  borderRight: 'none',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
}
const sidebarHeader = {
  padding: '16px 16px 12px',
  borderBottom: '1px solid #F3F4F6',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  position: 'sticky', top: 0, background: '#fff', zIndex: 1,
}
const matchItemStyle = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '12px 14px', width: '100%',
  background: 'transparent', border: 'none',
  cursor: 'pointer', transition: 'background 0.1s',
  textAlign: 'left',
  borderBottom: '1px solid #F9FAFB',
}
const matchItemActiveStyle = { background: '#EFF6FF' }
const chatAreaStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  background: '#fff',
  borderRadius: '0 16px 0 0',
  border: '1px solid #E5E7EB',
  overflow: 'hidden',
}
const chatHeaderStyle = {
  padding: '14px 20px',
  borderBottom: '1px solid #E5E7EB',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
}
const contextBanner = {
  padding: '10px 20px',
  background: '#F0F9FF',
  borderBottom: '1px solid #BAE6FD',
}
const messagesStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px 20px',
  display: 'flex',
  flexDirection: 'column',
}
const inputAreaStyle = {
  padding: '12px 16px',
  borderTop: '1px solid #E5E7EB',
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  background: '#fff',
}
