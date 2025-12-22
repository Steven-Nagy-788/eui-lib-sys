"use client"

import { useState } from "react"
import "../assets/AdminPages.css"

const mockCirculation = [
  {
    id: 1,
    bookTitle: "Understanding Calculus Second Edition",
    author: "H. S. Bear",
    studentName: "Student Full Name",
    studentId: "21-101010",
    status: "pending",
    image: "/calculus-textbook-blue-orange.jpg",
  },
  {
    id: 2,
    bookTitle: "Understanding Calculus Second Edition",
    author: "H. S. Bear",
    studentName: "Student Full Name",
    studentId: "21-101010",
    status: "owned",
    image: "/calculus-textbook-blue-orange.jpg",
  },
  {
    id: 3,
    bookTitle: "Understanding Calculus Second Edition",
    author: "H. S. Bear",
    studentName: "Student Full Name",
    studentId: "21-101010",
    status: "overdue",
    image: "/calculus-textbook-blue-orange.jpg",
  },
]

function CirculationCard({ item }) {
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
  }

  const getStatusBadge = () => {
    switch (item.status) {
      case "pending":
        return <span className="circulationStatusPending">Pending Pickup</span>
      case "owned":
        return <span className="circulationStatusOwned">With Patron</span>
      case "overdue":
        return <span className="circulationStatusOverdue">Overdue</span>
      default:
        return null
    }
  }

  const getButtons = () => {
    if (item.status === "pending") {
      return (
        <div className="circulationButtons">
          <button className="circulationCancelButton">Cancel</button>
          <button className="circulationPickedUpButton">Picked Up</button>
        </div>
      )
    }
    if (item.status === "owned" || item.status === "overdue") {
      return <button className="circulationReturnedButton">Returned</button>
    }
    return null
  }

  return (
    <div className="circulationCard">
      <img src={item.image || "/placeholder.svg"} alt={item.bookTitle} className="circulationBookImage" />

      <div className="circulationCardContent">
        <h3 className="circulationBookTitle">{item.bookTitle}</h3>
        <p className="circulationBookAuthor">{item.author}</p>

        <div className="circulationDetails">
          <div className="circulationPatronInfo">
            <div className="circulationPatronText">
              <p className="circulationReservedBy">Reserved by</p>
              <p className="circulationPatronName">{item.studentName}</p>
              <p className="circulationPatronId">Student ID: {item.studentId}</p>
            </div>

            <div className="circulationPatronAvatar">{getInitials(item.studentName)}</div>
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

  const filteredCirculation = mockCirculation.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesSearch =
      searchQuery === "" ||
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.studentId.toLowerCase().includes(searchQuery.toLowerCase())
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
            <option value="owned">With Patron</option>
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
        <div className="adminCirculationList">
          {filteredCirculation.map((item) => (
            <CirculationCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminCirculationPage
