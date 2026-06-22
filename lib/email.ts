const BREVO_API_KEY = process.env.BREVO_API_KEY!
const FROM_EMAIL = 'globalgraphics129@gmail.com'
const FROM_NAME = 'AcademiHub'
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

function baseTemplate(title: string, content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0a0a0f; color: #e2e8f0; }
    .wrapper { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .card { background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%); border: 1px solid rgba(5,150,105,0.3); border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #059669 0%, #0d9488 50%, #14b8a6 100%); padding: 36px 28px; text-align: center; }
    .header h1 { color: #fff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { color: rgba(255,255,255,0.75); font-size: 13px; margin-top: 4px; }
    .body { padding: 28px; }
    .greeting { font-size: 16px; font-weight: 600; color: #34d399; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.7; color: #94a3b8; margin-bottom: 16px; }
    .info-box { background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.2); border-radius: 10px; padding: 18px; margin: 20px 0; }
    .info-box h3 { font-size: 11px; font-weight: 700; color: #34d399; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(5,150,105,0.08); font-size: 13px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748b; }
    .info-value { color: #e2e8f0; font-weight: 500; text-align: right; max-width: 60%; word-break: break-word; }
    .members-box { background: rgba(13,148,136,0.06); border: 1px solid rgba(13,148,136,0.15); border-radius: 10px; padding: 18px; margin: 20px 0; }
    .members-box h3 { font-size: 11px; font-weight: 700; color: #2dd4bf; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .member-row { display: flex; justify-content: space-between; padding: 5px 8px; border-bottom: 1px solid rgba(13,148,136,0.06); font-size: 13px; }
    .member-row:last-child { border-bottom: none; }
    .member-name { color: #e2e8f0; }
    .member-matric { color: #2dd4bf; font-family: 'Consolas', 'Courier New', monospace; }
    .btn { display: block; background: linear-gradient(135deg, #059669, #0d9488); color: #fff; text-decoration: none; text-align: center; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 20px 0; }
    .support { font-size: 12px; color: #64748b; text-align: center; line-height: 1.6; }
    .support a { color: #34d399; }
    .footer { border-top: 1px solid rgba(5,150,105,0.12); padding: 18px 28px; text-align: center; }
    .footer p { font-size: 11px; color: #475569; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>AcademiHub</h1>
        <p>Academic Project Management</p>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        <p>Need assistance? Reply to this email and we will help.</p>
        <p style="margin-top:6px">&copy; 2025 AcademiHub &nbsp;·&nbsp; Project Submission System</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

export async function sendDepartmentRegistrationEmail({
  repEmail, repName, department, numberOfGroups, projectName
}: {
  repEmail: string; repName: string; department: string; numberOfGroups: number; projectName?: string
}) {
  const content = `
    <p class="greeting">Hello ${repName},</p>
    <p class="text">This email confirms that your department has been registered on AcademiHub. Groups in your department can now submit their projects through the platform.</p>
    <div class="info-box">
      <h3>Registration Summary</h3>
      <div class="info-row"><span class="info-label">Department</span><span class="info-value">${department}</span></div>
      ${projectName ? `<div class="info-row"><span class="info-label">Project</span><span class="info-value">${projectName}</span></div>` : ''}
      <div class="info-row"><span class="info-label">Number of Groups</span><span class="info-value">${numberOfGroups}</span></div>
      <div class="info-row"><span class="info-label">Class Representative</span><span class="info-value">${repName}</span></div>
      <div class="info-row"><span class="info-label">Status</span><span class="info-value" style="color:#4ade80">Confirmed</span></div>
    </div>
    <p class="text">Please share the AcademiHub link with your group leaders so they can register their groups and submit their projects. The lecturer will be able to review all submissions through the admin panel.</p>
    <p class="support">Questions? Reply to this email at <a href="mailto:${REPLY_TO}">${REPLY_TO}</a></p>
  `
  return sendEmail({
    to: [{ email: repEmail, name: repName }],
    subject: `${department} Registration Confirmed — AcademiHub`,
    htmlContent: baseTemplate('Department Registered', content),
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
    <div class="member-row">
      <span class="member-name">${m.name}</span>
      <span class="member-matric">${m.matric || '—'}</span>
    </div>
  `).join('')
  const content = `
    <p class="greeting">Dear ${leaderName},</p>
    <p class="text">Your project has been submitted successfully. The lecturer can now review your submission through the admin panel. Below is a summary of the submitted information.</p>
    <div class="info-box">
      <h3>Submission Details</h3>
      <div class="info-row"><span class="info-label">Project Title</span><span class="info-value">${projectName}</span></div>
      <div class="info-row"><span class="info-label">Department</span><span class="info-value">${department}</span></div>
      <div class="info-row"><span class="info-label">Group</span><span class="info-value">Group ${groupNumber}</span></div>
      <div class="info-row"><span class="info-label">GitHub Repository</span><span class="info-value"><a href="${githubLink}" style="color:#2dd4bf">${githubLink}</a></span></div>
      <div class="info-row"><span class="info-label">Submitted by</span><span class="info-value">${leaderName}</span></div>
      <div class="info-row"><span class="info-label">Status</span><span class="info-value" style="color:#4ade80">Confirmed</span></div>
    </div>
    <div class="members-box">
      <h3>Group Members (${members.length})</h3>
      ${memberRows}
    </div>
    <a href="${githubLink}" class="btn">View Repository on GitHub</a>
    <p class="support">If you need to make changes or have questions, reply to this email at <a href="mailto:${REPLY_TO}">${REPLY_TO}</a></p>
  `
  return sendEmail({
    to: [{ email: leaderEmail, name: leaderName }],
    subject: `Project Submitted — ${projectName} | Group ${groupNumber}`,
    htmlContent: baseTemplate('Project Submitted', content),
  })
}

export async function sendCustomAdminEmail({
  toEmail, toName, subject, message
}: {
  toEmail: string; toName: string; subject: string; message: string
}) {
  const content = `
    <p class="text" style="white-space:pre-wrap;line-height:1.8;">${message}</p>
    <p class="support">This message was sent by the AcademiHub admin. If you have any questions, please reply to this email.</p>
  `
  return sendEmail({
    to: [{ email: toEmail, name: toName }],
    subject,
    htmlContent: baseTemplate('Message from AcademiHub Admin', content),
  })
}

export async function sendBulkNotification({
  recipients, subject, message
}: {
  recipients: { email: string; name: string }[]
  subject: string
  message: string
}) {
  if (recipients.length === 0) return
  const content = `
    <p class="text" style="white-space:pre-wrap;line-height:1.8;">${message}</p>
    <p class="support">This is an automated message from AcademiHub. If you have any questions, please reply to this email.</p>
  `
  for (let i = 0; i < recipients.length; i += 50) {
    const batch = recipients.slice(i, i + 50)
    await sendEmail({
      to: batch,
      subject,
      htmlContent: baseTemplate('AcademiHub Notification', content),
    })
  }
}

export async function sendPortalClosedReportToAdmin({
  summary,
}: {
  summary: string
}) {
  const content = `
    <p class="greeting">Portal Closure Report</p>
    <p class="text">The project submission portal has been closed. All submissions are now final and available for review in the admin panel.</p>
    <div class="info-box">
      <h3>Submission Summary</h3>
      <div style="white-space:pre-wrap;font-size:13px;line-height:1.8;color:#e2e8f0;">${summary}</div>
    </div>
    <p class="support">You may view the complete report from the admin dashboard at any time.</p>
  `
  return sendEmail({
    to: [{ email: 'globalgraphics129@gmail.com', name: 'Admin' }],
    subject: 'AcademiHub Portal Closure — Submission Report',
    htmlContent: baseTemplate('Portal Closure Report', content),
  })
}

export async function sendStudentConfirmationCode({ email, name, code }: {
  email: string; name: string; code: string
}) {
  const content = `
    <p class="greeting">Hello ${name},</p>
    <p class="text">Welcome to AcademiHub! Use the confirmation code below to verify your email address and complete your registration.</p>
    <div style="text-align:center;padding:24px 0;">
      <span style="display:inline-block;font-size:36px;font-weight:800;letter-spacing:8px;padding:16px 32px;border-radius:12px;background:rgba(5,150,105,0.1);border:1px solid rgba(5,150,105,0.3);color:#34d399;font-family:monospace;">${code}</span>
    </div>
    <p class="text" style="font-size:13px;">This code expires in 15 minutes. If you did not request this, please ignore this email.</p>
    <p class="support">Questions? Reply to this email at <a href="mailto:${REPLY_TO}">${REPLY_TO}</a></p>
  `
  return sendEmail({
    to: [{ email, name }],
    subject: 'Your AcademiHub Confirmation Code',
    htmlContent: baseTemplate('Confirmation Code', content),
  })
}

export async function sendStudentLoginCode({ email, name, code }: {
  email: string; name: string; code: string
}) {
  const content = `
    <p class="greeting">Hello ${name},</p>
    <p class="text">Use the code below to sign in to your AcademiHub student dashboard.</p>
    <div style="text-align:center;padding:24px 0;">
      <span style="display:inline-block;font-size:36px;font-weight:800;letter-spacing:8px;padding:16px 32px;border-radius:12px;background:rgba(5,150,105,0.1);border:1px solid rgba(5,150,105,0.3);color:#34d399;font-family:monospace;">${code}</span>
    </div>
    <p class="text" style="font-size:13px;">This code expires in 15 minutes. If you did not request this, please ignore this email.</p>
    <p class="support">Questions? Reply to this email at <a href="mailto:${REPLY_TO}">${REPLY_TO}</a></p>
  `
  return sendEmail({
    to: [{ email, name }],
    subject: 'Your AcademiHub Login Code',
    htmlContent: baseTemplate('Login Code', content),
  })
}

export async function sendAnnouncementEmail({
  recipients, subject, message
}: {
  recipients: { email: string; name: string }[]
  subject: string
  message: string
}) {
  if (recipients.length === 0) return
  const content = `
    <p class="text" style="white-space:pre-wrap;line-height:1.8;">${message}</p>
    <p class="support">This is an announcement from AcademiHub. If you have any questions, please reply to this email.</p>
  `
  for (let i = 0; i < recipients.length; i += 50) {
    const batch = recipients.slice(i, i + 50)
    await sendEmail({
      to: batch,
      subject,
      htmlContent: baseTemplate('AcademiHub Announcement', content),
    })
  }
}
