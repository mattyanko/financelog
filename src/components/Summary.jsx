import { useEffect, useState, useCallback } from 'react'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from 'chart.js'
import { getAllExpenses } from '../utils/googleSheets'
import { CATEGORY_COLORS } from '../config'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const fmt$ = (n) => `$${parseFloat(n || 0).toFixed(2)}`

function getMonthKey(dateStr) { return dateStr?.substring(0, 7) || '' }
function fmtMonth(ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-')
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function Summary({ refreshKey }) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [view, setView]         = useState('month') // 'month' | 'all'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setExpenses(await getAllExpenses())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const thisMonth = new Date().toISOString().substring(0, 7)
  const thisMonthExp = expenses.filter(e => getMonthKey(e.date) === thisMonth)

  const totalAll   = expenses.reduce((s, e) => s + e.amount, 0)
  const totalMonth = thisMonthExp.reduce((s, e) => s + e.amount, 0)

  // Category breakdown
  const source = view === 'month' ? thisMonthExp : expenses
  const byCategory = source.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})

  const pieData = {
    labels: Object.keys(byCategory),
    datasets: [{
      data: Object.values(byCategory),
      backgroundColor: Object.keys(byCategory).map(k => CATEGORY_COLORS[k] || '#94a3b8'),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  }

  // Monthly bar chart — last 6 months
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push(d.toISOString().substring(0, 7))
  }
  const monthlyTotals = months.map(m =>
    expenses.filter(e => getMonthKey(e.date) === m).reduce((s, e) => s + e.amount, 0)
  )
  const barData = {
    labels: months.map(fmtMonth),
    datasets: [{
      label: 'Total Spent',
      data: monthlyTotals,
      backgroundColor: '#3b82f688',
      borderColor: '#3b82f6',
      borderWidth: 2,
      borderRadius: 6,
    }],
  }

  // Last 6 months breakdown table
  const allMonths = [...new Set(expenses.map(e => getMonthKey(e.date)))].sort().reverse().slice(0, 6)

  if (loading) return <div className="empty-state" style={{ paddingTop: 60 }}><div className="icon">⏳</div>Loading…</div>
  if (error)   return <div className="msg error">{error}</div>

  return (
    <div>
      <div className="stat-row">
        <div className="stat-card">
          <div className="val">{fmt$(totalMonth)}</div>
          <div className="lbl">This month</div>
        </div>
        <div className="stat-card" style={{ background: '#8b5cf6' }}>
          <div className="val">{fmt$(totalAll)}</div>
          <div className="lbl">All time</div>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card light">
          <div className="val">{thisMonthExp.length}</div>
          <div className="lbl">Expenses this month</div>
        </div>
        <div className="stat-card light">
          <div className="val">{expenses.length}</div>
          <div className="lbl">Total expenses</div>
        </div>
      </div>

      {/* Category donut */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>By Category</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['month', 'all'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                  background: view === v ? 'var(--primary)' : 'var(--bg)',
                  color: view === v ? 'white' : 'var(--muted)',
                }}
              >
                {v === 'month' ? 'This month' : 'All time'}
              </button>
            ))}
          </div>
        </div>
        {Object.keys(byCategory).length === 0
          ? <div className="empty-state">No data for this period.</div>
          : (
            <div className="chart-wrap">
              <Doughnut
                data={pieData}
                options={{
                  plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
                  cutout: '60%',
                }}
              />
            </div>
          )
        }
      </div>

      {/* Monthly bar */}
      <div className="card">
        <div className="card-title">Last 6 Months</div>
        <div className="chart-wrap">
          <Bar
            data={barData}
            options={{
              plugins: { legend: { display: false } },
              scales: {
                y: { ticks: { callback: v => `$${v}` }, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } },
              },
              responsive: true,
              maintainAspectRatio: true,
            }}
          />
        </div>
      </div>

      {/* Monthly breakdown table */}
      {allMonths.length > 0 && (
        <div className="card">
          <div className="card-title">Monthly Breakdown</div>
          <div className="table-wrap">
            <table className="monthly-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th># Items</th>
                  <th className="total-col">Total</th>
                </tr>
              </thead>
              <tbody>
                {allMonths.map(m => {
                  const rows = expenses.filter(e => getMonthKey(e.date) === m)
                  return (
                    <tr key={m}>
                      <td>{fmtMonth(m)}</td>
                      <td style={{ color: 'var(--muted)' }}>{rows.length}</td>
                      <td className="total-col">{fmt$(rows.reduce((s, e) => s + e.amount, 0))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
