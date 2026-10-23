# Shared loading UI

Use `AppLoader` from `@/components/ui/app-loader` for new screens. It uses the
shared navy/peach palette, exposes an accessible loading status, and respects
reduced motion.

- Route or full-screen loading: `<AppLoader variant="page" label="Loading attendance…" />`
- A fetching section: `<AppLoader label="Loading records…" />`
- A button or compact action: `<AppLoader variant="inline" label="Saving…" />`

Use specific labels. Keep unrelated sections visible when one request is loading.
The system layout has a shared route loading boundary; client queries still need
their own section loader. Migrate older screens to this component when updating
them rather than adding another spinner implementation.
