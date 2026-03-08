/**
 * SkillIntel – Indian salary formatting utilities
 * Backend stores salary directly in INR (e.g. 1200000).
 */

/**
 * Format salary as LPA (Lakhs Per Annum)
 * Example: 1200000 → "₹12 LPA"
 */
export function formatSalaryLPA(inrSalary, decimals = 1) {
    if (!inrSalary && inrSalary !== 0) return '—';

    const lakhs = inrSalary / 100000;

    const formatted =
        lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(decimals);

    return `₹${formatted} LPA`;
}

/**
 * Format salary as full INR with Indian comma format
 * Example: 1200000 → "₹12,00,000"
 */
export function formatSalaryINR(inrSalary) {
    if (!inrSalary && inrSalary !== 0) return '—';

    return '₹' + inrSalary.toLocaleString('en-IN');
}