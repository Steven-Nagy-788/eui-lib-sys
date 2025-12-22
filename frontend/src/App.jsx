"use client"

import { useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import PatronBooksPage from "./pages/PatronBooksPage"
import PatronBookbagPage from "./pages/PatronBookbagPage"
import PatronNoticesPage from "./pages/PatronNoticesPage"
import PatronProfilePage from "./pages/PatronProfilePage"
import AdminBooksPage from "./pages/AdminBooksPage"
import AdminPatronsPage from "./pages/AdminPatronsPage"
import AdminCirculationPage from "./pages/AdminCirculationPage"
import AdminRequestsPage from "./pages/AdminRequestsPage"
import AdminDatabasePage from "./pages/AdminDatabasePage"
import AdminProfilePage from "./pages/AdminProfilePage"
import PatronLayout from "./components/PatronLayout"
import AdminLayout from "./components/AdminLayout"

function App() {
  const [currentUser, setCurrentUser] = useState(null)

  const handleLogin = (user) => {
    setCurrentUser(user)
  }

  const handleLogout = () => {
    setCurrentUser(null)
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            currentUser ? (
              <Navigate to={currentUser.role === "admin" ? "/admin/books" : "/patron/books"} replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />

        {/* Patron Routes */}
        <Route
          path="/patron/*"
          element={
            currentUser && currentUser.role === "patron" ? (
              <PatronLayout user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        >
          <Route path="books" element={<PatronBooksPage user={currentUser} />} />
          <Route path="bookbag" element={<PatronBookbagPage user={currentUser} />} />
          <Route path="notices" element={<PatronNoticesPage user={currentUser} />} />
          <Route path="profile" element={<PatronProfilePage user={currentUser} />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            currentUser && currentUser.role === "admin" ? (
              <AdminLayout user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        >
          <Route path="books" element={<AdminBooksPage />} />
          <Route path="patrons" element={<AdminPatronsPage />} />
          <Route path="circulation" element={<AdminCirculationPage />} />
          <Route path="requests" element={<AdminRequestsPage />} />
          <Route path="database" element={<AdminDatabasePage />} />
          <Route path="profile" element={<AdminProfilePage user={currentUser} />} />
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
