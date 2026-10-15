"""
Generate compact DataTable-based versions of 27 Flexi Meta listing components.
Each file exports a default component with the exact name the wrapper pages expect.
"""
import os

# Configuration: (filename, export_name, type_label, title, description,
#                 searchPlaceholder, addLabel, exportFilename, fields)
# fields: list of tuples (key, label, type, sampleValues)
# type: 'code' | 'text' | 'select' | 'number' | 'status'
CONFIGS = [
    {
        "file": "BankBranchListing.tsx",
        "export": "BankBranchListingDummy",
        "typeLabel": "BankBranchRow",
        "title": "Bank Branches",
        "desc": "Bank branch directory with codes and cities",
        "searchPH": "Search by branch code, name, or city...",
        "addLabel": "Add Branch",
        "exportName": "bank-branches",
        "fields": [
            ("bank",       "Bank",        "select", ["HBL","MCB","UBL","Meezan Bank","Bank Alfalah","Allied Bank"]),
            ("branchCode", "Branch Code", "code",   None),
            ("branchName", "Branch Name", "text",   ["Main Clifton","Gulberg","Blue Area","Saddar","DHA Phase 5","Johar Town"]),
            ("city",       "City",        "select", ["Karachi","Lahore","Islamabad","Rawalpindi","Peshawar","Multan"]),
            ("country",    "Country",     "select", ["Pakistan","UAE","Saudi Arabia"]),
        ],
    },
    {
        "file": "BloodGroupListing.tsx",
        "export": "BloodGroupListingDummy",
        "typeLabel": "BloodGroupRow",
        "title": "Blood Groups",
        "desc": "Blood group reference data for employee profiles",
        "searchPH": "Search blood group...",
        "addLabel": "Add Blood Group",
        "exportName": "blood-groups",
        "fields": [
            ("code", "Code", "code", None),
            ("name", "Name", "text", ["A+","A-","B+","B-","O+","O-","AB+","AB-"]),
            ("description", "Description", "text", ["Universal donor","Universal recipient","Common","Rare","Very rare"]),
        ],
    },
    {
        "file": "BusinessLineListing.tsx",
        "export": "BusinessLineListingDummy",
        "typeLabel": "BusinessLineRow",
        "title": "Business Lines",
        "desc": "Company business line categorization",
        "searchPH": "Search business line...",
        "addLabel": "Add Business Line",
        "exportName": "business-lines",
        "fields": [
            ("code", "Code", "code", None),
            ("name", "Business Line", "text", ["Retail","Manufacturing","Corporate","E-commerce","Wholesale","Export","Franchise"]),
            ("segment", "Segment", "select", ["Domestic","International","Hybrid"]),
            ("revenue_share", "Revenue Share %", "number", None),
        ],
    },
    {
        "file": "CountryListing.tsx",
        "export": "CountryListingDummy",
        "typeLabel": "CountryRow",
        "title": "Countries",
        "desc": "ISO 3166 country reference data",
        "searchPH": "Search country or ISO code...",
        "addLabel": "Add Country",
        "exportName": "countries",
        "fields": [
            ("name",      "Country",   "text",   ["Pakistan","United Arab Emirates","Saudi Arabia","United Kingdom","United States","Canada","Australia","Singapore","India","Bangladesh"]),
            ("iso2",      "ISO2",      "text",   ["PK","AE","SA","GB","US","CA","AU","SG","IN","BD"]),
            ("iso3",      "ISO3",      "text",   ["PAK","ARE","SAU","GBR","USA","CAN","AUS","SGP","IND","BGD"]),
            ("phonecode", "Phone",     "text",   ["+92","+971","+966","+44","+1","+1","+61","+65","+91","+880"]),
            ("region",    "Region",    "select", ["Asia","Europe","North America","Middle East","Africa","Oceania"]),
        ],
    },
    {
        "file": "CurrencyListing.tsx",
        "export": "CurrencyListingDummy",
        "typeLabel": "CurrencyRow",
        "title": "Currencies",
        "desc": "Currency reference for payroll and FX",
        "searchPH": "Search currency...",
        "addLabel": "Add Currency",
        "exportName": "currencies",
        "fields": [
            ("code", "Code", "code", ["PKR","USD","GBP","EUR","AED","SAR","SGD","CAD","AUD","INR"]),
            ("name", "Currency", "text", ["Pakistani Rupee","US Dollar","Pound Sterling","Euro","UAE Dirham","Saudi Riyal","Singapore Dollar","Canadian Dollar","Australian Dollar","Indian Rupee"]),
            ("symbol", "Symbol", "text", ["₨","$","£","€","د.إ","﷼","S$","C$","A$","₹"]),
            ("decimals", "Decimals", "number", None),
        ],
    },
    {
        "file": "DeviceTypeListing.tsx",
        "export": "DeviceTypeListingDummy",
        "typeLabel": "DeviceTypeRow",
        "title": "Device Types",
        "desc": "Biometric and attendance device classifications",
        "searchPH": "Search device type...",
        "addLabel": "Add Device Type",
        "exportName": "device-types",
        "fields": [
            ("code", "Code", "code", None),
            ("name", "Device Type", "text", ["Fingerprint Reader","Face Recognition","RFID Card","Mobile GPS","Iris Scanner","QR Code Reader"]),
            ("vendor", "Vendor", "select", ["ZKTeco","Hikvision","Suprema","Anviz","Matrix","Custom"]),
            ("protocol", "Protocol", "select", ["TCP/IP","Wiegand","REST","WebSocket"]),
        ],
    },
    {
        "file": "DivisionListing.tsx",
        "export": "DivisionListingDummy",
        "typeLabel": "DivisionRow",
        "title": "Divisions",
        "desc": "Top-level organisational divisions",
        "searchPH": "Search division name or code...",
        "addLabel": "Add Division",
        "exportName": "divisions",
        "fields": [
            ("division_code", "Code", "code", None),
            ("division_name", "Division", "text", ["Corporate Strategy","Operations","Human Resources","Finance","Information Technology","Marketing","Sales","R&D","Legal","Procurement"]),
            ("division_head_name", "Head", "select", ["Muqadas Mazhar","Ali Nawab","Asra Arif","Ahmad Faraz","Yousaf Chaudhry"]),
            ("effective_from", "Effective From", "date", None),
        ],
    },
    {
        "file": "DocumentTypeListing.tsx",
        "export": "DocumentTypeListingDummy",
        "typeLabel": "DocumentTypeRow",
        "title": "Document Types",
        "desc": "HR document categories and requirements",
        "searchPH": "Search document type...",
        "addLabel": "Add Document Type",
        "exportName": "document-types",
        "fields": [
            ("code", "Code", "code", None),
            ("name", "Document", "text", ["CNIC","Passport","Educational Certificate","Experience Letter","Bank Statement","Medical Certificate","Police Clearance","Reference Letter","Offer Letter","Appointment Letter"]),
            ("category", "Category", "select", ["Identity","Educational","Employment","Medical","Legal"]),
            ("required", "Required", "select", ["Yes","No","Conditional"]),
        ],
    },
    {
        "file": "EmployeeTypeListing.tsx",
        "export": "EmployeeTypeListingDummy",
        "typeLabel": "EmployeeTypeRow",
        "title": "Employee Types",
        "desc": "Employment category definitions",
        "searchPH": "Search employee type...",
        "addLabel": "Add Employee Type",
        "exportName": "employee-types",
        "fields": [
            ("code", "Code", "code", None),
            ("name", "Type", "text", ["Permanent","Contract","Probation","Intern","Daily-Wage","Consultant","Part-Time"]),
            ("benefits_eligible", "Benefits Eligible", "select", ["Full","Partial","None"]),
            ("payroll_freq", "Payroll Frequency", "select", ["Monthly","Bi-Weekly","Weekly","Daily"]),
        ],
    },
    {
        "file": "EntityTypeListing.tsx",
        "export": "EntityTypeListingDummy",
        "typeLabel": "EntityTypeRow",
        "title": "Entity Types",
        "desc": "Company legal entity classifications",
        "searchPH": "Search entity type...",
        "addLabel": "Add Entity Type",
        "exportName": "entity-types",
        "fields": [
            ("code", "Code", "code", None),
            ("name", "Entity Type", "text", ["Private Limited","Public Limited","Partnership","Sole Proprietorship","Branch Office","Liaison Office","Joint Venture"]),
            ("regulator", "Regulator", "select", ["SECP","FBR","SBP","SEC","Other"]),
        ],
    },
    {
        "file": "ExchangeRateListing.tsx",
        "export": "ExchangeRateListingDummy",
        "typeLabel": "ExchangeRateRow",
        "title": "FX Rates",
        "desc": "Currency exchange rate history",
        "searchPH": "Search currency pair...",
        "addLabel": "Add FX Rate",
        "exportName": "fx-rates",
        "fields": [
            ("from_currency", "From", "select", ["USD","GBP","EUR","AED","SAR","SGD"]),
            ("to_currency", "To", "select", ["PKR"]),
            ("rate", "Rate", "number", None),
            ("effective_date", "Effective Date", "date", None),
        ],
    },
    {
        "file": "GenderListing.tsx",
        "export": "GenderListingDummy",
        "typeLabel": "GenderRow",
        "title": "Genders",
        "desc": "Gender reference data",
        "searchPH": "Search gender...",
        "addLabel": "Add Gender",
        "exportName": "genders",
        "fields": [
            ("code", "Code", "code", None),
            ("name", "Gender", "text", ["Male","Female","Other","Prefer not to say"]),
            ("description", "Description", "text", None),
        ],
    },
    {
        "file": "GradeTemplateListing.tsx",
        "export": "GradeTemplateListingDummy",
        "typeLabel": "GradeTemplateRow",
        "title": "Grade Templates",
        "desc": "Grade structures and component templates",
        "searchPH": "Search grade template...",
        "addLabel": "Add Template",
        "exportName": "grade-templates",
        "fields": [
            ("code", "Code", "code", None),
            ("name", "Grade Template", "text", ["Executive Band A","Executive Band B","Manager I","Manager II","Senior Staff","Staff","Operations"]),
            ("components", "Components", "number", None),
            ("applicable_to", "Applicable To", "select", ["All","Permanent Only","Contract Only","Management"]),
        ],
    },
    {
        "file": "HealthConditionListing.tsx",
        "export": "HealthConditionListingDummy",
        "typeLabel": "HealthConditionRow",
        "title": "Health Conditions",
        "desc": "Medical condition reference for HR records",
        "searchPH": "Search health condition...",
        "addLabel": "Add Condition",
        "exportName": "health-conditions",
        "fields": [
            ("code", "Code", "code", None),
            ("name", "Condition", "text", ["Hypertension","Diabetes","Asthma","Allergies","Heart Disease","None","Other"]),
            ("severity", "Severity", "select", ["Mild","Moderate","Severe","Critical"]),
        ],
    },
    {
        "file": "IbanFormatListing.tsx",
        "export": "IbanFormatListingDummy",
        "typeLabel": "IbanFormatRow",
        "title": "IBAN Formats",
        "desc": "Country-wise IBAN validation formats",
        "searchPH": "Search IBAN format...",
        "addLabel": "Add Format",
        "exportName": "iban-formats",
        "fields": [
            ("country", "Country", "select", ["Pakistan","UAE","Saudi Arabia","United Kingdom","Germany","France"]),
            ("country_code", "Code", "code", ["PK","AE","SA","GB","DE","FR"]),
            ("length", "Length", "number", None),
            ("pattern", "Pattern", "text", ["PK##XXXX#################","AE##XXX###############","SA##XX##################","GB##XXXX######XXXXXXXX"]),
        ],
    },
    {
        "file": "LocationListing.tsx",
        "export": "LocationListingDummy",
        "typeLabel": "LocationRow",
        "title": "Locations",
        "desc": "Company office and site locations",
        "searchPH": "Search location...",
        "addLabel": "Add Location",
        "exportName": "locations",
        "fields": [
            ("locationCode", "Code", "code", None),
            ("locationName", "Location", "text", ["Karachi Head Office","Lahore Plant","Islamabad Branch","Faisalabad Warehouse","Rawalpindi Regional","Multan Depot"]),
            ("type", "Type", "select", ["Head Office","Branch","Factory","Warehouse","Retail","Regional"]),
            ("city", "City", "select", ["Karachi","Lahore","Islamabad","Faisalabad","Rawalpindi","Multan"]),
        ],
    },
    {
        "file": "LocationTypeListing.tsx",
        "export": "LocationTypeListingDummy",
        "typeLabel": "LocationTypeRow",
        "title": "Location Types",
        "desc": "Location classification categories",
        "searchPH": "Search location type...",
        "addLabel": "Add Location Type",
        "exportName": "location-types",
        "fields": [
            ("code", "Code", "code", None),
            ("name", "Type", "text", ["Head Office","Regional Office","Branch","Factory","Warehouse","Retail Outlet","Franchise","Service Center"]),
            ("category", "Category", "select", ["Corporate","Operations","Sales","Support"]),
        ],
    },
    {
        "file": "MaritalStatusListing.tsx",
        "export": "MaritalStatusListingDummy",
        "typeLabel": "MaritalStatusRow",
        "title": "Marital Statuses",
        "desc": "Marital status reference data",
        "searchPH": "Search marital status...",
        "addLabel": "Add Status",
        "exportName": "marital-statuses",
        "fields": [
            ("code", "Code", "code", None),
            ("name", "Status", "text", ["Single","Married","Divorced","Widowed","Separated"]),
        ],
    },
    {
        "file": "MinimumWageListing.tsx",
        "export": "MinimumWageListingDummy",
        "typeLabel": "MinimumWageRow",
        "title": "Minimum Wages",
        "desc": "Province-wise statutory minimum wage rates",
        "searchPH": "Search province or effective year...",
        "addLabel": "Add Wage",
        "exportName": "minimum-wages",
        "fields": [
            ("province", "Province", "select", ["Sindh","Punjab","Khyber Pakhtunkhwa","Balochistan","ICT","Gilgit-Baltistan","AJK"]),
            ("unskilled", "Unskilled (PKR)", "number", None),
            ("skilled", "Skilled (PKR)", "number", None),
            ("effective_from", "Effective From", "date", None),
        ],
    },
    {
        "file": "RegionListing.tsx",
        "export": "RegionListingDummy",
        "typeLabel": "RegionRow",
        "title": "Regions",
        "desc": "Business regions spanning multiple cities",
        "searchPH": "Search region...",
        "addLabel": "Add Region",
        "exportName": "regions",
        "fields": [
            ("code", "Code", "code", None),
            ("name", "Region", "text", ["North","South","Central","East","West","Upper Punjab","Lower Punjab"]),
            ("country", "Country", "select", ["Pakistan","UAE","Saudi Arabia"]),
            ("manager", "Regional Manager", "select", ["Muqadas Mazhar","Ali Nawab","Asra Arif","Ahmad Faraz"]),
        ],
    },
    {
        "file": "SalaryComponentListing.tsx",
        "export": "SalaryComponentListingDummy",
        "typeLabel": "SalaryComponentRow",
        "title": "Salary Components",
        "desc": "Payroll earnings and deduction components",
        "searchPH": "Search component...",
        "addLabel": "Add Component",
        "exportName": "salary-components",
        "fields": [
            ("code", "Code", "code", None),
            ("componentName", "Component", "text", ["Basic Salary","House Rent Allowance","Conveyance Allowance","Medical Allowance","Dearness Allowance","Overtime","EOBI Deduction","Income Tax","PESSI","Provident Fund"]),
            ("type", "Type", "select", ["Earning","Deduction","Reimbursement","Statutory"]),
            ("taxable", "Taxable", "select", ["Yes","No","Partial"]),
        ],
    },
    {
        "file": "SalutationListing.tsx",
        "export": "SalutationListingDummy",
        "typeLabel": "SalutationRow",
        "title": "Salutations",
        "desc": "Honorific and title references",
        "searchPH": "Search salutation...",
        "addLabel": "Add Salutation",
        "exportName": "salutations",
        "fields": [
            ("code", "Code", "code", None),
            ("name", "Salutation", "text", ["Mr","Mrs","Ms","Dr","Engr","Prof","Mx","Syed","Mufti"]),
            ("gender", "Gender", "select", ["Male","Female","Any"]),
        ],
    },
    {
        "file": "ShiftArchetypeListing.tsx",
        "export": "ShiftArchetypeListingDummy",
        "typeLabel": "ShiftArchetypeRow",
        "title": "Shift Archetypes",
        "desc": "Reusable shift pattern templates",
        "searchPH": "Search shift...",
        "addLabel": "Add Shift",
        "exportName": "shift-archetypes",
        "fields": [
            ("code", "Code", "code", None),
            ("shiftName", "Shift Name", "text", ["Morning General","Evening Shift","Night Shift","Split Shift","Rotating","Flexible","Weekend Only"]),
            ("timing", "Timing", "text", ["09:00 - 17:00","14:00 - 22:00","22:00 - 06:00","06:00 - 14:00","08:00 - 20:00"]),
            ("shiftType", "Type", "select", ["Day","Night","Rotating","Flexible","Split"]),
        ],
    },
    {
        "file": "SkillTradeListing.tsx",
        "export": "SkillTradeListingDummy",
        "typeLabel": "SkillTradeRow",
        "title": "Skills & Trades",
        "desc": "Trade and skill classifications for blue-collar roles",
        "searchPH": "Search skill or trade...",
        "addLabel": "Add Skill",
        "exportName": "skill-trades",
        "fields": [
            ("code", "Code", "code", None),
            ("name", "Skill / Trade", "text", ["Welder","Electrician","Plumber","Carpenter","Mason","Mechanic","Driver","Operator","Fitter","Painter"]),
            ("category", "Category", "select", ["Technical","Construction","Transport","Maintenance","Production"]),
            ("level", "Level", "select", ["Unskilled","Semi-Skilled","Skilled","Highly Skilled"]),
        ],
    },
    {
        "file": "StateListing.tsx",
        "export": "StateListingDummy",
        "typeLabel": "StateRow",
        "title": "States / Provinces",
        "desc": "Sub-country administrative divisions",
        "searchPH": "Search state or province...",
        "addLabel": "Add State",
        "exportName": "states",
        "fields": [
            ("name", "State / Province", "text", ["Sindh","Punjab","Khyber Pakhtunkhwa","Balochistan","ICT","Gilgit-Baltistan","AJK"]),
            ("code", "Code", "code", None),
            ("country", "Country", "select", ["Pakistan","UAE","Saudi Arabia"]),
            ("capital", "Capital", "text", ["Karachi","Lahore","Peshawar","Quetta","Islamabad","Gilgit","Muzaffarabad"]),
        ],
    },
    {
        "file": "StatutoryRateListing.tsx",
        "export": "StatutoryRateListingDummy",
        "typeLabel": "StatutoryRateRow",
        "title": "Statutory Rates",
        "desc": "EOBI, PESSI, WHT and other statutory rates",
        "searchPH": "Search statutory rate...",
        "addLabel": "Add Rate",
        "exportName": "statutory-rates",
        "fields": [
            ("code", "Code", "code", None),
            ("name", "Rate Name", "text", ["EOBI Employee","EOBI Employer","PESSI Employee","PESSI Employer","WHT Filer","WHT Non-Filer","Gratuity"]),
            ("rate_pct", "Rate %", "number", None),
            ("ceiling", "Ceiling (PKR)", "number", None),
        ],
    },
    {
        "file": "CostCenterListing.tsx",
        "export": "CostCenterListingDummy",
        "typeLabel": "CostCenterRow",
        "title": "Cost Centers",
        "desc": "Financial cost center structure for budget allocation",
        "searchPH": "Search cost center...",
        "addLabel": "Add Cost Center",
        "exportName": "cost-centers",
        "fields": [
            ("cost_center_code", "Code", "code", None),
            ("cost_center_name", "Cost Center", "text", ["Corporate Overhead","IT Operations","Marketing Campaigns","Sales Commission","R&D Projects","Facilities","Training","Legal Fees"]),
            ("cost_center_type", "Type", "select", ["Cost Center","Profit Center","Investment Center","Revenue Center"]),
            ("manager_name", "Manager", "select", ["Muqadas Mazhar","Ali Nawab","Asra Arif","Yousaf Chaudhry","Ahmad Faraz"]),
            ("annual_budget", "Annual Budget (PKR)", "number", None),
        ],
    },
]

TEMPLATE = '''"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";

type __TYPELABEL__ = {
  id: number;
__TYPEFIELDS__
  is_active: boolean;
};

__CONSTANTS__

function makeDummyRows(count = __ROWCOUNT__): __TYPELABEL__[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
__ROWFIELDS__
    is_active: i % 8 !== 0,
  }));
}

const __EXPORTNAME__: React.FC = () => {
  const [rows, setRows] = useState<__TYPELABEL__[]>(() => makeDummyRows());

  const columns: DataTableColumn<__TYPELABEL__>[] = [
__COLUMNS_LIST__
    {
      key: "is_active",
      header: "Status",
      render: (v) =>
        v ? (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
            Active
          </Badge>
        ) : (
          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
            Inactive
          </Badge>
        ),
    },
  ];

  return (
    <DataTable<__TYPELABEL__>
      title="__TITLE__"
      description="__DESC__"
      columns={columns}
      data={rows}
      searchKeys={[__SEARCHKEYS__]}
      searchPlaceholder="__SEARCHPH__"
      addLabel="__ADDLABEL__"
      exportFilename="__EXPORTFILE__"
      onAdd={() => {}}
      onEdit={() => {}}
      onDelete={(item) => {
        setRows((prev) => prev.filter((r) => r.id !== item.id));
        toast.success("Record deleted");
      }}
      renderForm={(mode, item, onClose) => (
        <RecordForm
          mode={mode}
          initial={item}
          onClose={onClose}
          onSave={(data) => {
            if (item) {
              setRows((prev) =>
                prev.map((r) => (r.id === item.id ? { ...r, ...data } : r))
              );
              toast.success("Record updated");
            } else {
              const newId = Math.max(0, ...rows.map((r) => r.id)) + 1;
              setRows((prev) => [...prev, { id: newId, ...data }]);
              toast.success("Record created");
            }
            onClose?.();
          }}
        />
      )}
    />
  );
};

type FormProps = {
  mode: "create" | "edit";
  initial?: __TYPELABEL__;
  onClose?: () => void;
  onSave: (data: Omit<__TYPELABEL__, "id">) => void;
};

const RecordForm: React.FC<FormProps> = ({ mode, initial, onClose, onSave }) => {
  const [form, setForm] = useState<Omit<__TYPELABEL__, "id">>({
__FORMDEFAULTS__
    is_active: initial?.is_active ?? true,
  });

  const submit = () => {
__FORMVALIDATION__
    onSave(form);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
__FORMFIELDS__
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={form.is_active ? "active" : "inactive"}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, is_active: v === "active" }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onClose}
          className="border-gray-200 text-brand-800 hover:bg-brand-100"
        >
          Cancel
        </Button>
        <Button
          onClick={submit}
          className="bg-brand-800 hover:bg-brand-900 text-white"
        >
          {mode === "create" ? "Create" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default __EXPORTNAME__;
'''

def ts_type_for(field_type):
    if field_type == 'number':
        return 'number'
    if field_type == 'date':
        return 'string'
    return 'string'

def default_for(field_type, field_key, samples):
    if field_type == 'number':
        return '0'
    if field_type == 'date':
        return '""'
    return '""'

def sample_value(field_type, samples, i):
    if samples:
        return f'"{samples[i % len(samples)]}"'
    if field_type == 'number':
        return str(100 + i * 10)
    if field_type == 'date':
        return f'"2026-0{(i % 9) + 1}-15"'
    return f'""'

def generate(cfg):
    fields = cfg['fields']

    # Type fields
    type_fields = '\n'.join(
        f'  {f[0]}: {ts_type_for(f[2])};' for f in fields
    )

    # Constants (select options arrays for each select/code field)
    const_lines = []
    for key, label, ftype, samples in fields:
        if samples and ftype in ('select', 'text'):
            name = key.upper() + '_OPTIONS'
            opts = ', '.join(f'"{s}"' for s in samples)
            const_lines.append(f'const {name} = [{opts}];')
    constants = '\n'.join(const_lines) if const_lines else '// (no select options)'

    # Row data generation
    row_lines = []
    for key, label, ftype, samples in fields:
        if ftype == 'code':
            prefix = ''.join(c for c in key.upper() if c.isalpha())[:4] or 'REC'
            row_lines.append(f'    {key}: "{prefix}" + String(i + 1).padStart(3, "0"),')
        elif ftype == 'number':
            row_lines.append(f'    {key}: {100 + 10} + (i % 20) * 500,')
        elif ftype == 'date':
            row_lines.append(f'    {key}: new Date(2026, i % 12, ((i * 3) % 27) + 1).toISOString().split("T")[0],')
        else:
            if samples:
                row_lines.append(f'    {key}: {key.upper()}_OPTIONS[i % {key.upper()}_OPTIONS.length],')
            else:
                row_lines.append(f'    {key}: "{key} " + (i + 1),')
    row_fields = '\n'.join(row_lines)

    # Columns
    col_lines = []
    for key, label, ftype, samples in fields:
        if ftype == 'code':
            col_lines.append(
                f'    {{ key: "{key}", header: "{label}", render: (v) => <span className="font-mono text-brand-900">{{v as string}}</span> }},'
            )
        elif ftype == 'number':
            col_lines.append(
                f'    {{ key: "{key}", header: "{label}", render: (v) => (v as number).toLocaleString() }},'
            )
        elif ftype == 'text' and samples and any(w in label.lower() for w in ['name','bank','country','location','component','state']):
            col_lines.append(
                f'    {{ key: "{key}", header: "{label}", render: (v) => <span className="font-semibold text-brand-900">{{v as string}}</span> }},'
            )
        else:
            col_lines.append(f'    {{ key: "{key}", header: "{label}" }},')
    columns_str = '\n'.join(col_lines)

    # Search keys
    search_keys = ', '.join(f'"{f[0]}"' for f in fields)

    # Form defaults
    default_lines = []
    for key, label, ftype, samples in fields:
        if ftype == 'number':
            default_lines.append(f'    {key}: initial?.{key} ?? 0,')
        elif ftype == 'select':
            default = samples[0] if samples else ''
            default_lines.append(f'    {key}: initial?.{key} ?? "{default}",')
        elif ftype == 'date':
            default_lines.append(f'    {key}: initial?.{key} ?? new Date().toISOString().split("T")[0],')
        else:
            default_lines.append(f'    {key}: initial?.{key} ?? "",')
    form_defaults = '\n'.join(default_lines)

    # Form validation — only validate the first required field if present
    validation = '    // Basic validation'

    # Form fields
    ff_lines = []
    for key, label, ftype, samples in fields:
        ff_lines.append('        <div className="space-y-1.5">')
        ff_lines.append(f'          <Label>{label}</Label>')
        if ftype == 'number':
            ff_lines.append(f'          <Input type="number" value={{form.{key}}} onChange={{(e) => setForm((f) => ({{ ...f, {key}: Number(e.target.value || 0) }}))}} />')
        elif ftype == 'date':
            ff_lines.append(f'          <Input type="date" value={{form.{key}}} onChange={{(e) => setForm((f) => ({{ ...f, {key}: e.target.value }}))}} />')
        elif ftype == 'select' and samples:
            opts_name = key.upper() + '_OPTIONS'
            ff_lines.append(f'          <Select value={{form.{key}}} onValueChange={{(v) => setForm((f) => ({{ ...f, {key}: v }}))}}>')
            ff_lines.append('            <SelectTrigger><SelectValue /></SelectTrigger>')
            ff_lines.append('            <SelectContent className="bg-white">')
            ff_lines.append(f'              {{{opts_name}.map((o) => <SelectItem key={{o}} value={{o}}>{{o}}</SelectItem>)}}')
            ff_lines.append('            </SelectContent>')
            ff_lines.append('          </Select>')
        else:
            ff_lines.append(f'          <Input value={{form.{key}}} onChange={{(e) => setForm((f) => ({{ ...f, {key}: e.target.value }}))}} />')
        ff_lines.append('        </div>')
    form_fields = '\n'.join(ff_lines)

    replacements = {
        '__TYPELABEL__': cfg['typeLabel'],
        '__TYPEFIELDS__': type_fields,
        '__CONSTANTS__': constants,
        '__ROWCOUNT__': '40',
        '__ROWFIELDS__': row_fields,
        '__EXPORTNAME__': cfg['export'],
        '__COLUMNS_LIST__': columns_str,
        '__TITLE__': cfg['title'],
        '__DESC__': cfg['desc'],
        '__SEARCHKEYS__': search_keys,
        '__SEARCHPH__': cfg['searchPH'],
        '__ADDLABEL__': cfg['addLabel'],
        '__EXPORTFILE__': cfg['exportName'],
        '__FORMDEFAULTS__': form_defaults,
        '__FORMVALIDATION__': validation,
        '__FORMFIELDS__': form_fields,
    }
    out = TEMPLATE
    for k, v in replacements.items():
        out = out.replace(k, v)
    return out

for cfg in CONFIGS:
    out_path = os.path.join('components', cfg['file'])
    content = generate(cfg)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Wrote {out_path} ({len(content.splitlines())} lines)")

print(f"\nTotal: {len(CONFIGS)} files generated")
