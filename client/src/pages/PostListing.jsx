import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useApp } from '../App'

const CATEGORIES = ['shoes', 'gloves', 'earrings', 'socks', 'contacts']
const SIDES = ['left', 'right']
const CONDITIONS = ['new', 'like-new', 'good', 'fair']
const CATEGORY_EMOJI = { shoes: '👟', gloves: '🧤', earrings: '💍', socks: '🧦', contacts: '👁️' }

const SHOE_SIZES  = ['5','5.5','6','6.5','7','7.5','8','8.5','9','9.5','10','10.5','11','11.5','12','12.5','13','14']
const GLOVE_SIZES = ['XS','S','M','L','XL','XXL']
const SOCK_SIZES  = ['XS','S','M','L','XL']

function getSizes(cat) {
  if (cat === 'shoes')    return SHOE_SIZES
  if (cat === 'gloves')   return GLOVE_SIZES
  if (cat === 'socks')    return SOCK_SIZES
  if (cat === 'earrings') return ['one-size']
  if (cat === 'contacts') return ['-8.00','-7.50','-7.00','-6.50','-6.00','-5.50','-5.00','-4.50','-4.00','-3.50','-3.00','-2.50','-2.00','-1.50','-1.00','-0.50','0.00','+0.50','+1.00','+1.50','+2.00','+2.50','+3.00']
  return []
}

export default function PostListing() {
  const { currentUserId, currentUser } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [form, setForm] = useState({
    category: '', brand: '', model: '', size: '', side: '',
    color: '', condition: 'good', price: '', location: '', description: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const sizes = getSizes(form.category)

  async function submit() {
    setLoading(true)
    try {
      const res = await api.createListing({ ...form, user_id: currentUserId, price: parseFloat(form.price) || null })
      setResult(res)
      setStep(4)
    } catch (err) {
      alert('Failed to post listing: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const canNext1 = !!form.category
  const canNext2 = form.brand && form.size && form.side
  const canNext3 = !!form.location

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Post a Listing</h1>
        <p style={{ color: '#6B7280', fontSize: 15 }}>Tell us what you have, and what you need. We'll find your match.</p>
      </div>

      {/* Progress */}
      {step < 4 && (
        <div style={progressStyle}>
          {['Category', 'Item Details', 'Listing Info'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                ...stepDot,
                background: step > i + 1 ? '#10B981' : step === i + 1 ? '#1A6B8A' : '#E5E7EB',
                color: step >= i + 1 ? '#fff' : '#9CA3AF',
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? '#111827' : '#9CA3AF' }}>
                {label}
              </span>
              {i < 2 && <div style={{ flex: 1, height: 1, background: step > i + 1 ? '#10B981' : '#E5E7EB', minWidth: 20 }} />}
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 28 }}>

        {/* ── Step 1: Category ── */}
        {step === 1 && (
          <div>
            <h2 style={stepTitle}>What are you listing?</h2>
            <p style={stepSub}>Choose the category that best describes your item.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  style={{
                    ...catBtn,
                    ...(form.category === cat ? catBtnActive : {}),
                  }}
                  onClick={() => set('category', cat)}
                >
                  <span style={{ fontSize: 32 }}>{CATEGORY_EMOJI[cat]}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, textTransform: 'capitalize' }}>{cat}</span>
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={!canNext1} onClick={() => setStep(2)}>
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 2: Item Details ── */}
        {step === 2 && (
          <div>
            <h2 style={stepTitle}>
              {CATEGORY_EMOJI[form.category]} {form.category.charAt(0).toUpperCase() + form.category.slice(1)} Details
            </h2>
            <p style={stepSub}>Be specific so your co-buyer can find you easily.</p>
            <div style={formGrid}>
              <div className="form-group">
                <label className="form-label">Brand *</label>
                <input className="form-input" placeholder="e.g. Nike, Adidas, The North Face" value={form.brand} onChange={e => set('brand', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Model / Style</label>
                <input className="form-input" placeholder="e.g. Air Max 270, Ultra Boost" value={form.model} onChange={e => set('model', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Which side do you have? *</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {SIDES.map(s => (
                    <button
                      key={s}
                      style={{
                        ...sideBtn,
                        ...(form.side === s ? sideBtnActive : {}),
                      }}
                      onClick={() => set('side', s)}
                    >
                      {s === 'left' ? '← Left' : 'Right →'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Size *</label>
                {sizes.length === 1 ? (
                  <input className="form-input" value="One Size" readOnly style={{ background: '#F9FAFB', cursor: 'not-allowed' }} onChange={() => set('size', 'one-size')} />
                ) : (
                  <select className="form-input" value={form.size} onChange={e => set('size', e.target.value)}>
                    <option value="">Select size</option>
                    {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>
              {sizes.length === 1 && form.category === 'earrings' && !form.size && set('size', 'one-size')}
              <div className="form-group">
                <label className="form-label">Color</label>
                <input className="form-input" placeholder="e.g. Black, White/Blue" value={form.color} onChange={e => set('color', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Condition</label>
                <select className="form-input" value={form.condition} onChange={e => set('condition', e.target.value)}>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-secondary btn-lg" style={{ justifyContent: 'center' }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: 'center' }} disabled={!canNext2} onClick={() => setStep(3)}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Listing Info ── */}
        {step === 3 && (
          <div>
            <h2 style={stepTitle}>Listing Details</h2>
            <p style={stepSub}>A great description and fair price help you match faster.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div className="form-group">
                <label className="form-label">Full pair price ($) — your co-buyer pays half</label>
                <input className="form-input" type="number" placeholder="e.g. 150" value={form.price} onChange={e => set('price', e.target.value)} />
                {form.price && <div style={{ fontSize: 12, color: '#1A6B8A', marginTop: 4 }}>Each person pays ~${(parseFloat(form.price)/2).toFixed(0)}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Your location *</label>
                <input className="form-input" placeholder="e.g. San Francisco, CA" value={form.location} onChange={e => set('location', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" placeholder="Tell your co-buyer more: why you only need one, what you're looking for, condition details…" rows={4} value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
            </div>

            {/* Preview */}
            <div style={previewStyle}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preview</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ fontSize: 32 }}>{CATEGORY_EMOJI[form.category]}</div>
                <div>
                  <div style={{ fontWeight: 700, color: '#111827' }}>{form.brand} {form.model}</div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>
                    {form.side === 'left' ? '← Left' : 'Right →'} · Size {form.size} · {form.color} · {form.condition}
                  </div>
                  {form.price && <div style={{ fontSize: 13, color: '#1A6B8A', fontWeight: 600, marginTop: 2 }}>${(form.price/2).toFixed(0)} / person</div>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary btn-lg" style={{ justifyContent: 'center' }} onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: 'center' }} disabled={!canNext3 || loading} onClick={submit}>
                {loading ? '⏳ Posting…' : '🚀 Post Listing'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Success ── */}
        {step === 4 && result && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Listing Posted!</h2>
            <p style={{ color: '#6B7280', marginBottom: 24, fontSize: 15 }}>
              Your {form.category} listing is live. We'll notify you when a co-buyer reaches out.
            </p>

            {result.potentialMatches?.length > 0 ? (
              <div style={{ marginBottom: 24 }}>
                <div style={{ padding: '14px 18px', background: '#D1FAE5', borderRadius: 12, marginBottom: 16, color: '#065F46', fontWeight: 600, fontSize: 15 }}>
                  🔥 {result.potentialMatches.length} potential match{result.potentialMatches.length > 1 ? 'es' : ''} already exist!
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.potentialMatches.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#F9FAFB', borderRadius: 10, textAlign: 'left' }}>
                      <div className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>{m.user_avatar}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{m.user_name}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>
                          {m.brand} {m.model} · {m.side === 'left' ? '← Left' : 'Right →'} · Size {m.size}
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
                        onClick={async () => {
                          const match = await api.createMatch({
                            listing_id_1: result.id,
                            listing_id_2: m.id,
                            user_id_1: currentUserId,
                            user_id_2: m.user_id,
                          })
                          navigate(`/messages/${match.id}`)
                        }}
                      >
                        Connect →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '14px 18px', background: '#EFF6FF', borderRadius: 12, marginBottom: 20, color: '#1E40AF', fontSize: 14 }}>
                No matches yet — we'll notify you as soon as one comes in! 🔔
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/')}>Browse Listings</button>
              <button className="btn btn-primary" onClick={() => { setStep(1); setForm({ category: '', brand: '', model: '', size: '', side: '', color: '', condition: 'good', price: '', location: '', description: '' }); setResult(null) }}>
                + Post Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const stepTitle = { fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 6 }
const stepSub = { fontSize: 14, color: '#6B7280', marginBottom: 20 }

const progressStyle = {
  display: 'flex', alignItems: 'center', gap: 4,
  marginBottom: 20, padding: '0 4px',
}
const stepDot = {
  width: 28, height: 28, borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 12, fontWeight: 700, flexShrink: 0,
}

const formGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }

const catBtn = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
  padding: '20px 16px', borderRadius: 12,
  border: '2px solid #E5E7EB', background: '#F9FAFB',
  cursor: 'pointer', transition: 'all 0.15s',
}
const catBtnActive = { borderColor: '#1A6B8A', background: '#EFF6FF' }

const sideBtn = {
  flex: 1, padding: '10px', borderRadius: 8,
  border: '2px solid #E5E7EB', background: '#F9FAFB',
  fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
}
const sideBtnActive = { borderColor: '#1A6B8A', background: '#EFF6FF', color: '#1A6B8A' }

const previewStyle = {
  background: '#F9FAFB', borderRadius: 10, padding: '14px 16px', marginBottom: 20,
  border: '1px solid #E5E7EB',
}
