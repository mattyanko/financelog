import { CONFIG } from '../config'
import { apiFetch } from './googleAuth'

export async function uploadReceipt(file, description, category) {
  const ext = file.name.split('.').pop().toLowerCase()
  const date = new Date().toISOString().split('T')[0]
  const safe = (description || category || 'receipt')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .slice(0, 40)
  const filename = `${date}_${safe}.${ext}`

  const metadata = {
    name: filename,
    parents: [CONFIG.DRIVE_FOLDER_ID],
  }

  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', file)

  const uploadRes = await apiFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    { method: 'POST', body: form }
  )
  if (!uploadRes.ok) throw new Error('Failed to upload receipt')
  const fileData = await uploadRes.json()

  // Make viewable by anyone with the link
  await apiFetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  })

  return { name: filename, link: fileData.webViewLink }
}
