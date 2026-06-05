import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Activity, BarChart2, Calendar, Map, Trophy, Menu, X, Zap, LogOut, User } from 'lucide-react'
import styles from './Navbar.module.css'

const NAV = [
  { to: '/live', label: 'Live Timing', icon: Activity },
  { to: '/standings', label: 'Standings', icon: Trophy },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/circuits', label: 'Circuits', icon: Map },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, isPremium, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <span className={styles.logoText}>F1<span className={styles.logoAccent}>Pulse</span></span>
        </Link>

        <ul className={styles.links}>
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link to={to} className={`${styles.link} ${pathname.startsWith(to) ? styles.active : ''}`}>
                <Icon size={14} />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.right}>
          {!user ? (
            <>
              <Link to="/login" className="btn btn-ghost" style={{ padding: '7px 16px', fontSize: '0.85rem' }}>Sign in</Link>
              <Link to="/premium" className="btn btn-gold" style={{ padding: '7px 16px', fontSize: '0.85rem' }}>
                <Zap size={13} /> Premium
              </Link>
            </>
          ) : (
            <div className={styles.userWrap}>
              {isPremium && <span className="premium-badge"><Zap size={10} /> PRO</span>}
              <button className={styles.userBtn} onClick={() => setUserMenu(v => !v)}>
                <User size={16} />
              </button>
              {userMenu && (
                <div className={styles.userDrop}>
                  <div className={styles.userEmail}>{user.email}</div>
                  {!isPremium && <Link to="/premium" className={styles.dropItem} onClick={() => setUserMenu(false)}><Zap size={14} /> Upgrade to Pro</Link>}
                  <button className={styles.dropItem} onClick={() => { signOut(); setUserMenu(false) }}><LogOut size={14} /> Sign out</button>
                </div>
              )}
            </div>
          )}
          <button className={styles.burger} onClick={() => setOpen(v => !v)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className={styles.mobile}>
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={styles.mobileLink} onClick={() => setOpen(false)}>
              <Icon size={16} /> {label}
            </Link>
          ))}
          {!user
            ? <Link to="/login" className={styles.mobileLink} onClick={() => setOpen(false)}>Sign in</Link>
            : <button className={styles.mobileLink} onClick={() => { signOut(); setOpen(false) }}>Sign out</button>
          }
        </div>
      )}
    </nav>
  )
}
