import { useEffect, useState } from 'react'
import '../assets/Modal.css'

function Modal({ isOpen, onClose, title, children, size = 'medium' }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div 
        className={`modalContent modalContent--${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <h3>{title}</h3>
          <button className="modalClose" onClick={onClose}>&times;</button>
        </div>
        <div className="modalBody">
          {children}
        </div>
      </div>
    </div>
  )
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDestructive = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <p style={{ marginBottom: '24px', lineHeight: '1.5' }}>{message}</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button 
          onClick={onClose}
          style={{
            padding: '10px 20px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {cancelText}
        </button>
        <button 
          onClick={() => {
            onConfirm()
            onClose()
          }}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            background: isDestructive ? '#dc2626' : '#2563eb',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  )
}

export function PromptModal({ isOpen, onClose, onSubmit, title, message, placeholder = '', submitText = 'Submit', cancelText = 'Cancel' }) {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    onSubmit(value)
    onClose()
    setValue('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      {message && <p style={{ marginBottom: '16px', lineHeight: '1.5' }}>{message}</p>}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={4}
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          resize: 'vertical',
          marginBottom: '24px'
        }}
      />
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button 
          onClick={onClose}
          style={{
            padding: '10px 20px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {cancelText}
        </button>
        <button 
          onClick={handleSubmit}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            background: '#2563eb',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {submitText}
        </button>
      </div>
    </Modal>
  )
}

export default Modal
