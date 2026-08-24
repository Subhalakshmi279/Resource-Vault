# Manual Testing Checklist — Resource CRUD

- [ ] **Add Resource Form Validation**:
  - [ ] Leave Title blank and try to submit. Verify an inline validation error is shown.
  - [ ] Leave URL blank and try to submit. Verify validation error is shown.
  - [ ] Enter a malformed URL (e.g. `http:test`) and verify it handles it gracefully.

- [ ] **Create New Topic/Subtopic**:
  - [ ] In the Add Resource modal, select "Create New..." for subtopic and input a new name.
  - [ ] Verify the new subtopic is successfully created and appears in the Area list.
  - [ ] Ensure that a duplicate subtopic is not created if the name already matches.

- [ ] **Edit Resource**:
  - [ ] Select exactly 1 resource in the list view.
  - [ ] Click "Edit" in the selection toolbar.
  - [ ] Modify title, notes, and subtopic values and click Save.
  - [ ] Verify changes reflect immediately in the row cells.

- [ ] **Delete Resource**:
  - [ ] Select one resource and click "Delete". Verify the row disappears.
  - [ ] Select multiple resources and click "Delete". Verify all selected rows are deleted.
