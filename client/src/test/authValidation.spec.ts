import { describe, it, expect } from 'vitest'
import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from '@/features/auth/utils/validation'

describe('Authentication Validation Utility', () => {
  describe('validateName', () => {
    it('rejects empty or whitespace-only name', () => {
      expect(validateName('')).toBe('Name is required')
      expect(validateName('   ')).toBe('Name is required')
    })

    it('rejects names exceeding 100 characters', () => {
      const longName = 'A'.repeat(101)
      expect(validateName(longName)).toBe('Name cannot exceed 100 characters')
    })

    it('accepts valid names', () => {
      expect(validateName('Alice Smith')).toBeNull()
      expect(validateName('A')).toBeNull()
      expect(validateName('A'.repeat(100))).toBeNull()
    })
  })

  describe('validateEmail', () => {
    it('rejects empty or whitespace-only email', () => {
      expect(validateEmail('')).toBe('Email is required')
      expect(validateEmail('   ')).toBe('Email is required')
    })

    it('rejects malformed email addresses', () => {
      expect(validateEmail('notanemail')).toBe('Please enter a valid email address')
      expect(validateEmail('missingdomain@')).toBe('Please enter a valid email address')
      expect(validateEmail('@nodomain.com')).toBe('Please enter a valid email address')
      expect(validateEmail('no.tld@domain')).toBe('Please enter a valid email address')
    })

    it('rejects emails exceeding 255 characters', () => {
      const longEmail = `${'a'.repeat(250)}@test.com`
      expect(validateEmail(longEmail)).toBe('Email cannot exceed 255 characters')
    })

    it('accepts valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBeNull()
      expect(validateEmail('first.last@domain.co.uk')).toBeNull()
      expect(validateEmail('user+tag@gmail.com')).toBeNull()
    })
  })

  describe('validatePassword', () => {
    it('rejects empty password', () => {
      expect(validatePassword('')).toBe('Password is required')
    })

    it('rejects passwords shorter than 8 characters', () => {
      expect(validatePassword('1234567')).toBe('Password must be at least 8 characters')
      expect(validatePassword('abc')).toBe('Password must be at least 8 characters')
    })

    it('rejects passwords exceeding 72 characters', () => {
      const longPassword = 'P'.repeat(73)
      expect(validatePassword(longPassword)).toBe('Password cannot exceed 72 characters')
    })

    it('accepts valid passwords (8 to 72 chars)', () => {
      expect(validatePassword('Password123!')).toBeNull()
      expect(validatePassword('12345678')).toBeNull()
      expect(validatePassword('P'.repeat(72))).toBeNull()
    })
  })

  describe('validateConfirmPassword', () => {
    it('rejects empty confirm password', () => {
      expect(validateConfirmPassword('Secret123', '')).toBe('Please confirm your password')
    })

    it('rejects non-matching confirm password', () => {
      expect(validateConfirmPassword('Secret123', 'Secret456')).toBe('Passwords do not match')
      expect(validateConfirmPassword('Secret123', 'secret123')).toBe('Passwords do not match')
    })

    it('accepts matching confirm password', () => {
      expect(validateConfirmPassword('Secret123', 'Secret123')).toBeNull()
    })
  })
})
