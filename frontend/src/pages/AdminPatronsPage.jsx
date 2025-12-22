"use client"

import { useState, useMemo, useEffect, useRef } from "react"
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

function PatronCard({ patron, expandedId, onToggle }) {
  const [infractions, setInfractions] = useState("")
  const [loanPeriod, setLoanPeriod] = useState("")
  const [isBlacklisted, setIsBlacklisted] = useState(patron.blacklisted)
  const expanded = expandedId === patron.id
  const cardRef = useRef(null)

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
  }

  const handleToggle = () => {
    onToggle(expanded ? null : patron.id)
  }

  const handleRemoveInfractions = () => {
    console.log("Removing infractions:", infractions)
    setInfractions("")
    setLoanPeriod("")
  }

  const handleBlacklist = () => {
    setIsBlacklisted(!isBlacklisted)
    setInfractions("")
    setLoanPeriod("")
  }

  return (
    <div className="patronCard" ref={cardRef}>
      <div className="patronCardHeader">
        <div className="patronAvatar">{getInitials(patron.name)}</div>

        <div className="patronHeaderContent">
          <button onClick={handleToggle} className="patronExpandButton">
            <div className="patronHeaderInfo">
              <div className="patronNameContainer">
                <h3 className="patronName">{patron.name}</h3>
                {isBlacklisted && <span className="patronBlacklistIndicator" />}
              </div>
              <p className="patronType">{patron.type} ID</p>
            </div>
            <span className="patronExpandIcon">{expanded ? "▲" : "▼"}</span>
          </button>

          <div className="patronBasicInfo">
            <div className="patronBasicInfoRow">
              <span className="patronBasicInfoLabel">Faculty:</span>
              <p className="patronBasicInfoValue">{patron.faculty}</p>
              {patron.year && (
                <>
                  <span className="patronBasicInfoSeparator">|</span>
                  <span className="patronBasicInfoLabel">Year:</span>
                  <p className="patronBasicInfoValue">{patron.year}</p>
                </>
              )}
            </div>
            <div className="patronBasicInfoRow">
              <span className="patronBasicInfoLabel">Books Currently Owned:</span>
              <span className="patronBasicInfoValue">{patron.booksOwned}</span>
              <span className="patronBasicInfoLabel">Books Previously Owned:</span>
              <span className="patronBasicInfoValue">{patron.booksBorrowed}</span>
              <span className="patronBasicInfoLabel">Infractions:</span>
              <span className="patronBasicInfoValue">{patron.infractions}</span>
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
              <button onClick={handleRemoveInfractions} className="patronEnterButton">
                Enter
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
              />
              <button
                onClick={handleBlacklist}
                className={isBlacklisted ? "patronWhitelistButton" : "patronBlacklistButton"}
              >
                {isBlacklisted ? "Whitelist" : "Blacklist"}
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
  const containerRef = useRef(null)

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

  const filteredAndSortedPatrons = useMemo(() => {
    let filtered = [...mockPatrons]

    if (searchQuery) {
      filtered = filtered.filter(
        (patron) =>
          patron.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patron.id.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (faculty !== "all") {
      filtered = filtered.filter((patron) => patron.faculty.toLowerCase().includes(faculty.toLowerCase()))
    }

    if (sortBy === "az") {
      filtered.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === "za") {
      filtered.sort((a, b) => b.name.localeCompare(a.name))
    }

    return filtered
  }, [searchQuery, faculty, sortBy])

  return (
    <div className="adminPatronsContainer" ref={containerRef}>
      <div className="adminPatronsHeader">
        <h1 className="adminPatronsTitle">Patrons</h1>

        <div className="adminPatronsControls">
          <select className="adminPatronsSelect" value={faculty} onChange={(e) => setFaculty(e.target.value)}>
            <option value="all">All Faculties</option>
            <option value="Computer and Informational Sciences">Computer and Informational Sciences</option>
            <option value="Engineering">Engineering</option>
            <option value="Business Informatics">Business Informatics</option>
            <option value="Digital Arts and Design">Digital Arts and Design</option>
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
        <div className="adminPatronsList">
          {filteredAndSortedPatrons.map((patron) => (
            <PatronCard key={patron.id} patron={patron} expandedId={expandedId} onToggle={setExpandedId} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminPatronsPage

