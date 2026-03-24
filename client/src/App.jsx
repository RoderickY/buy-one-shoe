import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import { api } from './api'
import Navbar from './components/Navbar'
import Browse from './pages/Browse'
import PostListing from './pages/PostListing'
import Matches from './pages/Matches'
import Messages from './pages/Messages'
import Profile from './pages/Profile'

export const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

export default function App() {
  const [users, setUsers] = useState([])
  const [currentUserId, setCurrentUserId] = useState(() => {
    return parseInt(localStorage.getItem('currentUserId') || '1')
  })

  useEffect(() => {
    api.getUsers().then(setUsers)
  }, [])

  const currentUser = users.find(u => u.id === currentUserId) || null

  function switchUser(id) {
    setCurrentUserId(id)
    localStorage.setItem('currentUserId', id)
  }

  return (
    <AppContext.Provider value={{ currentUser, currentUserId, users, switchUser }}>
      <Navbar />
      <Routes>
        <Route path="/"            element={<Browse />} />
        <Route path="/post"        element={<PostListing />} />
        <Route path="/matches"     element={<Matches />} />
        <Route path="/messages/:matchId?" element={<Messages />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </AppContext.Provider>
  )
}
