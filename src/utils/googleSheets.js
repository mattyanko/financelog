import { CONFIG } from '../config'
import { apiFetch } from './googleAuth'

const BASE = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}`
const SHEET = 'Sheet1'
const HEADERS = ['Date', 'Amount', 'Category', 'Description', 'Receipt Name', 'Receipt Link']

export async function initializeSheet() {
  const res = await apiFetch(`${BASE}/values/${SHEET}!A1`)
  const data = await res.json()
  if (!data.values) {
    await apiFetch(`${BASE}/values/${SHEET}!A1:F1?valueInputOption=RAW`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [HEADERS] }),
    })
  }
}

export async function appendExpense({ date, amount, category, description, receiptName, receiptLink }) {
  const values = [[date, amount, category, description, receiptName || '', receiptLink || '']]
  const res = await apiFetch(
    `${BASE}/values/${SHEET}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  )
  if (!res.ok) throw new Error('Failed to save expense')
  return res.json()
}

export async function getAllExpenses() {
  const res = await apiFetch(`${BASE}/values/${SHEET}`)
  const data = await res.json()
  const rows = data.values || []
  if (rows.length <= 1) return []
  return rows.slice(1).map((row, i) => ({
    id: i + 2,
    date:        row[0] || '',
    amount:      parseFloat(row[1]) || 0,
    category:    row[2] || '',
    description: row[3] || '',
    receiptName: row[4] || '',
    receiptLink: row[5] || '',
  }))
}
