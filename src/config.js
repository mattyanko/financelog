// ─────────────────────────────────────────────────────────────────
// FILL THESE IN before running the app (see setup instructions)
// ─────────────────────────────────────────────────────────────────

export const CONFIG = {
  // From Google Cloud Console > Credentials > OAuth 2.0 Client ID
  CLIENT_ID: '453726668767-8lir0b5jrdtqi0uqjuqti1jp0rf7pcc2.apps.googleusercontent.com',

  // From your Google Sheet URL:
  // https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
  SPREADSHEET_ID: '1u1uBd6D4PdBp_kf9mj83V6mFqr6YzFjrcDaFyfpzhBA',

  // From your Google Drive folder URL:
  // https://drive.google.com/drive/folders/FOLDER_ID
  DRIVE_FOLDER_ID: '1HLW3KYbpHq2v1m3cFNvXevod2yvHkYk_',

  // Only these Google accounts can log in
  ALLOWED_EMAILS: ['mattryanyanko@gmail.com', 'ivanaguevara@gmail.com'],

  SCOPES: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
  ].join(' '),
}

export const CATEGORIES = [
  'Medical / Doctor Visit',
  'Pharmacy / Medications',
  'Groceries',
  'Transportation / Rides',
  'Utilities',
  'Home Care / Aide',
  'Personal Care',
  'Household Supplies',
  'Dining Out',
  'Clothing',
  'Entertainment',
  'Insurance / Copays',
  'Other',
]

export const CATEGORY_COLORS = {
  'Medical / Doctor Visit':  '#ef4444',
  'Pharmacy / Medications':  '#f97316',
  'Groceries':               '#22c55e',
  'Transportation / Rides':  '#3b82f6',
  'Utilities':               '#8b5cf6',
  'Home Care / Aide':        '#ec4899',
  'Personal Care':           '#14b8a6',
  'Household Supplies':      '#f59e0b',
  'Dining Out':              '#06b6d4',
  'Clothing':                '#a855f7',
  'Entertainment':           '#84cc16',
  'Insurance / Copays':      '#64748b',
  'Other':                   '#94a3b8',
}
