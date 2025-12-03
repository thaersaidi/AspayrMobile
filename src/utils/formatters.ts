import { decode as atob } from 'base-64';

/**
 * Format currency amounts
 */
export const formatCurrency = (
  amount: number | undefined | null,
  currency: string = 'EUR'
): string => {
  if (amount === undefined || amount === null) {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(0);
  }

  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format date/time
 */
export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Format date only (without time)
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateString);
  }
};

/**
 * Parse JWT token
 */
export const parseJwt = (token: string): any | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT:', e);
    return null;
  }
};

/**
 * Format account number (mask middle digits)
 */
export const formatAccountNumber = (accountNumber: string): string => {
  if (!accountNumber || accountNumber.length < 8) {
    return accountNumber || 'N/A';
  }

  const firstFour = accountNumber.substring(0, 4);
  const lastFour = accountNumber.substring(accountNumber.length - 4);
  const masked = '**** **** '.repeat(
    Math.floor((accountNumber.length - 8) / 4)
  );

  return `${firstFour} ${masked}${lastFour}`;
};

/**
 * Format IBAN
 */
export const formatIBAN = (iban: string): string => {
  if (!iban) return 'N/A';

  // Remove spaces
  const cleaned = iban.replace(/\s/g, '');

  // Add space every 4 characters
  return cleaned.match(/.{1,4}/g)?.join(' ') || iban;
};

/**
 * Truncate string with ellipsis
 */
export const truncate = (str: string, maxLength: number = 50): string => {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format large numbers (e.g., 1000 -> 1K, 1000000 -> 1M)
 */
export const formatCompactNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return 'N/A';

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
};
