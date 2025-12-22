"use client"

import { useState } from "react"
import "../assets/PatronPages.css"

function PatronNoticesPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const notices = [
    {
      id: 1,
      type: "overdue",
      title: "Overdue Warning",
      message:
        "Your book 'Understanding Calculus Second Edition' is overdue. You have been given an infraction. Please return the book immediately before corrective actions are taken.",
      bookTitle: "Understanding Calculus Second Edition",
      date: "12/15/25",
    },
    {
      id: 2,
      type: "due",
      title: "Return Notice",
      message:
        "Your book 'Understanding Calculus Second Edition' due date has been reached. Please return your book to the library.",
      bookTitle: "Understanding Calculus Second Edition",
      date: "12/10/25",
    },
    {
      id: 3,
      type: "approaching",
      title: "Due Date Approaching",
      message:
        "Your book 'Understanding Calculus Second Edition' is close to its due date 12/10/25. Please start to return your book before the date.",
      bookTitle: "Understanding Calculus Second Edition",
      date: "12/07/25",
    },
    {
      id: 4,
      type: "success",
      title: "Reserve Successful",
      message:
        "Your reserve request for 'Understanding Calculus Second Edition' has been accepted! Please pass by the library to pick up your book.",
      bookTitle: "Understanding Calculus Second Edition",
      date: "12/01/25",
    },
  ]

  const filteredNotices = notices.filter((notice) => {
    return (
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.bookTitle.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const getNoticeBorderClass = (type) => {
    switch (type) {
      case "success":
        return "notice-border-green"
      case "approaching":
        return "notice-border-blue"
      case "due":
        return "notice-border-yellow"
      case "overdue":
        return "notice-border-red"
      default:
        return ""
    }
  }

  return (
    <div className="pageContent">
      <div className="pageHeaderCard">
        <div className="pageHeaderContent">
          <h1>Notices</h1>
          <div className="controlsContainer">
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
          {filteredNotices.map((notice) => (
            <div key={notice.id} className={`patron-notice-card ${getNoticeBorderClass(notice.type)}`}>
              <div className="notice-card-header">
                <h3 className="notice-card-title">{notice.title}</h3>
                <span className="notice-card-date">{notice.date}</span>
              </div>
              <p className="notice-card-description">{notice.message}</p>
              <p className="notice-card-book">Book: {notice.bookTitle}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PatronNoticesPage
