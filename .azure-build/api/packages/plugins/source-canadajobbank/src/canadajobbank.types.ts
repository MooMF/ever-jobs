export interface CanadaJobBankResponse {
  success: boolean;
  result: {
    records: CanadaJobBankRecord[];
    total: number;
    fields: unknown[];
  };
}

export interface CanadaJobBankRecord {
  _id: number;
  'Job Title': string | null;
  'Original Job Title': string | null;
  'NOC21 Code Name': string | null;
  'Province/Territory': string | null;
  City: string | null;
  'Economic Region': string | null;
  'Employment Type': string | null;
  'Employment Term': string | null;
  'Vacancy Count': number | null;
  'Salary Minimum': number | null;
  'Salary Maximum': number | null;
  'Salary Per': string | null;
  'First Posting Date': string | null;
  'Education LOS': string | null;
  'Experience Level': string | null;
}
