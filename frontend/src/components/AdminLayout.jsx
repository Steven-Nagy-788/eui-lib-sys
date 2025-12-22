"use client"
import { Outlet, NavLink, useNavigate } from "react-router-dom"
import "../assets/AdminPages.css"

function AdminLayout({ user, onLogout }) {
  const navigate = useNavigate()

  const handleProfileClick = () => {
    navigate("/admin/profile")
  }

  return (
    <div className="layoutContainer">
      <aside className="sidebarNav">
        <div className="sidebarBrand">
          <img src="/images/euilogo.png" alt="University Logo" className="sidebarLogo" />
          <div className="sidebarBrandText">
            <h2 className="sidebarTitle">Admin Library</h2>
          </div>
        </div>

        <nav className="sidebarLinks">
          <NavLink to="/admin/books" className={({ isActive }) => (isActive ? "sidebarLink active" : "sidebarLink")}>
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
          <NavLink to="/admin/patrons" className={({ isActive }) => (isActive ? "sidebarLink active" : "sidebarLink")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            Patrons
          </NavLink>
          <NavLink
            to="/admin/circulation"
            className={({ isActive }) => (isActive ? "sidebarLink active" : "sidebarLink")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Circulation
          </NavLink>
          <NavLink to="/admin/requests" className={({ isActive }) => (isActive ? "sidebarLink active" : "sidebarLink")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Requests
          </NavLink>
          <NavLink to="/admin/database" className={({ isActive }) => (isActive ? "sidebarLink active" : "sidebarLink")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </svg>
            Database
          </NavLink>
          <NavLink to="/admin/profile" className={({ isActive }) => (isActive ? "sidebarLink active" : "sidebarLink")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
            <span className="userName">{user?.full_name || "Admin Full Name"}</span>
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

export default AdminLayout
