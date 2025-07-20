// Utility functions for the PitchPal application

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Format date to ISO string
 */
export const formatDate = (date: Date = new Date()): string => {
  return date.toISOString();
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Clean and sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Generate a response object
 */
export const createResponse = (success: boolean, message: string, data: any = null) => {
  return {
    success,
    message,
    data,
    timestamp: formatDate()
  };
};

export default {
  generateId,
  formatDate,
  isValidEmail,
  sanitizeString,
  createResponse
};
