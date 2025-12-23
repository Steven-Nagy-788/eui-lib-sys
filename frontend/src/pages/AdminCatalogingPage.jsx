"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createBook } from "../api/booksService"
import { createBulkCopies } from "../api/bookCopiesService"
import { getAllCourses, addBookToCourse } from "../api/coursesService"
import toast from "../utils/toast"
import Spinner from "../components/Spinner"
import "../assets/AdminPages.css"
import "../assets/Responsive.css"

function AdminCatalogingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Fetch all courses for dropdown
  const { data: allCourses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['all-courses'],
    queryFn: () => getAllCourses(0, 500),
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  })
  
  // Book form fields based on API schema
  const [formData, setFormData] = useState({
    isbn: "",
    title: "",
    author: "",
    publisher: "",
    publication_year: new Date().getFullYear(),
    book_pic_url: "",
    call_number: "",
    faculty: "",
    course_code: ""
  })
  
  const [numCopies, setNumCopies] = useState(1)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.isbn.trim() || !formData.title.trim() || !formData.author.trim()) {
      toast.error("ISBN, Title, and Author are required")
      return
    }

    try {
      setIsSubmitting(true)
      
      // Create book
      const bookData = {
        ...formData,
        publication_year: parseInt(formData.publication_year) || new Date().getFullYear(),
        book_pic_url: formData.book_pic_url || null,
        call_number: formData.call_number || null,
        faculty: formData.faculty || null,
        course_code: formData.course_code || null,
        publisher: formData.publisher || null
      }
      
      const newBook = await createBook(bookData)
      
      // Associate book with course if course_code was provided
      if (formData.course_code) {
        try {
          await addBookToCourse({
            book_id: newBook.id,
            course_code: formData.course_code
          })
        } catch (err) {
          console.error('Failed to associate book with course:', err)
          // Don't fail the whole operation, just warn the user
          toast.warning(`Book added, but failed to associate with course: ${err.message}`)
        }
      }
      
      // Create copies if specified
      if (numCopies > 0) {
        await createBulkCopies(newBook.id, numCopies)
        toast.success(`Book "${formData.title}" added with ${numCopies} ${numCopies === 1 ? 'copy' : 'copies'}!`)
      } else {
        toast.success(`Book "${formData.title}" added successfully!`)
      }
      
      // Reset form
      setFormData({
        isbn: "",
        title: "",
        author: "",
        publisher: "",
        publication_year: new Date().getFullYear(),
        book_pic_url: "",
        call_number: "",
        faculty: "",
        course_code: ""
      })
      setNumCopies(1)
      
    } catch (error) {
      console.error('Failed to add book:', error)
      toast.error(error.message || 'Failed to add book')
    } finally {
      setIsSubmitting(false)
    }
  }

  const faculties = [
    "Computer and Informational Sciences",
    "Engineering",
    "Business Informatics",
    "Digital Arts and Design"
  ]

  return (
    <div className="adminDatabaseContainer">
      <div className="adminDatabaseHeader">
        <h1 className="adminDatabaseTitle">Cataloging</h1>
        <p style={{ color: '#6b7280', marginTop: '8px' }}>Add new books to the library catalog</p>
      </div>

      <div className="adminDatabaseContent">
        <div className="databaseCard">
          <h2 className="cardTitle">Add New Book</h2>
          
          <form onSubmit={handleSubmit} className="bookForm">
            {/* Required Fields */}
            <div className="formSection">
              <h3 className="formSectionTitle">Required Information</h3>
              
              <div className="formGroup">
                <label htmlFor="isbn">ISBN *</label>
                <input
                  type="text"
                  id="isbn"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleInputChange}
                  placeholder="978-1234567890"
                  required
                />
              </div>

              <div className="formGroup">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Book title"
                  required
                />
              </div>

              <div className="formGroup">
                <label htmlFor="author">Author *</label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="Author name"
                  required
                />
              </div>
            </div>

            {/* Optional Fields */}
            <div className="formSection">
              <h3 className="formSectionTitle">Additional Information</h3>
              
              <div className="formRow">
                <div className="formGroup">
                  <label htmlFor="publisher">Publisher</label>
                  <input
                    type="text"
                    id="publisher"
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleInputChange}
                    placeholder="Publisher name"
                  />
                </div>

                <div className="formGroup">
                  <label htmlFor="publication_year">Publication Year</label>
                  <input
                    type="number"
                    id="publication_year"
                    name="publication_year"
                    value={formData.publication_year}
                    onChange={handleInputChange}
                    placeholder="2024"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
              </div>

              <div className="formRow">
                <div className="formGroup">
                  <label htmlFor="call_number">Call Number</label>
                  <input
                    type="text"
                    id="call_number"
                    name="call_number"
                    value={formData.call_number}
                    onChange={handleInputChange}
                    placeholder="e.g., QA76.73.P98"
                  />
                </div>

                <div className="formGroup">
                  <label htmlFor="faculty">Faculty</label>
                  <select
                    id="faculty"
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Faculty</option>
                    {faculties.map(faculty => (
                      <option key={faculty} value={faculty}>{faculty}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="formRow">
                <div className="formGroup">
                  <label htmlFor="course_code">Course Code</label>
                  <select
                    id="course_code"
                    name="course_code"
                    value={formData.course_code}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Course (Optional)</option>
                    {coursesLoading ? (
                      <option disabled>Loading courses...</option>
                    ) : (
                      allCourses.map(course => (
                        <option key={course.code} value={course.code}>
                          {course.code} - {course.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="formGroup">
                  <label htmlFor="book_pic_url">Book Cover URL</label>
                  <input
                    type="url"
                    id="book_pic_url"
                    name="book_pic_url"
                    value={formData.book_pic_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Copies */}
            <div className="formSection">
              <h3 className="formSectionTitle">Inventory</h3>
              
              <div className="formGroup">
                <label htmlFor="numCopies">Number of Copies</label>
                <input
                  type="number"
                  id="numCopies"
                  value={numCopies}
                  onChange={(e) => setNumCopies(parseInt(e.target.value) || 0)}
                  placeholder="1"
                  min="0"
                  max="100"
                />
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  How many physical copies to add to inventory
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="formActions">
              <button
                type="button"
                className="buttonSecondary"
                onClick={() => {
                  setFormData({
                    isbn: "",
                    title: "",
                    author: "",
                    publisher: "",
                    publication_year: new Date().getFullYear(),
                    book_pic_url: "",
                    call_number: "",
                    faculty: "",
                    course_code: ""
                  })
                  setNumCopies(1)
                }}
                disabled={isSubmitting}
              >
                Clear Form
              </button>
              
              <button
                type="submit"
                className="buttonPrimary"
                disabled={isSubmitting || !formData.isbn || !formData.title || !formData.author}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="small" />
                    Adding Book...
                  </>
                ) : (
                  'Add Book'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminCatalogingPage
