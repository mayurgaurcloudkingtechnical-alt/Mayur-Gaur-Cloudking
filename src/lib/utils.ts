import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats integer Paise to Indian Rupee (INR) string representation.
 * Example: 5000000 -> "₹50,000"
 */
export function formatPaiseToRupees(paise: number): string {
  const rupees = Math.floor(paise / 100);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Formats a Date object or ISO string to standard Indian presentation.
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Converts Rupee amount (integer) to English words in Indian numbering convention.
 * Example: 15000 -> "Fifteen Thousand Rupees Only"
 */
export function rupeesToWords(rupees: number): string {
  const rounded = Math.floor(rupees);
  if (!rounded || rounded <= 0) return "Zero Rupees Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertSection(num: number): string {
    let n = num;
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + " ";
    }
    return str.trim();
  }

  let words = "";
  let rem = rounded;
  const crore = Math.floor(rem / 10000000);
  rem %= 10000000;
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  const thousand = Math.floor(rem / 1000);
  rem %= 1000;

  if (crore > 0) words += convertSection(crore) + " Crore ";
  if (lakh > 0) words += convertSection(lakh) + " Lakh ";
  if (thousand > 0) words += convertSection(thousand) + " Thousand ";
  if (rem > 0) words += convertSection(rem) + " ";

  return (words.trim() + " Rupees Only").replace(/\s+/g, " ");
}
