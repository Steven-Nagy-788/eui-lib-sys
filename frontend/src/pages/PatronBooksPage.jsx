"use client"

import { useState, useEffect, useMemo } from "react"
import { getBooks, searchBooks } from "../api/booksService"
import { getCopiesByBook } from "../api/bookCopiesService"
import { createLoanRequest } from "../api/loansService"
import { getUserFromToken } from "../api/authService"
import toast from "../utils/toast"
import "../assets/PatronPages.css"

function PatronBooksPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState("a-z")
  const [facultyFilter, setFacultyFilter] = useState("all")
  const [selectedBook, setSelectedBook] = useState(null)
  const [books, setBooks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isReserving, setIsReserving] = useState(false)
  const [selectedCopyId, setSelectedCopyId] = useState(null)

  const currentUser = getUserFromToken()

  useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = async () => {
    try {
      setIsLoading(true)
      setError("")
      const data = await getBooks(0, 1000)
      
      // Fetch available copies for each book
      const booksWithAvailability = await Promise.all(
        data.map(async (book) => {
          try {
            const copies = await getCopiesByBook(book.id, true)
            return {
              ...book,
              available: copies.length,
              copies: copies,
            }
          } catch (err) {
            return {
              ...book,
              available: 0,
              copies: [],
            }
          }
        })
      )
      
      setBooks(booksWithAvailability)
    } catch (err) {
      console.error('Failed to load books:', err)
      setError(err.message || 'Failed to load books')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle search with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      loadBooks()
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsLoading(true)
        const data = await searchBooks(searchQuery)
        
        const booksWithAvailability = await Promise.all(
          data.map(async (book) => {
            try {
              const copies = await getCopiesByBook(book.id, true)
              return {
                ...book,
                available: copies.length,
                copies: copies,
              }
            } catch (err) {
              return {
                ...book,
                available: 0,
                copies: [],
              }
            }
          })
        )
        
        setBooks(booksWithAvailability)
      } catch (err) {
        console.error('Search failed:', err)
        setError(err.message || 'Search failed')
      } finally {
        setIsLoading(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const filteredBooks = useMemo(() => {
    let filtered = [...books]

    if (facultyFilter !== "all") {
      // Note: Faculty filtering would require course data integration
    }

    filtered.sort((a, b) => {
      if (sortOrder === "a-z") {
        return a.title.localeCompare(b.title)
      } else {
        return b.title.localeCompare(a.title)
      }
    })

    return filtered
  }, [books, sortOrder, facultyFilter])

  const handleReserve = (book) => {
    if (book.available === 0) {
      toast.error('No copies available')
      return
    }
    setSelectedBook(book)
    setSelectedCopyId(book.copies[0]?.id || null)
  }

  const handleConfirmReservation = async () => {
    if (!selectedCopyId) {
      toast.error('No copy selected')
      return
    }

    try {
      setIsReserving(true)
      await createLoanRequest(selectedCopyId)
      toast.success(`Reservation submitted for ${selectedBook.title}. Awaiting approval.`)
      setSelectedBook(null)
      setSelectedCopyId(null)
      loadBooks()
    } catch (err) {
      console.error('Reservation failed:', err)
      toast.error(err.message || 'Failed to create reservation request')
    } finally {
      setIsReserving(false)
    }
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
        {error && (
          <div className="errorMessage" style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
            {error}
            <button onClick={loadBooks} style={{ marginLeft: '10px' }}>Retry</button>
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>Loading books...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>No books found</p>
          </div>
        ) : (
          <div className="scrollableContent">
            {filteredBooks.map((book) => (
              <div key={book.id} className="patronBookCard">
                <img src={book.book_pic_url || "/placeholder.svg"} alt={book.title} className="patronBookImage" 
                     onError={(e) => { e.target.src = "/placeholder.svg" }} />

                <div className="patronBookDetails">
                  <h3 className="patronBookTitle">{book.title}</h3>
                  <p className="patronBookAuthor">{book.author}</p>

                  <div className="patronBookInfo">
                    <div className="patronBookInfoGrid">
                      <div className="patronBookInfoItem">
                        <span className="patronBookInfoLabel">Publisher:</span>
                        <p className="patronBookInfoValue">{book.publisher || 'N/A'}</p>
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
        )}
      </div>

      {selectedBook && (
        <div className="reservationModalOverlay" onClick={() => setSelectedBook(null)}>
          <div className="reservationModalContent" onClick={(e) => e.stopPropagation()}>
            <h2 className="reservationModalTitle">Confirm Reservation</h2>
            <h3 className="reservationModalBookTitle">{selectedBook.title}</h3>

            <div className="reservationModalBody">
              <p>
                <strong>Author:</strong> {selectedBook.author}
              </p>
              <p>
                <strong>Available Copies:</strong> {selectedBook.available}
              </p>
              <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
                Your reservation request will be sent to the admin for approval.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setSelectedBook(null)} disabled={isReserving} style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleConfirmReservation} disabled={isReserving} className="reservationSubmitButton" style={{ flex: 1 }}>
                {isReserving ? 'Requesting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatronBooksPage
