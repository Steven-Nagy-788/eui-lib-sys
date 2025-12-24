"use client"

import { useState, useEffect } from "react"
import { getDashboardStats, getMostBorrowedBooks, getTopBorrowers } from "../api/statsService"
import { deleteBook, createBook } from "../api/booksService"
import { createBulkCopies } from "../api/bookCopiesService"
import { ConfirmModal } from "../components/Modal"
import toast from "../utils/toast"
import "../assets/AdminPages.css"
import "../assets/Responsive.css"

function AdminDatabasePage() {
  // Stats state
  const [stats, setStats] = useState(null)
  const [mostBorrowed, setMostBorrowed] = useState([])
  const [topBorrowers, setTopBorrowers] = useState([])
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  
  // Form state
  const [isbn, setIsbn] = useState("")
  const [bookNumber, setBookNumber] = useState("")
  const [callNumber, setCallNumber] = useState("")
  const [faculty, setFaculty] = useState("")
  const [course, setCourse] = useState("")
  const [amount, setAmount] = useState("")
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [bookImage, setBookImage] = useState(null)
  const [bookImageName, setBookImageName] = useState("")
  const [removeSearch, setRemoveSearch] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [deletingBookId, setDeletingBookId] = useState(null)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setIsLoadingStats(true)
      const [dashStats, borrowed, borrowers] = await Promise.all([
        getDashboardStats().catch(() => null),
        getMostBorrowedBooks(10).catch(() => []),
        getTopBorrowers(10).catch(() => [])
      ])
      setStats(dashStats)
      setMostBorrowed(borrowed)
      setTopBorrowers(borrowers)
    } catch (error) {
      console.error('Failed to load statistics:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const isAddBookFormValid =
    isbn.trim() !== "" &&
    title.trim() !== "" &&
    author.trim() !== "" &&
    amount.trim() !== "" &&
    !isNaN(parseInt(amount))

  const handleAddBook = async () => {
    try {
      // Create book
      const bookData = {
        isbn,
        title,
        author,
        publisher: "",
        publication_year: new Date().getFullYear(),
        book_pic_url: bookImageName || null,
        call_number: callNumber || null,
        faculty: faculty || null,
        course_code: course || null
      }
      
      const newBook = await createBook(bookData)
      
      // Create copies if amount specified
      const numCopies = parseInt(amount)
      if (numCopies > 0) {
        await createBulkCopies(newBook.id, numCopies)
      }
      
      toast.success(`Book "${title}" added with ${numCopies} copies!`)
      
      // Reset form
      setIsbn("")
      setBookNumber("")
      setCallNumber("")
      setFaculty("")
      setCourse("")
      setAmount("")
      setTitle("")
      setAuthor("")
      setBookImage(null)
      setBookImageName("")
      
      loadStatistics()
    } catch (error) {
      console.error('Failed to add book:', error)
      toast.error(error.message || 'Failed to add book')
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setBookImage(file)
      setBookImageName(file.name)
    }
  }

  const handleRemoveBook = (bookId) => {
    setDeletingBookId(bookId)
  }

  const confirmDelete = async () => {
    try {
      await deleteBook(deletingBookId)
      toast.success('Book removed successfully')
      setSearchResults(searchResults.filter(b => b.id !== deletingBookId))
      await loadStatistics()
    } catch (error) {
      console.error('Failed to remove book:', error)
      toast.error(error.message || 'Failed to remove book')
    } finally {
      setDeletingBookId(null)
    }
  }

  return (
    <div className="adminDatabaseContainer">
      <div className="adminDatabaseHeader">
        <h1 className="adminDatabaseTitle">Database & Statistics</h1>
      </div>

      {/* Statistics Dashboard */}
      <div className="adminDatabaseSection">
        <h2 className="adminDatabaseSectionTitle">Dashboard Statistics</h2>
        {isLoadingStats ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Loading statistics...</p>
        ) : stats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>Total Books</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{stats.total_books || 0}</p>
            </div>
            <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>Total Copies</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{stats.total_copies || 0}</p>
            </div>
            <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>Active Loans</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{stats.active_loans || 0}</p>
            </div>
            <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>Total Users</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{stats.total_users || 0}</p>
            </div>
            <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>Overdue Loans</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#d32f2f' }}>{stats.overdue_loans || 0}</p>
            </div>
            <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>Pending Requests</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#ff9800' }}>{stats.pending_requests || 0}</p>
            </div>
          </div>
        ) : (
          <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No statistics available</p>
        )}

        {mostBorrowed.length > 0 && (
          <>
            <h3 style={{ marginTop: '40px', marginBottom: '15px' }}>Most Borrowed Books</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {mostBorrowed.slice(0, 5).map((book, index) => (
                <div key={book.book_id} style={{ padding: '15px', background: '#f9f9f9', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', marginRight: '10px' }}>#{index + 1}</span>
                    <span style={{ fontSize: '16px' }}>{book.title}</span>
                    <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>by {book.author}</span>
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2' }}>{book.borrow_count} loans</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="adminDatabaseSection">
        <h2 className="adminDatabaseSectionTitle">Add Book</h2>

        <div className="adminDatabaseFormGrid3">
          <div className="adminDatabaseFormGroup">
            <label className="adminDatabaseLabel">ISBN</label>
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="Enter ISBN"
              className="adminDatabaseInput"
            />
          </div>

          <div className="adminDatabaseFormGroup">
            <label className="adminDatabaseLabel">Book Number</label>
            <input
              type="text"
              value={bookNumber}
              onChange={(e) => setBookNumber(e.target.value)}
              placeholder="Enter book number"
              className="adminDatabaseInput"
            />
          </div>

          <div className="adminDatabaseFormGroup">
            <label className="adminDatabaseLabel">Call Number</label>
            <input
              type="text"
              value={callNumber}
              onChange={(e) => setCallNumber(e.target.value)}
              placeholder="Enter call number"
              className="adminDatabaseInput"
            />
          </div>
        </div>

        <div className="adminDatabaseFormGrid3">
          <div className="adminDatabaseFormGroup">
            <label className="adminDatabaseLabel">Faculty</label>
            <input
              type="text"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              placeholder="Enter faculty"
              className="adminDatabaseInput"
            />
          </div>

          <div className="adminDatabaseFormGroup">
            <label className="adminDatabaseLabel">Course</label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="Enter course"
              className="adminDatabaseInput"
            />
          </div>

          <div className="adminDatabaseFormGroup">
            <label className="adminDatabaseLabel">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="adminDatabaseInput"
            />
          </div>
        </div>

        <div className="adminDatabaseFormGrid2">
          <div className="adminDatabaseFormGroup">
            <label className="adminDatabaseLabel">Book Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
              className="adminDatabaseInput"
            />
          </div>

          <div className="adminDatabaseFormGroup">
            <label className="adminDatabaseLabel">Book Author</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter book author"
              className="adminDatabaseInput"
            />
          </div>
        </div>

        <div className="adminDatabaseFormGroup">
          <label className="adminDatabaseLabel">Book Image</label>
          <div className="adminDatabaseFileInputWrapper">
            <label htmlFor="bookImage" className="adminDatabaseFileLabel">
              {bookImageName || "Choose image"}
            </label>
            <input
              id="bookImage"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="adminDatabaseFileInput"
            />
          </div>
        </div>

        <button onClick={handleAddBook} disabled={!isAddBookFormValid} className="adminDatabaseAddButton">
          Add Book
        </button>
      </div>

      <div className="adminDatabaseSection">
        <h2 className="adminDatabaseSectionTitle">Remove Book</h2>

        <div className="adminDatabaseSearchWrapper">
          <input
            type="text"
            placeholder="Search by book name or ISBN"
            value={removeSearch}
            onChange={(e) => setRemoveSearch(e.target.value)}
            className="adminDatabaseSearchInput"
          />
          <button className="adminDatabaseSearchIcon">
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

        {searchResults.length > 0 && (
          <div className="adminDatabaseBookList">
            {searchResults.map((book) => (
              <div key={book.id} className="adminDatabaseBookCard">
                <img src={book.image || "/placeholder.svg"} alt="Book cover" className="adminDatabaseBookImage" />

                <div className="adminDatabaseBookDetails">
                  <h3 className="adminDatabaseBookTitle">{book.title}</h3>
                  <p className="adminDatabaseBookAuthor">{book.author}</p>

                  <div className="adminDatabaseBookInfo">
                    <p>
                      <span className="adminDatabaseBookInfoLabel">Course:</span> {book.course}
                    </p>
                    <p>
                      <span className="adminDatabaseBookInfoLabel">Faculty:</span> {book.faculty}
                    </p>
                    <p>
                      <span className="adminDatabaseBookInfoLabel">ISBN:</span> {book.isbn}
                    </p>
                  </div>
                </div>

                <div className="adminDatabaseBookActions">
                  <button onClick={() => handleRemoveBook(book.id)} className="adminDatabaseRemoveButton">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {removeSearch && searchResults.length === 0 && (
          <p className="adminDatabaseNoResults">No books found matching your search.</p>
        )}
      </div>

      <ConfirmModal
        isOpen={deletingBookId !== null}
        onClose={() => setDeletingBookId(null)}
        onConfirm={confirmDelete}
        title="Delete Book"
        message="Are you sure you want to delete this book and all its copies? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  )
}

export default AdminDatabasePage
