import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { supabaseAdmin } from './supabase'

const SALT_ROUNDS = 10
const SESSION_EXPIRY_DAYS = 30

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 86400000).toISOString()

  const { error } = await supabaseAdmin
    .from('sessions')
    .insert({ user_id: userId, token, expires_at: expiresAt })

  if (error) throw new Error('Failed to create session: ' + error.message)
  return token
}

export async function getSessionUser(token: string) {
  if (!token) return null

  const { data, error } = await supabaseAdmin
    .from('sessions')
    .select('*, users(*)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) return null
  return data.users
}

export async function verifyAdmin(token: string): Promise<boolean> {
  if (!token) return false

  // 1. Check if it matches the admin password environment variable
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'academihubadmin2025'
  if (token === adminPassword) {
    return true
  }

  // 2. Check if it is a valid session token for an admin user
  const user = await getSessionUser(token)
  if (user && user.role === 'admin') {
    return true
  }

  return false
}

export async function deleteSession(token: string) {
  await supabaseAdmin
    .from('sessions')
    .delete()
    .eq('token', token)
}
