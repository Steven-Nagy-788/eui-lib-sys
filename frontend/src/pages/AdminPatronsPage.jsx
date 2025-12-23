"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { getUsers, searchUsers, addToBlacklist, removeFromBlacklist, getUser } from "../api/usersService"
import { getUserLoans } from "../api/loansService"
import { getStudentEnrollments } from "../api/coursesService"
import Spinner from "../components/Spinner"
import toast from "../utils/toast"
import "../assets/AdminPages.css"
import "../assets/Responsive.css"

const mockPatrons = [
  {
    id: "21-101010",
    name: "Student Full Name",
    type: "Student",
    faculty: "Computer and Informational Sciences",
    year: 4,
    booksOwned: 2,
    booksBorrowed: 4,
    blacklisted: false,
  },
  {
    id: "P-12345",
    name: "Professor Full Name",
    type: "Professor",
    faculty: "Computer and Informational Sciences",
    year: null,
    booksOwned: 1,
    booksBorrowed: 0,
    blacklisted: false,
  },
  {
    id: "21-101011",
    name: "Student Full Name",
    type: "Student",
    faculty: "Computer and Informational Sciences",
    year: 4,
    booksOwned: 3,
    booksBorrowed: 1,
    blacklisted: false,
  },
]

function PatronCard({ patron, expandedId, onToggle, onUpdate, onViewDetails }) {
  const [isBlacklisted, setIsBlacklisted] = useState(patron.is_blacklisted || false)
  const [isLoading, setIsLoading] = useState(false)
  const [showBlacklistModal, setShowBlacklistModal] = useState(false)
  const [blacklistReason, setBlacklistReason] = useState('')
  const expanded = expandedId === patron.id
  const cardRef = useRef(null)

  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleToggle = () => {
    onToggle(expanded ? null : patron.id)
  }

  const handleBlacklist = async () => {
    if (!isBlacklisted) {
      // Show modal to get reason
      setShowBlacklistModal(true)
      return
    }
    
    // Whitelist without reason
    try {
      setIsLoading(true)
      await removeFromBlacklist(patron.id)
      toast.success('User whitelisted successfully')
      setIsBlacklisted(false)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to whitelist user:', error)
      toast.error(error.message || 'Failed to whitelist user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmBlacklist = async () => {
    if (!blacklistReason.trim()) {
      toast.warning('Please enter a reason for blacklisting')
      return
    }
    
    try {
      setIsLoading(true)
      await addToBlacklist(patron.id, blacklistReason)
      toast.success('User blacklisted successfully')
      setIsBlacklisted(true)
      setShowBlacklistModal(false)
      setBlacklistReason('')
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to blacklist user:', error)
      toast.error(error.message || 'Failed to blacklist user')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="patronCard" ref={cardRef}>
      <div className="patronCardHeader">
        <div className="patronAvatar">{getInitials(patron.full_name || patron.email)}</div>

        <div className="patronHeaderContent">
          <button onClick={handleToggle} className="patronExpandButton">
            <div className="patronHeaderInfo">
              <div className="patronNameContainer">
                <h3 className="patronName">{patron.full_name || patron.email}</h3>
                {isBlacklisted && <span className="patronBlacklistIndicator" />}
              </div>
              <p className="patronType">{patron.university_id || patron.id}</p>
            </div>
            <span className="patronExpandIcon">{expanded ? "▲" : "▼"}</span>
          </button>

          <div className="patronBasicInfo">
            <div className="patronBasicInfoRow">
              <span className="patronBasicInfoLabel">Email:</span>
              <p className="patronBasicInfoValue">{patron.email}</p>
              <span className="patronBasicInfoSeparator">|</span>
              <span className="patronBasicInfoLabel">Role:</span>
              <p className="patronBasicInfoValue">{patron.role}</p>
            </div>
            <div className="patronBasicInfoRow">
              <span className="patronBasicInfoLabel">Active Loans:</span>
              <span className="patronBasicInfoValue">{patron.active_loans_count || 0}</span>
              <span className="patronBasicInfoLabel">Total Loans:</span>
              <span className="patronBasicInfoValue">{patron.total_loans_count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="patronCardExpanded">
          <div className="patronExpandedContent">
            <div className="patronExpandedRow">
              <button 
                onClick={() => onViewDetails(patron)}
                style={{
                  padding: '10px 20px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                📊 View Full Details & Loan History
              </button>
            </div>
            
            <div className="patronExpandedRow">
              <button
                onClick={handleBlacklist}
                className={isBlacklisted ? "patronWhitelistButton" : "patronBlacklistButton"}
                disabled={isLoading}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  flex: '0 0 auto'
                }}
              >
                {isLoading ? 'Processing...' : (isBlacklisted ? "Whitelist" : "Blacklist")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blacklist Reason Modal */}
      {showBlacklistModal && (
        <div className="modal" style={{ zIndex: 10000 }} onClick={() => { setShowBlacklistModal(false); setBlacklistReason(''); }}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modalHeader">
              <h2 className="modalTitle">Blacklist User</h2>
              <button className="modalCloseButton" onClick={() => { setShowBlacklistModal(false); setBlacklistReason(''); }}>×</button>
            </div>
            <div className="modalBody">
              <p style={{ marginBottom: '12px', color: '#6b7280' }}>
                You are about to blacklist <strong>{patron.full_name || patron.email}</strong>. Please provide a reason:
              </p>
              <textarea
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                placeholder="Enter reason for blacklisting..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
              <p style={{ marginTop: '12px', fontSize: '13px', color: '#dc2626' }}>
                ⚠️ Blacklisted users will not be able to reserve books.
              </p>
            </div>
            <div className="modalFooter">
              <button 
                className="buttonSecondary" 
                onClick={() => { setShowBlacklistModal(false); setBlacklistReason(''); }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                className="buttonPrimary" 
                onClick={handleConfirmBlacklist}
                disabled={isLoading || !blacklistReason.trim()}
                style={{ background: '#dc2626' }}
              >
                {isLoading ? 'Processing...' : 'Blacklist User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminPatronsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [faculty, setFaculty] = useState("all")
  const [blacklistFilter, setBlacklistFilter] = useState("all")
  const [sortBy, setSortBy] = useState("az")
  const [expandedId, setExpandedId] = useState(null)
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedPatron, setSelectedPatron] = useState(null)
  const [patronDetails, setPatronDetails] = useState(null)
  const [patronLoans, setPatronLoans] = useState([])
  const [patronEnrollments, setPatronEnrollments] = useState([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const containerRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setExpandedId(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")
      const usersData = await getUsers()
      setUsers(usersData)
    } catch (err) {
      console.error('Failed to load users:', err)
      setError(err.message || 'Failed to load patrons')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          setIsLoading(true)
          const results = await searchUsers(searchQuery)
          setUsers(results)
        } catch (err) {
          console.error('Search failed:', err)
          setError(err.message || 'Search failed')
        } finally {
          setIsLoading(false)
        }
      }, 500)
    } else {
      loadUsers()
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, loadUsers])

  const filteredAndSortedPatrons = useMemo(() => {
    let filtered = [...users]

    // Filter by role (exclude admins from patron list)
    filtered = filtered.filter(user => user.role !== 'admin')

    if (faculty !== "all") {
      filtered = filtered.filter((patron) => patron.role === faculty)
    }

    // Filter by blacklist status
    if (blacklistFilter === "blacklisted") {
      filtered = filtered.filter((patron) => patron.is_blacklisted === true)
    } else if (blacklistFilter === "non-blacklisted") {
      filtered = filtered.filter((patron) => !patron.is_blacklisted)
    }

    if (sortBy === "az") {
      filtered.sort((a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email))
    } else if (sortBy === "za") {
      filtered.sort((a, b) => (b.full_name || b.email).localeCompare(a.full_name || a.email))
    }

    return filtered
  }, [users, faculty, blacklistFilter, sortBy])

  const handleViewDetails = async (patron) => {
    setSelectedPatron(patron)
    setIsLoadingDetails(true)
    try {
      // Fetch full patron details, loan history, and enrollments
      const [details, loans] = await Promise.all([
        getUser(patron.id),
        getUserLoans(patron.id)
      ])
      setPatronDetails(details)
      setPatronLoans(loans)
      
      // Fetch enrollments if student
      if (details.role === 'student') {
        try {
          const enrollments = await getStudentEnrollments(patron.id)
          setPatronEnrollments(enrollments)
        } catch (err) {
          console.error('Failed to fetch enrollments:', err)
          setPatronEnrollments([])
        }
      } else {
        setPatronEnrollments([])
      }
    } catch (err) {
      console.error('Failed to fetch patron details:', err)
      toast.error('Failed to load patron details')
      setPatronDetails(patron) // Fallback to basic info
      setPatronLoans([])
      setPatronEnrollments([])
    } finally {
      setIsLoadingDetails(false)
    }
  }

  return (
    <div className="adminPatronsContainer" ref={containerRef}>
      <div className="adminPatronsHeader">
        <h1 className="adminPatronsTitle">Patrons</h1>

        <div className="adminPatronsControls">
          <select className="adminPatronsSelect" value={faculty} onChange={(e) => setFaculty(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="professor">Professors</option>
            <option value="ta">Teaching Assistants</option>
          </select>

          <select className="adminPatronsSelect" value={blacklistFilter} onChange={(e) => setBlacklistFilter(e.target.value)}>
            <option value="all">All Patrons</option>
            <option value="blacklisted">Blacklisted Only</option>
            <option value="non-blacklisted">Non-Blacklisted</option>
          </select>

          <select className="adminPatronsSelect" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="az">A-Z</option>
            <option value="za">Z-A</option>
          </select>

          <div className="adminPatronsSearchWrapper">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="adminPatronsSearchInput"
            />
            <button className="adminPatronsSearchIcon">
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

      <div className="adminPatronsContent">
        {error && (
          <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
            {error}
            <button onClick={loadUsers} style={{ marginLeft: '10px' }}>Retry</button>
          </div>
        )}
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>Loading patrons...</p>
          </div>
        ) : filteredAndSortedPatrons.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>No patrons found</p>
          </div>
        ) : (
          <div className="adminPatronsList">
            {filteredAndSortedPatrons.map((patron) => (
              <PatronCard 
                key={patron.id} 
                patron={patron} 
                expandedId={expandedId} 
                onToggle={setExpandedId} 
                onUpdate={loadUsers} 
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Patron Detail Modal */}
      {selectedPatron && (
        <div className="modal" onClick={() => { setSelectedPatron(null); setPatronDetails(null); setPatronLoans([]); setPatronEnrollments([]); }}>
          <div 
            className="modalContent" 
            style={{ maxWidth: '900px', maxHeight: '80vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modalHeader">
              <h2 className="modalTitle">Patron Details</h2>
              <button 
                className="modalCloseButton" 
                onClick={() => { setSelectedPatron(null); setPatronDetails(null); setPatronLoans([]); setPatronEnrollments([]); }}
              >
                ×
              </button>
            </div>

            <div className="modalBody">
              {isLoadingDetails ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Spinner size="large" />
                  <p style={{ marginTop: '16px' }}>Loading patron information...</p>
                </div>
              ) : patronDetails ? (
                <>
                  {/* Personal Information */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
                      Personal Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Full Name</label>
                        <p style={{ margin: 0, fontWeight: '500' }}>{patronDetails.full_name || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>University ID</label>
                        <p style={{ margin: 0, fontWeight: '500' }}>{patronDetails.university_id || 'N/A'}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Email</label>
                        <p style={{ margin: 0, fontWeight: '500' }}>{patronDetails.email}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Role</label>
                        <p style={{ margin: 0, fontWeight: '500', textTransform: 'capitalize' }}>{patronDetails.role}</p>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Status</label>
                        <p style={{ margin: 0, fontWeight: '500' }}>
                          {patronDetails.is_blacklisted ? (
                            <span style={{ color: '#dc2626' }}>⛔ Blacklisted</span>
                          ) : (
                            <span style={{ color: '#10b981' }}>✓ Active</span>
                          )}
                        </p>
                      </div>
                      {patronDetails.faculty && (
                        <div>
                          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Faculty</label>
                          <p style={{ margin: 0, fontWeight: '500' }}>{patronDetails.faculty}</p>
                        </div>
                      )}
                      {patronDetails.academic_year && (
                        <div>
                          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Academic Year</label>
                          <p style={{ margin: 0, fontWeight: '500' }}>Year {patronDetails.academic_year}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enrolled Courses */}
                  {patronDetails.role === 'student' && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
                        Enrolled Courses ({patronEnrollments.length})
                      </h3>
                      {patronEnrollments.length === 0 ? (
                        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No enrolled courses</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                          {patronEnrollments.map((enrollment, index) => (
                            <div 
                              key={index}
                              style={{ 
                                background: '#dbeafe', 
                                padding: '12px', 
                                borderRadius: '8px',
                                border: '1px solid #93c5fd'
                              }}
                            >
                              <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#1e40af' }}>
                                {enrollment.course_code}
                              </p>
                              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#1e3a8a' }}>
                                {enrollment.course_name}
                              </p>
                              <p style={{ margin: 0, fontSize: '12px', color: '#3b82f6' }}>
                                {enrollment.semester}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Statistics */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
                      Statistics
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>
                          {patronLoans.filter(l => l.status === 'active' || l.status === 'overdue').length}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Active Loans</p>
                      </div>
                      <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                          {patronLoans.length}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Total Loans</p>
                      </div>
                    </div>
                  </div>

                  {/* Active Loans */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
                      Currently Borrowed ({patronLoans.filter(l => l.status === 'active').length})
                    </h3>
                    {patronLoans.filter(l => l.status === 'active').length === 0 ? (
                      <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No active loans</p>
                    ) : (
                      <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600' }}>Book</th>
                              <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600' }}>Borrowed</th>
                              <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600' }}>Due Date</th>
                              <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patronLoans.filter(l => l.status === 'active').map((loan) => (
                              <tr key={loan.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '8px' }}>
                                  <div>
                                    <p style={{ margin: 0, fontWeight: '500' }}>{loan.book_title || 'Unknown Book'}</p>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Copy #{loan.copy_accession_number || loan.book_copy_id}</p>
                                  </div>
                                </td>
                                <td style={{ padding: '8px', color: '#6b7280' }}>
                                  {loan.loan_date ? new Date(loan.loan_date).toLocaleDateString() : 'N/A'}
                                </td>
                                <td style={{ padding: '8px' }}>
                                  {loan.due_date ? (
                                    <span style={{ 
                                      color: new Date(loan.due_date) < new Date() ? '#dc2626' : '#6b7280'
                                    }}>
                                      {new Date(loan.due_date).toLocaleDateString()}
                                    </span>
                                  ) : 'N/A'}
                                </td>
                                <td style={{ padding: '8px' }}>
                                  {loan.is_overdue ? (
                                    <span style={{ color: '#dc2626', fontWeight: '500' }}>⚠️ Overdue</span>
                                  ) : (
                                    <span style={{ color: '#10b981' }}>✓ Active</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Loan History */}
                  <div>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
                      Loan History ({patronLoans.length} total)
                    </h3>
                    {patronLoans.length === 0 ? (
                      <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No loan history</p>
                    ) : (
                      <div style={{ maxHeight: '250px', overflow: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: 'white' }}>
                              <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600' }}>Book</th>
                              <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600' }}>Date</th>
                              <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patronLoans.slice().reverse().map((loan) => (
                              <tr key={loan.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '8px' }}>
                                  <div>
                                    <p style={{ margin: 0, fontWeight: '500' }}>{loan.book_title || 'Unknown Book'}</p>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Copy #{loan.copy_accession_number || loan.book_copy_id}</p>
                                  </div>
                                </td>
                                <td style={{ padding: '8px', color: '#6b7280', fontSize: '12px' }}>
                                  {loan.loan_date ? new Date(loan.loan_date).toLocaleDateString() : 
                                   loan.request_date ? new Date(loan.request_date).toLocaleDateString() : 'N/A'}
                                  {loan.status === 'returned' && loan.return_date && 
                                    ` → ${new Date(loan.return_date).toLocaleDateString()}`}
                                  {loan.status === 'active' && loan.due_date && 
                                    ` → ${new Date(loan.due_date).toLocaleDateString()}`}
                                </td>
                                <td style={{ padding: '8px' }}>
                                  <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    background: 
                                      loan.status === 'active' ? '#dcfce7' :
                                      loan.status === 'returned' ? '#f3f4f6' :
                                      loan.status === 'pending' ? '#fef3c7' :
                                      loan.status === 'rejected' ? '#fee2e2' :
                                      '#fecaca',
                                    color:
                                      loan.status === 'active' ? '#166534' :
                                      loan.status === 'returned' ? '#6b7280' :
                                      loan.status === 'pending' ? '#92400e' :
                                      loan.status === 'rejected' ? '#991b1b' :
                                      '#991b1b'
                                  }}>
                                    {loan.status === 'active' ? 'Active' :
                                     loan.status === 'returned' ? 'Returned' :
                                     loan.status === 'pending' ? 'Pending' :
                                     loan.status === 'rejected' ? 'Rejected' :
                                     loan.status === 'overdue' ? 'Overdue' :
                                     loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p style={{ color: '#6b7280' }}>Failed to load patron details</p>
              )}
            </div>

            <div className="modalFooter">
              <button 
                className="buttonPrimary" 
                onClick={() => { setSelectedPatron(null); setPatronDetails(null); setPatronLoans([]); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPatronsPage

