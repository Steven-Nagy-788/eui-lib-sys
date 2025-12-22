"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { getUsers, searchUsers, clearInfractions, addToBlacklist, removeFromBlacklist } from "../api/usersService"
import toast from "../utils/toast"
import "../assets/AdminPages.css"

const mockPatrons = [
  {
    id: "21-101010",
    name: "Student Full Name",
    type: "Student",
    faculty: "Computer and Informational Sciences",
    year: 4,
    booksOwned: 2,
    booksBorrowed: 4,
    infractions: 0,
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
    infractions: 0,
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
    infractions: 2,
    blacklisted: false,
  },
]

function PatronCard({ patron, expandedId, onToggle, onUpdate }) {
  const [infractions, setInfractions] = useState("")
  const [loanPeriod, setLoanPeriod] = useState("")
  const [isBlacklisted, setIsBlacklisted] = useState(patron.is_blacklisted || false)
  const [isLoading, setIsLoading] = useState(false)
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

  const handleRemoveInfractions = async () => {
    if (!infractions || parseInt(infractions) <= 0) {
      toast.warning('Please enter a valid number of infractions to remove')
      return
    }
    
    try {
      setIsLoading(true)
      await clearInfractions(patron.id, parseInt(infractions))
      toast.success('Infractions cleared successfully')
      setInfractions("")
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to clear infractions:', error)
      toast.error(error.message || 'Failed to clear infractions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBlacklist = async () => {
    const action = isBlacklisted ? 'whitelist' : 'blacklist'
    const reason = isBlacklisted ? '' : prompt('Enter reason for blacklisting:')
    
    if (!isBlacklisted && !reason) {
      return // User cancelled
    }
    
    try {
      setIsLoading(true)
      if (isBlacklisted) {
        await removeFromBlacklist(patron.id)
        toast.success('User whitelisted successfully')
      } else {
        await addToBlacklist(patron.id, reason)
        toast.success('User blacklisted successfully')
      }
      setIsBlacklisted(!isBlacklisted)
      setInfractions("")
      setLoanPeriod("")
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
      toast.error(error.message || `Failed to ${action} user`)
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
              <span className="patronBasicInfoLabel">Infractions:</span>
              <span className="patronBasicInfoValue">{patron.infractions || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="patronCardExpanded">
          <div className="patronExpandedContent">
            <div className="patronExpandedRow">
              <label className="patronInputLabel">Remove Infractions:</label>
              <input
                type="number"
                placeholder="Enter number"
                value={infractions}
                onChange={(e) => setInfractions(e.target.value)}
                className="patronInput"
              />
              <button onClick={handleRemoveInfractions} className="patronEnterButton" disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Enter'}
              </button>
            </div>

            <div className="patronExpandedRow">
              <label className="patronInputLabel">Extend Loan Period:</label>
              <input
                type="number"
                placeholder="Enter days"
                value={loanPeriod}
                onChange={(e) => setLoanPeriod(e.target.value)}
                className="patronInput"
                disabled={true}
                title="Feature coming soon"
              />
              <button
                onClick={handleBlacklist}
                className={isBlacklisted ? "patronWhitelistButton" : "patronBlacklistButton"}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : (isBlacklisted ? "Whitelist" : "Blacklist")}
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
  const [sortBy, setSortBy] = useState("az")
  const [expandedId, setExpandedId] = useState(null)
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
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

    if (sortBy === "az") {
      filtered.sort((a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email))
    } else if (sortBy === "za") {
      filtered.sort((a, b) => (b.full_name || b.email).localeCompare(a.full_name || a.email))
    }

    return filtered
  }, [users, faculty, sortBy])

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
              <PatronCard key={patron.id} patron={patron} expandedId={expandedId} onToggle={setExpandedId} onUpdate={loadUsers} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPatronsPage

