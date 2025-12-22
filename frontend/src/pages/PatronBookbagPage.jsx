"use client"

import { useState } from "react"
import "../assets/PatronPages.css"

function PatronBookbagPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("all")

  const borrowedBooks = [
    {
      id: 1,
      title: "Understanding Calculus Second Edition",
      author: "H. S. Bear",
      course: "C-MA111",
      publisher: "Wiley-IEEE Press",
      isbn: "978-0-471-43307-1",
      image: "/calculus-textbook-blue-orange.jpg",
      bookingDate: "10/12/25",
      returnDate: "17/12/25",
      status: "Owned",
      daysLeft: 2,
    },
    {
      id: 2,
      title: "Understanding Calculus Second Edition",
      author: "H. S. Bear",
      course: "C-MA111",
      publisher: "Wiley-IEEE Press",
      isbn: "978-0-471-43307-1",
      image: "/calculus-textbook-blue-orange.jpg",
      bookingDate: "10/12/25",
      returnDate: "17/12/25",
      status: "Overdue",
      daysLeft: -10,
    },
    {
      id: 3,
      title: "Digital Logic Design",
      author: "M. Morris Mano",
      course: "C-CE102",
      publisher: "Pearson",
      isbn: "978-0-13-277420-8",
      image: "/digital-logic-textbook.jpg",
      bookingDate: "15/12/25",
      returnDate: "22/12/25",
      status: "Pending Pickup",
      daysLeft: 5, // Added daysLeft for pending pickup status
    },
  ]

  const handleCancelReservation = (bookId) => {
    console.log(`Canceling reservation for book ${bookId}`)
    // Logic to cancel reservation would go here
  }

  const filteredBooks = borrowedBooks.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.course.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = sortBy === "all" || book.status.toLowerCase().replace(" ", "") === sortBy.toLowerCase()
    return matchesSearch && matchesStatus
  })

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
        <div className="scrollableContent">
          {filteredBooks.map((book) => (
            <div key={book.id} className="bookCard">
              <img src={book.image || "/placeholder.svg"} alt={book.title} className="bookImage" />
              <div className="bookContent">
                <h3 className="bookTitle">{book.title}</h3>
                <p className="bookAuthor">{book.author}</p>
                <div className="bookDetailsBox">
                  <div className="bookDetailsLeft">
                    <p className="detailRow">
                      <span className="detailLabel">Course:</span>
                      <span className="detailValue">{book.course}</span>
                    </p>
                    <p className="detailRow">
                      <span className="detailLabel">Publisher:</span>
                      <span className="detailValue">{book.publisher}</span>
                    </p>
                    <p className="detailRow">
                      <span className="detailLabel">ISBN:</span>
                      <span className="detailValue">{book.isbn}</span>
                    </p>
                  </div>
                  <div className="bookDetailsCenter">
                    <p className="detailRow">
                      <span className="detailLabel">Booking Date:</span>
                      <span className="detailValue">{book.bookingDate}</span>
                    </p>
                    <p className="detailRow">
                      <span className="detailLabel">Return Date:</span>
                      <span className="detailValue">{book.returnDate}</span>
                    </p>
                  </div>
                  <div className="bookDetailsRight">
                    <p className="detailRow">
                      <span className="detailLabel">Status:</span>
                      <span
                        className={`statusBadge ${
                          book.status === "Owned"
                            ? "statusOwned"
                            : book.status === "Overdue"
                              ? "statusOverdue"
                              : "statusPending"
                        }`}
                      >
                        {book.status}
                      </span>
                    </p>
                    {book.daysLeft !== null && (
                      <p className="detailRow">
                        <span className="detailLabel">Days Left:</span>
                        <span className={`detailValue ${book.daysLeft < 0 ? "daysOverdue" : ""}`}>{book.daysLeft}</span>
                      </p>
                    )}
                    {book.status === "Pending Pickup" && (
                      <button onClick={() => handleCancelReservation(book.id)} className="cancelReservationButton">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PatronBookbagPage
