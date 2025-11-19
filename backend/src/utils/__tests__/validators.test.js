import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateUsername, validateRequired } from '../validators.js';

describe('validateEmail', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    expect(validateEmail('user+tag@example.com')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('invalid@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('test@example')).toBe(false);
  });
});

describe('validatePassword', () => {
  it('should validate strong passwords', () => {
    expect(validatePassword('Password123')).toBe(true);
    expect(validatePassword('MyP@ssw0rd')).toBe(true);
    expect(validatePassword('Secure123')).toBe(true);
  });

  it('should reject weak passwords', () => {
    expect(validatePassword('password')).toBe(false); // no uppercase, no number
    expect(validatePassword('PASSWORD123')).toBe(false); // no lowercase
    expect(validatePassword('Password')).toBe(false); // no number
    expect(validatePassword('Pass123')).toBe(false); // too short
    expect(validatePassword('')).toBe(false);
  });
});

describe('validateUsername', () => {
  it('should validate correct usernames', () => {
    expect(validateUsername('user123')).toBe(true);
    expect(validateUsername('user_name')).toBe(true);
    expect(validateUsername('User123')).toBe(true);
    expect(validateUsername('abc')).toBe(true); // min length
    expect(validateUsername('a'.repeat(20))).toBe(true); // max length
  });

  it('should reject invalid usernames', () => {
    expect(validateUsername('ab')).toBe(false); // too short
    expect(validateUsername('a'.repeat(21))).toBe(false); // too long
    expect(validateUsername('user-name')).toBe(false); // contains hyphen
    expect(validateUsername('user name')).toBe(false); // contains space
    expect(validateUsername('user@name')).toBe(false); // contains special char
    expect(validateUsername('')).toBe(false);
  });
});

describe('validateRequired', () => {
  it('should pass for valid values', () => {
    expect(validateRequired('value', 'field')).toBe(true);
    expect(validateRequired(123, 'field')).toBe(true);
    expect(validateRequired([1, 2, 3], 'field')).toBe(true);
  });

  it('should throw for empty values', () => {
    expect(() => validateRequired('', 'field')).toThrow('field is required');
    expect(() => validateRequired('   ', 'field')).toThrow('field is required');
    expect(() => validateRequired(null, 'field')).toThrow('field is required');
    expect(() => validateRequired(undefined, 'field')).toThrow('field is required');
  });

  it('should include statusCode in error', () => {
    try {
      validateRequired('', 'field');
    } catch (error) {
      expect(error.statusCode).toBe(400);
    }
  });
});

