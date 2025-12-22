"use client"

import { useState, useEffect, useMemo } from "react"
import { getBooks, searchBooks } from "../api/booksService"
import { getCopyStats } from "../api/bookCopiesService"
import "../assets/AdminPages.css"

function AdminBooksPage() {
  const [books, setBooks] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [faculty, setFaculty] = useState("all")
  const [sortBy, setSortBy] = useState("az")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch books on component mount
  useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = async () => {
    try {
      setIsLoading(true)
      setError("")
      const data = await getBooks(0, 1000) // Get all books
      
      // Fetch copy stats for each book
      const booksWithStats = await Promise.all(
        data.map(async (book) => {
          try {
            const stats = await getCopyStats(book.id)
            return {
              ...book,
              available: stats.available || 0,
              total_copies: stats.total || 0,
            }
          } catch (err) {
            return {
              ...book,
              available: 0,
              total_copies: 0,
            }
          }
        })
      )
      
      setBooks(booksWithStats)
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
        
        // Fetch copy stats for search results
        const booksWithStats = await Promise.all(
          data.map(async (book) => {
            try {
              const stats = await getCopyStats(book.id)
              return {
                ...book,
                available: stats.available || 0,
                total_copies: stats.total || 0,
              }
            } catch (err) {
              return {
                ...book,
                available: 0,
                total_copies: 0,
              }
            }
          })
        )
        
        setBooks(booksWithStats)
      } catch (err) {
        console.error('Search failed:', err)
        setError(err.message || 'Search failed')
      } finally {
        setIsLoading(false)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const filteredAndSortedBooks = useMemo(() => {
    let filtered = [...books]

    // Note: Faculty filtering would require course data
    // This is a limitation of the current API structure
    // if (faculty !== "all") {
    //   filtered = filtered.filter((book) => book.faculty?.toLowerCase().includes(faculty.toLowerCase()))
    // }

    if (sortBy === "az") {
      filtered.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortBy === "za") {
      filtered.sort((a, b) => b.title.localeCompare(a.title))
    }

    return filtered
  }, [books, faculty, sortBy])

  return (
    <div className="adminBooksContainer">
      <div className="adminBooksHeader">
        <h1 className="adminBooksTitle">Books</h1>

        <div className="adminBooksControls">
          <select className="adminBooksSelect" value={faculty} onChange={(e) => setFaculty(e.target.value)}>
            <option value="all">All Faculties</option>
            <option value="Computer and Informational Sciences">Computer and Informational Sciences</option>
            <option value="Engineering">Engineering</option>
            <option value="Business Informatics">Business Informatics</option>
            <option value="Digital Arts and Design">Digital Arts and Design</option>
          </select>

          <select className="adminBooksSelect" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="az">A-Z</option>
            <option value="za">Z-A</option>
          </select>

          <div className="adminBooksSearchWrapper">
            <input
              type="text"
              placeholder="Search by title, author, or ISBN"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="adminBooksSearchInput"
            />
            <button className="adminBooksSearchIcon">
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

      <div className="adminBooksContent">
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
        ) : filteredAndSortedBooks.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>No books found</p>
          </div>
        ) : (
          <div className="adminBooksList">
            {filteredAndSortedBooks.map((book) => (
              <div key={book.id} className="adminBookCard">
                <img 
                  src={book.cover_image || "/placeholder.svg"} 
                  alt={book.title} 
                  className="adminBookImage"
                  onError={(e) => { e.target.src = "/placeholder.svg" }}
                />

                <div className="adminBookDetails">
                  <h3 className="adminBookTitle">{book.title}</h3>
                  <p className="adminBookAuthor">{book.author}</p>

                  <div className="adminBookInfo">
                    <div className="adminBookInfoGrid">
                      <div className="adminBookInfoItem">
                        <span className="adminBookInfoLabel">Publisher:</span>
                        <p className="adminBookInfoValue">{book.publisher || 'N/A'}</p>
                      </div>
                      <div className="adminBookInfoItem">
                        <span className="adminBookInfoLabel">ISBN:</span>
                        <p className="adminBookInfoValue">{book.isbn}</p>
                      </div>
                      <div className="adminBookInfoItem">
                        <span className="adminBookInfoLabel">Call Number:</span>
                        <p className="adminBookInfoValue">{book.call_number || 'N/A'}</p>
                      </div>
                      <div className="adminBookInfoItem">
                        <span className="adminBookInfoLabel">Total Copies:</span>
                        <p className="adminBookInfoValue">{book.total_copies || 0}</p>
                      </div>
                    </div>

                    <div className="adminBookAvailability">
                      <span className="adminBookAvailableBadge">Available</span>
                      <span className="adminBookAvailableCount">{book.available || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminBooksPage
