"use client"

import { useQuery } from "@tanstack/react-query"
import { getDashboardStats, getMostBorrowedBooks, getTopBorrowers } from "../api/statsService"
import Spinner from "../components/Spinner"
import "../assets/AdminPages.css"
import "../assets/Responsive.css"

function AdminReportsPage() {
  // Use React Query for statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
    staleTime: 2 * 60 * 1000, // Cache 2 minutes
  })

  // Debug: Log stats structure
  if (stats) {
    console.log('Dashboard Stats:', stats)
  }

  const { data: mostBorrowed = [], isLoading: isLoadingBorrowed } = useQuery({
    queryKey: ['mostBorrowed'],
    queryFn: () => getMostBorrowedBooks(10),
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  })

  const { data: topBorrowers = [], isLoading: isLoadingBorrowers } = useQuery({
    queryKey: ['topBorrowers'],
    queryFn: () => getTopBorrowers(10),
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  })

  // Debug: Log top borrowers structure
  if (topBorrowers.length > 0) {
    console.log('Top Borrowers:', topBorrowers)
  }

  const isLoading = isLoadingStats || isLoadingBorrowed || isLoadingBorrowers

  if (isLoading) {
    return (
      <div className="adminDatabaseContainer">
        <div className="adminDatabaseHeader">
          <h1 className="adminDatabaseTitle">Reports</h1>
        </div>
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <Spinner size="large" />
          <p style={{ marginTop: '20px', color: '#6b7280' }}>Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="adminDatabaseContainer">
      <div className="adminDatabaseHeader">
        <h1 className="adminDatabaseTitle">Reports & Statistics</h1>
        <p style={{ color: '#6b7280', marginTop: '8px' }}>Library usage and performance metrics</p>
      </div>

      <div className="adminDatabaseContent">
        {/* Dashboard Statistics */}
        {stats && (
          <div className="databaseCard">
            <h2 className="cardTitle">Library Overview</h2>
            <div className="statsGrid">
              <div key="stat-books" className="statCard">
                <div className="statIcon" style={{ backgroundColor: '#dbeafe' }}>
                  <svg width="24" height="24" fill="#3b82f6" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                </div>
                <div className="statContent">
                  <p className="statLabel">Total Books</p>
                  <p className="statValue">{stats?.books?.total_books || 0}</p>
                </div>
              </div>

              <div key="stat-users" className="statCard">
                <div className="statIcon" style={{ backgroundColor: '#dcfce7' }}>
                  <svg width="24" height="24" fill="#10b981" viewBox="0 0 24 24">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                </div>
                <div className="statContent">
                  <p className="statLabel">Total Users</p>
                  <p className="statValue">{stats?.users?.total_users || 0}</p>
                </div>
              </div>

              <div key="stat-active" className="statCard">
                <div className="statIcon" style={{ backgroundColor: '#fef3c7' }}>
                  <svg width="24" height="24" fill="#f59e0b" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="statContent">
                  <p className="statLabel">Active Loans</p>
                  <p className="statValue">{stats?.loans?.active_loans || 0}</p>
                </div>
              </div>

              <div key="stat-overdue" className="statCard">
                <div className="statIcon" style={{ backgroundColor: '#fee2e2' }}>
                  <svg width="24" height="24" fill="#ef4444" viewBox="0 0 24 24">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                  </svg>
                </div>
                <div className="statContent">
                  <p className="statLabel">Overdue Loans</p>
                  <p className="statValue">{stats?.loans?.overdue_loans || 0}</p>
                </div>
              </div>

              <div key="stat-copies" className="statCard">
                <div className="statIcon" style={{ backgroundColor: '#e0e7ff' }}>
                  <svg width="24" height="24" fill="#6366f1" viewBox="0 0 24 24">
                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <div className="statContent">
                  <p className="statLabel">Total Copies</p>
                  <p className="statValue">{stats?.books?.total_copies || 0}</p>
                </div>
              </div>

              <div key="stat-available" className="statCard">
                <div className="statIcon" style={{ backgroundColor: '#d1fae5' }}>
                  <svg width="24" height="24" fill="#059669" viewBox="0 0 24 24">
                    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                  </svg>
                </div>
                <div className="statContent">
                  <p className="statLabel">Available Copies</p>
                  <p className="statValue">{stats?.books?.available_copies || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Most Borrowed Books */}
        <div className="databaseCard">
          <h2 className="cardTitle">Most Borrowed Books</h2>
          {mostBorrowed.length > 0 ? (
            <div className="tableWrapper">
              <table className="databaseTable">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>ISBN</th>
                    <th>Times Borrowed</th>
                  </tr>
                </thead>
                <tbody>
                  {mostBorrowed.map((book, index) => (
                    <tr key={book.id}>
                      <td>
                        <span className="rankBadge" style={{
                          backgroundColor: index === 0 ? '#fef3c7' : index === 1 ? '#e5e7eb' : index === 2 ? '#fed7aa' : '#f3f4f6',
                          color: index < 3 ? '#92400e' : '#374151'
                        }}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="bookTitle">{book.title}</td>
                      <td>{book.author}</td>
                      <td className="isbn">{book.isbn}</td>
                      <td>
                        <strong style={{ color: '#3b82f6' }}>{book.borrow_count || 0}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
              No borrowing data available
            </p>
          )}
        </div>

        {/* Top Borrowers */}
        <div className="databaseCard">
          <h2 className="cardTitle">Top Borrowers</h2>
          {topBorrowers.length > 0 ? (
            <div className="tableWrapper">
              <table className="databaseTable">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>University ID</th>
                    <th>Books Borrowed</th>
                  </tr>
                </thead>
                <tbody>
                  {topBorrowers.map((user, index) => (
                    <tr key={user.id}>
                      <td>
                        <span className="rankBadge" style={{
                          backgroundColor: index === 0 ? '#fef3c7' : index === 1 ? '#e5e7eb' : index === 2 ? '#fed7aa' : '#f3f4f6',
                          color: index < 3 ? '#92400e' : '#374151'
                        }}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="userName">{user.full_name || user.name}</td>
                      <td>{user.email || 'N/A'}</td>
                      <td className="universityId">{user.university_id}</td>
                      <td>
                        <strong style={{ color: '#10b981' }}>{user.loan_count || user.borrow_count || 0}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
              No borrower data available
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminReportsPage
