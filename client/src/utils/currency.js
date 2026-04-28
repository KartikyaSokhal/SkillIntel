export function formatSalaryLPA(inrSalary, decimals = 1) {
    if (!inrSalary && inrSalary !== 0) return '—';
    const lakhs = inrSalary / 100000;
    const formatted =
        lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(decimals);
    return `₹${formatted} LPA`;
}
export function formatSalaryINR(inrSalary) {
    if (!inrSalary && inrSalary !== 0) return '—';
    return '₹' + inrSalary.toLocaleString('en-IN');
}
