import { useState, useEffect } from "react"
import { getUserFromToken } from "../api/authService"
import { getUserLoans } from "../api/loansService"
import "../assets/PatronPages.css"

function PatronProfilePage() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ booksBorrowed: 0, infractions: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const currentUser = getUserFromToken()
      setUser(currentUser)
      
      // Get user's active and completed loans count
      const activeLoans = await getUserLoans(currentUser.id, 'active')
      const completedLoans = await getUserLoans(currentUser.id, 'returned')
      
      setStats({
        booksBorrowed: activeLoans.length + completedLoans.length,
        infractions: currentUser.infractions || 0
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="pageContent">
        <div className="pageHeaderCard">
          <h1>Profile</h1>
        </div>
        <div className="contentCard">
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="pageContent">
        <div className="pageHeaderCard">
          <h1>Profile</h1>
        </div>
        <div className="contentCard">
          <p>Failed to load profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pageContent">
      <div className="pageHeaderCard">
        <h1>Profile</h1>
      </div>

      <div className="contentCard">
        <div className="profileContainer">
          <div className="profileHeader">
            <div className="avatarLarge">{getInitials(user.full_name)}</div>
            <div className="profileInfo">
              <h2>{user.full_name || user.email}</h2>
              <p className="profileId">{user.uniId || user.university_id}</p>
              <p className="profileEmail">{user.email}</p>
            </div>
          </div>

          <div className="profileDetails">
            <div className="profileSection">
              <h3>Account Information</h3>
              <div className="profileDetailItem">
                <span className="detailLabel">Role:</span> {user.role}</div>
              <div className="profileDetailItem">
                <span className="detailLabel">University ID:</span> {user.uniId || user.university_id}
              </div>
              <div className="profileDetailItem">
                <span className="detailLabel">Email:</span> {user.email}
              </div>
            </div>

            <div className="profileStats">
              <div className="statItem">
                <h3>Books Borrowed</h3>
                <p className="statValue statPrimary">{stats.booksBorrowed}</p>
              </div>
              <div className="statItem">
                <h3>Infractions</h3>
                <p className="statValue statDanger">{stats.infractions}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatronProfilePage
