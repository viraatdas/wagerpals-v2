# Username Normalization Changes

## Overview
Updated the application to handle usernames in a case-insensitive manner and restrict special characters.

## Key Changes

### 1. Username Validation Rules
- **Allowed characters**: Alphanumeric (a-z, A-Z, 0-9) and underscores (_) only
- **Min length**: 2 characters
- **Max length**: 20 characters
- **Special characters**: Rejected (e.g., @, -, spaces, etc.)

### 2. Case-Insensitive Handling
- All usernames are stored in lowercase in the database
- Lookups are case-insensitive (e.g., "JohnDoe", "johndoe", "JOHNDOE" are all treated as the same user)
- Display can show the normalized (lowercase) username

### 3. Files Modified

#### `/lib/utils.ts`
- Added `normalizeUsername()` - converts username to lowercase
- Added `validateUsername()` - validates username format and returns error messages
- Added `sanitizeUsername()` - removes invalid characters

#### `/lib/db.ts`
- Updated `getByUsername()` to use case-insensitive lookup with `LOWER()`
- Updated `activities.deleteByBet()` to use case-insensitive username matching

#### `/lib/schema.sql`
- Added case-insensitive index: `CREATE INDEX idx_users_username_lower ON users(LOWER(username))`

#### `/app/api/users/route.ts`
- Added server-side validation using `validateUsername()`
- Normalize username to lowercase before storing
- Return descriptive error messages for invalid usernames

#### `/components/UsernameModal.tsx`
- Added real-time validation with error display
- Shows validation errors as user types
- Displays helper text: "Letters, numbers, and underscores only"
- Made `onSubmit` async to handle server errors

#### Updated Pages
- `/app/page.tsx`
- `/app/events/[id]/page.tsx`
- `/app/create/page.tsx`
- All updated to properly handle async username submission with error handling

### 4. Database Migration

#### `/scripts/normalize-usernames.ts`
Created migration script that:
- Normalizes all existing usernames to lowercase in the `users` table
- Updates denormalized username data in the `bets` table
- Updates denormalized username data in the `activities` table
- Creates the case-insensitive index

**Migration Results**:
- Normalized "Cricket" → "cricket"
- Normalized "Nivi" → "nivi" (previously "@Nivi", manually changed by user)
- All 4 users in database successfully normalized

### 5. Testing

Created comprehensive test script (`/scripts/test-username-normalization.ts`) that verifies:
- Username validation works correctly
- Special characters are properly rejected
- Normalization converts to lowercase
- Case-insensitive lookups work in database
- All usernames in database are normalized

**All tests passed! ✅**

## Usage Examples

### Valid Usernames
- `JohnDoe` (stored as: `johndoe`)
- `user_123` (stored as: `user_123`)
- `Cricket` (stored as: `cricket`)

### Invalid Usernames
- `@username` ❌ (special character)
- `user-name` ❌ (hyphen not allowed)
- `user name` ❌ (spaces not allowed)
- `a` ❌ (too short)

### Case-Insensitive Login
A user who created their account as "JohnDoe" can now log in using:
- `johndoe`
- `JOHNDOE`
- `JohnDoe`
- `jOhNdOe`

All will recognize them as the same user.

## Benefits
1. **Consistency**: No confusion with case variations
2. **User-friendly**: Users don't need to remember exact casing
3. **Security**: Prevents username squatting with case variations
4. **Data Quality**: Clean, standardized username format
5. **Validation**: Clear error messages for invalid usernames

