import { useState, useEffect, useCallback } from 'react'
import { getAllExpenses } from '../utils/googleSheets'
import { CATEGORIES, CATEGORY_COLORS } from '../config'

const fmt$ = (n) => `$${parseFloat(n).toFixed(2)}`
const fmtDate = (s) => {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ExpenseTable({ refreshKey }) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', category: '', hasReceipt: 'all' })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllExpenses()
      setExpenses(data.reverse()) // newest first
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const setFilter = (field) => (e) => setFilters(f => ({ ...f, [field]: e.target.value }))

  const filtered = expenses.filter(exp => {
    if (filters.dateFrom && exp.date < filters.dateFrom) return false
    if (filters.dateTo   && exp.date > filters.dateTo)   return false
    if (filters.category && exp.category !== filters.category) return false
    if (filters.hasReceipt === 'yes' && !exp.receiptLink) return false
    if (filters.hasReceipt === 'no'  &&  exp.receiptLink) return false
    return true
  })

  const total = filtered.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div>
      <div className="card">
        <div className="card-title">Filters</div>
        <div className="filters">
          <div>
            <label>From</label>
            <input type="date" value={filters.dateFrom} onChange={setFilter('dateFrom')} />
          </div>
          <div>
            <label>To</label>
            <input type="date" value={filters.dateTo} onChange={setFilter('dateTo')} />
          </div>
          <div>
            <label>Category</label>
            <select value={filters.category} onChange={setFilter('category')}>
              <option value="">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label>Receipt</label>
            <select value={filters.hasReceipt} onChange={setFilter('hasReceipt')}>
              <option value="all">All</option>
              <option value="yes">Has receipt</option>
              <option value="no">No receipt</option>
            </select>
          </div>
        </div>
        {(filters.dateFrom || filters.dateTo || filters.category || filters.hasReceipt !== 'all') && (
          <button
            className="btn btn-primary"
            style={{ marginTop: 0, padding: '8px', fontSize: 13 }}
            onClick={() => setFilters({ dateFrom: '', dateTo: '', category: '', hasReceipt: 'all' })}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>
            {filtered.length} expense{filtered.length !== 1 ? 's' : ''}
          </div>
          <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{fmt$(total)}</div>
        </div>

        {loading && <div className="empty-state"><div className="icon">⏳</div>Loading…</div>}
        {error   && <div className="msg error">{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state">
            <div className="icon">🗒️</div>
            No expenses found.
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((exp) => (
                  <tr key={exp.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: 12 }}>{fmtDate(exp.date)}</td>
                    <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{fmt$(exp.amount)}</td>
                    <td>
                      <span
                        className="category-badge"
                        style={{ backgroundColor: CATEGORY_COLORS[exp.category] + '22', color: CATEGORY_COLORS[exp.category] || 'var(--text)' }}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>{exp.description || '—'}</td>
                    <td>
                      {exp.receiptLink
                        ? <a className="receipt-link" href={exp.receiptLink} target="_blank" rel="noopener noreferrer">📎 {exp.receiptName || 'View'}</a>
                        : <span className="no-receipt">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
