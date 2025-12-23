import { useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { getUserFromToken, logout, isPatronRole, getRedirectPath } from "./utils/auth"
import LoginPage from "./pages/LoginPage"
import BooksPage from "./pages/BooksPage"
import ProfilePage from "./pages/ProfilePage"
import PatronBookbagPage from "./pages/PatronBookbagPage"
import PatronNoticesPage from "./pages/PatronNoticesPage"
import AdminPatronsPage from "./pages/AdminPatronsPage"
import AdminCirculationPage from "./pages/AdminCirculationPage"
import AdminRequestsPage from "./pages/AdminRequestsPage"
import AdminCatalogingPage from "./pages/AdminCatalogingPage"
import AdminReportsPage from "./pages/AdminReportsPage"
import Layout from "./components/Layout"

// Create a client with caching config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      cacheTime: 10 * 60 * 1000, // 10 minutes - cache retention
      refetchOnWindowFocus: false, // Don't refetch on tab switch
      retry: 1, // Only retry once on failure
    },
  },
})

function App() {
  const [currentUser, setCurrentUser] = useState(() => getUserFromToken())

  const handleLogin = () => {
    const user = getUserFromToken()
    setCurrentUser(user)
  }

  const handleLogout = () => {
    logout()
    setCurrentUser(null)
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
        <Route
          path="/"
          element={
            currentUser ? (
              <Navigate to={getRedirectPath(currentUser.role)} replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        
        {/* Patron Routes */}
        <Route
          path="/patron/*"
          element={
            currentUser && isPatronRole(currentUser.role) ? (
              <Layout user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        >
          <Route path="books" element={<BooksPage user={currentUser} />} />
          <Route path="bookbag" element={<PatronBookbagPage user={currentUser} />} />
          <Route path="notices" element={<PatronNoticesPage user={currentUser} />} />
          <Route path="profile" element={<ProfilePage user={currentUser} />} />
        </Route>
        
        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            currentUser && currentUser.role === "admin" ? (
              <Layout user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        >
          <Route path="books" element={<BooksPage user={currentUser} />} />
          <Route path="patrons" element={<AdminPatronsPage />} />
          <Route path="circulation" element={<AdminCirculationPage />} />
          <Route path="requests" element={<AdminRequestsPage />} />
          <Route path="cataloging" element={<AdminCatalogingPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="profile" element={<ProfilePage user={currentUser} />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
