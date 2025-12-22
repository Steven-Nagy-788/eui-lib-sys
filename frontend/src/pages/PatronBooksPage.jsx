"use client"

import { useState } from "react"
import "../assets/PatronPages.css"

function PatronBooksPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState("a-z")
  const [facultyFilter, setFacultyFilter] = useState("all")
  const [selectedBook, setSelectedBook] = useState(null)
  const [reservationDays, setReservationDays] = useState("")

  const books = [
    {
      id: 1,
      title: "Understanding Calculus Second Edition",
      author: "H. S. Bear",
      course: "C-MA111",
      publisher: "Wiley-IEEE Press",
      isbn: "978-0-471-43307-1",
      available: 3,
      total: 5,
      image: "/calculus-textbook-blue-orange.jpg",
      faculty: "Computer and Informational Sciences",
      year: "2015",
    },
    {
      id: 2,
      title: "Introduction to Algorithms",
      author: "Thomas H. Cormen",
      course: "C-CS201",
      publisher: "MIT Press",
      isbn: "978-0-262-03384-8",
      available: 5,
      total: 8,
      image: "/algorithms-textbook.jpg",
      faculty: "Computer and Informational Sciences",
      year: "2009",
    },
    {
      id: 3,
      title: "Digital Logic Design",
      author: "M. Morris Mano",
      course: "C-CE102",
      publisher: "Pearson",
      isbn: "978-0-13-277420-8",
      available: 2,
      total: 4,
      image: "/digital-logic-textbook.jpg",
      faculty: "Computer and Informational Sciences",
      year: "2017",
    },
    {
      id: 4,
      title: "Engineering Mechanics Statics",
      author: "J.L. Meriam",
      course: "E-ME101",
      publisher: "Wiley",
      isbn: "978-1-118-80711-0",
      available: 4,
      total: 7,
      image: "/engineering-mechanics-textbook.jpg",
      faculty: "Engineering",
      year: "2018",
    },
    {
      id: 5,
      title: "Business Intelligence and Analytics",
      author: "Ramesh Sharda",
      course: "BI-BA201",
      publisher: "Pearson",
      isbn: "978-0-13-461759-0",
      available: 6,
      total: 10,
      image: "/business-intelligence-textbook.jpg",
      faculty: "Business Informatics",
      year: "2020",
    },
    {
      id: 6,
      title: "Digital Design Principles",
      author: "David Harris",
      course: "DA-CS102",
      publisher: "Morgan Kaufmann",
      isbn: "978-0-12-800056-4",
      available: 2,
      total: 5,
      image: "/digital-design-textbook.jpg",
      faculty: "Digital Arts and Design",
      year: "2019",
    },
  ]

  const filteredBooks = books
    .filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.course.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFaculty = facultyFilter === "all" || book.faculty === facultyFilter
      return matchesSearch && matchesFaculty
    })
    .sort((a, b) => {
      if (sortOrder === "a-z") {
        return a.title.localeCompare(b.title)
      } else {
        return b.title.localeCompare(a.title)
      }
    })

  const handleReserve = (book) => {
    setSelectedBook(book)
    setReservationDays("")
  }

  const handleConfirmReservation = () => {
    if (!reservationDays || reservationDays <= 0) {
      alert("Please enter a valid number of days")
      return
    }
    alert(`Reservation confirmed for ${selectedBook.title} for ${reservationDays} days`)
    setSelectedBook(null)
    setReservationDays("")
  }

  const getReserveDate = () => {
    const today = new Date()
    return today.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })
  }

  const getReturnDate = () => {
    if (!reservationDays || reservationDays <= 0) return "--/--/--"
    const today = new Date()
    const returnDate = new Date(today.getTime() + reservationDays * 24 * 60 * 60 * 1000)
    return returnDate.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })
  }

  return (
    <div className="pageContent">
      <div className="pageHeaderCard">
        <div className="pageHeaderContent">
          <h1>Books</h1>
          <div className="controlsContainer">
            <select value={facultyFilter} onChange={(e) => setFacultyFilter(e.target.value)} className="selectInput">
              <option value="all">All Faculties</option>
              <option value="Computer and Informational Sciences">Computer and Informational Sciences</option>
              <option value="Engineering">Engineering</option>
              <option value="Business Informatics">Business Informatics</option>
              <option value="Digital Arts and Design">Digital Arts and Design</option>
            </select>

            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="selectInput">
              <option value="a-z">A-Z</option>
              <option value="z-a">Z-A</option>
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
            <div key={book.id} className="patronBookCard">
              <img src={book.image || "/placeholder.svg"} alt={book.title} className="patronBookImage" />

              <div className="patronBookDetails">
                <h3 className="patronBookTitle">{book.title}</h3>
                <p className="patronBookAuthor">{book.author}</p>

                <div className="patronBookInfo">
                  <div className="patronBookInfoGrid">
                    <div className="patronBookInfoItem">
                      <span className="patronBookInfoLabel">Course:</span>
                      <p className="patronBookInfoValue">{book.course}</p>
                    </div>
                    <div className="patronBookInfoItem">
                      <span className="patronBookInfoLabel">Publisher:</span>
                      <p className="patronBookInfoValue">{book.publisher}</p>
                    </div>
                    <div className="patronBookInfoItem">
                      <span className="patronBookInfoLabel">ISBN:</span>
                      <p className="patronBookInfoValue">{book.isbn}</p>
                    </div>
                  </div>

                  <div className="patronBookAvailability">
                    <span className="patronBookAvailableBadge">Available</span>
                    <span className="patronBookAvailableCount">{book.available}</span>
                    <button
                      onClick={() => handleReserve(book)}
                      className="patronReserveButton"
                      disabled={book.available === 0}
                    >
                      Reserve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedBook && (
        <div className="reservationModalOverlay" onClick={() => setSelectedBook(null)}>
          <div className="reservationModalContent" onClick={(e) => e.stopPropagation()}>
            <h2 className="reservationModalTitle">Reserving:</h2>
            <h3 className="reservationModalBookTitle">{selectedBook.title}</h3>

            <div className="reservationModalBody">
              <div className="reservationInputGroup">
                <label className="reservationLabel">Days:</label>
                <input
                  type="number"
                  min="1"
                  value={reservationDays}
                  onChange={(e) => setReservationDays(e.target.value)}
                  className="reservationInput"
                  placeholder="Enter days"
                />
              </div>

              <div className="reservationDatesGroup">
                <div className="reservationDateItem">
                  <span className="reservationDateLabel">Reserve Date:</span>
                  <span className="reservationDateValue">{getReserveDate()}</span>
                </div>
                <div className="reservationDateItem">
                  <span className="reservationDateLabel">Return Date:</span>
                  <span className="reservationDateValue">{getReturnDate()}</span>
                </div>
              </div>
            </div>

            <button onClick={handleConfirmReservation} className="reservationSubmitButton">
              Submit Request
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatronBooksPage
