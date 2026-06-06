import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Activity, BarChart2, Calendar, Map, Trophy, Users, Film, Navigation, Menu, X, Zap, LogOut, User, ChevronRight, CheckSquare, UsersRound } from 'lucide-react'
import styles from './Navbar.module.css'

const NAV = [
  { to: '/live',      label: 'Live Timing', icon: Activity },
  { to: '/standings', label: 'Standings',   icon: Trophy },
  { to: '/results',   label: 'Results',     icon: CheckSquare },
  { to: '/drivers',   label: 'Drivers',     icon: UsersRound },
  { to: '/analytics', label: 'Analytics',   icon: BarChart2 },
  { to: '/calendar',  label: 'Calendar',    icon: Calendar },
  { to: '/circuits',  label: 'Circuits',    icon: Map },
  { to: '/teams',     label: 'Teams',       icon: Users },
  { to: '/trackmap',  label: 'Track Map',   icon: Navigation },
  { to: '/replay',    label: 'Replay',      icon: Film },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, isPremium, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.inner}>
          {/* Logo */}
          <Link to="/" className={styles.logo} onClick={() => setMobileOpen(false)}>
            <span className={styles.logoIcon}>⚡</span>
            <span>F1<span className={styles.logoRed}>Pulse</span></span>
          </Link>

          {/* Desktop links */}
          <ul className={styles.links}>
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = pathname === to || (to !== '/' && pathname.startsWith(to))
              return (
                <li key={to}>
                  <Link to={to} className={`${styles.link} ${active ? styles.active : ''}`}>
                    <Icon size={13} strokeWidth={2.2} />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Right side */}
          <div className={styles.right}>
            {!user ? (
              <>
                <Link to="/login" className={`btn btn-ghost btn-sm`}>Sign in</Link>
                <Link to="/premium" className={`btn btn-gold btn-sm`}>
                  <Zap size={12} /> Premium
                </Link>
              </>
            ) : (
              <div className={styles.userWrap}>
                {isPremium && <span className="premium-badge"><Zap size={9} />PRO</span>}
                <button className={styles.userBtn} onClick={() => setUserMenu(v => !v)}>
                  <div className={styles.avatar}><User size={13} /></div>
                </button>
                {userMenu && (
                  <>
                    <div className={styles.dropOverlay} onClick={() => setUserMenu(false)} />
                    <div className={styles.drop}>
                      <div className={styles.dropEmail}>{user.email}</div>
                      <div className={styles.dropDivider} />
                      {!isPremium && (
                        <Link to="/premium" className={styles.dropItem} onClick={() => setUserMenu(false)}>
                          <Zap size={13} /> Upgrade to Pro
                        </Link>
                      )}
                      <button className={styles.dropItem} onClick={() => { signOut(); setUserMenu(false) }}>
                        <LogOut size={13} /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            <button className={styles.burger} onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {/* Active indicator line */}
        <div className={styles.redLine} />
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.dHead}>
              <span className={styles.logo} style={{ fontSize: '1rem' }}>
                <span className={styles.logoIcon}>⚡</span>
                F1<span className={styles.logoRed}>Pulse</span>
              </span>
              <button className={styles.burger} onClick={() => setMobileOpen(false)}><X size={19} /></button>
            </div>
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = pathname === to || (to !== '/' && pathname.startsWith(to))
              return (
                <Link key={to} to={to} className={`${styles.mLink} ${active ? styles.mActive : ''}`} onClick={() => setMobileOpen(false)}>
                  <Icon size={15} /> {label}
                  <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                </Link>
              )
            })}
            <div className={styles.mDiv} />
            <Link to="/premium" className={`${styles.mLink} ${styles.mGold}`} onClick={() => setMobileOpen(false)}>
              <Zap size={15} /> Premium
            </Link>
            {user
              ? <button className={styles.mLink} onClick={() => { signOut(); setMobileOpen(false) }}><LogOut size={15} /> Sign out</button>
              : <Link to="/login" className={styles.mLink} onClick={() => setMobileOpen(false)}><User size={15} /> Sign in</Link>
            }
          </div>
        </div>
      )}
    </>
  )
}
