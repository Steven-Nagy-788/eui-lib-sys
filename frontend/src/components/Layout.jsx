import { useState, useEffect } from "react"
import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { isPatronRole } from "../utils/auth"
import { getCurrentUserProfile } from "../api/authService"
import "../assets/Responsive.css"

function Layout({ user, onLogout }) {
  const navigate = useNavigate()
  const [userName, setUserName] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const isPatron = user && isPatronRole(user.role)
  const baseRoute = isPatron ? '/patron' : '/admin'
  
  // Fetch user name for display in header
  useEffect(() => {
    const loadUserName = async () => {
      try {
        const profile = await getCurrentUserProfile()
        setUserName(profile.full_name || profile.email)
      } catch {
        // Silently fail - will show "User" as fallback
        setUserName(null)
      }
    }
    
    if (user) {
      loadUserName()
    }
  }, [user])
  
  // Role-specific navigation items
  const navItems = isPatron ? [
    { path: `${baseRoute}/books`, label: 'Books', icon: 'books' },
    { path: `${baseRoute}/bookbag`, label: 'Bookbag', icon: 'bag' },
    { path: `${baseRoute}/notices`, label: 'Notices', icon: 'bell' },
    { path: `${baseRoute}/profile`, label: 'Profile', icon: 'user' }
  ] : [
    { path: `${baseRoute}/books`, label: 'Books', icon: 'books' },
    { path: `${baseRoute}/patrons`, label: 'Patrons', icon: 'users' },
    { path: `${baseRoute}/circulation`, label: 'Circulation', icon: 'cycle' },
    { path: `${baseRoute}/requests`, label: 'Requests', icon: 'clipboard' },
    { path: `${baseRoute}/cataloging`, label: 'Cataloging', icon: 'plus' },
    { path: `${baseRoute}/reports`, label: 'Reports', icon: 'chart' },
    { path: `${baseRoute}/config`, label: 'Configuration', icon: 'settings' },
    { path: `${baseRoute}/profile`, label: 'Profile', icon: 'user' }
  ]

  const handleProfileClick = () => {
    navigate(`${baseRoute}/profile`)
  }

  const getIcon = (iconName) => {
    const icons = {
      books: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      ),
      bag: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      ),
      bell: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      ),
      users: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      ),
      cycle: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      ),
      clipboard: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      ),
      database: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      ),
      plus: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 4v16m8-8H4" />
      ),
      chart: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      ),
      settings: (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </>
      ),
      user: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      )
    }
    return icons[iconName]
  }

  return (
    <div className="layoutContainer">
      {/* Mobile overlay */}
      <div 
        className={`sidebarOverlay ${isSidebarOpen ? 'show' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      
      <aside className={`sidebarNav ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebarBrand">
          <img src="/images/euilogo.png" alt="University Logo" className="sidebarLogo" />
          <div className="sidebarBrandText">
            <h2 className="sidebarTitle">
              {isPatron ? 'Patron Library' : 'Admin Library'}
            </h2>
          </div>
        </div>

        <nav className="sidebarLinks">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? "sidebarLink active" : "sidebarLink")}
              onClick={() => setIsSidebarOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                {getIcon(item.icon)}
              </svg>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebarFooter">
          <button onClick={onLogout} className="logoutButton">
            Logout
          </button>
        </div>
      </aside>

      <div className="mainContent">
        <header className="pageHeader">
          <button 
            className="mobileMenuButton"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div></div>
          <div className="userProfile" onClick={handleProfileClick}>
            <span className="userName">{userName || "User"}</span>
            <div className="userAvatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </header>

        <main className="contentArea">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
