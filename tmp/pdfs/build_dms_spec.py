from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Preformatted
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from xml.sax.saxutils import escape
from pathlib import Path
out=Path('output/pdf/DMS Dashboard Backend API Specification.pdf')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleCustom',fontName='Helvetica-Bold',fontSize=24,leading=29,spaceAfter=16,textColor=colors.HexColor('#221e42')))
styles.add(ParagraphStyle(name='BodyCustom',fontName='Helvetica',fontSize=10,leading=14,spaceAfter=8))
styles.add(ParagraphStyle(name='HCustom',fontName='Helvetica-Bold',fontSize=14,leading=18,spaceBefore=12,spaceAfter=9,textColor=colors.HexColor('#322E53')))
styles.add(ParagraphStyle(name='CodeCustom',fontName='Courier',fontSize=8,leading=11,spaceAfter=6))
styles.add(ParagraphStyle(name='SmallCustom',fontName='Helvetica',fontSize=8.5,leading=12,spaceAfter=6))
story=[]
def p(s): story.append(Paragraph(s,styles['BodyCustom']))
def h(s): story.append(Paragraph(s,styles['HCustom']))
def code(s): story.append(Preformatted(s,styles['CodeCustom']))
def page(title): story.append(PageBreak()); h(title)
def table(rows,widths):
    cells=[[Paragraph(escape(x),styles['SmallCustom']) for x in row] for row in rows]
    t=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT'); t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#eeeaf5')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,0),0.5,colors.HexColor('#bcb5d1')),('LINEBELOW',(0,1),(-1,-1),0.3,colors.HexColor('#e5e2eb'))])); story.append(t)
story.append(Paragraph('DMS Dashboard<br/>Backend API Specification',styles['TitleCustom']))
p('Flexi HRMS | Engineering handoff | 15 October 2026')
p('Implement one aggregate endpoint to replace the DMS dashboard fixtures with real company data while preserving the existing dashboard layout. This is a proposed API contract for backend implementation; it is not an existing endpoint guarantee.')
h('Request and access')
code('GET {{base_url}}dms/dashboard?month=2026-10\nAuthorization: Bearer <access_token>\nX-Company-ID: <selected_company_id>\nAccept: application/json')
p('Use the configured API base URL without adding a second API or version prefix. The optional month parameter accepts YYYY-MM and defaults to the current company month. Reject malformed or future months with HTTP 422. Resolve the reporting timezone from company settings.')
p('Authenticate and authorize the selected company and DMS dashboard access. Apply existing document visibility, employee access and folder permissions before every aggregation and list query. Never expose totals for records the viewer cannot access.')
h('Dashboard sections and response fields')
table([['Existing UI section','Response source'],['Six KPI cards','kpi: documents_uploaded, verified_documents, pending_verification, pending_signatures, expiring_documents, folders'],['Uploads and verification chart','trend: six months with uploaded and verified event counts'],['Verification status donut','status_breakdown and status_total'],['Needs attention','needs_attention: counts, scopes and hints'],['Document types and folder distribution','document_types and folder_distribution'],['Bulk uploads and signature requests','recent_batches and signatures'],['Recent documents table','recent_documents with owner, document type and folder']], [210,305])
page('Reporting and counting rules')
p('<b>Monthly cohort.</b> Count distinct logical documents whose original uploaded_at (normally created_at) falls in the selected company month. Use a half-open range from month_start inclusive to range_end_exclusive. For the current month, cap the effective range at as_of. A new file version does not create another logical upload.')
p('<b>Snapshot values.</b> Proposed v1 behavior uses current snapshots for signatures, folders, expiry, missing requirements and the current verification status of monthly uploads. Return snapshot_at and snapshot_mode=current. Changing month changes the upload cohort, trend, recent documents and batches; it does not time-travel current inventory. Historical snapshots require event history and a separate agreed contract.')
p('<b>Verification is separate from expiry.</b> The repository contains conflicting verification types: one includes expired and another allows only pending, verified and rejected. Proposed contract uses those three verification states, with expiry_date and is_expired as separate fields. An expired verified document remains verified in the donut and also contributes to the expired compliance count. Confirm backend storage mapping before implementation; do not double-count documents.')
p('<b>Trend.</b> Return exactly six chronological calendar months ending with the selected month. uploaded counts original upload events. verified counts transitions into verified, grouped by verification time, including documents uploaded earlier. Deduplicate by document within each month. Use verification events where available; a mutable verified_at alone cannot reconstruct repeated historical verification. Zero-fill inactive months.')
p('<b>Document types.</b> Group the monthly upload cohort by stable document_type_id, including an Unclassified bucket for null. Return the top four groups, plus an explicit Other bucket when needed. Sort by descending count, with stable ID tie-breaking. The sum must equal documents_uploaded.')
p('<b>Folder distribution.</b> Classify each monthly upload by its current folder type: personal, shared, system or unfiled. Each document belongs to exactly one bucket. Include all four buckets, even when zero; percentage = count / total * 100, or zero if total is zero. Folder count counts distinct visible folders, not the recursive sum of descendants.')
p('<b>Scope labels.</b> Each attention item returns scope=selected_month or current_snapshot so the frontend can label mixed time scopes correctly. Awaiting verification covers selected-month uploads; all other attention cards use the current snapshot.')
h('Dates and lifecycle')
p('Use ISO 8601 UTC timestamps for events, YYYY-MM-DD for date-only expiry fields, YYYY-MM for month IDs, and non-negative integer counts. Exclude soft-deleted documents and superseded file-version rows consistently. Existing document lifecycle status (draft, under_review, approved, published, archived) must remain separate from verification_status.')
page('Signatures compliance and bulk uploads')
h('Signature request summary')
p('Count distinct parent signature requests, not signatory rows. A request remains pending until its required signing workflow is complete; notified signatories do not create extra requests. Return pending, signed, declined and expired explicitly, and total as their sum. Use current request status and existing expiry rules. The frontend must display total from the API and include expired requests when nonzero rather than silently omitting them.')
h('Compliance snapshot')
p('<b>Expiring documents.</b> Distinct current documents with an expiry date from the company reporting date through the following 30 calendar days, inclusive. Documents expiring today are expiring, not expired. Return window_start and window_end so the boundary is visible.')
p('<b>Expired documents.</b> Current documents with expiry_date earlier than the company reporting date. Exclude deleted and replaced versions. Count documents once regardless of how many requirements they satisfy.')
p('<b>Missing documents.</b> Count unsatisfied required employee-requirement pairs across eligible active employees and active mandatory requirements. Apply employee applicability and recurrence periods using compliance policy. A current valid document satisfies a requirement according to that policy. Return missing_unit=employee_requirement; this is not a count of employees. Confirm whether verified-only documents satisfy a requirement and how recurring periods work before release.')
h('Recent bulk upload batches')
p('Return the latest three visible batches created in the selected month, ordered by created_at descending then UUID. Preserve the existing resource names: total_files, processed, failed, progress_percentage and status. Here processed means successfully uploaded files; pending = total_files - processed - failed. Confirm that meaning against the persisted counters. Reconcile any legacy processed_count/failed_count fields in the backend adapter.')
p('Use existing machine statuses pending, processing, completed and failed. A completed batch can contain failures; the UI may show Completed with failures without inventing a new stored status. When total_files is zero, progress_percentage is zero. Progress is (processed + failed) / total_files * 100, clamped to 0 through 100.')
h('Recent documents')
p('Return the latest six visible documents from the monthly upload cohort, ordered by uploaded_at descending then UUID. Include a real UUID, title, nullable reference_number, uploaded_at, verification_status, expiry fields, and nullable owner, document_type and folder objects. Employee owner: include name and employee_code. Company document: use a company owner label; do not infer the owner from uploaded_by.')
p('Search and verification filtering apply locally to these six returned rows, matching the current UI. They must not alter aggregate metrics. Existing full document and bulk upload list endpoints provide pagination and full search. Do not include document bytes, private storage paths or public download URLs in the aggregate response.')
page('Example response aggregate fields')
p('Illustrative values only. This example uses the existing demo upload volume, with expiry kept separate from verification. Object keys below form one JSON response continued on the next page.')
code('''{
  "success": true,
  "message": "Success",
  "data": {
    "month": "2026-10",
    "month_label": "October 2026",
    "month_start": "2026-10-01",
    "month_end": "2026-10-31",
    "range_end_exclusive": "2026-10-31T19:00:00Z",
    "timezone": "Asia/Karachi",
    "as_of": "2026-10-15T07:00:00Z",
    "is_current_month": true,
    "snapshot_at": "2026-10-15T07:00:00Z",
    "snapshot_mode": "current",
    "kpi": {
      "documents_uploaded": 144, "verified_documents": 116,
      "pending_verification": 20, "pending_signatures": 9,
      "expiring_documents": 12, "folders": 36
    },
    "trend": {
      "months": ["2026-05", "2026-06", "2026-07",
                 "2026-08", "2026-09", "2026-10"],
      "labels": ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
      "uploaded": [248, 272, 255, 310, 360, 144],
      "verified": [223, 251, 240, 284, 332, 116],
      "note": "Upload and verification events; October is month to date."
    },
    "status_breakdown": [
      {"status": "verified", "label": "Verified", "count": 116},
      {"status": "pending", "label": "Pending", "count": 20},
      {"status": "rejected", "label": "Rejected", "count": 8}
    ],
    "status_total": 144,
    "needs_attention": {
      "awaiting_verification": {"count": 20, "scope": "selected_month",
        "hint": "Review the selected month's pending uploads."},
      "awaiting_signature": {"count": 9, "scope": "current_snapshot",
        "hint": "Signers still need to complete their requests."},
      "missing_documents": {"count": 18, "scope": "current_snapshot",
        "hint": "Required employee documents are missing."},
      "expired_documents": {"count": 7, "scope": "current_snapshot",
        "hint": "Replacement documents are required."}
    },
    "document_types": [
      {"document_type_id": 1, "label": "HR letters", "count": 42},
      {"document_type_id": 2, "label": "Identity", "count": 38},
      {"document_type_id": 3, "label": "Contracts", "count": 26},
      {"document_type_id": 4, "label": "Certificates", "count": 22}
    ],
    "document_types_other": 16,
    "document_types_total": 144,''')
page('Example response snapshot and list fields')
code('''    "folder_distribution": {
      "total": 144,
      "folders": [
        {"folder_type": "personal", "label": "Personal folders",
         "count": 102, "percentage": 70.83},
        {"folder_type": "shared", "label": "Shared folders",
         "count": 42, "percentage": 29.17},
        {"folder_type": "system", "label": "System folders",
         "count": 0, "percentage": 0},
        {"folder_type": "unfiled", "label": "Unfiled",
         "count": 0, "percentage": 0}
      ]
    },
    "signatures": {
      "total": 35, "pending": 9, "signed": 24,
      "declined": 2, "expired": 0
    },
    "compliance": {
      "expiring": 12, "expired": 7, "missing": 18,
      "missing_unit": "employee_requirement",
      "window_start": "2026-10-15", "window_end": "2026-11-14"
    },
    "folder_count": 36,
    "batches_in_month": 3,
    "recent_batches": [
      {
        "uuid": "c79033d4-3c72-4e7f-8dc4-0305ce90ab01",
        "batch_name": "October employee documents",
        "status": "processing", "total_files": 40,
        "processed": 28, "failed": 2, "remaining": 10,
        "progress_percentage": 75,
        "created_at": "2026-10-12T05:00:00Z", "completed_at": null
      }
    ],
    "recent_documents": [
      {
        "uuid": "fbd8212c-7c34-4d44-8cb4-7012832f99bf",
        "reference_number": "DOC-0144",
        "title": "Employment confirmation",
        "uploaded_at": "2026-10-12T06:00:00Z",
        "verification_status": "verified",
        "verified_at": "2026-10-12T06:30:00Z",
        "expiry_date": null, "is_expired": false,
        "owner": {
          "type": "employee", "name": "Example Employee",
          "uuid": "fe11830c-241a-4bc0-81fd-2b0ca90f904b",
          "employee_code": "EMP-0012"
        },
        "document_type": {"id": 1, "name": "HR letter"},
        "folder": {"id": 10, "name": "Employee records",
                   "folder_type": "personal"}
      }
    ]
  }
}''')
p('The sample shows one row per list for readability; return up to three batches and six documents. UUIDs are illustrative. Nullable reference_number should remain null if no reference exists; never fabricate a persisted reference.')
page('Implementation and acceptance checks')
h('Consistency requirements')
for s in [
'1. status_total = sum(status_breakdown.count) = kpi.documents_uploaded. Verified and pending KPI values match their status buckets.',
'2. sum(document_types.count) + document_types_other = document_types_total = documents_uploaded. Null document types must be represented.',
'3. sum(folder_distribution.folders.count) = folder_distribution.total = documents_uploaded. Percentages are zero when total is zero; rounded percentages may differ slightly from 100.',
'4. kpi.pending_signatures = signatures.pending; kpi.expiring_documents = compliance.expiring; kpi.folders = folder_count. Needs-attention counts match the corresponding sources.',
'5. signatures.total = pending + signed + declined + expired. Do not join signatories in a way that multiplies parent requests.',
'6. For every batch, processed + failed + remaining = total_files. Return non-negative counts from a consistent read or shared reporting cutoff.',
'7. Trend uploads for the selected month equal documents_uploaded under the same cohort rules. Verification event totals need not equal the current verified cohort count.'
]: p(s)
h('Response and error behavior')
p('Return HTTP 200 with success=true even when there are no records. Keep all objects present, all counters zero and recent lists empty. Keep fixed status and folder buckets and six trend buckets. Null applies to optional metadata only. Never substitute demo figures or silently return a successful zero section after a query failure.')
p('Use existing application error envelopes: 401 for unauthenticated access, 403 for unauthorized company or dashboard access, 422 with a month field error for invalid input, and the existing 5xx convention for server failure. Apply one authorization scope consistently to every section.')
h('Backend test scenarios')
p('Cover empty company; current and historical month; company timezone month boundaries; upload before month with verification inside month; updated file version; expired verified document; unfiled and system folders; deleted document; multiple signatories on one request; expired signature request; partially failed batch; zero-file batch; null owner/type; company switch; and restricted employee visibility. Verify expiry dates today, day 30 and day 31.')
h('Decisions to confirm before integration')
p('Confirm the dashboard permission and role scope; current snapshot behavior for historical month selection; verification storage normalization; recurrence and valid-document rules for missing requirements; signature parent status rollup; bulk processed counter meaning; and whether the existing database retains verification events. These are proposed definitions, not claims about the backend implementation.')
h('Frontend integration handoff')
p('Wire the dashboard through the existing authenticated Axios client and React Query. Key cached results by company, access context and month. Add loading, retry and empty states; guard zero denominators; remove demo labels after integration. Preserve the dashboard layout and use API UUIDs for real document actions.')

def footer(c,d):
 c.setFont('Helvetica',8); c.setFillColor(colors.HexColor('#666173')); c.drawString(40,25,'Flexi HRMS  |  DMS backend handoff'); c.drawRightString(555,25,str(d.page))
doc=SimpleDocTemplate(str(out),pagesize=(595.28,841.89),rightMargin=40,leftMargin=40,topMargin=38,bottomMargin=42)
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(out.resolve())
