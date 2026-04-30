// Rounds a number to 2 decimal places
const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// Calculates cart total from array of { price, quantity }
const calcTotal = (items) =>
  roundToTwo(items.reduce((sum, item) => sum + item.price * item.quantity, 0));

module.exports = { roundToTwo, calcTotal };
