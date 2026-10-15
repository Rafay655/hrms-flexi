import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';

// ── Types ───────────────────────────────────────────────
export interface TaxCertificateData {
  certificate_uuid: string;
  certificate_number: string;
  status: string;
  generated_at: string | null;
  downloaded_at: string | null;
  tax_year: {
    uuid: string;
    label: string;
    from_date: string; // "DD-MM-YYYY"
    to_date: string; // "DD-MM-YYYY"
  };
  employee: {
    uuid: string;
    name: string;
    address: string;
    cnic: string;
    ntn: string;
    designation: string;
  };
  amount: string;
  amount_in_words: string;
  value_amount: string;
  value_amount_words: string;
  section: string;
  nature: string;
  total_taxable_income: string;
  total_tax_deducted: string;
  total_gross_salary: string;
  salary_breakdown?: Record<string, string>;
  exemption?: { type: string; amount: string };
  surcharge_amount?: string;
  company: {
    name: string;
    address: string;
    ntn: string;
    phone?: string;
    email?: string;
  };
  signer: {
    name: string;
    designation: string;
    signature_url?: string;
    seal_url?: string;
  };
  issue_date: string; // "DD-MM-YYYY"
  serial_number: string;
}

interface TaxCertificatePDFProps {
  data: TaxCertificateData;
}

// ── Helpers ─────────────────────────────────────────────
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatShortMonthYear(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [, mm, yyyy] = parts;
  const monthIdx = parseInt(mm, 10) - 1;
  const month = MONTHS[monthIdx] ?? mm;
  const yy = yyyy.slice(-2);
  return `${month} ${yy}`;
}

function formatFullDate(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [dd, mm, yyyy] = parts;
  const monthIdx = parseInt(mm, 10) - 1;
  const month = MONTHS[monthIdx] ?? mm;
  return `${dd}-${month}-${yyyy}`;
}

function formatMoney(value?: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value ?? 0;
  if (isNaN(num)) return '0';

  // Round to the nearest whole number
  const rounded = Math.round(num);
  
  return rounded.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatHumanDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// ── Styles ──────────────────────────────────────────────
const ROW_H = 24;
const FIELD_FONT_SIZE = 7;
const FIELD_PADDING_TOP = ROW_H - (FIELD_FONT_SIZE + 4);

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: '#000000',
  },
  headerTitle: {
    fontSize: 8,
    textAlign: 'center',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 7,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 16,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  topLabel: { fontSize: 7 },
  topFieldSmall: {
    width: 150,
    marginLeft: 6,
    textAlign: 'center',
    fontWeight: 'bold',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    paddingBottom: 2,
  },
  topCenterCell: { flex: 1, textAlign: 'center' },
  topRightLabel: { fontSize: 7, marginRight: 4 },

  certRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 9,
  },
  certLabel: { width: '30%', fontSize: 7, paddingRight: 8 },
  certLabelEmpty: { width: '30%' },
  certField: {
    flex: 1,
    marginHorizontal: 8,
    textAlign: 'center',
    fontWeight: 'bold',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    paddingBottom: 2,
    minHeight: 14,
  },
  certFieldEmpty: {
    flex: 1,
    marginHorizontal: 8,
    minHeight: 14,
    borderBottomWidth: 0,
  },
  certNote: { width: 150, fontSize: 5, textAlign: 'left' },
  certNoteStack: { width: 150 },

  association: {
    fontSize: 5,
    marginLeft: '32%',
    marginTop: 0,
    marginBottom: 8,
    maxWidth: 170,
  },

  periodRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8, marginTop: 12 },
  periodFromToLabel: { fontSize: 7, marginRight: 4 },
  periodFromToValue: {
    fontWeight: 'bold',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    paddingHorizontal: 10,
    marginRight: 10,
    textAlign: 'center',
    minWidth: 50,
  },

  signatureSection: {
    flexDirection: 'row',
    marginTop: 90,
  },
  sigCol: { flex: 1 },
  sigColLeft: { paddingRight: 16 },
  sigColRight: { paddingLeft: 40 },
  sigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sigLabel: { width: 45, fontSize: 7, color: '#000' },
  sigLabelRight: { width: 45, fontSize: 7, color: '#000' },
  sigFieldBox: {
    flex: 1,
    height: ROW_H,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: FIELD_FONT_SIZE,
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    paddingTop: FIELD_PADDING_TOP,
  },
  sigImageBox: {
    flex: 1,
    height: ROW_H,
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sigImage: { maxHeight: ROW_H - 6, maxWidth: '100%', objectFit: 'contain' },
  sealImage: { maxHeight: ROW_H - 4, maxWidth: '100%', objectFit: 'contain' },
});

// ── Component ───────────────────────────────────────────
export const TaxCertificatePDF: React.FC<TaxCertificatePDFProps> = ({ data }) => {
  const {
    tax_year,
    employee,
    amount,
    amount_in_words,
    value_amount,
    value_amount_words,
    section,
    nature,
    company,
    signer,
    issue_date,
    serial_number,
    total_taxable_income,
  } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <Text style={styles.headerTitle}>
          Certificate of Collection or Deduction of Income Tax
        </Text>
        <Text style={styles.headerSubtitle}>(under rule 42)</Text>

        {/* ── Top Row ── */}
        <View style={styles.topRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.topLabel}>S.No.</Text>
            <Text style={styles.topFieldSmall}>{serial_number}</Text>
          </View>
          <Text style={styles.topCenterCell}>Original/Duplicate</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.topRightLabel}>Date of issue.</Text>
            <Text style={styles.topFieldSmall}>{formatFullDate(issue_date)}</Text>
          </View>
        </View>

        {/* ── Certified sum ── */}
        <View style={styles.certRow}>
          <Text style={styles.certLabel}>Certified that the sum of Rupees</Text>
          <Text style={styles.certField}>{formatMoney(amount)}</Text>
          <Text style={styles.certNote}>(Amount of tax collected/deducted in figures)</Text>
        </View>

        <View style={styles.certRow}>
          <Text style={styles.certLabelEmpty} />
          <Text style={styles.certField}>{amount_in_words}</Text>
          <Text style={styles.certNote}>(Amount in words)</Text>
        </View>

        {/* ── Deducted from ── */}
        <View style={styles.certRow}>
          <Text style={styles.certLabel}>on account of income tax has been</Text>
          <Text style={styles.certField}>{employee.name}</Text>
          <View style={styles.certNoteStack} />
        </View>

        <View style={styles.certRow}>
          <Text style={styles.certLabel}>
            deducted/collected from (Name and Address of
          </Text>
          <Text style={styles.certField}>{employee.address || ''}</Text>
          <View style={styles.certNoteStack} />
        </View>

        {/* ── Missing line: same bordered field style + same marginHorizontal as the rows above/below ── */}
        <View style={styles.certRow}>
          <Text style={styles.certLabel}>the person from whom tax collected/deducted)</Text>
          <Text style={styles.certField}> </Text>
          <View style={styles.certNoteStack} />
        </View>

        {/* ── Association footnote ── */}
        <Text style={styles.association}>
          in case of an individual, his/her name in full and in case of an association of persons /
          company, name and style of the association of persons/company
        </Text>

        {/* ── NTN ── */}
        <View style={styles.certRow}>
          <Text style={styles.certLabel}>having National Tax Number</Text>
          <Text style={styles.certField}>{employee.ntn || ''}</Text>
          <Text style={styles.certNote}>(if any) and</Text>
        </View>

        {/* ── CNIC ── */}
        <View style={styles.certRow}>
          <Text style={styles.certLabel}>holder of CNIC No.</Text>
          <Text style={styles.certField}>{employee.cnic || ''}</Text>
          <Text style={styles.certNote}>(In case of an individual)</Text>
        </View>

        {/* ── Period ── */}
        <View style={styles.certRow}>
          <Text style={styles.certLabel}>During the period under section</Text>
          <View style={{ flex: 1, marginHorizontal: 8 }}>
            <View style={styles.periodRow}>
              <Text style={styles.periodFromToLabel}>From</Text>
              <Text style={styles.periodFromToValue}>
                {formatShortMonthYear(tax_year.from_date)}
              </Text>
              <Text style={styles.periodFromToLabel}>To</Text>
              <Text style={styles.periodFromToValue}>
                {formatShortMonthYear(tax_year.to_date)}
              </Text>
            </View>
            <Text style={[styles.certField, { marginHorizontal: 0 }]}>
              {section} - Section of Income Tax Ordinance, 2001
            </Text>
          </View>
          <Text style={styles.certNote}>
            (Period of collection/deduction) (specify the Section of Income Tax Ordinance, 2001)
          </Text>
        </View>

        {/* ── Nature ── */}
        <View style={styles.certRow}>
          <Text style={styles.certLabel}>On account of</Text>
          <Text style={styles.certField}>{nature}</Text>
          <Text style={styles.certNote}>(specify nature)</Text>
        </View>

        {/* ── Vide ── */}
        <View style={styles.certRow}>
          <Text style={styles.certLabel}>vide</Text>
          <Text style={styles.certFieldEmpty} />
          <Text style={styles.certNote}>(particulars of LC, Contract etc.)</Text>
        </View>

        {/* ── Value amount ── */}
        <View style={styles.certRow}>
          <Text style={styles.certLabel}>on the value/amount of Rupee</Text>
          <Text style={styles.certField}>{formatMoney(total_taxable_income)}</Text>
          <Text style={styles.certNote}>(Gross amount on which tax deducted/collected in figures)</Text>
        </View>

        <View style={styles.certRow}>
          <Text style={styles.certLabelEmpty} />
          <Text style={styles.certField}>{value_amount_words}</Text>
          <View style={styles.certNoteStack} />
        </View>

        {/* ── Signature block ── */}
        <View style={styles.signatureSection}>
          {/* Left column */}
          <View style={[styles.sigCol, styles.sigColLeft]}>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Name.</Text>
              <Text style={styles.sigFieldBox}>{company.name}</Text>
            </View>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Address.</Text>
              <Text style={styles.sigFieldBox}>{company.address}</Text>
            </View>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>NTN (if any)</Text>
              <Text style={styles.sigFieldBox}>{company.ntn || ''}</Text>
            </View>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Date.</Text>
              <Text style={styles.sigFieldBox}>{formatHumanDate(new Date())}</Text>
            </View>
          </View>

          {/* Right column */}
          <View style={[styles.sigCol, styles.sigColRight]}>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabelRight}>Signature</Text>
              <View style={styles.sigImageBox}>
                {signer.signature_url ? (
                  <Image src={signer.signature_url} style={styles.sigImage} />
                ) : (
                  <Text style={{ fontSize: 6, color: '#999' }}>Signature</Text>
                )}
              </View>
            </View>

            <View style={styles.sigRow}>
              <Text style={styles.sigLabelRight}>Name</Text>
              <Text style={styles.sigFieldBox}>{signer.name}</Text>
            </View>

            <View style={styles.sigRow}>
              <Text style={styles.sigLabelRight}>Designation</Text>
              <Text style={styles.sigFieldBox}>{signer.designation}</Text>
            </View>

            <View style={styles.sigRow}>
              <Text style={styles.sigLabelRight}>Seal</Text>
              <View style={styles.sigImageBox}>
                {signer.seal_url ? (
                  <Image src={signer.seal_url} style={styles.sealImage} />
                ) : (
                  <Text style={{ fontSize: 6, color: '#999' }}>Seal</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default TaxCertificatePDF;