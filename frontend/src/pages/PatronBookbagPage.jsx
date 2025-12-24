"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUserLoans, rejectLoan } from "../api/loansService"
import { getUserFromToken } from "../api/authService"
import { ConfirmModal } from "../components/Modal"
import Spinner from "../components/Spinner"
import toast from "../utils/toast"
import "../assets/PatronPages.css"
import "../assets/Responsive.css"

function PatronBookbagPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("current") // "current" or "history"
  const [cancelingLoanId, setCancelingLoanId] = useState(null)

  const currentUser = getUserFromToken()
  const queryClient = useQueryClient()

  // Use React Query for loans with automatic caching
  const { data: loans = [], isLoading, error, refetch } = useQuery({
    queryKey: ['userLoans', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return []
      const loansData = await getUserLoans(currentUser.id)
      console.log('Loaded loans:', loansData)
      
      // Transform loan data with embedded book details
      return loansData.map(loan => ({
        ...loan,
        book: {
          id: loan.book_id,
          title: loan.book_title || 'Unknown Book',
          author: loan.book_author || 'Unknown Author',
          publisher: loan.book_publisher,
          isbn: loan.book_isbn,
          book_pic_url: loan.book_pic_url
        }
      }))
    },
    enabled: !!currentUser,
    staleTime: 30 * 1000, // Cache for 30 seconds
  })


  const getStatusDisplay = (loan) => {
    if (loan.status === 'pending') return 'Pending Approval'
    if (loan.status === 'pending_pickup') return 'Ready for Pickup'
    if (loan.status === 'active') {
      // Check if overdue
      if (loan.is_overdue || (loan.due_date && new Date(loan.due_date) < new Date())) {
        return 'Overdue'
      }
      return 'Borrowed'
    }
    if (loan.status === 'returned') return 'Returned'
    if (loan.status === 'rejected') return 'Rejected'
    if (loan.status === 'overdue') return 'Overdue'
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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  // Separate current loans (pending, pending_pickup, active, overdue) from history (returned, rejected, canceled)
  const { currentLoans, historyLoans } = useMemo(() => {
    const current = loans.filter(loan => 
      ['pending', 'pending_pickup', 'active', 'overdue'].includes(loan.status) || 
      (loan.status === 'active' && loan.is_overdue)
    )
    const history = loans.filter(loan => 
      ['returned', 'rejected'].includes(loan.status)
    )
    return { currentLoans: current, historyLoans: history }
  }, [loans])

  // Cancel mutation for patrons to cancel their own requests
  const cancelMutation = useMutation({
    mutationFn: (loanId) => rejectLoan(loanId),
    onSuccess: async () => {
      await queryClient.invalidateQueries(['userLoans'])
      toast.success('Request cancelled successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel request')
    }
  })

  const handleCancelRequest = (loanId) => {
    setCancelingLoanId(loanId)
  }

  const confirmCancel = () => {
    if (cancelingLoanId) {
      cancelMutation.mutate(cancelingLoanId)
      setCancelingLoanId(null)
    }
  }

  // Filter based on search and active tab
  const displayedLoans = useMemo(() => {
    const source = activeTab === 'current' ? currentLoans : historyLoans
    return source.filter((loan) => {
      if (!loan.book) return false
      const matchesSearch =
        loan.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.book.author.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [currentLoans, historyLoans, activeTab, searchQuery])

  if (isLoading) {
    return (
      <div className="pageContent">
        <div className="pageHeaderCard">
          <h1>Bookbag</h1>
        </div>
        <div className="contentCard" style={{ padding: '60px', textAlign: 'center' }}>
          <Spinner size="large" />
          <p style={{ marginTop: '20px', color: '#6b7280' }}>Loading your books...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="pageContent">
        <div className="pageHeaderCard">
          <h1>Bookbag</h1>
        </div>
        <div className="contentCard" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ color: '#ef4444', marginBottom: '20px' }}>
            <p style={{ fontSize: '18px', fontWeight: '600' }}>Failed to load bookbag</p>
            <p style={{ marginTop: '8px', color: '#6b7280' }}>{error.message || 'Please try again'}</p>
          </div>
          <button onClick={() => refetch()} className="buttonPrimary">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pageContent">
      <div className="pageHeaderCard">
        <div className="pageHeaderContent">
          <div>
            <h1>Bookbag</h1>
            <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>Manage your borrowed books and loan history</p>
          </div>
          <div className="searchContainer">
            <input
              type="text"
              placeholder="Search books..."
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

      {/* Tabs */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '16px 24px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', gap: '24px', borderBottom: '2px solid #e5e7eb' }}>
          <button
            onClick={() => setActiveTab('current')}
            style={{
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'current' ? '3px solid #2563eb' : '3px solid transparent',
              color: activeTab === 'current' ? '#2563eb' : '#6b7280',
              fontWeight: activeTab === 'current' ? '600' : '500',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            Current Loans ({currentLoans.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'history' ? '3px solid #2563eb' : '3px solid transparent',
              color: activeTab === 'history' ? '#2563eb' : '#6b7280',
              fontWeight: activeTab === 'history' ? '600' : '500',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            History ({historyLoans.length})
          </button>
        </div>
      </div>

      <div className="contentCard">
        {displayedLoans.length === 0 ? (
          <div style={{ padding: '60px 40px', textAlign: 'center' }}>
            <svg width="64" height="64" fill="#d1d5db" viewBox="0 0 24 24" style={{ margin: '0 auto 16px' }}>
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              {searchQuery ? 'No matching books found' : activeTab === 'current' ? 'No active loans' : 'No loan history'}
            </p>
            <p style={{ color: '#6b7280' }}>
              {searchQuery ? 'Try adjusting your search' : activeTab === 'current' ? 'Reserve a book to get started' : 'Your returned books will appear here'}
            </p>
          </div>
        ) : (
          <div className="scrollableContent">
            {displayedLoans.map((loan) => {
              const book = loan.book
              const status = getStatusDisplay(loan)
              const daysLeft = getDaysLeft(loan)

              return (
                <div key={loan.id} className="bookCard">
                  <img 
                    src={book.book_pic_url || "/placeholder.svg"} 
                    alt={book.title} 
                    className="bookImage" 
                    onError={(e) => { e.target.src = "/placeholder.svg" }} 
                  />
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
                        {loan.copy_accession_number && (
                          <p className="detailRow">
                            <span className="detailLabel">Copy #:</span>
                            <span className="detailValue">{loan.copy_accession_number}</span>
                          </p>
                        )}
                      </div>
                      <div className="bookDetailsCenter">
                        <p className="detailRow">
                          <span className="detailLabel">Request Date:</span>
                          <span className="detailValue">{formatDate(loan.request_date)}</span>
                        </p>
                        {loan.approval_date && (
                          <p className="detailRow">
                            <span className="detailLabel">Approved:</span>
                            <span className="detailValue">{formatDate(loan.approval_date)}</span>
                          </p>
                        )}
                        {loan.due_date && (
                          <p className="detailRow">
                            <span className="detailLabel">Due Date:</span>
                            <span className="detailValue">{formatDate(loan.due_date)}</span>
                          </p>
                        )}
                        {loan.return_date && (
                          <p className="detailRow">
                            <span className="detailLabel">Returned:</span>
                            <span className="detailValue">{formatDate(loan.return_date)}</span>
                          </p>
                        )}
                      </div>
                      <div className="bookDetailsRight">
                        <p className="detailRow">
                          <span className="detailLabel">Status:</span>
                          <span
                            className={
                              status === "Borrowed" ? "statusOwned" :
                              status === "Overdue" ? "statusOverdue" :
                              status === "Pending Approval" ? "statusPending" :
                              status === "Ready for Pickup" ? "statusPending" :
                              status === "Returned" ? "statusReturned" :
                              status === "Rejected" ? "statusRejected" :
                              "statusBadge"
                            }
                          >
                            {status}
                          </span>
                        </p>
                        {daysLeft !== null && (
                          <p className="detailRow">
                            <span className="detailLabel">{daysLeft >= 0 ? 'Days Left:' : 'Days Overdue:'}</span>
                            <span className="detailValue" style={{ 
                              color: daysLeft < 0 ? '#dc2626' : daysLeft <= 3 ? '#f59e0b' : '#059669',
                              fontWeight: '600'
                            }}>
                              {Math.abs(daysLeft)}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    {loan.status === 'pending' && (
                      <button
                        onClick={() => handleCancelRequest(loan.id)}
                        disabled={cancelMutation.isPending}
                        style={{
                          marginTop: '12px',
                          padding: '8px 16px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: cancelMutation.isPending ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          opacity: cancelMutation.isPending ? 0.6 : 1,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!cancelMutation.isPending) e.target.style.background = '#dc2626'
                        }}
                        onMouseLeave={(e) => {
                          if (!cancelMutation.isPending) e.target.style.background = '#ef4444'
                        }}
                      >
                        {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Request'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={cancelingLoanId !== null}
        onClose={() => setCancelingLoanId(null)}
        onConfirm={confirmCancel}
        title="Cancel Reservation"
        message="Are you sure you want to cancel this book reservation?"
        confirmText="Yes, Cancel"
        cancelText="No, Keep It"
        isDestructive={true}
      />
    </div>
  )
}

export default PatronBookbagPage
