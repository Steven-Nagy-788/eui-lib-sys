"use client"
import { Outlet, NavLink, useNavigate } from "react-router-dom"
import "../assets/PatronPages.css"

function PatronLayout({ user, onLogout }) {
  const navigate = useNavigate()

  const handleProfileClick = () => {
    navigate("/patron/profile")
  }

  return (
    <div className="layoutContainer">
      <aside className="sidebarNav">
        <div className="sidebarBrand">
          <img src="/images/euilogo.png" alt="University Logo" className="sidebarLogo" />
          <div className="sidebarBrandText">
            <h2 className="sidebarTitle">Patron Library</h2>
          </div>
        </div>

        <nav className="sidebarLinks">
          <NavLink to="/patron/books" className={({ isActive }) => (isActive ? "sidebarLink active" : "sidebarLink")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Books
          </NavLink>
          <NavLink to="/patron/bookbag" className={({ isActive }) => (isActive ? "sidebarLink active" : "sidebarLink")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Bookbag
          </NavLink>
          <NavLink to="/patron/notices" className={({ isActive }) => (isActive ? "sidebarLink active" : "sidebarLink")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            Notices
          </NavLink>
          <NavLink to="/patron/profile" className={({ isActive }) => (isActive ? "sidebarLink active" : "sidebarLink")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Profile
          </NavLink>
        </nav>

        <div className="sidebarFooter">
          <button onClick={onLogout} className="logoutButton">
            Logout
          </button>
        </div>
      </aside>

      <div className="mainContent">
        <header className="pageHeader">
          <button className="translateButton">
            <span className="translateIcon">🌐</span>
            عربي
          </button>
          <div className="userProfile" onClick={handleProfileClick}>
            <span className="userName">{user?.full_name || user?.email || "Patron"}</span>
            <div className="userAvatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
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

export default PatronLayout
