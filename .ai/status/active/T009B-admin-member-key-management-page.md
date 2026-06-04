# T009B Admin Member And Key Management Page

- Status: Ready for User Review
- Branch: feature/T009B-admin-member-key-management-page
- Scope: Added an admin-only member management workflow.

## Changes

- Added `/admin` redirect to `/admin/users`.
- Added admin-only `/admin/users` page.
- Shows member email, role, active status, created/updated timestamps, and provider key assignment state.
- Added email search with `q` query string.
- Added admin-only member creation route and form at `/api/admin/users`.
- Added selected-member role/status actions at `/api/admin/users/{userId}`:
  - grant admin role
  - deactivate account
  - delete account
- Deactivation policy: `users.disabledAt` is set, active session/project access is blocked, the member remains visible in the admin list, and existing project/slide rows are preserved.
- Deletion policy: `users.deletedAt` is set, the member is hidden from the admin list and selected-user lookup, and existing project/slide rows are preserved.
- Admin accounts are not deactivated or deleted from this workflow; the server rejects self-admin lockout and other-admin destructive actions.
- Added inline provider key assignment/replacement/deletion forms per member and provider.
- Kept admin workflow separate from project workspace and regular settings.
- Fixed the member list card alignment so long emails remain contained in the member list column.

## Verification

- `npm run test:unit` -> passed, 14 files / 56 tests.
- `npm run lint` -> passed.
- `npm run typecheck` -> passed.
- `npm run build` -> passed and listed `/admin`, `/admin/users`, `/api/admin/users`, `/api/admin/users/[userId]`, and `/api/admin/users/[userId]/api-keys`.
- `npm run test:storyboard-sample` -> passed with `slides=12`, `llm_dummy_calls=story_structure`, `status=storyboard_review`, `image_generation=not_started`.
- Browser check at `http://127.0.0.1:3000/settings` with admin session -> confirmed admin access, member list, member creation, active-member admin grant/deactivate/delete buttons, protected disabled actions for admin accounts, soft-deactivation state, disabled inactive-member key controls, active-member provider key management UI, and no card overflow in the member list column.

## Notes

- In-app browser screenshot capture timed out, so visual evidence is recorded as DOM/browser interaction rather than a saved image.
- Dev server is intended to stay running for user review before PR creation.
