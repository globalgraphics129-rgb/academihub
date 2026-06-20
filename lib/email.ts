const BREVO_API_KEY = process.env.BREVO_API_KEY!
const FROM_EMAIL = 'globalgraphics129@gmail.com'
const FROM_NAME = 'COS 102 Project Hub'
const REPLY_TO = 'globalgraphics129@gmail.com'

interface EmailPayload {
  to: { email: string; name: string }[]
  subject: string
  htmlContent: string
}

async function sendEmail(payload: EmailPayload) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      replyTo: { email: REPLY_TO },
      ...payload,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Brevo error: ${err}`)
  }
  return res.json()
}

function baseTemplate(title: string, content: string, emoji: string = '🎓') {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; background: #0a0a0f; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%); border: 1px solid rgba(139,92,246,0.3); border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #06b6d4 100%); padding: 40px 32px; text-align: center; }
    .header-emoji { font-size: 48px; display: block; margin-bottom: 12px; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 6px; }
    .body { padding: 32px; }
    .greeting { font-size: 18px; font-weight: 600; color: #c4b5fd; margin-bottom: 16px; }
    .text { font-size: 14px; line-height: 1.7; color: #94a3b8; margin-bottom: 20px; }
    .summary-box { background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.25); border-radius: 12px; padding: 20px; margin: 24px 0; }
    .summary-box h3 { font-size: 13px; font-weight: 700; color: #a78bfa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(139,92,246,0.1); font-size: 13px; }
    .summary-row:last-child { border-bottom: none; }
    .summary-label { color: #64748b; }
    .summary-value { color: #e2e8f0; font-weight: 500; text-align: right; max-width: 60%; word-break: break-word; }
    .members-box { background: rgba(6,182,212,0.08); border: 1px solid rgba(6,182,212,0.2); border-radius: 12px; padding: 20px; margin: 24px 0; }
    .members-box h3 { font-size: 13px; font-weight: 700; color: #67e8f9; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .member-chip { display: inline-block; background: rgba(6,182,212,0.15); color: #67e8f9; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin: 4px 4px 4px 0; }
    .github-btn { display: block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; margin: 24px 0; }
    .support-text { font-size: 13px; color: #64748b; text-align: center; line-height: 1.6; }
    .support-text a { color: #a78bfa; }
    .footer { border-top: 1px solid rgba(139,92,246,0.15); padding: 20px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #475569; }
    .badge { display: inline-block; background: rgba(139,92,246,0.2); color: #c4b5fd; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <span class="header-emoji">${emoji}</span>
        <h1>COS 102 Project Hub</h1>
        <p>University Project Submission System</p>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        <p>Need help? Reply to this email — we're here for you.</p>
        <p style="margin-top:8px">© 2025 COS 102 Project Hub &nbsp;·&nbsp; <span class="badge">Computer Science</span></p>
      </div>
    </div>
  </div>
</body>
</html>`
}

export async function sendDepartmentRegistrationEmail({
  repEmail, repName, department, numberOfGroups
}: {
  repEmail: string; repName: string; department: string; numberOfGroups: number
}) {
  const content = `
    <p class="greeting">Hey ${repName}! 👋</p>
    <p class="text">Your department has been successfully registered on the COS 102 Project Hub. You're all set — groups in your department can now start submitting their projects.</p>
    <div class="summary-box">
      <h3>📋 Registration Summary</h3>
      <div class="summary-row"><span class="summary-label">Department</span><span class="summary-value">${department}</span></div>
      <div class="summary-row"><span class="summary-label">Number of Groups</span><span class="summary-value">${numberOfGroups}</span></div>
      <div class="summary-row"><span class="summary-label">Class Rep</span><span class="summary-value">${repName}</span></div>
      <div class="summary-row"><span class="summary-label">Status</span><span class="summary-value" style="color:#4ade80">✓ Registered</span></div>
    </div>
    <p class="text">Share the submission link with your group leaders so they can upload their work. The admin will be notified as submissions come in.</p>
    <p class="support-text">Questions? Reply to this email at <a href="mailto:${REPLY_TO}">${REPLY_TO}</a></p>
  `
  return sendEmail({
    to: [{ email: repEmail, name: repName }],
    subject: `✅ ${department} Registered — COS 102 Project Hub`,
    htmlContent: baseTemplate('Department Registered', content, '🏛️'),
  })
}

interface Member { name: string; matric: string }

export async function sendProjectSubmissionEmail({
  leaderEmail, leaderName, department, groupNumber, projectName, githubLink, members
}: {
  leaderEmail: string; leaderName: string; department: string; groupNumber: number;
  projectName: string; githubLink: string; members: Member[]
}) {
  const memberRows = members.map(m => `
    <div style="display:flex;justify-content:space-between;padding:6px 10px;border-bottom:1px solid rgba(6,182,212,0.1);font-size:13px;">
      <span style="color:#e2e8f0">${m.name}</span>
      <span style="color:#67e8f9;font-family:monospace">${m.matric || '—'}</span>
    </div>
  `).join('')
  const content = `
    <p class="greeting">Submission received, ${leaderName}! 🚀</p>
    <p class="text">Your group's project has been successfully submitted. The lecturer will be able to view all submissions through the admin panel. Here's a summary of what was submitted:</p>
    <div class="summary-box">
      <h3>📦 Submission Details</h3>
      <div class="summary-row"><span class="summary-label">Project Name</span><span class="summary-value">${projectName}</span></div>
      <div class="summary-row"><span class="summary-label">Department</span><span class="summary-value">${department}</span></div>
      <div class="summary-row"><span class="summary-label">Group Number</span><span class="summary-value">Group ${groupNumber}</span></div>
      <div class="summary-row"><span class="summary-label">GitHub Link</span><span class="summary-value"><a href="${githubLink}" style="color:#67e8f9">${githubLink}</a></span></div>
      <div class="summary-row"><span class="summary-label">Submitted By</span><span class="summary-value">${leaderName}</span></div>
      <div class="summary-row"><span class="summary-label">Status</span><span class="summary-value" style="color:#4ade80">✓ Submitted</span></div>
    </div>
    <div class="members-box">
      <h3>👥 Group Members (${members.length})</h3>
      <div style="background:rgba(6,182,212,0.05);border-radius:8px;overflow:hidden;">
        ${memberRows}
      </div>
    </div>
    <a href="${githubLink}" class="github-btn">🔗 View Project on GitHub</a>
    <p class="support-text">If you need to make changes or have questions, reply to this email at <a href="mailto:${REPLY_TO}">${REPLY_TO}</a></p>
  `
  return sendEmail({
    to: [{ email: leaderEmail, name: leaderName }],
    subject: `🎉 Project Submitted — ${projectName} | Group ${groupNumber}`,
    htmlContent: baseTemplate('Project Submitted', content, '🚀'),
  })
}

export async function sendCustomAdminEmail({
  toEmail, toName, subject, message
}: {
  toEmail: string; toName: string; subject: string; message: string
}) {
  const content = `
    <div style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:12px;padding:24px;margin:16px 0;">
      <p class="text" style="white-space:pre-wrap;line-height:1.8;">${message}</p>
    </div>
    <p class="support-text">This message was sent to you by the COS 102 admin. Reply to this email if you have questions.</p>
  `
  return sendEmail({
    to: [{ email: toEmail, name: toName }],
    subject,
    htmlContent: baseTemplate('Message from Admin', content, '📬'),
  })
}

export async function sendBulkNotification({
  recipients, subject, message, emoji = '📢'
}: {
  recipients: { email: string; name: string }[]
  subject: string
  message: string
  emoji?: string
}) {
  if (recipients.length === 0) return
  const content = `
    <p class="text" style="white-space:pre-wrap;line-height:1.8;">${message}</p>
    <p class="support-text">This is an automated message from the COS 102 Project Hub. Reply to this email if you have questions.</p>
  `
  // Brevo allows up to 1000 recipients per call, send in batches
  for (let i = 0; i < recipients.length; i += 50) {
    const batch = recipients.slice(i, i + 50)
    await sendEmail({
      to: batch,
      subject,
      htmlContent: baseTemplate('COS 102 Portal Notification', content, emoji),
    })
  }
}

export async function sendPortalClosedReportToAdmin({
  summary,
}: {
  summary: string
}) {
  const content = `
    <p class="greeting">Portal Closed — Final Report</p>
    <p class="text">The COS 102 project submission portal has been closed. All submissions are now final.</p>
    <div class="summary-box">
      <h3>📊 Submission Summary</h3>
      <div style="white-space:pre-wrap;font-size:13px;line-height:1.8;color:#e2e8f0;">${summary}</div>
    </div>
    <p class="support-text">You can view the full report in the admin panel at any time.</p>
  `
  return sendEmail({
    to: [{ email: 'globalgraphics129@gmail.com', name: 'Admin' }],
    subject: '📊 COS 102 Portal Closed — Final Submission Report',
    htmlContent: baseTemplate('Portal Closed Report', content, '📊'),
  })
}
