import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Check, Activity, BarChart2, Radio, Map, RefreshCw, Lock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import styles from './Premium.module.css'

const FEATURES = [
  { icon: RefreshCw, title: 'Live data, ~3s delay', desc: 'Faster polling during sessions — closer to real time.' },
  { icon: Activity, title: 'Mini-sector breakdowns', desc: 'Detailed micro-sector times for every lap.' },
  { icon: BarChart2, title: 'Lap charts & stint analysis', desc: 'Full visual analytics tools for every session.' },
  { icon: Activity, title: 'Driver comparison', desc: 'Match any two drivers lap-for-lap under identical conditions.' },
  { icon: Radio, title: 'Team radio', desc: 'Listen to live comms between drivers and their engineers.' },
  { icon: Map, title: 'Track map', desc: 'Live car positions on circuit map during sessions.' },
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
      // Call a Supabase Edge Function that creates a Stripe Checkout session
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: { price_id: import.meta.env.VITE_STRIPE_PRICE_ID, user_id: user.id, user_email: user.email },
      })
      if (fnError) throw fnError
      if (data?.url) window.location.href = data.url
    } catch (e) {
      setError('Could not start checkout. Please try again or contact support.')
    } finally {
      setLoading(false)
    }
  }

  if (isPremium) {
    return (
      <div className="page-wrap" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div className={styles.alreadyPro}>
          <div className={styles.proIcon}><Zap size={32} /></div>
          <h1 className="page-title">You're already Pro!</h1>
          <p className="page-sub">All F1Pulse Pro features are unlocked for your account.</p>
          <Link to="/live" className="btn btn-primary" style={{ marginTop: 8 }}>Open Live Timing</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrap">
      <div className={styles.wrap}>
        {/* Left: features */}
        <div className={styles.left}>
          <div className={styles.badge}><Zap size={14} /> F1Pulse Pro</div>
          <h1 className={styles.title}>Upgrade for the full experience</h1>
          <p className={styles.sub}>Everything a serious F1 fan needs in one place.</p>

          <div className={styles.features}>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className={styles.feature}>
                <div className={styles.featureIcon}><Icon size={18} /></div>
                <div>
                  <div className={styles.featureTitle}>{title}</div>
                  <div className={styles.featureDesc}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: pricing card */}
        <div className={styles.right}>
          <div className={styles.pricingCard}>
            <div className={styles.planName}>Monthly Pro</div>
            <div className={styles.price}>
              <span className={styles.currency}>£</span>
              <span className={styles.amount}>3.99</span>
              <span className={styles.per}>/month</span>
            </div>
            <div className={styles.priceNote}>Cancel anytime. No commitment.</div>

            <ul className={styles.checklist}>
              {['All Pro features', 'Live data with ~3s delay', 'Advanced analytics', 'Team radio', 'Cancel any time'].map(f => (
                <li key={f}><Check size={15} className={styles.checkIcon} /> {f}</li>
              ))}
            </ul>

            {error && <div className={styles.error}>{error}</div>}

            <button
              className={`btn btn-gold ${styles.cta}`}
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Processing...</>
                : <><Zap size={16} /> {user ? 'Subscribe — £3.99/mo' : 'Sign in to Subscribe'}</>}
            </button>

            <div className={styles.secure}><Lock size={12} /> Payments secured by Stripe</div>
          </div>

          <div className={styles.freeNote}>
            <strong>Free tier:</strong> Live timing with 10s refresh, standings, calendar and circuit info.
          </div>
        </div>
      </div>
    </div>
  )
}
