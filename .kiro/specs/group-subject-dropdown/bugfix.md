# Bugfix Requirements Document

## Introduction

The GroupPanel component currently uses a text input field for the subject field when creating groups. This forces users to manually type subject names, which is error-prone and inconsistent with the rest of the application's design patterns. The subject field should be changed to a dropdown/select field that fetches and displays available subjects from the backend API, allowing users to select from existing subjects rather than typing them manually.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an admin creates a new group THEN the system displays a text input field for the subject where users must manually type the subject name

1.2 WHEN an admin types a subject name manually THEN the system accepts any arbitrary text without validation against existing subjects

1.3 WHEN an admin creates a corequisite group THEN the system inherits the manually typed subject text from the main group field

### Expected Behavior (Correct)

2.1 WHEN an admin creates a new group THEN the system SHALL display a dropdown/select field populated with available subjects fetched from the backend API

2.2 WHEN an admin opens the subject dropdown THEN the system SHALL fetch subjects from the `/api/subjects` endpoint and display them as selectable options

2.3 WHEN an admin selects a subject from the dropdown THEN the system SHALL use the selected subject's code for group creation

2.4 WHEN an admin creates a corequisite group THEN the system SHALL inherit the selected subject from the main group dropdown

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an admin fills out other group fields (number, type, day, time, capacity) THEN the system SHALL CONTINUE TO validate and process these fields as before

3.2 WHEN an admin checks the corequisite checkbox THEN the system SHALL CONTINUE TO display the corequisite form section with inherited subject and group number

3.3 WHEN an admin submits the form with valid data THEN the system SHALL CONTINUE TO create groups via POST to `/api/groups` endpoint

3.4 WHEN an admin edits an existing group THEN the system SHALL CONTINUE TO populate the form with existing group data and update via PUT request

3.5 WHEN form validation fails THEN the system SHALL CONTINUE TO display error messages and prevent submission

3.6 WHEN groups are displayed in the table THEN the system SHALL CONTINUE TO show all group information including subject, number, type, day, time, capacity, and student count
