# Manual Testing Checklist — Edge Cases & Relocation Cleanup

- [ ] **Delete a Pinned Resource**:
  - [ ] Pin a resource to both Home and Subtopic.
  - [ ] Delete this resource from the table.
  - [ ] Navigate to Home and check the Pinned list. Verify the resource is completely gone.
  - [ ] Check localstorage keys. Verify the deleted resource ID has been cleaned up.

- [ ] **Reassign Area/Subtopic for Pinned Resource**:
  - [ ] Pin a resource in the Computer area to "Home" and "This Subtopic".
  - [ ] Edit the resource and move it to "Personal" area, topic "Hobbies".
  - [ ] Verify the Home pin is still preserved.
  - [ ] Verify the old subtopic pin is removed.
  - [ ] Verify the new subtopic "Hobbies" does not automatically get a pin.
