import { useState, useEffect } from "react"
import { getUserFromToken } from "../api/authService"
import "../assets/AdminPages.css"

function AdminProfilePage() {
  const [admin, setAdmin] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const currentUser = getUserFromToken()
      setAdmin(currentUser)
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return "A"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="adminProfileContainer">
        <div className="adminProfileHeader">
          <h1 className="adminProfileTitle">Profile</h1>
        </div>
        <div className="adminProfileContent">
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return (
      <div className="adminProfileContainer">
        <div className="adminProfileHeader">
          <h1 className="adminProfileTitle">Profile</h1>
        </div>
        <div className="adminProfileContent">
          <p>Failed to load profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="adminProfileContainer">
      <div className="adminProfileHeader">
        <h1 className="adminProfileTitle">Profile</h1>
      </div>

      <div className="adminProfileContent">
        <div className="adminProfileInner">
          <div className="adminProfileAvatarSection">
            <div className="adminProfileAvatar">{getInitials(admin.full_name)}</div>
            <h2 className="adminProfileName">{admin.full_name || admin.email}</h2>
            <p className="adminProfileId">{admin.uniId || admin.university_id}</p>
          </div>

          <div className="adminProfileInfoSection">
            <div className="adminProfileInfoGrid">
              <div className="adminProfileInfoItem">
                <p className="adminProfileInfoLabel">Email</p>
                <p className="adminProfileInfoValue">{admin.email}</p>
              </div>

              <div className="adminProfileInfoItem">
                <p className="adminProfileInfoLabel">Role</p>
                <p className="adminProfileInfoValue">{admin.role}</p>
              </div>

              <div className="adminProfileInfoItem">
                <p className="adminProfileInfoLabel">University ID</p>
                <p className="adminProfileInfoValue">{admin.uniId || admin.university_id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminProfilePage
