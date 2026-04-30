// Formats a number as INR currency
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

// Capitalizes first letter of a string
export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
