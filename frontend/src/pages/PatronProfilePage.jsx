import "../assets/PatronPages.css"

function PatronProfilePage() {
  const user = {
    name: "Patron Full Name",
    id: "21-101010",
    email: "student@eui.edu.eg",
    faculty: "Computer Science and Artificial Intelligence",
    program: "Software Engineering Track",
    year: "4th Academic Year - 1st Semester",
    infractions: 10,
    booksBorrowed: 3,
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
  }

  return (
    <div className="pageContent">
      <div className="pageHeaderCard">
        <h1>Profile</h1>
      </div>

      <div className="contentCard">
        <div className="profileContainer">
          <div className="profileHeader">
            <div className="avatarLarge">{getInitials(user.name)}</div>
            <div className="profileInfo">
              <h2>{user.name}</h2>
              <p className="profileId">{user.id}</p>
              <p className="profileEmail">{user.email}</p>
            </div>
          </div>

          <div className="profileDetails">
            <div className="profileSection">
              <h3>Academic Information</h3>
              <div className="profileDetailItem">
                <span className="detailLabel">Faculty:</span> {user.faculty}
              </div>
              <div className="profileDetailItem">
                <span className="detailLabel">Program:</span> {user.program}
              </div>
              <div className="profileDetailItem">
                <span className="detailLabel">Year:</span> {user.year}
              </div>
            </div>

            <div className="profileStats">
              <div className="statItem">
                <h3>Books Borrowed</h3>
                <p className="statValue statPrimary">{user.booksBorrowed}</p>
              </div>
              <div className="statItem">
                <h3>Infractions</h3>
                <p className="statValue statDanger">{user.infractions}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatronProfilePage
