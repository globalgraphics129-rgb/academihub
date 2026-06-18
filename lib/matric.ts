export interface Member {
  name: string; matric: string;
}

export const parseMatric = (input: string): { name: string; matric: string } => {
  const s = input.trim()
  if (!s) return { name: '', matric: '' }

  const matricRegex = /(?:\(|^|\s)?(\d{2,4}[\s\/-][A-Za-z]*\d*[\s\/-]?\w*)(?:\s|\)|$)?/

  const match = s.match(matricRegex)
  if (match) {
    const rawMatric = match[1].trim()
    const matric = rawMatric.replace(/^[\s\/-]+|[\s\/-]+$/g, '').trim()
    let name = s.replace(match[0], '').trim()
    name = name.replace(/[\(\[\{]\s*[\)\]\}]/g, '').replace(/[\s\-]+$/, '').trim()
    return { name: name || s.replace(matricRegex, '').trim(), matric }
  }

  const digit8 = s.match(/(\d{8})/)
  if (digit8) {
    const matric = digit8[1]
    const name = s.replace(digit8[0], '').trim()
    return { name: name || 'Unknown', matric }
  }

  return { name: s, matric: '' }
}

export const parseMemberEntry = (input: string): { name: string; matric: string } => {
  const parsed = parseMatric(input)
  if (parsed.matric) return parsed
  const parts = input.split(/[,|\t–—]+/).map(p => p.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return { name: parts[0], matric: parts.slice(1).join(' ') }
  }
  return { name: input.trim(), matric: '' }
}

export const fmtMembers = (members: any[]): string => {
  return members.map(m => {
    let name: string, matric: string
    if (typeof m === 'string') {
      const parsed = parseMatric(m)
      name = parsed.name
      matric = parsed.matric
    } else {
      name = m.name || ''
      matric = m.matric || ''
      if (!matric && name) {
        const parsed = parseMatric(name)
        name = parsed.name
        matric = parsed.matric
      }
    }
    return `${name}${matric ? ` (${matric})` : ''}`
  }).filter(Boolean).join(', ')
}
