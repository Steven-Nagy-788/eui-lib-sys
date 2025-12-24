"use client"

import { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getLoansByStatus, returnLoan, rejectLoan, approveLoan, checkoutLoan } from "../api/loansService"
import { getUser } from "../api/usersService"
import toast from "../utils/toast"
import Spinner from "../components/Spinner"
import "../assets/AdminPages.css"
import "../assets/Responsive.css"

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
      await checkoutLoan(item.id)
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
        return <span className="circulationStatusPending">Pending Request</span>
      case "pending_pickup":
        return <span className="circulationStatusPending">Pending Pickup</span>
      case "active":
        return <span className="circulationStatusOwned">With Patron</span>
      default:
        return <span className="circulationStatusPending">{item.status}</span>
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const getDaysInfo = () => {
    if (!item.due_date || item.status === 'pending' || item.status === 'pending_pickup') return null
    
    const dueDate = new Date(item.due_date)
    const now = new Date()
    const diffTime = dueDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return <span style={{ color: '#dc2626', fontWeight: '600' }}>{Math.abs(diffDays)} days overdue</span>
    } else if (diffDays <= 3) {
      return <span style={{ color: '#f59e0b', fontWeight: '600' }}>{diffDays} days left</span>
    } else {
      return <span style={{ color: '#059669', fontWeight: '600' }}>{diffDays} days left</span>
    }
  }

  const getButtons = () => {
    if (item.status === "pending_pickup") {
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

          <div className="circulationInfoGrid" style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px', 
            marginTop: '16px',
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px'
          }}>
            {item.copy_accession_number && (
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Copy #</p>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{item.copy_accession_number}</p>
              </div>
            )}
            
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Request Date</p>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{formatDate(item.request_date)}</p>
            </div>

            {item.approval_date && (
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Approved</p>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{formatDate(item.approval_date)}</p>
              </div>
            )}

            {item.due_date && (
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Due Date</p>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{formatDate(item.due_date)}</p>
              </div>
            )}

            {getDaysInfo() && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Time Remaining</p>
                <p style={{ fontSize: '14px' }}>{getDaysInfo()}</p>
              </div>
            )}
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
  const queryClient = useQueryClient()

  // Use React Query for automatic caching of loans
  const { data: loans = [], isLoading, error } = useQuery({
    queryKey: ['circulation'],
    queryFn: async () => {
      // Fetch only approved loans for circulation (pending_pickup and active)
      // Pending requests should only appear in the Requests page
      const [activeLoans, pendingPickupLoans] = await Promise.all([
        getLoansByStatus('active').catch(() => []),
        getLoansByStatus('pending_pickup').catch(() => [])
      ])
      
      const allLoans = [...activeLoans, ...pendingPickupLoans]
      
      // Fetch user details and extract embedded book details
      const loansWithDetails = await Promise.all(
        allLoans.map(async (loan) => {
          try {
            // Only fetch user details - book details are already embedded
            const user = await getUser(loan.user_id).catch(() => ({ 
              full_name: 'Unknown', 
              email: 'N/A' 
            }))
            
            // Extract embedded book details from loan response
            const book = {
              id: loan.book_id,
              title: loan.book_title || 'Unknown Book',
              author: loan.book_author || 'Unknown',
              isbn: loan.book_isbn,
              publisher: loan.book_publisher,
              book_pic_url: loan.book_pic_url
            }
            
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
              book: { 
                title: loan.book_title || 'Unknown Book', 
                author: loan.book_author || 'Unknown' 
              },
              status: loan.status
            }
          }
        })
      )
      
      return loansWithDetails
    },
    staleTime: 1 * 60 * 1000, // 1 minute cache
  })

  const handleUpdate = useCallback(() => {
    queryClient.invalidateQueries(['circulation'])
  }, [queryClient])

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

  if (isLoading) {
    return (
      <div className="adminCirculationContainer">
        <div className="adminCirculationHeader">
          <h1 className="adminCirculationTitle">Circulation</h1>
        </div>
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <Spinner size="large" />
          <p style={{ marginTop: '20px', color: '#6b7280' }}>Loading circulation data...</p>
        </div>
      </div>
    )
  }

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
            <option value="pending_pickup">Pending Pickup</option>
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
              <CirculationCard key={item.id} item={item} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminCirculationPage
