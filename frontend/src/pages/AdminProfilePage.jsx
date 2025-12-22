import "../assets/AdminPages.css"

function AdminProfilePage() {
  const admin = {
    name: "Admin Full Name",
    id: "A-12345",
    email: "admin@university.edu",
    department: "Library Administration",
    role: "Senior Librarian",
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
  }

  return (
    <div className="adminProfileContainer">
      <div className="adminProfileHeader">
        <h1 className="adminProfileTitle">Profile</h1>
      </div>

      <div className="adminProfileContent">
        <div className="adminProfileInner">
          <div className="adminProfileAvatarSection">
            <div className="adminProfileAvatar">{getInitials(admin.name)}</div>
            <h2 className="adminProfileName">{admin.name}</h2>
            <p className="adminProfileId">{admin.id}</p>
          </div>

          <div className="adminProfileInfoSection">
            <div className="adminProfileInfoGrid">
              <div className="adminProfileInfoItem">
                <p className="adminProfileInfoLabel">Email</p>
                <p className="adminProfileInfoValue">{admin.email}</p>
              </div>

              <div className="adminProfileInfoItem">
                <p className="adminProfileInfoLabel">Department</p>
                <p className="adminProfileInfoValue">{admin.department}</p>
              </div>

              <div className="adminProfileInfoItem">
                <p className="adminProfileInfoLabel">Role</p>
                <p className="adminProfileInfoValue">{admin.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminProfilePage
