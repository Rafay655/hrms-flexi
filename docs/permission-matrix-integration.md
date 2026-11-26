# Permission matrix integration

Source: HRPSP_Connect_Central_Permission_Matrix.xlsx, 25 November 2026. The workbook contains 582 exact permission keys and 12 roles. The checked-in snapshot is lib/permission-matrix.json.

## Runtime role assignments

Manage role permissions in Connect Central using its existing editor and sync flow. Frontend checks consume the permission list stored by login in Redux. Role names are not used to decide whether controls are shown. The workbook snapshot is reference data and is never used to manufacture runtime grants. After changing role permissions, affected users must sign in again to load the updated login snapshot. No refresh endpoint has been supplied.

No production assignments have been applied from this development session.

## Frontend coverage

lib/access-control.ts contains explicit route mappings for Connect Central, TimeSync, LeaveEase, Flexi Import, onboarding, form builder, and Letter Forge templates. These mappings filter sidebar links and guard direct page rendering. Unmapped routes remain unchanged. Permission checks use the authenticated permission list, including explicit wildcard grants; they do not manufacture permissions from role names or spreadsheet role defaults.

components/shared/PermissionBoundary.tsx exports a reusable Permission component for action controls. Shared Button and DropdownMenuItem accept an explicit permission key. Main TimeSync and LeaveEase directory actions now use these checks, including device, policy, shift, roster, accrual, blackout, carry-forward, adjustment and encashment actions. Revoke and shift swap approval no longer require hard-coded admin or HR role names. Remaining module-specific mutation and modal controls require individual review. This is not complete application-wide action coverage.

Backend authorization remains required for every endpoint. Frontend checks are presentation controls and cannot enforce server access. After changing role grants, sign in again to refresh the current login permission snapshot.
