# Group Subject Dropdown Bugfix Design

## Overview

The GroupPanel component currently uses a text input field for subject selection, allowing users to type arbitrary text. This creates inconsistency and potential data integrity issues. The fix will replace the text input with a dropdown/select field that fetches available subjects from the `/api/subjects` endpoint, ensuring users can only select from existing subjects. The implementation will include proper state management for the subjects list, loading states, error handling for API failures, and seamless integration with both the main group form and the corequisite form.

## Glossary

- **Bug_Condition (C)**: The condition where the subject field is a text input instead of a dropdown populated from the API
- **Property (P)**: The desired behavior where the subject field is a dropdown that fetches and displays subjects from `/api/subjects`
- **Preservation**: All existing form functionality (validation, submission, corequisite inheritance, editing) must remain unchanged
- **GroupPanel**: The React component in `frontend/src/components/dashboard/panels/groupPanel.tsx` that manages group creation and editing
- **Subject**: A course entity with properties: `_id`, `code`, `name`, `prerequisites`, `corequisites`, `creditHours`
- **Corequisite Form**: The secondary form section that appears when the "Add corequisite group" checkbox is enabled, which inherits the subject from the main form

## Bug Details

### Bug Condition

The bug manifests when an admin attempts to create or edit a group. The subject field is currently a text input that accepts any arbitrary string, rather than a dropdown that constrains selection to existing subjects from the database.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type FormInteraction
  OUTPUT: boolean
  
  RETURN input.field == "subject"
         AND input.fieldType == "text_input"
         AND NOT (input.fieldType == "dropdown" AND input.dataSource == "/api/subjects")
END FUNCTION
```

### Examples

- **Example 1**: Admin types "CS201" manually → System accepts any text, even if subject doesn't exist (e.g., "CS20l" with lowercase L)
- **Example 2**: Admin types "math101" → System accepts inconsistent casing, creating data integrity issues
- **Example 3**: Admin creates corequisite group → Corequisite inherits the manually typed text, propagating any typos
- **Edge Case**: API fails to load subjects → Expected behavior: show error message and fallback UI

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Form validation for all other fields (number, type, day, time, capacity) must continue to work exactly as before
- Corequisite checkbox functionality must remain unchanged - when checked, the corequisite form appears
- Form submission logic must continue to POST/PUT to `/api/groups` endpoint with the same data structure
- Edit functionality must continue to populate the form with existing group data
- Error handling for form validation and submission must remain unchanged
- Groups table display and CRUD operations must remain unchanged

**Scope:**
All inputs and interactions that do NOT involve the subject field should be completely unaffected by this fix. This includes:
- Group number input and validation
- Type, day, time, capacity selection and validation
- Corequisite form fields (except inherited subject display)
- Submit, cancel, edit, delete button functionality
- Groups table rendering and interactions

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Hardcoded Text Input**: The subject field is implemented as a simple `<input type="text">` element without any API integration
   - Located in the main group form section around line 300
   - No state management for subjects list
   - No API fetch logic for subjects

2. **Missing State Management**: The component lacks state variables to store:
   - The list of available subjects fetched from the API
   - Loading state while fetching subjects
   - Error state if the API call fails

3. **No API Integration**: The component doesn't call the `/api/subjects` endpoint
   - The endpoint exists and returns subjects with structure: `{ _id, code, name, prerequisites, corequisites, creditHours }`
   - The endpoint requires authentication (already handled by the app)

4. **Corequisite Inheritance Logic**: The corequisite form correctly inherits the subject value, but since it's a text input, it inherits whatever text was typed

## Correctness Properties

Property 1: Bug Condition - Subject Dropdown Populated from API

_For any_ interaction where an admin opens the group creation form, the subject field SHALL be a dropdown/select element populated with subjects fetched from the `/api/subjects` endpoint, displaying each subject's code as the selectable option and using the code value for form submission.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-Subject Field Behavior

_For any_ form interaction that does NOT involve the subject field (group number, type, day, time, capacity, corequisite fields, submit/cancel/edit actions), the system SHALL produce exactly the same behavior as the original code, preserving all existing validation, submission, and display functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `frontend/src/components/dashboard/panels/groupPanel.tsx`

**Function**: `GroupPanel` component

**Specific Changes**:

1. **Add State Management for Subjects**:
   - Add state variable: `const [subjects, setSubjects] = useState<Array<{_id: string, code: string, name: string}>>([]);`
   - Add loading state: `const [loadingSubjects, setLoadingSubjects] = useState(false);`
   - Add error state: `const [subjectsError, setSubjectsError] = useState<string | null>(null);`

2. **Add API Fetch Function**:
   - Create `fetchSubjects` async function that:
     - Sets loading state to true
     - Calls `GET http://localhost:5000/api/subjects`
     - On success: stores subjects in state, clears error
     - On failure: sets error message, logs error
     - Always sets loading state to false

3. **Add useEffect Hook for Initial Load**:
   - Call `fetchSubjects()` when component mounts
   - Add to existing `useEffect` or create new one

4. **Replace Text Input with Select Dropdown**:
   - Replace the subject `<input type="text">` element with `<select>` element
   - Add placeholder option: `<option value="">Select subject</option>`
   - Map over subjects array to create options: `subjects.map(s => <option key={s._id} value={s.code.toLowerCase()}>{s.code.toUpperCase()}</option>)`
   - Maintain existing onChange handler and error styling

5. **Add Loading and Error UI**:
   - Show loading indicator when `loadingSubjects` is true
   - Show error message when `subjectsError` is not null
   - Provide retry button if fetch fails

6. **Update Corequisite Inherited Subject Display**:
   - The corequisite form already displays the inherited subject as a disabled input
   - No changes needed - it will automatically show the selected dropdown value

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code (text input accepting arbitrary values), then verify the fix works correctly (dropdown with API data) and preserves existing behavior (form validation, submission, corequisite inheritance).

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that the subject field is a text input and accepts arbitrary values.

**Test Plan**: Inspect the DOM to verify the subject field is an `<input type="text">` element, then attempt to type arbitrary values including invalid subject codes. Run these tests on the UNFIXED code to observe the defect.

**Test Cases**:
1. **Text Input Verification**: Inspect DOM and confirm subject field is `<input type="text">` (will pass on unfixed code, confirming bug)
2. **Arbitrary Value Acceptance**: Type "INVALID123" in subject field and verify it's accepted (will pass on unfixed code, confirming bug)
3. **No API Call**: Monitor network tab and verify no call to `/api/subjects` is made (will pass on unfixed code, confirming bug)
4. **Corequisite Inheritance**: Enable corequisite, type arbitrary text in subject, verify corequisite inherits the text (will pass on unfixed code, confirming bug propagation)

**Expected Counterexamples**:
- Subject field is a text input that accepts any string
- No API call to `/api/subjects` occurs
- Arbitrary text can be submitted and saved to the database
- Possible causes: hardcoded text input, missing API integration, no state management for subjects

### Fix Checking

**Goal**: Verify that for all interactions where the subject field is accessed, the fixed component displays a dropdown populated from the API.

**Pseudocode:**
```
FOR ALL interaction WHERE interaction.field == "subject" DO
  result := renderGroupPanel_fixed()
  ASSERT result.subjectField.type == "select"
  ASSERT result.subjectField.options.length > 0
  ASSERT result.subjectField.options.source == "/api/subjects"
END FOR
```

### Preservation Checking

**Goal**: Verify that for all form interactions that do NOT involve the subject field, the fixed component produces the same result as the original component.

**Pseudocode:**
```
FOR ALL interaction WHERE interaction.field != "subject" DO
  ASSERT GroupPanel_original(interaction) = GroupPanel_fixed(interaction)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (different field combinations)
- It catches edge cases that manual unit tests might miss (boundary values, empty states)
- It provides strong guarantees that behavior is unchanged for all non-subject interactions

**Test Plan**: Observe behavior on UNFIXED code first for all non-subject fields, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Form Validation Preservation**: Verify that validation for number, type, day, time, capacity fields continues to work identically
2. **Corequisite Toggle Preservation**: Verify that checking/unchecking the corequisite checkbox shows/hides the corequisite form
3. **Form Submission Preservation**: Verify that submitting the form with valid data POSTs to `/api/groups` with the same structure
4. **Edit Mode Preservation**: Verify that clicking edit on a group populates the form and updates via PUT request

### Unit Tests

- Test subject dropdown renders with correct options from API response
- Test loading state displays while fetching subjects
- Test error state displays when API call fails
- Test retry functionality after API failure
- Test subject selection updates form state correctly
- Test corequisite form inherits selected subject value
- Test form validation still works for all fields
- Test form submission includes selected subject code

### Property-Based Tests

- Generate random subject lists and verify dropdown renders all options correctly
- Generate random form field values (excluding subject) and verify validation behavior is preserved
- Generate random API error scenarios and verify error handling works correctly
- Test that all non-subject form interactions produce identical results before and after fix

### Integration Tests

- Test full group creation flow: load subjects → select subject → fill form → submit → verify group created
- Test corequisite flow: select subject → enable corequisite → verify subject inherited → submit → verify both groups created
- Test edit flow: click edit → verify subject dropdown shows current value → change subject → update → verify change saved
- Test error recovery: simulate API failure → verify error message → retry → verify subjects load successfully
