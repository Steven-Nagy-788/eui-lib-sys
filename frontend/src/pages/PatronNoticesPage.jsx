import { useState, useEffect } from "react"
import { getUserLoans } from "../api/loansService"
import { getUserFromToken, getUserDashboard } from "../api/authService"
import "../assets/PatronPages.css"
import "../assets/Responsive.css"

function PatronNoticesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [notices, setNotices] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadNotices()
  }, [])

  const loadNotices = async () => {
    try {
      setIsLoading(true)
      const tokenUser = getUserFromToken()
      
      // Fetch fresh user data from API to get current blacklist status
      const dashboardData = await getUserDashboard()
      const currentUser = dashboardData.user
      
      const activeLoans = await getUserLoans(tokenUser.id, 'active')
      const pendingLoans = await getUserLoans(tokenUser.id, 'pending')
      const overdueLoans = await getUserLoans(tokenUser.id, 'overdue')
      
      const allNotices = []
      
      // Check if user is blacklisted (using fresh data from API)
      if (currentUser.is_blacklisted) {
        allNotices.push({
          id: 'blacklist-notice',
          type: 'error',
          title: 'Account Restricted',
          message: `Your account has been blacklisted. Reason: ${currentUser.blacklist_reason || 'No reason provided'}. You cannot reserve books while blacklisted. Please contact the library administrator.`,
          bookTitle: '',
          date: new Date().toLocaleDateString(),
        })
      }
      
      // Overdue notices
      for (const loan of overdueLoans) {
        const bookTitle = loan.book_title || 'Unknown Book'
        allNotices.push({
          id: `overdue-${loan.id}`,
          type: "overdue",
          title: "Overdue Warning",
          message: `Your book '${bookTitle}' is overdue. Please return it immediately to avoid additional penalties.`,
          bookTitle: bookTitle,
          date: new Date(loan.due_date).toLocaleDateString(),
          loan
        })
      }
      
      // Active loans approaching due date
      for (const loan of activeLoans) {
        const dueDate = new Date(loan.due_date)
        const today = new Date()
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
        
        if (daysUntilDue <= 3 && daysUntilDue >= 0) {
          const bookTitle = loan.book_title || 'Unknown Book'
          allNotices.push({
            id: `approaching-${loan.id}`,
            type: "approaching",
            title: "Due Date Approaching",
            message: `Your book '${bookTitle}' is due on ${dueDate.toLocaleDateString()}. Please return it soon.`,
            bookTitle: bookTitle,
            date: today.toLocaleDateString(),
            loan
          })
        }
      }
      
      // Pending requests
      for (const loan of pendingLoans) {
        const bookTitle = loan.book_title || 'Unknown Book'
        allNotices.push({
          id: `pending-${loan.id}`,
          type: "info",
          title: "Request Pending",
          message: `Your reservation request for '${bookTitle}' is awaiting admin approval.`,
          bookTitle: bookTitle,
          date: new Date(loan.request_date).toLocaleDateString(),
          loan
        })
      }
      
      // Sort by date (newest first)
      allNotices.sort((a, b) => new Date(b.date) - new Date(a.date))
      
      setNotices(allNotices)
    } catch (error) {
      console.error('Failed to load notices:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredNotices = notices.filter((notice) => {
    return (
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.bookTitle.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const getNoticeBorderClass = (type) => {
    switch (type) {
      case "success":
        return "notice-border-green"
      case "approaching":
        return "notice-border-blue"
      case "due":
        return "notice-border-yellow"
      case "overdue":
        return "notice-border-red"
      case "info":
        return "notice-border-blue"
      default:
        return ""
    }
  }

  if (isLoading) {
    return (
      <div className="pageContent">
        <div className="pageHeaderCard">
          <h1>Notices</h1>
        </div>
        <div className="contentCard">
          <p>Loading notices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pageContent">
      <div className="pageHeaderCard">
        <div className="pageHeaderContent">
          <h1>Notices</h1>
          <div className="controlsContainer">
            <div className="searchContainer">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="searchInput"
              />
              <button className="searchIconButton">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="contentCard">
        <div className="scrollableContent">
          {filteredNotices.map((notice) => (
            <div key={notice.id} className={`patron-notice-card ${getNoticeBorderClass(notice.type)}`}>
              <div className="notice-card-header">
                <h3 className="notice-card-title">{notice.title}</h3>
                <span className="notice-card-date">{notice.date}</span>
              </div>
              <p className="notice-card-description">{notice.message}</p>
              <p className="notice-card-book">Book: {notice.bookTitle}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PatronNoticesPage
