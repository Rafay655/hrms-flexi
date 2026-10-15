
export const DEMO_COMPANY = {
  legalName: "Crescent Enterprises (Pvt.) Ltd.",
  shortName: "Crescent Enterprises",
  shortCode: "CEPL",
  ntn: "3456789-1",
  strn: "17-10-9876-543-21",
  incorporationDate: "14 Aug 1985",
  industry: "Diversified Manufacturing & Trading",
  headOffice: "3rd Floor, Dolmen Tower, Marine Drive, Clifton, Karachi",
  website: "www.crescent-ent.com.pk",
  employeeCount: 1247,
  currency: "PKR",
  fiscalYearStart: "01 July",
  fiscalYearEnd: "30 June",
};

export const PK_EMPLOYEES = [
  { name: "Sana Ahmed", initials: "SA", gender: "F" },
  { name: "Muhammad Ali", initials: "MA", gender: "M" },
  { name: "Ayesha Malik", initials: "AM", gender: "F" },
  { name: "Ahmed Raza", initials: "AR", gender: "M" },
  { name: "Fatima Sheikh", initials: "FS", gender: "F" },
  { name: "Usman Khan", initials: "UK", gender: "M" },
  { name: "Hina Iqbal", initials: "HI", gender: "F" },
  { name: "Bilal Hussain", initials: "BH", gender: "M" },
  { name: "Zainab Farooq", initials: "ZF", gender: "F" },
  { name: "Hamza Riaz", initials: "HR", gender: "M" },
  { name: "Sadia Javed", initials: "SJ", gender: "F" },
  { name: "Imran Qureshi", initials: "IQ", gender: "M" },
  { name: "Mariam Tariq", initials: "MT", gender: "F" },
  { name: "Ali Hassan", initials: "AH", gender: "M" },
  { name: "Nida Rehman", initials: "NR", gender: "F" },
  { name: "Yasir Shah", initials: "YS", gender: "M" },
  { name: "Aiman Siddiqui", initials: "AS", gender: "F" },
  { name: "Tariq Mehmood", initials: "TM", gender: "M" },
  { name: "Rabia Nadeem", initials: "RN", gender: "F" },
  { name: "Salman Butt", initials: "SB", gender: "M" },
];

export const PK_DEPARTMENTS = [
  "Human Resources",
  "Finance",
  "Information Technology",
  "Operations",
  "Sales & Marketing",
  "Supply Chain",
  "Legal & Compliance",
  "Administration",
  "Production",
  "Quality Control",
];

export const PK_DESIGNATIONS = [
  "General Manager",
  "Manager HR",
  "Manager Finance",
  "Senior Manager",
  "Deputy Manager",
  "Assistant Manager",
  "Senior Executive",
  "Team Lead",
  "Officer",
  "Senior Analyst",
  "Analyst",
  "Junior Officer",
  "Executive",
];

export const PK_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Faisalabad",
  "Rawalpindi",
  "Multan",
  "Peshawar",
  "Gujranwala",
  "Sialkot",
  "Hyderabad",
];

export const PK_BRANCHES = [
  { name: "Head Office", city: "Karachi", type: "Head Office", address: "Dolmen Tower, Clifton" },
  { name: "Lahore Regional", city: "Lahore", type: "Regional Office", address: "Gulberg III, Main Boulevard" },
  { name: "Islamabad Branch", city: "Islamabad", type: "Branch Office", address: "F-7 Markaz" },
  { name: "Faisalabad Plant", city: "Faisalabad", type: "Factory", address: "Industrial Estate" },
  { name: "Multan Depot", city: "Multan", type: "Warehouse", address: "Bosan Road" },
];


export const PK_BANKS = [
  "Habib Bank Limited (HBL)",
  "MCB Bank Limited",
  "United Bank Limited (UBL)",
  "Meezan Bank",
  "Bank Alfalah",
  "Allied Bank Limited (ABL)",
  "Standard Chartered Pakistan",
  "Faysal Bank",
  "Askari Bank",
  "Habib Metropolitan Bank",
];

export const PK_SALARY_RANGES = {
  entry: { min: 45000, max: 80000, label: "Entry Level" },
  mid: { min: 80000, max: 200000, label: "Mid Level" },
  senior: { min: 200000, max: 500000, label: "Senior" },
  executive: { min: 500000, max: 1500000, label: "Executive" },
};

export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export function formatPKRShort(amount: number): string {
  if (amount >= 10000000) return `PKR ${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `PKR ${(amount / 100000).toFixed(2)} L`;
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

/** Pick N employees from the pool with sequential codes */
export function pickEmployees(count: number, startCode = 1001) {
  return PK_EMPLOYEES.slice(0, count).map((emp, i) => ({
    ...emp,
    code: `EMP-${startCode + i}`,
    department: PK_DEPARTMENTS[i % PK_DEPARTMENTS.length],
    designation: PK_DESIGNATIONS[i % PK_DESIGNATIONS.length],
    city: PK_CITIES[i % PK_CITIES.length],
  }));
}
