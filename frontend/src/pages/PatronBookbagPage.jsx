"use client"

import { useState, useEffect } from "react"
import { getUserLoans } from "../api/loansService"
import { getBook } from "../api/booksService"
import { getUserFromToken } from "../api/authService"
import "../assets/PatronPages.css"

function PatronBookbagPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("all")
  const [loans, setLoans] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const currentUser = getUserFromToken()

  useEffect(() => {
    if (currentUser) {
      loadUserLoans()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  const loadUserLoans = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      // Get all loans for current user
      const loansData = await getUserLoans(currentUser.id)
      
      // Fetch book details for each loan
      const loansWithBooks = await Promise.all(
        loansData.map(async (loan) => {
          try {
            const book = await getBook(loan.copy_id) // Need to get book from copy
            return {
              ...loan,
              book: book,
            }
          } catch {
            return {
              ...loan,
              book: null,
            }
          }
        })
      )
      
      setLoans(loansWithBooks)
    } catch (err) {
      console.error('Failed to load loans:', err)
      setError(err.message || 'Failed to load your bookbag')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusDisplay = (loan) => {
    if (loan.status === 'pending') return 'Pending Pickup'
    if (loan.status === 'active') {
      // Check if overdue
      const dueDate = new Date(loan.due_date)
      const now = new Date()
      if (now > dueDate) return 'Overdue'
      return 'Owned'
    }
    if (loan.status === 'returned') return 'Returned'
    if (loan.status === 'rejected') return 'Rejected'
    return loan.status
  }

  const getDaysLeft = (loan) => {
    if (!loan.due_date || loan.status !== 'active') return null
    const dueDate = new Date(loan.due_date)
    const now = new Date()
    const diffTime = dueDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })
  }

  const filteredLoans = loans.filter((loan) => {
    if (!loan.book) return false
    
    const matchesSearch =
      loan.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.book.author.toLowerCase().includes(searchQuery.toLowerCase())
    
    const loanStatus = getStatusDisplay(loan).toLowerCase().replace(" ", "")
    const matchesStatus = sortBy === "all" || loanStatus === sortBy.toLowerCase()
    
    return matchesSearch && matchesStatus
  })

  const handleCancelReservation = (loanId) => {
    // TODO: Implement cancel reservation
    console.log(`Canceling reservation for loan ${loanId}`)
  }

  return (
    <div className="pageContent">
      <div className="pageHeaderCard">
        <div className="pageHeaderContent">
          <h1>Bookbag</h1>
          <div className="controlsContainer">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="selectInput">
              <option value="all">Sort By</option>
              <option value="owned">Owned</option>
              <option value="overdue">Overdue</option>
              <option value="pendingpickup">Pending Pickup</option>
            </select>

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
        {error && (
          <div className="errorMessage" style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
            {error}
            <button onClick={loadUserLoans} style={{ marginLeft: '10px' }}>Retry</button>
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>Loading your books...</p>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>No books in your bookbag</p>
          </div>
        ) : (
          <div className="scrollableContent">
            {filteredLoans.map((loan) => {
              const book = loan.book
              const status = getStatusDisplay(loan)
              const daysLeft = getDaysLeft(loan)

              return (
                <div key={loan.id} className="bookCard">
                  <img src={book.book_pic_url || "/placeholder.svg"} alt={book.title} className="bookImage" 
                       onError={(e) => { e.target.src = "/placeholder.svg" }} />
                  <div className="bookContent">
                    <h3 className="bookTitle">{book.title}</h3>
                    <p className="bookAuthor">{book.author}</p>
                    <div className="bookDetailsBox">
                      <div className="bookDetailsLeft">
                        <p className="detailRow">
                          <span className="detailLabel">Publisher:</span>
                          <span className="detailValue">{book.publisher || 'N/A'}</span>
                        </p>
                        <p className="detailRow">
                          <span className="detailLabel">ISBN:</span>
                          <span className="detailValue">{book.isbn}</span>
                        </p>
                      </div>
                      <div className="bookDetailsCenter">
                        <p className="detailRow">
                          <span className="detailLabel">Request Date:</span>
                          <span className="detailValue">{formatDate(loan.request_date)}</span>
                        </p>
                        <p className="detailRow">
                          <span className="detailLabel">Due Date:</span>
                          <span className="detailValue">{formatDate(loan.due_date)}</span>
                        </p>
                      </div>
                      <div className="bookDetailsRight">
                        <p className="detailRow">
                          <span className="detailLabel">Status:</span>
                          <span
                            className={`statusBadge ${
                              status === "Owned"
                                ? "statusOwned"
                                : status === "Overdue"
                                  ? "statusOverdue"
                                  : "statusPending"
                            }`}
                          >
                            {status}
                          </span>
                        </p>
                        {daysLeft !== null && (
                          <p className="detailRow">
                            <span className="detailLabel">{daysLeft >= 0 ? 'Days Left:' : 'Days Overdue:'}</span>
                            <span className="detailValue">{Math.abs(daysLeft)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    {loan.status === 'pending' && (
                      <button
                        onClick={() => handleCancelReservation(loan.id)}
                        className="cancelButton"
                      >
                        Cancel Reservation
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default PatronBookbagPage
