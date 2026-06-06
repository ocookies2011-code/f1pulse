import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Check, X, Activity, BarChart2, Radio, Map, RefreshCw, Gauge, Users, Layers, TrendingUp, Car, Clock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import styles from './Premium.module.css'

const FREE_FEATURES = [
  'Live timing table (POS, DRIVER, TYRE, BEST LAP, GAPS)',
  'Last sector times (S1 / S2 / S3)',
  'Race control messages & flags',
  'Track map (circuit image)',
  'Driver & Team championship standings',
  'Penalties panel',
  '20 second refresh rate',
  'Session replay (select any past session)',
  'Analytics — basic lap chart view',
]

const PRO_FEATURES = [
  { icon: RefreshCw, text: '3–5 second live refresh rate' },
  { icon: Map,       text: 'Live car position dots on track map' },
  { icon: Car,       text: 'Click any driver → live telemetry (speed / RPM / gear / DRS / throttle / brake)' },
  { icon: Activity,  text: 'Mini-sector colour bars (purple / green / yellow)' },
  { icon: TrendingUp,text: 'Personal best sectors (S1pb / S2pb / S3pb)' },
  { icon: Gauge,     text: 'Speed trap readings per driver' },
  { icon: Radio,     text: 'Team radio audio playback' },
  { icon: BarChart2, text: 'Full Analytics suite — potential lap, tyre strategy, head-to-head comparisons' },
  { icon: Layers,    text: 'Session replay with sector breakdowns' },
  { icon: Users,     text: 'Overtakes tracker during races' },
  { icon: Clock,     text: 'Priority support' },
]

export default function Premium() {
  const { user, isPremium } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleCheckout() {
    if (!user) { navigate('/login?redirect=/premium'); return }
    setLoading(true)
    setError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: { price_id: import.meta.env.VITE_STRIPE_PRICE_ID, user_id: user.id, user_email: user.email },
      })
      if (fnError) throw fnError
      if (data?.url) window.location.href = data.url
    } catch {
      setError('Could not start checkout. Please try again or contact support.')
    } finally {
      setLoading(false)
    }
  }

  if (isPremium) {
    return (
      <div className="page" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: 8 }}>You're already Pro!</h1>
        <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>All F1Pulse Pro features are unlocked.</p>
        <Link to="/live" className="btn btn-primary">Open Live Timing →</Link>
      </div>
    )
  }

  return (
    <div className="page">
      <div className={styles.hero}>
        <div className={styles.heroBadge}><Zap size={14} /> F1Pulse Pro</div>
        <h1 className={styles.heroTitle}>The full F1 live timing experience</h1>
        <p className={styles.heroSub}>Everything a serious F1 fan needs — real-time data, deep analytics, and live telemetry.</p>
      </div>

      {/* Comparison table */}
      <div className={styles.compWrap}>
        <div className={styles.compCard}>
          <div className={styles.compHeader}>
            <div className={styles.compPlan}>Free</div>
            <div className={styles.compPrice}>£0<span>/mo</span></div>
          </div>
          <ul className={styles.compList}>
            {FREE_FEATURES.map((f, i) => (
              <li key={i} className={styles.compItem}>
                <Check size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
                <span>{f}</span>
              </li>
            ))}
            <li className={styles.compItem} style={{ opacity: 0.4 }}>
              <X size={13} style={{ flexShrink: 0 }} />
              <span>Live car tracking</span>
            </li>
            <li className={styles.compItem} style={{ opacity: 0.4 }}>
              <X size={13} style={{ flexShrink: 0 }} />
              <span>Driver telemetry modal</span>
            </li>
            <li className={styles.compItem} style={{ opacity: 0.4 }}>
              <X size={13} style={{ flexShrink: 0 }} />
              <span>Team radio</span>
            </li>
          </ul>
          <Link to="/live" className={styles.freeBtn}>Start with Free</Link>
        </div>

        <div className={`${styles.compCard} ${styles.proCard}`}>
          <div className={styles.proRibbon}><Zap size={11} /> BEST VALUE</div>
          <div className={styles.compHeader}>
            <div className={styles.compPlan} style={{ color: 'var(--gold)' }}>Pro</div>
            <div className={styles.compPrice}>£3.99<span>/mo</span></div>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginBottom: 16 }}>
            Everything in Free, plus:
          </p>
          <ul className={styles.compList}>
            {PRO_FEATURES.map(({ icon: Icon, text }, i) => (
              <li key={i} className={styles.compItem}>
                <Icon size={13} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          {error && <p style={{ color: 'var(--red)', fontSize: '0.8rem', marginBottom: 8 }}>{error}</p>}
          <button onClick={handleCheckout} className={styles.proBtn} disabled={loading}>
            {loading ? 'Redirecting…' : <><Zap size={14} /> Upgrade to Pro — £3.99/mo</>}
          </button>
          {!user && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', textAlign: 'center', marginTop: 8 }}>
              <Link to="/login?redirect=/premium" style={{ color: 'var(--gold)' }}>Sign in</Link> or <Link to="/signup" style={{ color: 'var(--gold)' }}>create account</Link> first
            </p>
          )}
        </div>
      </div>

      {/* Feature highlight cards */}
      <div className={styles.highlights}>
        <div className={styles.highlightCard}>
          <Map size={22} style={{ color: '#3671C6', marginBottom: 8 }} />
          <h3>Live Car Tracking</h3>
          <p>See every car's position update in real-time on the circuit map at 3.7Hz. Know exactly who's where at Eau Rouge or through the Swimming Pool.</p>
        </div>
        <div className={styles.highlightCard}>
          <Car size={22} style={{ color: '#e10600', marginBottom: 8 }} />
          <h3>Driver Telemetry</h3>
          <p>Click any driver to open their live telemetry — speed (km/h), RPM, gear selection, DRS status, throttle % and brake inputs. Updated every 2 seconds.</p>
        </div>
        <div className={styles.highlightCard}>
          <RefreshCw size={22} style={{ color: '#FF8000', marginBottom: 8 }} />
          <h3>3-Second Refresh</h3>
          <p>Free users get 20-second updates. Pro users get 3–5 second refresh on timing data and 2-second position updates — close to what the pit wall sees.</p>
        </div>
        <div className={styles.highlightCard}>
          <BarChart2 size={22} style={{ color: '#b45cf4', marginBottom: 8 }} />
          <h3>Deep Analytics</h3>
          <p>Lap time charts, theoretical best lap (S1+S2+S3), tyre stint visualisation, and head-to-head driver comparisons for any session since 2023.</p>
        </div>
      </div>
    </div>
  )
}
