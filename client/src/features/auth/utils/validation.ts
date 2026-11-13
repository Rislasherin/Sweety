const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) {
    return 'Email is required'
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Please enter a valid email address'
  }
  if (trimmed.length > 255) {
    return 'Email cannot exceed 255 characters'
  }
  return null
}

export function validateName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) {
    return 'Name is required'
  }
  if (trimmed.length > 100) {
    return 'Name cannot exceed 100 characters'
  }
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required'
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters'
  }
  if (password.length > 72) {
    return 'Password cannot exceed 72 characters'
  }
  return null
}

export function validateConfirmPassword(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) {
    return 'Please confirm your password'
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match'
  }
  return null
}
