export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Email is required'
  if (!emailRegex.test(email)) return 'Enter a valid email address'
  return undefined
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required'
  return undefined
}

export function validateConfirmPassword(password: string, confirm: string): string | undefined {
  if (!confirm) return 'Please confirm your password'
  if (password !== confirm) return 'Passwords do not match'
  return undefined
}
