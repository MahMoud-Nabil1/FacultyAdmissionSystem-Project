# Bug Condition Exploration Test Results

## Test Execution Summary

**Date**: Task 1 Execution
**Status**: ✅ Tests FAILED as expected (confirming bug exists)
**Test File**: `frontend/src/components/dashboard/panels/groupPanel.test.tsx`

## Counterexamples Found

### 1. Subject Field is Text Input (Not Dropdown)

**Expected Behavior**: Subject field should be a `<select>` dropdown element
**Actual Behavior**: Subject field is an `<input type="text">` element

**Evidence from Test Output**:
```
TestingLibraryElementError: Unable to find an accessible element with the role "combobox"

Here are the accessible roles:
  textbox:
  Name "":
  <input
    placeholder="e.g. CS201, MATH101"
    value=""
  />
```

**Counterexample**: The DOM shows the subject field is rendered as a text input with placeholder "e.g. CS201, MATH101", not as a dropdown/select element.

---

### 2. No API Call to /api/subjects

**Expected Behavior**: Component should call `GET http://localhost:5000/api/subjects` on mount
**Actual Behavior**: No API call to `/api/subjects` is made

**Evidence from Test Output**:
```
expect(jest.fn()).toHaveBeenCalledWith(...expected)

Expected: "http://localhost:5000/api/subjects"
Received: "http://localhost:5000/api/groups"

Number of calls: 1
```

**Counterexample**: The fetch mock was only called once with `/api/groups`, never with `/api/subjects`. This confirms the component doesn't fetch subjects from the API.

---

### 3. Text Input Accepts Arbitrary Values

**Expected Behavior**: Subject field should only allow selection from predefined options
**Actual Behavior**: Text input accepts any arbitrary string without validation

**Evidence**: The text input field has no constraints and accepts any typed value. The test couldn't proceed to verify this because the field type was wrong (text input instead of dropdown).

---

### 4. Corequisite Inherits Arbitrary Text

**Expected Behavior**: Corequisite form should inherit a selected subject code from dropdown
**Actual Behavior**: Corequisite form inherits whatever arbitrary text is typed in the main form

**Evidence**: Since the main subject field is a text input, the corequisite form's inherited subject display will show whatever text was typed, including invalid values like "INVALID123" or "xyz".

---

## Root Cause Confirmation

The test results confirm the hypothesized root cause from the design document:

1. ✅ **Hardcoded Text Input**: The subject field is implemented as `<input type="text">` (confirmed by DOM inspection)
2. ✅ **No API Integration**: No call to `/api/subjects` endpoint is made (confirmed by fetch mock)
3. ✅ **Missing State Management**: No subjects list is loaded or stored (implied by lack of API call)
4. ✅ **Arbitrary Text Acceptance**: Text input accepts any value without validation (confirmed by field type)

## Next Steps

The bug condition exploration test has successfully:
- ✅ Confirmed the bug exists in the unfixed code
- ✅ Documented specific counterexamples
- ✅ Validated the root cause analysis
- ✅ Encoded the expected behavior in test assertions

When the fix is implemented (Task 3), these same tests will PASS, validating that:
- Subject field is a dropdown/select element
- API call to `/api/subjects` is made on mount
- Dropdown is populated with subjects from API
- Only valid subject codes can be selected
- Corequisite form inherits the selected subject code
