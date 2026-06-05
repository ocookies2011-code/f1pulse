import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Activity, BarChart2, Calendar, Map, Trophy, Menu, X, Zap, LogOut, ChevronDown, SkipBack } from 'lucide-react'
import styles from './Navbar.module.css'

const NAV = [
  { to:'/live',      label:'Live Timing', icon:Activity },
  { to:'/standings', label:'Standings',   icon:Trophy },
  { to:'/analytics', label:'Analytics',   icon:BarChart2 },
  { to:'/calendar',  label:'Calendar',    icon:Calendar },
  { to:'/circuits',  label:'Circuits',    icon:Map },
  { to:'/replay',    label:'Replay',      icon:SkipBack, premiumOnly:true },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, profile, isPremium, signOut } = useAuth()
  const [mob, setMob] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setUserOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  useEffect(() => setMob(false), [pathname])

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.inner}>
          <Link to="/" className={styles.logo}>
            <span className={styles.bolt}>⚡</span>
            <span>F1<span className={styles.acc}>Pulse</span></span>
          </Link>
          <ul className={styles.links}>
            {NAV.map(({ to, label, icon: Icon, premiumOnly }) => (
              <li key={to}>
                <Link to={to} className={`${styles.link} ${pathname.startsWith(to) ? styles.active : ''} ${premiumOnly ? styles.premiumLink : ''}`}>
                  <Icon size={12} strokeWidth={2.2} /> {label}
                  {premiumOnly && <span className={styles.proTag}>PRO</span>}
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.right}>
            {!user ? (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
                <Link to="/premium" className="btn btn-gold btn-sm"><Zap size={11} /> Premium</Link>
              </>
            ) : (
              <div ref={ref} className={styles.userWrap}>
                {isPremium && <span className="premium-badge"><Zap size={9}/> PRO</span>}
                <button className={styles.userBtn} onClick={() => setUserOpen(v=>!v)}>
                  <div className={styles.avatar}>{(profile?.full_name || user.email || 'U')[0].toUpperCase()}</div>
                  <ChevronDown size={12} style={{ transform: userOpen ? 'rotate(180deg)' : '', transition: 'transform .15s' }} />
                </button>
                {userOpen && (
                  <div className={styles.drop}>
                    <div className={styles.dropEmail}>{user.email}</div>
                    <div className={styles.dropDivider} />
                    {!isPremium && <Link to="/premium" className={styles.dropItem} onClick={()=>setUserOpen(false)}><Zap size={12}/> Upgrade to Pro</Link>}
                    <button className={styles.dropItem} onClick={()=>{signOut();setUserOpen(false)}}><LogOut size={12}/> Sign out</button>
                  </div>
                )}
              </div>
            )}
            <button className={styles.burger} onClick={()=>setMob(v=>!v)}>{mob?<X size={18}/>:<Menu size={18}/>}</button>
          </div>
        </div>
        <div className={styles.redLine}/>
      </nav>
      {mob && (
        <div className={styles.overlay} onClick={()=>setMob(false)}>
          <div className={styles.drawer} onClick={e=>e.stopPropagation()}>
            <div className={styles.dHead}>
              <span className={styles.logo}><span className={styles.bolt}>⚡</span><span>F1<span className={styles.acc}>Pulse</span></span></span>
              <button onClick={()=>setMob(false)} style={{color:'var(--text-2)'}}><X size={18}/></button>
            </div>
            {NAV.map(({to,label,icon:Icon})=>(
              <Link key={to} to={to} className={`${styles.mLink} ${pathname.startsWith(to)?styles.mActive:''}`}>
                <Icon size={15}/> {label}
              </Link>
            ))}
            <div className={styles.mDiv}/>
            {!user ? (
              <><Link to="/login" className={styles.mLink}>Sign in</Link>
              <Link to="/premium" className={`${styles.mLink} ${styles.mGold}`}><Zap size={14}/> Get Premium</Link></>
            ) : (
              <><div className={styles.mEmail}>{user.email}</div>
              {!isPremium && <Link to="/premium" className={`${styles.mLink} ${styles.mGold}`}><Zap size={14}/> Upgrade</Link>}
              <button className={styles.mLink} onClick={()=>{signOut();setMob(false)}}><LogOut size={14}/> Sign out</button></>
            )}
          </div>
        </div>
      )}
    </>
  )
}
