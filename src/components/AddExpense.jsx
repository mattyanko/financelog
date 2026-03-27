import { useState } from 'react'
import { appendExpense } from '../utils/googleSheets'
import { uploadReceipt } from '../utils/googleDrive'
import { CATEGORIES } from '../config'

const today = () => new Date().toISOString().split('T')[0]

export default function AddExpense({ onExpenseAdded }) {
  const [form, setForm] = useState({ date: today(), amount: '', category: '', description: '' })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
    e.target.value = '' // reset so same file can be re-selected
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || !form.category) {
      setError('Amount and category are required.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      let receiptName = ''
      let receiptLink = ''
      if (file) {
        const receipt = await uploadReceipt(file, form.description, form.category)
        receiptName = receipt.name
        receiptLink = receipt.link
      }
      await appendExpense({ ...form, receiptName, receiptLink })
      setSuccess(true)
      setForm({ date: today(), amount: '', category: '', description: '' })
      setFile(null)
      onExpenseAdded?.()
      setTimeout(() => setSuccess(false), 3500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {success && <div className="msg success">✓ Expense saved to Google Sheets!</div>}
      {error   && <div className="msg error">{error}</div>}

      <div className="card">
        <div className="card-title">New Expense</div>

        <div className="form-group">
          <label>Date</label>
          <input type="date" value={form.date} onChange={set('date')} required />
        </div>

        <div className="form-group">
          <label>Amount</label>
          <div className="amount-wrap">
            <span className="prefix">$</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={set('amount')}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Category</label>
          <select value={form.category} onChange={set('category')} required>
            <option value="">Select a category…</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Description <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
          <input
            type="text"
            placeholder="e.g. CVS prescription, Uber to doctor"
            value={form.description}
            onChange={set('description')}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-title">Receipt / Document <span style={{ textTransform: 'none', fontWeight: 400, fontSize: 11 }}>(optional)</span></div>
        <div className="file-upload-area">
          <input
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFile}
          />
          <div className="icon">📎</div>
          <strong style={{ fontSize: 14 }}>Tap to attach a file</strong>
          <p>Photo, PDF, or document</p>
        </div>
        {file && (
          <div className="file-preview">
            <span>{file.type.startsWith('image/') ? '🖼️' : '📄'}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
            <button type="button" onClick={() => setFile(null)} title="Remove">✕</button>
          </div>
        )}
      </div>

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? <><span className="spinner" />Saving…</> : 'Save Expense'}
      </button>
    </form>
  )
}
