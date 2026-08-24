# Manual Testing Checklist — Contextual Search, Filtering, and Sorting

- [ ] **Context-aware Search**:
  - [ ] Navigate to a Subtopic. Type a search query matching a title.
  - [ ] Verify the table immediately filters the rows.
  - [ ] Verify pagination updates correctly (e.g. if page was 2 and results fit on page 1, page resets to 1).

- [ ] **Filtering by Type**:
  - [ ] Change the Type dropdown from "All Types" to "Website".
  - [ ] Verify that only rows with type `website` are visible.
  - [ ] Check that the dropdown arrow is gray and the background is white.

- [ ] **Sorting Orders**:
  - [ ] Change the Sort dropdown to "A-Z" and verify rows sort alphabetically.
  - [ ] Change to "Newest" and verify newest entries appear first.
  - [ ] Ensure that active selections are preserved during sorting (or cleared, matching current app design).
