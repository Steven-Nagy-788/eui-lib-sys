import { useState, useEffect } from "react"
import { getUserLoans } from "../api/loansService"
import { getBook } from "../api/booksService"
import { getUserFromToken } from "../api/authService"
import "../assets/PatronPages.css"

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
      const currentUser = getUserFromToken()
      const activeLoans = await getUserLoans(currentUser.id, 'active')
      const pendingLoans = await getUserLoans(currentUser.id, 'pending')
      const overdueLoans = await getUserLoans(currentUser.id, 'overdue')
      
      const allNotices = []
      
      // Overdue notices
      for (const loan of overdueLoans) {
        const book = await getBook(loan.book_copy?.book_id)
        allNotices.push({
          id: `overdue-${loan.id}`,
          type: "overdue",
          title: "Overdue Warning",
          message: `Your book '${book.title}' is overdue. Please return it immediately to avoid additional infractions.`,
          bookTitle: book.title,
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
          const book = await getBook(loan.book_copy?.book_id)
          allNotices.push({
            id: `approaching-${loan.id}`,
            type: "approaching",
            title: "Due Date Approaching",
            message: `Your book '${book.title}' is due on ${dueDate.toLocaleDateString()}. Please return it soon.`,
            bookTitle: book.title,
            date: today.toLocaleDateString(),
            loan
          })
        }
      }
      
      // Pending requests
      for (const loan of pendingLoans) {
        const book = await getBook(loan.book_copy?.book_id)
        allNotices.push({
          id: `pending-${loan.id}`,
          type: "info",
          title: "Request Pending",
          message: `Your reservation request for '${book.title}' is awaiting admin approval.`,
          bookTitle: book.title,
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
