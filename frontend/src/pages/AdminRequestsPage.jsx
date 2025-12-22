"use client"

import { useState, useMemo } from "react"
import "../assets/AdminPages.css"

const mockRequests = [
  {
    id: 1,
    studentName: "Student Full Name",
    studentId: "21-101010",
    bookTitle: "Understanding Calculus Second Edition",
    days: 7,
    reserveDate: "10/12/25",
    dueDate: "17/12/25",
  },
  {
    id: 2,
    studentName: "Student Full Name",
    studentId: "21-101010",
    bookTitle: "Understanding Calculus Second Edition",
    days: 14,
    reserveDate: "10/12/25",
    dueDate: "24/12/25",
  },
  {
    id: 3,
    studentName: "Student Full Name",
    studentId: "21-101010",
    bookTitle: "Understanding Calculus Second Edition",
    days: 7,
    reserveDate: "10/12/25",
    dueDate: "17/12/25",
  },
]

function AdminRequestsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("earliest")

  const filteredAndSortedRequests = useMemo(() => {
    let filtered = [...mockRequests]

    if (searchQuery) {
      filtered = filtered.filter(
        (request) =>
          request.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.studentId.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (sortBy === "earliest") {
      filtered.sort((a, b) => new Date(a.reserveDate) - new Date(b.reserveDate))
    } else if (sortBy === "latest") {
      filtered.sort((a, b) => new Date(b.reserveDate) - new Date(a.reserveDate))
    }

    return filtered
  }, [searchQuery, sortBy])

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
        <div className="adminRequestsList">
          {filteredAndSortedRequests.map((request) => (
            <div key={request.id} className="requestCard">
              <div className="requestCardInfo">
                <div className="requestInfoRow">
                  <div className="requestInfoItem">
                    <span className="requestInfoLabel">Name:</span>
                    <p className="requestInfoValue">{request.studentName}</p>
                  </div>
                  <div className="requestInfoItem">
                    <span className="requestInfoLabel">ID:</span>
                    <p className="requestInfoValue">{request.studentId}</p>
                  </div>
                </div>

                <div className="requestInfoItem">
                  <span className="requestInfoLabel">Book:</span>
                  <p className="requestInfoValue">{request.bookTitle}</p>
                </div>

                <div className="requestInfoRow">
                  <div className="requestInfoItem">
                    <span className="requestInfoLabel">Days:</span>
                    <p className="requestInfoValue">{request.days}</p>
                  </div>
                  <div className="requestInfoItem">
                    <span className="requestInfoLabel">Reserve Date:</span>
                    <p className="requestInfoValue">{request.reserveDate}</p>
                  </div>
                  <div className="requestInfoItem">
                    <span className="requestInfoLabel">Due Date:</span>
                    <p className="requestInfoValue">{request.dueDate}</p>
                  </div>
                </div>
              </div>

              <div className="requestCardButtons">
                <button className="requestAcceptButton">Accept</button>
                <button className="requestRejectButton">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminRequestsPage
