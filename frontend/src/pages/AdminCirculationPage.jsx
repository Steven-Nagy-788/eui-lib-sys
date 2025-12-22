"use client"

import { useState, useEffect, useCallback } from "react"
import { getLoansByStatus, returnLoan, rejectLoan, approveLoan } from "../api/loansService"
import { getUser } from "../api/usersService"
import { getBook } from "../api/booksService"
import toast from "../utils/toast"
import "../assets/AdminPages.css"

function CirculationCard({ item, onUpdate }) {
  const [isProcessing, setIsProcessing] = useState(false)

  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handlePickedUp = async () => {
    try {
      setIsProcessing(true)
      await approveLoan(item.id)
      toast.success('Loan marked as picked up')
      onUpdate()
    } catch (error) {
      console.error('Failed to mark as picked up:', error)
      toast.error(error.message || 'Failed to update loan status')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    const reason = prompt('Enter reason for cancellation (optional):')
    try {
      setIsProcessing(true)
      await rejectLoan(item.id, reason || undefined)
      toast.success('Loan cancelled')
      onUpdate()
    } catch (error) {
      console.error('Failed to cancel loan:', error)
      toast.error(error.message || 'Failed to cancel loan')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReturned = async () => {
    const isOverdue = item.status === 'overdue'
    let incrementInfractions = false
    
    if (isOverdue) {
      incrementInfractions = confirm('This book is overdue. Add an infraction to the patron?')
    }
    
    try {
      setIsProcessing(true)
      await returnLoan(item.id, incrementInfractions)
      toast.success('Book marked as returned')
      onUpdate()
    } catch (error) {
      console.error('Failed to process return:', error)
      toast.error(error.message || 'Failed to process return')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = () => {
    // Check if overdue for active loans
    if (item.status === 'active' && item.due_date) {
      const dueDate = new Date(item.due_date)
      const now = new Date()
      if (now > dueDate) {
        return <span className="circulationStatusOverdue">Overdue</span>
      }
      return <span className="circulationStatusOwned">With Patron</span>
    }
    
    switch (item.status) {
      case "pending":
        return <span className="circulationStatusPending">Pending Pickup</span>
      case "active":
        return <span className="circulationStatusOwned">With Patron</span>
      default:
        return <span className="circulationStatusPending">{item.status}</span>
    }
  }

  const getButtons = () => {
    if (item.status === "pending") {
      return (
        <div className="circulationButtons">
          <button className="circulationCancelButton" onClick={handleCancel} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Cancel'}
          </button>
          <button className="circulationPickedUpButton" onClick={handlePickedUp} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Picked Up'}
          </button>
        </div>
      )
    }
    if (item.status === "active" || item.status === "overdue") {
      return (
        <button className="circulationReturnedButton" onClick={handleReturned} disabled={isProcessing}>
          {isProcessing ? 'Processing...' : 'Returned'}
        </button>
      )
    }
    return null
  }

  return (
    <div className="circulationCard">
      <img 
        src={item.book?.book_pic_url || "/placeholder.svg"} 
        alt={item.book?.title || 'Book'} 
        className="circulationBookImage"
        onError={(e) => { e.target.src = "/placeholder.svg" }}
      />

      <div className="circulationCardContent">
        <h3 className="circulationBookTitle">{item.book?.title || 'Unknown Book'}</h3>
        <p className="circulationBookAuthor">{item.book?.author || 'Unknown Author'}</p>

        <div className="circulationDetails">
          <div className="circulationPatronInfo">
            <div className="circulationPatronText">
              <p className="circulationReservedBy">Reserved by</p>
              <p className="circulationPatronName">{item.user?.full_name || item.user?.email || 'Unknown'}</p>
              <p className="circulationPatronId">ID: {item.user?.university_id || 'N/A'}</p>
            </div>

            <div className="circulationPatronAvatar">{getInitials(item.user?.full_name || item.user?.email)}</div>
          </div>

          <div className="circulationActions">
            <div className="circulationStatus">
              <p className="circulationStatusLabel">Status:</p>
              {getStatusBadge()}
            </div>
            {getButtons()}
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminCirculationPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loans, setLoans] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const loadLoans = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")
      
      // Fetch all active and pending loans
      const [activeLoans, pendingLoans] = await Promise.all([
        getLoansByStatus('active').catch(() => []),
        getLoansByStatus('pending').catch(() => [])
      ])
      
      const allLoans = [...activeLoans, ...pendingLoans]
      
      // Fetch user and book details for each loan
      const loansWithDetails = await Promise.all(
        allLoans.map(async (loan) => {
          try {
            const [user, book] = await Promise.all([
              getUser(loan.user_id).catch(() => ({ full_name: 'Unknown', email: 'N/A' })),
              getBook(loan.book_id).catch(() => ({ title: 'Unknown Book', author: 'Unknown' }))
            ])
            
            // Check if overdue
            let status = loan.status
            if (loan.status === 'active' && loan.due_date) {
              const dueDate = new Date(loan.due_date)
              const now = new Date()
              if (now > dueDate) {
                status = 'overdue'
              }
            }
            
            return {
              ...loan,
              user,
              book,
              status
            }
          } catch {
            return {
              ...loan,
              user: { full_name: 'Unknown', email: 'N/A' },
              book: { title: 'Unknown Book', author: 'Unknown' },
              status: loan.status
            }
          }
        })
      )
      
      setLoans(loansWithDetails)
    } catch (err) {
      console.error('Failed to load loans:', err)
      setError(err.message || 'Failed to load circulation data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLoans()
  }, [])

  const filteredCirculation = loans.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesSearch =
      searchQuery === "" ||
      item.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user?.university_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.book?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="adminCirculationContainer">
      <div className="adminCirculationHeader">
        <h1 className="adminCirculationTitle">Circulation</h1>

        <div className="adminCirculationControls">
          <select
            className="adminCirculationSelect"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Pickup</option>
            <option value="active">With Patron</option>
            <option value="overdue">Overdue</option>
          </select>

          <div className="adminCirculationSearchWrapper">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="adminCirculationSearchInput"
            />
            <button className="adminCirculationSearchIcon">
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

      <div className="adminCirculationContent">
        {error && (
          <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
            {error}
            <button onClick={loadLoans} style={{ marginLeft: '10px' }}>Retry</button>
          </div>
        )}
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>Loading circulation data...</p>
          </div>
        ) : filteredCirculation.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>No active circulation</p>
          </div>
        ) : (
          <div className="adminCirculationList">
            {filteredCirculation.map((item) => (
              <CirculationCard key={item.id} item={item} onUpdate={loadLoans} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminCirculationPage
