"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { getLoansByStatus, approveLoan, rejectLoan } from "../api/loansService"
import { getUser } from "../api/usersService"
import { PromptModal } from "../components/Modal"
import toast from "../utils/toast"
import "../assets/AdminPages.css"
import "../assets/Responsive.css"

function AdminRequestsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("earliest")
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [rejectingLoanId, setRejectingLoanId] = useState(null)

  const loadRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")
      
      // getLoansByStatus now returns LoanWithBookInfo schema with embedded book details
      const pendingLoans = await getLoansByStatus('pending')
      
      const requestsWithDetails = await Promise.all(
        pendingLoans.map(async (loan) => {
          try {
            // Only fetch user details - book details are already embedded in loan
            const user = await getUser(loan.user_id).catch(() => ({ 
              full_name: 'Unknown User', 
              email: 'N/A', 
              university_id: loan.user_id 
            }))
            
            // Extract embedded book details from loan response
            const book = {
              id: loan.book_id,
              title: loan.book_title || 'Unknown Book',
              author: loan.book_author || 'Unknown Author',
              isbn: loan.book_isbn,
              publisher: loan.book_publisher,
              book_pic_url: loan.book_pic_url
            }
            
            return { ...loan, user, book }
          } catch (err) {
            console.error('Error processing loan:', loan.id, err)
            return {
              ...loan,
              user: { full_name: 'Unknown User', email: 'N/A', university_id: loan.user_id },
              book: { title: loan.book_title || 'Unknown Book', author: loan.book_author || 'Unknown' }
            }
          }
        })
      )
      
      setRequests(requestsWithDetails)
    } catch (err) {
      console.error('Failed to load requests:', err)
      setError(err.message || 'Failed to load pending requests')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const handleApprove = async (loanId) => {
    try {
      await approveLoan(loanId)
      toast.success('Loan request approved successfully')
      await loadRequests()
    } catch (err) {
      console.error('Failed to approve loan:', err)
      toast.error(err.message || 'Failed to approve loan request')
    }
  }

  const handleReject = (loanId) => {
    setRejectingLoanId(loanId)
  }

  const confirmReject = async (reason) => {
    try {
      await rejectLoan(rejectingLoanId, reason || undefined)
      toast.success('Loan request rejected')
      await loadRequests()
    } catch (err) {
      console.error('Failed to reject loan:', err)
      toast.error(err.message || 'Failed to reject loan request')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })
  }

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const filteredAndSortedRequests = useMemo(() => {
    let filtered = [...requests]

    if (searchQuery) {
      filtered = filtered.filter(
        (request) =>
          request.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.user?.university_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.book?.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (sortBy === "earliest") {
      filtered.sort((a, b) => new Date(a.request_date) - new Date(b.request_date))
    } else if (sortBy === "latest") {
      filtered.sort((a, b) => new Date(b.request_date) - new Date(a.request_date))
    }

    return filtered
  }, [requests, searchQuery, sortBy])

  return (
    <div className="adminRequestsContainer">
      <div className="adminRequestsHeader">
        <h1 className="adminRequestsTitle">Requests</h1>

        <div className="adminRequestsControls">
          <select className="adminRequestsSelect" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="earliest">Earliest to Latest</option>
            <option value="latest">Latest to Earliest</option>
          </select>

          <div className="adminRequestsSearchWrapper">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="adminRequestsSearchInput"
            />
            <button className="adminRequestsSearchIcon">
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

      <div className="adminRequestsContent">
        {error && (
          <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
            {error}
            <button onClick={loadRequests} style={{ marginLeft: '10px' }}>Retry</button>
          </div>
        )}
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>Loading pending requests...</p>
          </div>
        ) : filteredAndSortedRequests.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>No pending requests</p>
          </div>
        ) : (
          <div className="adminRequestsList">
          {filteredAndSortedRequests.map((request) => {
            const days = calculateDays(request.request_date, request.due_date)
            
            return (
              <div key={request.id} className="requestCard">
                <div className="requestCardInfo">
                  <div className="requestInfoRow">
                    <div className="requestInfoItem">
                      <span className="requestInfoLabel">Name:</span>
                      <p className="requestInfoValue">{request.user?.full_name || request.user?.email || 'Unknown'}</p>
                    </div>
                    <div className="requestInfoItem">
                      <span className="requestInfoLabel">ID:</span>
                      <p className="requestInfoValue">{request.user?.university_id || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="requestInfoItem">
                    <span className="requestInfoLabel">Book:</span>
                    <p className="requestInfoValue">{request.book?.title || 'Unknown Book'}</p>
                  </div>

                  <div className="requestInfoRow">
                    <div className="requestInfoItem">
                      <span className="requestInfoLabel">Days:</span>
                      <p className="requestInfoValue">{days}</p>
                    </div>
                    <div className="requestInfoItem">
                      <span className="requestInfoLabel">Reserve Date:</span>
                      <p className="requestInfoValue">{formatDate(request.request_date)}</p>
                    </div>
                    <div className="requestInfoItem">
                      <span className="requestInfoLabel">Due Date:</span>
                      <p className="requestInfoValue">{formatDate(request.due_date)}</p>
                    </div>
                  </div>
                </div>

                <div className="requestCardButtons">
                  <button className="requestAcceptButton" onClick={() => handleApprove(request.id)}>Accept</button>
                  <button className="requestRejectButton" onClick={() => handleReject(request.id)}>Reject</button>
                </div>
              </div>
            )
          })}
          </div>
        )}
      </div>

      <PromptModal
        isOpen={rejectingLoanId !== null}
        onClose={() => setRejectingLoanId(null)}
        onSubmit={confirmReject}
        title="Reject Loan Request"
        message="Please provide a reason for rejection (optional):"
        placeholder="Enter reason..."
        submitText="Reject"
        cancelText="Cancel"
      />
    </div>
  )
}

export default AdminRequestsPage
