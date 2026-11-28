# Import batches listing — API notes

The Batches page now uses the shared Table Preview listing UI: Poppins, square corners, fixed-height scrolling table, compact filter popover, server pagination and row Review import action. Review continues to the existing batch workflow page; no batch mutation is performed from the listing.

Connected: GET /flexi-import/batches with import_type, page, per_page, status, date_from, date_to. Import types come from GET /flexi-import/import-types. A specific import type is selected because the existing service defaults to employees; no unsupported All types request is sent.

Missing or unconfirmed contract features:

- Global search: no q/search parameter is defined by the connected history service. Search is explicitly labeled Search files on this page and filters only the returned page. Backend should define global file-name/UUID search and matching total counts before replacing it.
- Sorting: no sort_by/sort_direction contract. Columns are not presented as sortable.
- Delete/archive/bulk actions: no corresponding list-level contract. No checkbox selection, delete or bulk mutation is offered.
- All importer types: confirm support for an unfiltered all-types query; currently a specific type is required.
- Guaranteed pagination: return current_page, per_page, last_page, total. The existing adapter can work with hasNext when total/last_page are absent, but cannot provide an exact final-page count in that case. The UI does not invent total counts.
- Guaranteed batch timestamps, actor labels and template names: these are not guaranteed by the current list type, so they are not displayed as fabricated columns.

Date ranges are validated before making requests. Choose template remains the only new-import entry; exact pinned version selection happens in the template library.
