import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getBooksWithStats, updateBook, deleteBook } from "../api/booksService"
import { createLoanRequest } from "../api/loansService"
import { getCopiesByBook, createCopy, deleteCopy, updateCopyStatus } from "../api/bookCopiesService"
import { getUserFromToken, isPatronRole } from "../utils/auth"
import { getUserDashboard } from "../api/authService"
import Spinner from "../components/Spinner"
import toast from "../utils/toast"
import "../assets/AdminPages.css"
import "../assets/PatronPages.css"
import "../assets/Responsive.css"

function BooksPage({ user }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [facultyFilter, setFacultyFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState("az")
  
  // Patron-specific state
  const [selectedBook, setSelectedBook] = useState(null)
  const [isReserving, setIsReserving] = useState(false)
  const [selectedCopyId, setSelectedCopyId] = useState(null)
  const [availableCopies, setAvailableCopies] = useState([])

  // Admin-specific state
  const [editingBook, setEditingBook] = useState(null)
  const [deletingBook, setDeletingBook] = useState(null)
  const [expandedBookId, setExpandedBookId] = useState(null)
  const [bookCopies, setBookCopies] = useState({})
  const [loadingCopies, setLoadingCopies] = useState({})
  const [deletingCopy, setDeletingCopy] = useState(null)
  const [creatingCopyFor, setCreatingCopyFor] = useState(null)
  const [newCopyData, setNewCopyData] = useState({
    is_reference: false,
    location: '',
    accession_number: ''
  })

  const currentUser = user || getUserFromToken()
  const isPatron = currentUser && isPatronRole(currentUser.role)
  const queryClient = useQueryClient()

  // Use React Query for books with automatic caching
  const { data: books = [], isLoading, error, refetch } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      // TODO: Backend should support: ?search=query&faculty=Engineering  
      const booksWithStats = await getBooksWithStats(0, 50) // Reduced from 200 to 50
      return booksWithStats.map(book => ({
        ...book,
        available: book.copy_stats?.available || 0,
        total_copies: book.copy_stats?.total || 0,
        reference_copies: book.copy_stats?.reference || 0,
        circulating_copies: book.copy_stats?.circulating || 0
      }))
    },
    staleTime: 2 * 60 * 1000, // 2 minutes cache
  })

  // Mutations for admin operations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateBook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['books'])
      toast.success('Book updated successfully')
      setEditingBook(null)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update book')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['books'])
      toast.success('Book deleted successfully')
      setDeletingBook(null)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete book')
    }
  })

  const filteredAndSortedBooks = useMemo(() => {
    let filtered = [...books]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(book =>
        book.title?.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query) ||
        book.isbn?.toLowerCase().includes(query) ||
        book.publisher?.toLowerCase().includes(query)
      )
    }

    // Faculty filter
    if (facultyFilter !== "all") {
      filtered = filtered.filter(book => book.faculty === facultyFilter)
    }

    // Sort
    if (sortOrder === "az" || sortOrder === "a-z") {
      filtered.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortOrder === "za" || sortOrder === "z-a") {
      filtered.sort((a, b) => b.title.localeCompare(a.title))
    }

    return filtered
  }, [books, searchQuery, facultyFilter, sortOrder])

  // Patron handlers
  const handleReserve = async (book) => {
    try {
      // Fetch fresh user data from API to check current blacklist status
      const dashboardData = await getUserDashboard()
      const currentUser = dashboardData.user
      
      // Check if user is blacklisted
      if (currentUser?.is_blacklisted) {
        toast.error(`Your account is blacklisted. Reason: ${currentUser.blacklist_reason || 'Contact administrator for details'}. You cannot reserve books.`)
        return
      }
      
      if (book.available === 0) {
        toast.error('No copies available')
        return
      }
      
      // Fetch available copies for this book
      const copies = await getCopiesByBook(book.id, true) // true = available only
      if (copies.length === 0) {
        toast.error('No copies available')
        return
      }
      
      // Auto-select first circulating (non-reference) copy
      const circulatingCopy = copies.find(c => !c.is_reference)
      if (!circulatingCopy) {
        toast.error('No circulating copies available. All available copies are reference-only.')
        return
      }
      
      setAvailableCopies([circulatingCopy])
      setSelectedBook(book)
      setSelectedCopyId(circulatingCopy.id)
    } catch (err) {
      console.error('Failed to fetch copies:', err)
      toast.error('Failed to load available copies')
    }
  }

  const handleConfirmReservation = async () => {
    if (!selectedCopyId) {
      toast.error('Please select a copy')
      return
    }

    try {
      setIsReserving(true)
      await createLoanRequest(selectedCopyId)
      toast.success(`Reservation submitted for ${selectedBook.title}`)
      setSelectedBook(null)
      setSelectedCopyId(null)
      setAvailableCopies([])
      refetch()
    } catch (err) {
      console.error('Reservation failed:', err)
      // Extract the actual error message from the backend
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to create reservation'
      toast.error(errorMessage)
    } finally {
      setIsReserving(false)
    }
  }

  // Admin handlers
  const handleEditBook = (book) => {
    setEditingBook({ ...book })
  }

  const handleSaveBook = () => {
    if (!editingBook.title || !editingBook.author || !editingBook.isbn) {
      toast.error('Title, Author, and ISBN are required')
      return
    }
    updateMutation.mutate({ id: editingBook.id, data: editingBook })
  }

  const handleDeleteBook = (book) => {
    setDeletingBook(book)
  }

  const confirmDelete = () => {
    deleteMutation.mutate(deletingBook.id)
  }

  const handleToggleCopies = async (bookId) => {
    if (expandedBookId === bookId) {
      setExpandedBookId(null)
      return
    }
    
    setExpandedBookId(bookId)
    
    // Fetch copies if not already loaded
    if (!bookCopies[bookId]) {
      setLoadingCopies(prev => ({ ...prev, [bookId]: true }))
      try {
        const copies = await getCopiesByBook(bookId, false) // false = include all copies
        setBookCopies(prev => ({ ...prev, [bookId]: copies }))
      } catch (err) {
        console.error('Failed to fetch copies:', err)
        toast.error('Failed to load book copies')
      } finally {
        setLoadingCopies(prev => ({ ...prev, [bookId]: false }))
      }
    }
  }

  const handleCreateCopy = async () => {
    if (!newCopyData.accession_number) {
      toast.error('Accession number is required')
      return
    }
    
    try {
      const created = await createCopy({
        book_id: creatingCopyFor,
        accession_number: newCopyData.accession_number,
        is_reference: newCopyData.is_reference,
        location: newCopyData.location || null
      })
      
      // Update local state
      setBookCopies(prev => ({
        ...prev,
        [creatingCopyFor]: [...(prev[creatingCopyFor] || []), created]
      }))
      
      toast.success('Copy created successfully')
      setCreatingCopyFor(null)
      setNewCopyData({ is_reference: false, location: '', accession_number: '' })
      refetch() // Refresh book stats
    } catch (err) {
      console.error('Failed to create copy:', err)
      toast.error(err.message || 'Failed to create copy')
    }
  }

  const handleUpdateCopyStatus = async (copyId, newStatus, bookId) => {
    try {
      await updateCopyStatus(copyId, newStatus)
      
      // Update local state
      setBookCopies(prev => ({
        ...prev,
        [bookId]: prev[bookId].map(c => 
          c.id === copyId ? { ...c, status: newStatus } : c
        )
      }))
      
      toast.success('Copy status updated')
      refetch() // Refresh book stats
    } catch (err) {
      console.error('Failed to update copy status:', err)
      toast.error(err.message || 'Failed to update copy')
    }
  }

  const handleDeleteCopy = async () => {
    try {
      await deleteCopy(deletingCopy.id)
      
      // Update local state
      setBookCopies(prev => ({
        ...prev,
        [deletingCopy.bookId]: prev[deletingCopy.bookId].filter(c => c.id !== deletingCopy.id)
      }))
      
      toast.success('Copy deleted successfully')
      setDeletingCopy(null)
      refetch() // Refresh book stats
    } catch (err) {
      console.error('Failed to delete copy:', err)
      toast.error(err.message || 'Failed to delete copy')
    }
  }

  // Render based on role
  if (isPatron) {
    return (
      <div className="pageContent">
        <div className="pageHeaderCard">
          <h1>Books</h1>
        </div>

        <div className="contentCard">
          <div className="filterSection">
            <select value={facultyFilter} onChange={(e) => setFacultyFilter(e.target.value)}>
              <option value="all">All Faculties</option>
              <option value="Computer and Informational Sciences">Computer & IS</option>
              <option value="Engineering">Engineering</option>
              <option value="Business Informatics">Business Informatics</option>
              <option value="Digital Arts and Design">Digital Arts & Design</option>
            </select>

            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="az">A-Z</option>
              <option value="za">Z-A</option>
            </select>

            <input
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, minWidth: '200px' }}
            />
          </div>

          {error && (
            <div style={{ padding: '20px', color: '#ef4444', textAlign: 'center' }}>
              {error}
              <button onClick={() => refetch()} style={{ marginLeft: '10px', padding: '8px 16px' }}>Retry</button>
            </div>
          )}

          {isLoading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <Spinner size="large" />
              <p style={{ marginTop: '20px', color: '#6b7280' }}>Loading books...</p>
            </div>
          ) : filteredAndSortedBooks.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              No books found
            </div>
          ) : (
            <div className="scrollableContent">
              {filteredAndSortedBooks.map((book) => (
                <div key={book.id} className="patronBookCard">
                  <img 
                    src={book.book_pic_url || "/placeholder.svg"} 
                    alt={book.title} 
                    className="patronBookImage"
                    onError={(e) => { e.target.src = "/placeholder.svg" }} 
                  />

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
                        <span className="patronBookAvailableCount">{book.available || 0}</span>
                        <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '4px' }}>/ {book.total_copies || 0} total</span>
                        <button
                          onClick={() => handleReserve(book)}
                          className="patronReserveButton"
                          disabled={book.available === 0 || user?.is_blacklisted}
                          title={user?.is_blacklisted ? 'Your account is blacklisted' : ''}
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

        {/* Reservation Modal */}
        {selectedBook && (
          <div className="modal" onClick={() => { setSelectedBook(null); setAvailableCopies([]); setSelectedCopyId(null); }}>
            <div className="modalContent" onClick={(e) => e.stopPropagation()}>
              <div className="modalHeader">
                <h2 className="modalTitle">Reserve Book</h2>
                <button className="modalCloseButton" onClick={() => { setSelectedBook(null); setAvailableCopies([]); setSelectedCopyId(null); }}>×</button>
              </div>

              <div className="modalBody">
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 8px 0' }}>{selectedBook.title}</h3>
                  <p style={{ margin: '0 0 4px 0', color: '#6b7280' }}><strong>Author:</strong> {selectedBook.author}</p>
                  <p style={{ margin: '0 0 4px 0', color: '#6b7280' }}><strong>ISBN:</strong> {selectedBook.isbn}</p>
                  {selectedBook.publisher && (
                    <p style={{ margin: '0 0 4px 0', color: '#6b7280' }}><strong>Publisher:</strong> {selectedBook.publisher}</p>
                  )}
                  {selectedBook.publication_year && (
                    <p style={{ margin: '0', color: '#6b7280' }}><strong>Year:</strong> {selectedBook.publication_year}</p>
                  )}
                </div>

                <div style={{ 
                  padding: '12px', 
                  background: '#f0fdf4', 
                  borderRadius: '6px',
                  marginBottom: '12px',
                  border: '1px solid #86efac'
                }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '500', color: '#166534' }}>
                    ✓ Copy Auto-Selected for You
                  </p>
                  {availableCopies[0] && (
                    <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>
                      Copy #{availableCopies[0].accession_number}
                      {availableCopies[0].location ? ` - Location: ${availableCopies[0].location}` : ''}
                    </p>
                  )}
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#15803d' }}>
                    Note: Reference copies (30% of collection) cannot be borrowed and remain in the library.
                  </p>
                </div>

                <div style={{ 
                  marginTop: '20px', 
                  padding: '12px', 
                  background: '#eff6ff', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1e40af'
                }}>
                  <strong>📋 Loan Request Info:</strong>
                  <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                    <li>Your request will be sent to the admin for approval</li>
                    <li>Loan period: Typically 14 days (determined by admin)</li>
                    <li>You'll be notified once approved</li>
                    <li>Check "Bookbag" page for your pending requests</li>
                  </ul>
                </div>
              </div>

              <div className="modalFooter">
                <button 
                  className="buttonSecondary" 
                  onClick={() => { setSelectedBook(null); setAvailableCopies([]); setSelectedCopyId(null); }} 
                  disabled={isReserving}
                >
                  Cancel
                </button>
                <button className="buttonPrimary" onClick={handleConfirmReservation} disabled={isReserving || !selectedCopyId}>
                  {isReserving ? <><Spinner size="small" /> Requesting...</> : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Admin view
  return (
    <div className="pageContent">
      <div className="pageHeaderCard">
        <h1>Books Management</h1>
      </div>

      <div className="contentCard">
        <div className="filterSection">
          <select value={facultyFilter} onChange={(e) => setFacultyFilter(e.target.value)}>
            <option value="all">All Faculties</option>
            <option value="Computer and Informational Sciences">Computer & IS</option>
            <option value="Engineering">Engineering</option>
            <option value="Business Informatics">Business Informatics</option>
            <option value="Digital Arts and Design">Digital Arts & Design</option>
          </select>

          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="az">A-Z</option>
            <option value="za">Z-A</option>
          </select>

          <input
            type="text"
            placeholder="Search by title, author, ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }}
          />
        </div>

        {error && (
          <div style={{ padding: '20px', color: '#ef4444', textAlign: 'center' }}>
            {error.message || 'Failed to load books'}
            <button onClick={() => refetch()} style={{ marginLeft: '10px', padding: '8px 16px' }}>Retry</button>
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Spinner size="large" />
            <p style={{ marginTop: '20px', color: '#6b7280' }}>Loading books...</p>
          </div>
        ) : filteredAndSortedBooks.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            No books found
          </div>
        ) : (
          <div className="scrollableContent">
            {filteredAndSortedBooks.map((book) => (
              <div key={book.id} style={{ marginBottom: '16px' }}>
                <div className="adminBookCard">
                  <img 
                    src={book.book_pic_url || "/placeholder.svg"} 
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
                      </div>

                      <div className="adminBookStats">
                        <div className="adminBookStat">
                          <span className="adminBookStatLabel">Total:</span>
                          <span className="adminBookStatValue">{book.total_copies || 0}</span>
                        </div>
                        <div className="adminBookStat">
                          <span className="adminBookStatLabel">Available:</span>
                          <span className="adminBookStatValue" style={{ color: '#10b981' }}>{book.available || 0}</span>
                        </div>
                      </div>

                      <div className="bookCardActions">
                        <button 
                          className="editBookButton" 
                          onClick={() => handleToggleCopies(book.id)}
                          style={{ background: '#8b5cf6', flex: 1 }}
                        >
                          {expandedBookId === book.id ? '▲ Hide' : '▼ View'} Copies ({book.total_copies || 0})
                        </button>
                        <button className="editBookButton" onClick={() => handleEditBook(book)}>
                          Edit
                        </button>
                        <button 
                          className="deleteBookButton" 
                          onClick={() => handleDeleteBook(book)}
                          disabled={book.total_copies > 0}
                          title={book.total_copies > 0 ? 'Cannot delete book with copies' : 'Delete book'}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Book Copies Dropdown */}
                {expandedBookId === book.id && (
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    padding: '20px',
                    background: '#f9fafb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Book Copies</h4>
                      <button
                        onClick={() => setCreatingCopyFor(book.id)}
                        style={{
                          padding: '8px 16px',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        + Add Copy
                      </button>
                    </div>

                    {loadingCopies[book.id] ? (
                      <div style={{ padding: '20px', textAlign: 'center' }}>
                        <Spinner size="medium" />
                      </div>
                    ) : bookCopies[book.id]?.length === 0 ? (
                      <p style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center' }}>No copies found</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {bookCopies[book.id]?.map((copy) => (
                          <div
                            key={copy.id}
                            style={{
                              background: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              padding: '16px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                                <span style={{ fontWeight: '600' }}>#{copy.accession_number}</span>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  background: copy.is_reference ? '#dbeafe' : '#dcfce7',
                                  color: copy.is_reference ? '#1e40af' : '#166534'
                                }}>
                                  {copy.is_reference ? 'Reference' : 'Circulating'}
                                </span>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  background: 
                                    copy.status === 'available' ? '#dcfce7' :
                                    copy.status === 'maintenance' ? '#fef3c7' :
                                    copy.status === 'lost' ? '#f3f4f6' :
                                    '#fee2e2',
                                  color:
                                    copy.status === 'available' ? '#166534' :
                                    copy.status === 'maintenance' ? '#92400e' :
                                    copy.status === 'lost' ? '#4b5563' :
                                    '#991b1b'
                                }}>
                                  {copy.status}
                                </span>
                              </div>
                              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                {copy.location && <span>Location: {copy.location}</span>}
                                {copy.current_borrower_name && (
                                  <span style={{ marginLeft: copy.location ? '16px' : '0' }}>
                                    📖 Borrowed by: <strong>{copy.current_borrower_name}</strong> ({copy.current_borrower_id})
                                  </span>
                                )}
                                {copy.status === 'available' && !copy.current_borrower_name && (
                                  <span style={{ color: '#10b981' }}>✓ Available for loan</span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                              {copy.status === 'available' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateCopyStatus(copy.id, 'maintenance', book.id)}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#fbbf24',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                    title="Mark as under maintenance"
                                  >
                                    Maintenance
                                  </button>
                                  <button
                                    onClick={() => handleUpdateCopyStatus(copy.id, 'lost', book.id)}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#6b7280',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                    title="Mark as lost"
                                  >
                                    Lost
                                  </button>
                                </>
                              )}
                              {(copy.status === 'maintenance' || copy.status === 'lost') && (
                                <button
                                  onClick={() => handleUpdateCopyStatus(copy.id, 'available', book.id)}
                                  style={{
                                    padding: '6px 12px',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                  title="Mark as available"
                                >
                                  Make Available
                                </button>
                              )}
                              <button
                                onClick={() => setDeletingCopy({ ...copy, bookId: book.id })}
                                disabled={copy.current_loan_id}
                                style={{
                                  padding: '6px 12px',
                                  background: copy.current_loan_id ? '#d1d5db' : '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: copy.current_loan_id ? 'not-allowed' : 'pointer',
                                  fontSize: '12px'
                                }}
                                title={copy.current_loan_id ? 'Cannot delete borrowed copy' : 'Delete copy'}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Book Modal */}
      {editingBook && (
        <div className="modal" onClick={() => setEditingBook(null)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">Edit Book</h2>
              <button className="modalCloseButton" onClick={() => setEditingBook(null)}>×</button>
            </div>

            <div className="modalBody">
              <div className="formGroup">
                <label>Title *</label>
                <input
                  type="text"
                  value={editingBook.title || ''}
                  onChange={(e) => setEditingBook({...editingBook, title: e.target.value})}
                />
              </div>

              <div className="formGroup">
                <label>Author *</label>
                <input
                  type="text"
                  value={editingBook.author || ''}
                  onChange={(e) => setEditingBook({...editingBook, author: e.target.value})}
                />
              </div>

              <div className="formGroup">
                <label>ISBN *</label>
                <input
                  type="text"
                  value={editingBook.isbn || ''}
                  onChange={(e) => setEditingBook({...editingBook, isbn: e.target.value})}
                />
              </div>

              <div className="formGroup">
                <label>Publisher</label>
                <input
                  type="text"
                  value={editingBook.publisher || ''}
                  onChange={(e) => setEditingBook({...editingBook, publisher: e.target.value})}
                />
              </div>

              <div className="formGroup">
                <label>Faculty</label>
                <select
                  value={editingBook.faculty || ''}
                  onChange={(e) => setEditingBook({...editingBook, faculty: e.target.value})}
                >
                  <option value="">Select Faculty</option>
                  <option value="Computer and Informational Sciences">Computer & IS</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Business Informatics">Business Informatics</option>
                  <option value="Digital Arts and Design">Digital Arts & Design</option>
                </select>
              </div>

              <div className="formGroup">
                <label>Call Number</label>
                <input
                  type="text"
                  value={editingBook.call_number || ''}
                  onChange={(e) => setEditingBook({...editingBook, call_number: e.target.value})}
                />
              </div>

              <div className="formGroup">
                <label>Publication Year</label>
                <input
                  type="number"
                  value={editingBook.publication_year || ''}
                  onChange={(e) => setEditingBook({...editingBook, publication_year: parseInt(e.target.value) || ''})}
                />
              </div>

              <div className="formGroup">
                <label>Book Cover URL</label>
                <input
                  type="text"
                  value={editingBook.book_pic_url || ''}
                  onChange={(e) => setEditingBook({...editingBook, book_pic_url: e.target.value})}
                />
              </div>
            </div>

            <div className="modalFooter">
              <button className="buttonSecondary" onClick={() => setEditingBook(null)} disabled={updateMutation.isPending}>
                Cancel
              </button>
              <button className="buttonPrimary" onClick={handleSaveBook} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <><Spinner size="small" /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBook && (
        <div className="modal" onClick={() => setDeletingBook(null)}>
          <div className="modalContent" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">Delete Book</h2>
              <button className="modalCloseButton" onClick={() => setDeletingBook(null)}>×</button>
            </div>

            <div className="modalBody">
              <p>Are you sure you want to delete <strong>{deletingBook.title}</strong>?</p>
              <p style={{ marginTop: '10px', color: '#ef4444', fontSize: '14px' }}>
                This action cannot be undone.
              </p>
            </div>

            <div className="modalFooter">
              <button className="buttonSecondary" onClick={() => setDeletingBook(null)} disabled={deleteMutation.isPending}>
                Cancel
              </button>
              <button className="buttonDanger" onClick={confirmDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? <><Spinner size="small" /> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Copy Modal */}
      {creatingCopyFor && (
        <div className="modal" onClick={() => { setCreatingCopyFor(null); setNewCopyData({ is_reference: false, location: '', accession_number: '' }); }}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">Add New Copy</h2>
              <button className="modalCloseButton" onClick={() => { setCreatingCopyFor(null); setNewCopyData({ is_reference: false, location: '', accession_number: '' }); }}>×</button>
            </div>

            <div className="modalBody">
              <div className="formGroup">
                <label>Accession Number *</label>
                <input
                  type="text"
                  value={newCopyData.accession_number}
                  onChange={(e) => setNewCopyData({ ...newCopyData, accession_number: e.target.value })}
                  placeholder="e.g., ACC-001234"
                />
              </div>

              <div className="formGroup">
                <label>Copy Type *</label>
                <select
                  value={newCopyData.is_reference ? 'reference' : 'circulating'}
                  onChange={(e) => setNewCopyData({ ...newCopyData, is_reference: e.target.value === 'reference' })}
                >
                  <option value="circulating">Circulating (Can be borrowed)</option>
                  <option value="reference">Reference (Library use only)</option>
                </select>
              </div>

              <div className="formGroup">
                <label>Location</label>
                <input
                  type="text"
                  value={newCopyData.location}
                  onChange={(e) => setNewCopyData({ ...newCopyData, location: e.target.value })}
                  placeholder="e.g., Shelf A-12"
                />
              </div>
            </div>

            <div className="modalFooter">
              <button className="buttonSecondary" onClick={() => { setCreatingCopyFor(null); setNewCopyData({ is_reference: false, location: '', accession_number: '' }); }}>
                Cancel
              </button>
              <button className="buttonPrimary" onClick={handleCreateCopy}>
                Create Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Copy Confirmation Modal */}
      {deletingCopy && (
        <div className="modal" onClick={() => setDeletingCopy(null)}>
          <div className="modalContent" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">Delete Copy</h2>
              <button className="modalCloseButton" onClick={() => setDeletingCopy(null)}>×</button>
            </div>

            <div className="modalBody">
              <p>Are you sure you want to delete copy <strong>#{deletingCopy.accession_number}</strong>?</p>
              <p style={{ marginTop: '10px', color: '#ef4444', fontSize: '14px' }}>
                This action cannot be undone.
              </p>
            </div>

            <div className="modalFooter">
              <button className="buttonSecondary" onClick={() => setDeletingCopy(null)}>
                Cancel
              </button>
              <button className="buttonDanger" onClick={handleDeleteCopy}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BooksPage
