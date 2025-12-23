import { useQuery } from "@tanstack/react-query"
import { getUserFromToken } from "../utils/auth"
import { getUserDashboard } from "../api/authService"
import { getUserLoans } from "../api/loansService"
import { getStudentEnrollments } from "../api/coursesService"
import { isPatronRole } from "../utils/auth"
import Spinner from "../components/Spinner"
import "../assets/AdminPages.css"
import "../assets/PatronPages.css"
import "../assets/Responsive.css"

function ProfilePage({ user }) {
  const currentUser = user || getUserFromToken()
  const isPatron = currentUser && isPatronRole(currentUser.role)

  // Use React Query for automatic caching - no more reloads!
  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['userDashboard', currentUser?.id],
    queryFn: getUserDashboard,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Fetch active loans
  const { data: allLoans, isLoading: loansLoading } = useQuery({
    queryKey: ['userLoans', currentUser?.id],
    queryFn: () => getUserLoans(currentUser?.id),
    staleTime: 60 * 1000, // Cache for 1 minute
    enabled: !!currentUser?.id && isPatron,
  })

  // Fetch student enrollments/courses
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['studentEnrollments', currentUser?.id],
    queryFn: () => getStudentEnrollments(currentUser?.id),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!currentUser?.id && isPatron,
  })

  const activeLoans = allLoans?.filter(loan => 
    loan.status === 'active' || loan.status === 'pending' || loan.status === 'overdue'
  ) || []

  const profileUser = dashboard?.user

  const getInitials = (name) => {
    if (!name) return isPatron ? "U" : "A"
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
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Spinner size="large" />
            <p style={{ marginTop: '20px', color: '#6b7280' }}>Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profileUser) {
    return isPatron ? (
      <div className="pageContent">
        <div className="pageHeaderCard">
          <h1>Profile</h1>
        </div>
        <div className="contentCard">
          <p>Failed to load profile</p>
        </div>
      </div>
    ) : (
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

  // Patron view
  if (isPatron) {
    return (
      <div className="pageContent">
        <div className="pageHeaderCard">
          <h1>Profile</h1>
        </div>

        <div className="contentCard">
          <div className="profileContainer">
            <div className="profileHeader">
              <div className="avatarLarge">{getInitials(profileUser.full_name)}</div>
              <div className="profileInfo">
                <h2>{profileUser.full_name || profileUser.email}</h2>
                <p className="profileId">{profileUser.uniId || profileUser.university_id}</p>
                <p className="profileEmail">{profileUser.email}</p>
              </div>
            </div>

            <div className="profileDetails">
              <div className="profileSection">
                <h3>Account Information</h3>
                <div className="profileDetailItem">
                  <span className="detailLabel">Role:</span> {profileUser.role}
                </div>
                <div className="profileDetailItem">
                  <span className="detailLabel">University ID:</span> {profileUser.uniId || profileUser.university_id}
                </div>
                <div className="profileDetailItem">
                  <span className="detailLabel">Email:</span> {profileUser.email}
                </div>
                {profileUser.faculty && (
                  <div className="profileDetailItem">
                    <span className="detailLabel">Faculty:</span> {profileUser.faculty}
                  </div>
                )}
                {profileUser.academic_year && (
                  <div className="profileDetailItem">
                    <span className="detailLabel">Academic Year:</span> {profileUser.academic_year}
                  </div>
                )}
              </div>

              <div className="profileSection" style={{ marginTop: '20px' }}>
                <h3>Enrolled Courses</h3>
                {enrollmentsLoading ? (
                  <Spinner size="small" />
                ) : enrollments && enrollments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    {enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        style={{
                          padding: '10px 14px',
                          background: '#eff6ff',
                          borderRadius: '6px',
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        <div style={{ fontWeight: '500', fontSize: '14px', color: '#1e40af' }}>
                          {enrollment.course_code} - {enrollment.course_name}
                        </div>
                        {enrollment.semester && (
                          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                            Semester: {enrollment.semester}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#6b7280', fontStyle: 'italic', marginTop: '12px' }}>
                    No enrolled courses
                  </p>
                )}
              </div>

              <div className="profileStats">
                <div className="statItem">
                  <h3>Active Loans</h3>
                  <p className="statValue statPrimary">{activeLoans.length}</p>
                </div>
              </div>

              {activeLoans.length > 0 && (
                <div className="profileSection" style={{ marginTop: '20px' }}>
                  <h3>Currently Borrowed Books</h3>
                  {loansLoading ? (
                    <Spinner size="small" />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                      {activeLoans.map(loan => (
                        <div
                          key={loan.id}
                          style={{
                            padding: '12px 16px',
                            background: '#f9fafb',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '4px' }}>
                            {loan.book_title}
                          </div>
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            Due: {loan.due_date ? new Date(loan.due_date).toLocaleDateString() : 'N/A'}
                          </div>
                          <div style={{ marginTop: '6px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                background:
                                  loan.status === 'active'
                                    ? '#dcfce7'
                                    : loan.status === 'overdue'
                                    ? '#fee2e2'
                                    : '#fef3c7',
                                color:
                                  loan.status === 'active'
                                    ? '#166534'
                                    : loan.status === 'overdue'
                                    ? '#991b1b'
                                    : '#854d0e',
                              }}
                            >
                              {loan.status === 'active' ? 'Active' : loan.status === 'overdue' ? 'Overdue' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Admin view - using patron styling for consistency
  return (
    <div className="pageContent">
      <div className="pageHeaderCard">
        <h1>Profile</h1>
      </div>

      <div className="contentCard">
        <div className="profileContainer">
          <div className="profileHeader">
            <div className="avatarLarge">{getInitials(profileUser.full_name)}</div>
            <div className="profileInfo">
              <h2>{profileUser.full_name || profileUser.email}</h2>
              <p className="profileId">{profileUser.uniId || profileUser.university_id}</p>
              <p className="profileEmail">{profileUser.email}</p>
            </div>
          </div>

          <div className="profileDetails">
            <div className="profileSection">
              <h3>Account Information</h3>
              <div className="profileDetailItem">
                <span className="detailLabel">Role:</span> {profileUser.role}
              </div>
              <div className="profileDetailItem">
                <span className="detailLabel">University ID:</span> {profileUser.uniId || profileUser.university_id}
              </div>
              <div className="profileDetailItem">
                <span className="detailLabel">Email:</span> {profileUser.email}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
