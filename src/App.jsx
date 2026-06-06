import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import LiveTiming from './pages/LiveTiming'
import Standings from './pages/Standings'
import Analytics from './pages/Analytics'
import Calendar from './pages/Calendar'
import { CircuitsList, CircuitProfile } from './pages/Circuits'
import { TeamsList, TeamProfile } from './pages/Teams'
import Premium from './pages/Premium'
import Auth from './pages/Auth'
import Replay from './pages/Replay'
import TrackMap from './pages/TrackMap'
import Results from './pages/Results'
import Drivers from './pages/Drivers'
import './styles/global.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/live"          element={<LiveTiming />} />
          <Route path="/standings"     element={<Standings />} />
          <Route path="/analytics"     element={<Analytics />} />
          <Route path="/calendar"      element={<Calendar />} />
          <Route path="/circuits"      element={<CircuitsList />} />
          <Route path="/circuits/:slug" element={<CircuitProfile />} />
          <Route path="/teams"         element={<TeamsList />} />
          <Route path="/teams/:name"   element={<TeamProfile />} />
          <Route path="/trackmap"      element={<TrackMap />} />
          <Route path="/replay"        element={<Replay />} />
          <Route path="/results"       element={<Results />} />
          <Route path="/drivers"       element={<Drivers />} />
          <Route path="/premium"       element={<Premium />} />
          <Route path="/login"         element={<Auth />} />
          <Route path="/signup"        element={<Auth />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
