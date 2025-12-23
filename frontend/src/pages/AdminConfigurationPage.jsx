"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAllLoanPolicies, updateLoanPolicy } from "../api/loansService"
import toast from "../utils/toast"
import Spinner from "../components/Spinner"
import "../assets/AdminPages.css"
import "../assets/Responsive.css"

function AdminConfigurationPage() {
  const queryClient = useQueryClient()
  const [editingRole, setEditingRole] = useState(null)
  const [editFormData, setEditFormData] = useState({
    max_books: 0,
    loan_days: 0
  })

  // Fetch all loan policies
  const { data: policies = [], isLoading, error } = useQuery({
    queryKey: ['loan-policies'],
    queryFn: getAllLoanPolicies,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ role, data }) => updateLoanPolicy(role, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['loan-policies'])
      toast.success('Loan policy updated successfully')
      setEditingRole(null)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update loan policy')
    }
  })

  const handleEdit = (policy) => {
    setEditingRole(policy.role)
    setEditFormData({
      max_books: policy.max_books,
      loan_days: policy.loan_days
    })
  }

  const handleSave = () => {
    if (!editFormData.max_books || !editFormData.loan_days) {
      toast.error('All fields are required')
      return
    }
    
    if (editFormData.max_books < 1 || editFormData.loan_days < 1) {
      toast.error('Values must be greater than 0')
      return
    }

    updateMutation.mutate({
      role: editingRole,
      data: {
        max_books: parseInt(editFormData.max_books),
        loan_days: parseInt(editFormData.loan_days)
      }
    })
  }

  const getRoleLabel = (role) => {
    const labels = {
      student: 'Student',
      professor: 'Professor',
      ta: 'Teaching Assistant',
      admin: 'Administrator'
    }
    return labels[role] || role
  }

  const getRoleIcon = (role) => {
    const icons = {
      student: '🎓',
      professor: '👨‍🏫',
      ta: '👨‍💼',
      admin: '⚙️'
    }
    return icons[role] || '👤'
  }

  return (
    <div className="adminDatabaseContainer">
      <div className="adminDatabaseHeader">
        <h1 className="adminDatabaseTitle">Configuration Management</h1>
        <p style={{ color: '#6b7280', marginTop: '8px' }}>
          Manage loan policies and system settings
        </p>
        
        <div style={{
          marginTop: '16px',
          padding: '14px 16px',
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#92400e'
        }}>
          <strong>ℹ️ Important Note:</strong>
          <p style={{ margin: '6px 0 0 0', lineHeight: '1.5' }}>
            If a student is enrolled in a course that has a book associated with it, 
            the <strong>course's loan duration</strong> will override the role-based policy. 
            Students will get the loan period defined in their enrolled course instead of their default role policy.
          </p>
        </div>
      </div>

      <div className="adminDatabaseContent">
        <div className="databaseCard">
          <h2 className="cardTitle">Loan Policies by Role</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
            Configure maximum books allowed and loan duration for each user role
          </p>

          {error && (
            <div style={{ padding: '20px', color: '#ef4444', textAlign: 'center', marginBottom: '20px' }}>
              Failed to load loan policies: {error.message}
            </div>
          )}

          {isLoading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <Spinner size="large" />
              <p style={{ marginTop: '20px', color: '#6b7280' }}>Loading policies...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {policies.map((policy) => (
                <div
                  key={policy.role}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div style={{ fontSize: '32px' }}>
                      {getRoleIcon(policy.role)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                        {getRoleLabel(policy.role)}
                      </h3>
                      <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#6b7280' }}>
                        <div>
                          <span style={{ fontWeight: '500', color: '#3b82f6' }}>
                            {policy.max_books}
                          </span>
                          {' '}max books
                        </div>
                        <div>
                          <span style={{ fontWeight: '500', color: '#10b981' }}>
                            {policy.loan_days}
                          </span>
                          {' '}days loan period
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(policy)}
                    style={{
                      padding: '8px 16px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Policy Modal */}
      {editingRole && (
        <div className="modal" onClick={() => setEditingRole(null)}>
          <div className="modalContent" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">Edit Loan Policy</h2>
              <button className="modalCloseButton" onClick={() => setEditingRole(null)}>×</button>
            </div>

            <div className="modalBody">
              <div style={{ marginBottom: '20px', padding: '12px', background: '#f3f4f6', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{getRoleIcon(editingRole)}</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '16px' }}>
                      {getRoleLabel(editingRole)}
                    </p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                      Configure loan limits and duration
                    </p>
                  </div>
                </div>
              </div>

              <div className="formGroup">
                <label>Maximum Books Allowed *</label>
                <input
                  type="number"
                  value={editFormData.max_books}
                  onChange={(e) => setEditFormData({ ...editFormData, max_books: e.target.value })}
                  min="1"
                  max="100"
                  placeholder="e.g., 5"
                />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Number of books this role can borrow at once
                </p>
              </div>

              <div className="formGroup">
                <label>Loan Period (Days) *</label>
                <input
                  type="number"
                  value={editFormData.loan_days}
                  onChange={(e) => setEditFormData({ ...editFormData, loan_days: e.target.value })}
                  min="1"
                  max="365"
                  placeholder="e.g., 14"
                />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Number of days before the book is due
                </p>
              </div>

              <div style={{ 
                padding: '12px', 
                background: '#fef3c7', 
                borderRadius: '6px',
                border: '1px solid #fbbf24',
                marginTop: '16px'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
                  ⚠️ <strong>Note:</strong> Changes will apply to new loans only. Existing active loans will not be affected.
                </p>
              </div>
            </div>

            <div className="modalFooter">
              <button 
                className="buttonSecondary" 
                onClick={() => setEditingRole(null)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </button>
              <button 
                className="buttonPrimary" 
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Spinner size="small" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminConfigurationPage
