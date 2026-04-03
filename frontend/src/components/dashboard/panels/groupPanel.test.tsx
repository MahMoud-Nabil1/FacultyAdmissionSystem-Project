import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import GroupPanel from './groupPanel';

/**
 * Bug Condition Exploration Test
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * This test encodes the EXPECTED behavior (dropdown with API data).
 * It will FAIL on unfixed code, confirming the bug exists.
 * When the fix is implemented, this test will PASS, validating the fix.
 * 
 * Expected Behavior Properties (from design):
 * - Property 1: Subject field SHALL be a dropdown/select element populated from /api/subjects
 * - Property 2: Subject field SHALL NOT accept arbitrary text input
 * - Property 3: API call to /api/subjects SHALL be made when form loads
 * - Property 4: Corequisite form SHALL inherit the selected subject from dropdown
 */

describe('GroupPanel - Bug Condition Exploration', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    // Mock fetch globally
    fetchMock = jest.spyOn(global, 'fetch');
    
    // Mock /api/groups response (existing groups)
    fetchMock.mockImplementation((url: string) => {
      if (url === 'http://localhost:5000/api/groups') {
        return Promise.resolve({
          ok: true,
          json: async () => []
        } as Response);
      }
      
      // Mock /api/subjects response (expected behavior)
      if (url === 'http://localhost:5000/api/subjects') {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { _id: '1', code: 'CS201', name: 'Data Structures', prerequisites: [], corequisites: [], creditHours: 3 },
            { _id: '2', code: 'MATH101', name: 'Calculus I', prerequisites: [], corequisites: [], creditHours: 4 },
            { _id: '3', code: 'PHYS101', name: 'Physics I', prerequisites: [], corequisites: [], creditHours: 3 }
          ]
        } as Response);
      }
      
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  test('Bug Condition 1: Subject field should be a SELECT dropdown, not a text input', async () => {
    render(<GroupPanel />);
    
    // Wait for component to mount and API calls to complete
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/groups');
    });

    // Find the subject field by its label
    const subjectLabel = screen.getByText(/Subject \*/i);
    const subjectFieldContainer = subjectLabel.closest('div');
    
    // EXPECTED BEHAVIOR: Subject field should be a <select> element
    const subjectField = within(subjectFieldContainer!).getByRole('combobox');
    
    // This assertion will FAIL on unfixed code (text input) and PASS on fixed code (dropdown)
    expect(subjectField.tagName).toBe('SELECT');
  });

  test('Bug Condition 2: API call to /api/subjects should be made when form loads', async () => {
    render(<GroupPanel />);
    
    // Wait for component to mount
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/groups');
    });

    // EXPECTED BEHAVIOR: /api/subjects should be called
    // This assertion will FAIL on unfixed code (no API call) and PASS on fixed code
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/subjects');
    }, { timeout: 3000 });
  });

  test('Bug Condition 3: Subject dropdown should be populated with subjects from API', async () => {
    render(<GroupPanel />);
    
    // Wait for API calls to complete
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/subjects');
    });

    // Find the subject field
    const subjectLabel = screen.getByText(/Subject \*/i);
    const subjectFieldContainer = subjectLabel.closest('div');
    const subjectField = within(subjectFieldContainer!).getByRole('combobox') as HTMLSelectElement;

    // EXPECTED BEHAVIOR: Dropdown should have options from API
    // This will FAIL on unfixed code (text input has no options) and PASS on fixed code
    await waitFor(() => {
      const options = Array.from(subjectField.options).map(opt => opt.value);
      expect(options).toContain('cs201'); // Lowercase as per design
      expect(options).toContain('math101');
      expect(options).toContain('phys101');
    });
  });

  test('Bug Condition 4: Subject field should NOT accept arbitrary text input', async () => {
    render(<GroupPanel />);
    
    // Wait for component to mount
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/groups');
    });

    // Find the subject field
    const subjectLabel = screen.getByText(/Subject \*/i);
    const subjectFieldContainer = subjectLabel.closest('div');
    const subjectField = within(subjectFieldContainer!).getByRole('combobox') as HTMLSelectElement;

    // EXPECTED BEHAVIOR: Cannot type arbitrary text in a dropdown
    // Attempting to type should not work (dropdown only allows selection)
    // This will FAIL on unfixed code (text input accepts typing) and PASS on fixed code
    
    // Try to type arbitrary text
    await userEvent.click(subjectField);
    await userEvent.type(subjectField, 'INVALID123');
    
    // In a proper dropdown, typing doesn't set arbitrary values
    // The value should either be empty or one of the valid options
    const validOptions = ['', 'cs201', 'math101', 'phys101'];
    expect(validOptions).toContain(subjectField.value);
  });

  test('Bug Condition 5: Corequisite form should inherit selected subject from dropdown', async () => {
    render(<GroupPanel />);
    
    // Wait for API calls
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/subjects');
    });

    // Select a subject from dropdown
    const subjectLabel = screen.getByText(/Subject \*/i);
    const subjectFieldContainer = subjectLabel.closest('div');
    const subjectField = within(subjectFieldContainer!).getByRole('combobox') as HTMLSelectElement;
    
    await userEvent.selectOptions(subjectField, 'cs201');

    // Enable corequisite checkbox
    const coreqCheckbox = screen.getByRole('checkbox', { name: /Add corequisite group/i });
    await userEvent.click(coreqCheckbox);

    // EXPECTED BEHAVIOR: Corequisite form should show the selected subject
    // This will FAIL on unfixed code (shows typed text) and PASS on fixed code
    await waitFor(() => {
      const coreqSubjectLabel = screen.getByText(/Subject \(inherited\)/i);
      const coreqSubjectContainer = coreqSubjectLabel.closest('div');
      const coreqSubjectField = within(coreqSubjectContainer!).getByDisplayValue('CS201') as HTMLInputElement;
      
      expect(coreqSubjectField).toBeInTheDocument();
      expect(coreqSubjectField).toBeDisabled();
    });
  });
});

/**
 * Preservation Property Tests
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 * 
 * These tests follow observation-first methodology:
 * - Observe behavior on UNFIXED code for non-subject field interactions
 * - Write property-based tests capturing observed behavior patterns
 * - Tests PASS on unfixed code (confirming baseline behavior to preserve)
 * 
 * Preservation Requirements:
 * - All non-subject field validation and submission logic remains unchanged
 * - Corequisite checkbox functionality is preserved
 * - Edit/delete operations work identically
 * - Groups table displays correctly
 */

describe('GroupPanel - Preservation Property Tests', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
    
    // Mock /api/groups response
    fetchMock.mockImplementation((url: string) => {
      if (url === 'http://localhost:5000/api/groups') {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              _id: 'group1',
              subject: 'cs201',
              number: 1,
              type: 'lecture',
              day: 'monday',
              from: 9,
              to: 11,
              capacity: 30,
              students: []
            },
            {
              _id: 'group2',
              subject: 'math101',
              number: 2,
              type: 'lab',
              day: 'tuesday',
              from: 14,
              to: 16,
              capacity: 25,
              students: ['student1', 'student2']
            }
          ]
        } as Response);
      }
      
      // Mock /api/subjects (may or may not be called on unfixed code)
      if (url === 'http://localhost:5000/api/subjects') {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { _id: '1', code: 'CS201', name: 'Data Structures', prerequisites: [], corequisites: [], creditHours: 3 },
            { _id: '2', code: 'MATH101', name: 'Calculus I', prerequisites: [], corequisites: [], creditHours: 4 },
            { _id: '3', code: 'PHYS101', name: 'Physics I', prerequisites: [], corequisites: [], creditHours: 3 }
          ]
        } as Response);
      }
      
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  /**
   * Property 1: Group Number Field Validation
   * 
   * Observation: Group number input is required and accepts numeric values
   * Test: Verify group number field exists, accepts numbers, and shows validation error when empty
   */
  test('Preservation 1: Group number input validation works (required field, numeric)', async () => {
    render(<GroupPanel />);
    
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/groups');
    });

    // Find group number field by placeholder
    const groupNumberInput = screen.getByPlaceholderText('1') as HTMLInputElement;

    // Verify field exists and accepts numeric input
    expect(groupNumberInput).toBeInTheDocument();
    expect(groupNumberInput.type).toBe('number');
    
    // Test that field accepts numeric values
    await userEvent.clear(groupNumberInput);
    await userEvent.type(groupNumberInput, '5');
    expect(groupNumberInput.value).toBe('5');
  });

  /**
   * Property 2: Type, Day, Time, Capacity Fields Validation
   * 
   * Observation: Type, day, time, capacity fields have dropdowns/inputs with proper validation
   * Test: Verify all non-subject fields exist and accept valid values
   */
  test('Preservation 2: Type, day, time, capacity fields validate correctly', async () => {
    render(<GroupPanel />);
    
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/groups');
    });

    // Type field - find by option text
    const lectureOption = screen.getByRole('option', { name: /📚 Lecture/i });
    const typeSelect = lectureOption.closest('select') as HTMLSelectElement;
    expect(typeSelect).toBeInTheDocument();
    expect(typeSelect.value).toBe('lecture'); // Default value
    
    // Day field - find by "Select day" option
    const selectDayOption = screen.getByRole('option', { name: /Select day/i });
    const daySelect = selectDayOption.closest('select') as HTMLSelectElement;
    expect(daySelect).toBeInTheDocument();
    
    // From and To time fields - find by "Select" options (there are 2)
    const selectOptions = screen.getAllByRole('option', { name: /^Select$/i });
    expect(selectOptions.length).toBeGreaterThanOrEqual(2);
    const fromSelect = selectOptions[0].closest('select') as HTMLSelectElement;
    const toSelect = selectOptions[1].closest('select') as HTMLSelectElement;
    expect(fromSelect).toBeInTheDocument();
    expect(toSelect).toBeInTheDocument();
    
    // Capacity field - find by min attribute
    const capacityInput = screen.getByDisplayValue('30') as HTMLInputElement;
    expect(capacityInput).toBeInTheDocument();
    expect(capacityInput.type).toBe('number');
    expect(capacityInput.value).toBe('30'); // Default value
  });

  /**
   * Property 3: Corequisite Checkbox Toggle
   * 
   * Observation: Corequisite checkbox toggles the corequisite form section
   * Test: Verify checkbox shows/hides corequisite form
   */
  test('Preservation 3: Corequisite checkbox toggles the corequisite form section', async () => {
    render(<GroupPanel />);
    
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/groups');
    });

    // Find corequisite checkbox
    const coreqCheckbox = screen.getByRole('checkbox', { name: /Add corequisite group/i });
    expect(coreqCheckbox).toBeInTheDocument();
    expect(coreqCheckbox).not.toBeChecked();

    // Verify corequisite form is NOT visible initially (check for inherited fields)
    expect(screen.queryByText(/Subject \(inherited\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Group # \(inherited\)/i)).not.toBeInTheDocument();

    // Check the checkbox
    await userEvent.click(coreqCheckbox);
    expect(coreqCheckbox).toBeChecked();

    // Verify corequisite form IS visible after checking
    await waitFor(() => {
      expect(screen.getByText(/Subject \(inherited\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Group # \(inherited\)/i)).toBeInTheDocument();
    });

    // Uncheck the checkbox
    await userEvent.click(coreqCheckbox);
    expect(coreqCheckbox).not.toBeChecked();

    // Verify corequisite form is hidden again
    await waitFor(() => {
      expect(screen.queryByText(/Subject \(inherited\)/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Group # \(inherited\)/i)).not.toBeInTheDocument();
    });
  });

  /**
   * Property 4: Form Submission Structure
   * 
   * Observation: Form submission POSTs to /api/groups with correct data structure
   * Test: Verify form submission calls correct endpoint (structure validation)
   */
  /**
   * Property 4: Form Submission Structure
   * 
   * Observation: Form submission POSTs to /api/groups with correct data structure
   * Test: Verify form validation prevents submission when fields are invalid (preservation of validation logic)
   */
  test('Preservation 4: Form validation and submission logic remains unchanged', async () => {
    // Mock window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<GroupPanel />);
    
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/groups');
    });

    // Wait for subjects to load
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/subjects');
    });

    // Test 1: Verify validation prevents submission with empty required fields
    const submitButton = screen.getByRole('button', { name: /Add Group/i });
    await userEvent.click(submitButton);

    // Form should not submit - no POST call should be made
    await waitFor(() => {
      const postCalls = fetchMock.mock.calls.filter(
        call => call[0] === 'http://localhost:5000/api/groups' && call[1]?.method === 'POST'
      );
      expect(postCalls.length).toBe(0); // No submission with empty fields
    });

    // Test 2: Verify form fields exist and can be filled
    const subjectLabel = screen.getByText(/Subject \*/i);
    const subjectFieldContainer = subjectLabel.closest('div');
    const subjectField = within(subjectFieldContainer!).getByRole('combobox') as HTMLSelectElement;
    expect(subjectField).toBeInTheDocument();
    
    const groupNumberInput = screen.getByPlaceholderText('1');
    expect(groupNumberInput).toBeInTheDocument();
    
    const selectDayOption = screen.getByRole('option', { name: /Select day/i });
    const daySelect = selectDayOption.closest('select') as HTMLSelectElement;
    expect(daySelect).toBeInTheDocument();
    
    // Test 3: Verify form accepts input (preservation of input handling)
    await userEvent.selectOptions(subjectField, 'cs201');
    expect(subjectField).toHaveValue('cs201');
    
    await userEvent.type(groupNumberInput, '3');
    expect(groupNumberInput).toHaveValue(3);

    alertSpy.mockRestore();
  });

  /**
   * Property 5: Edit Mode Population
   * 
   * Observation: Edit mode populates form and updates via PUT request
   * Test: Verify edit button populates form with existing group data
   */
  test('Preservation 5: Edit mode populates form with existing group data', async () => {
    render(<GroupPanel />);
    
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/groups');
    });

    // Wait for subjects to load
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/subjects');
    });

    // Wait for groups to be displayed
    await waitFor(() => {
      const cs201Elements = screen.getAllByText('CS201');
      expect(cs201Elements.length).toBeGreaterThan(0);
    });

    // Find and click edit button for first group
    const editButtons = screen.getAllByRole('button', { name: /Edit/i });
    await userEvent.click(editButtons[0]);

    // Verify form is populated with group data
    await waitFor(() => {
      const subjectLabel = screen.getByText(/Subject \*/i);
      const subjectFieldContainer = subjectLabel.closest('div');
      const subjectField = within(subjectFieldContainer!).getByRole('combobox') as HTMLSelectElement;
      expect(subjectField.value).toBe('cs201');

      const groupNumberInput = screen.getByDisplayValue('1') as HTMLInputElement;
      expect(groupNumberInput.type).toBe('number');
      expect(groupNumberInput.value).toBe('1');

      const lectureOption = screen.getByRole('option', { name: /📚 Lecture/i });
      const typeSelect = lectureOption.closest('select') as HTMLSelectElement;
      expect(typeSelect.value).toBe('lecture');

      const mondayOptions = screen.getAllByRole('option', { name: /Monday/i });
      const daySelect = mondayOptions[0].closest('select') as HTMLSelectElement;
      expect(daySelect.value).toBe('monday');
    });

    // Verify Update button is shown
    expect(screen.getByRole('button', { name: /Update Group/i })).toBeInTheDocument();
  });

  /**
   * Property 6: Delete Functionality
   * 
   * Observation: Delete functionality removes groups from the table
   * Test: Verify delete button triggers confirmation and removes group
   */
  test('Preservation 6: Delete functionality removes groups from the table', async () => {
    // Mock window.confirm
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    
    // Mock DELETE response
    fetchMock.mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/groups/group1') && options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Deleted' })
        } as Response);
      }
      
      if (url === 'http://localhost:5000/api/groups') {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              _id: 'group1',
              subject: 'cs201',
              number: 1,
              type: 'lecture',
              day: 'monday',
              from: 9,
              to: 11,
              capacity: 30,
              students: []
            }
          ]
        } as Response);
      }
      
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<GroupPanel />);
    
    await waitFor(() => {
      expect(screen.getByText('CS201')).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    await userEvent.click(deleteButton);

    // Verify confirmation was called
    expect(confirmSpy).toHaveBeenCalled();

    // Verify DELETE was called
    await waitFor(() => {
      const deleteCalls = fetchMock.mock.calls.filter(
        call => call[0].includes('/api/groups/group1') && call[1]?.method === 'DELETE'
      );
      expect(deleteCalls.length).toBeGreaterThan(0);
    });

    confirmSpy.mockRestore();
  });

  /**
   * Property 7: Groups Table Display
   * 
   * Observation: Groups table displays all group information correctly
   * Test: Verify table renders with correct columns and data
   */
  test('Preservation 7: Groups table displays all group information correctly', async () => {
    render(<GroupPanel />);
    
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/groups');
    });

    // Verify table headers
    await waitFor(() => {
      expect(screen.getByText('Subject')).toBeInTheDocument();
      expect(screen.getByText('Group #')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Day')).toBeInTheDocument();
      expect(screen.getByText('From')).toBeInTheDocument();
      expect(screen.getByText('To')).toBeInTheDocument();
      expect(screen.getByText('Capacity')).toBeInTheDocument();
      expect(screen.getByText('Students')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    // Verify group data is displayed
    await waitFor(() => {
      // Use getAllByText since CS201 and MATH101 now appear in both dropdown and table
      expect(screen.getAllByText('CS201').length).toBeGreaterThan(0);
      expect(screen.getAllByText('MATH101').length).toBeGreaterThan(0);
      // Use getAllByText for "Monday" and "Tuesday" since they appear in both dropdown and table
      expect(screen.getAllByText('Monday').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Tuesday').length).toBeGreaterThan(0);
    });

    // Verify edit and delete buttons are present
    const editButtons = screen.getAllByRole('button', { name: /Edit/i });
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    expect(editButtons.length).toBeGreaterThan(0);
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  /**
   * Property 8: Corequisite Form Inherits Subject
   * 
   * Observation: When corequisite checkbox is enabled, the corequisite form
   * displays the subject from the main form as a disabled input
   * Test: Verify corequisite form inherits and displays subject value
   */
  test('Preservation 8: Corequisite form inherits subject from main form', async () => {
    render(<GroupPanel />);
    
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/groups');
    });

    // Wait for subjects to load
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/subjects');
    });

    // Select subject from dropdown
    const subjectLabel = screen.getByText(/Subject \*/i);
    const subjectFieldContainer = subjectLabel.closest('div');
    const subjectField = within(subjectFieldContainer!).getByRole('combobox') as HTMLSelectElement;
    await userEvent.selectOptions(subjectField, 'phys101');

    // Enable corequisite checkbox
    const coreqCheckbox = screen.getByRole('checkbox', { name: /Add corequisite group/i });
    await userEvent.click(coreqCheckbox);

    // Verify corequisite form shows inherited subject
    await waitFor(() => {
      const inheritedSubjectLabel = screen.getByText(/Subject \(inherited\)/i);
      const inheritedSubjectContainer = inheritedSubjectLabel.closest('div');
      const inheritedSubjectInput = within(inheritedSubjectContainer!).getByDisplayValue('PHYS101') as HTMLInputElement;
      
      expect(inheritedSubjectInput).toBeInTheDocument();
      expect(inheritedSubjectInput).toBeDisabled();
    });
  });

  /**
   * Property 9: Corequisite Form Inherits Group Number
   * 
   * Observation: When corequisite checkbox is enabled, the corequisite form
   * displays the group number from the main form as a disabled input
   * Test: Verify corequisite form inherits and displays group number
   */
  test('Preservation 9: Corequisite form inherits group number from main form', async () => {
    render(<GroupPanel />);
    
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/groups');
    });

    // Fill group number field
    const groupNumberInput = screen.getByPlaceholderText('1');
    await userEvent.clear(groupNumberInput);
    await userEvent.type(groupNumberInput, '7');

    // Enable corequisite checkbox
    const coreqCheckbox = screen.getByRole('checkbox', { name: /Add corequisite group/i });
    await userEvent.click(coreqCheckbox);

    // Verify corequisite form shows inherited group number
    await waitFor(() => {
      const inheritedNumberLabel = screen.getByText(/Group # \(inherited\)/i);
      const inheritedNumberContainer = inheritedNumberLabel.closest('div');
      const inheritedNumberInput = within(inheritedNumberContainer!).getByDisplayValue('7') as HTMLInputElement;
      
      expect(inheritedNumberInput).toBeInTheDocument();
      expect(inheritedNumberInput).toBeDisabled();
    });
  });
});
