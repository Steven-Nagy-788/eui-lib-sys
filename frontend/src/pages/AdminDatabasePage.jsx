"use client"

import { useState } from "react"
import "../assets/AdminPages.css"

function AdminDatabasePage() {
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

  const allBooks = [
    {
      id: 1,
      title: "Understanding Calculus Second Edition",
      author: "H. S. Bear",
      course: "C-MA111",
      faculty: "Computer and Informational Sciences",
      isbn: "978-0-471-43307-1",
      image: "/calculus-textbook-blue-orange.jpg",
    },
    {
      id: 2,
      title: "Introduction to Algorithms",
      author: "Thomas H. Cormen",
      course: "C-CS201",
      faculty: "Computer and Informational Sciences",
      isbn: "978-0-262-03384-8",
      image: "/algorithms-textbook.jpg",
    },
    {
      id: 3,
      title: "Digital Logic Design",
      author: "M. Morris Mano",
      course: "C-CS111",
      faculty: "Computer and Informational Sciences",
      isbn: "978-0-13-277420-8",
      image: "/digital-logic-textbook.jpg",
    },
    {
      id: 4,
      title: "Engineering Mechanics Statics",
      author: "J.L. Meriam",
      course: "E-ME101",
      faculty: "Engineering",
      isbn: "978-1-118-80711-0",
      image: "/engineering-mechanics-textbook.jpg",
    },
    {
      id: 5,
      title: "Business Intelligence and Analytics",
      author: "Ramesh Sharda",
      course: "BI-BA201",
      faculty: "Business Informatics",
      isbn: "978-0-13-461759-0",
      image: "/business-intelligence-textbook.jpg",
    },
    {
      id: 6,
      title: "Digital Design Principles",
      author: "David Harris",
      course: "DA-CS102",
      faculty: "Digital Arts and Design",
      isbn: "978-0-12-800056-4",
      image: "/digital-design-textbook.jpg",
    },
  ]

  const searchResults = removeSearch
    ? allBooks.filter(
        (book) => book.title.toLowerCase().includes(removeSearch.toLowerCase()) || book.isbn.includes(removeSearch),
      )
    : []

  const isAddBookFormValid =
    isbn.trim() !== "" &&
    bookNumber.trim() !== "" &&
    callNumber.trim() !== "" &&
    faculty.trim() !== "" &&
    course.trim() !== "" &&
    amount.trim() !== "" &&
    title.trim() !== "" &&
    author.trim() !== "" &&
    bookImage !== null

  const handleAddBook = () => {
    console.log("Adding book:", {
      isbn,
      bookNumber,
      callNumber,
      faculty,
      course,
      amount,
      title,
      author,
      bookImage,
    })
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
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setBookImage(file)
      setBookImageName(file.name)
    }
  }

  const handleRemoveBook = (bookId) => {
    console.log("Removing book with ID:", bookId)
  }

  return (
    <div className="adminDatabaseContainer">
      <div className="adminDatabaseHeader">
        <h1 className="adminDatabaseTitle">Database</h1>
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
              📤 {bookImageName || "Choose image"}
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
    </div>
  )
}

export default AdminDatabasePage
