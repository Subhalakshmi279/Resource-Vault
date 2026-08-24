# Manual Testing Checklist — Pinned Items & Pop-up Modal

- [ ] **Simultaneous Pinning**:
  - [ ] Select exactly 1 resource, click "Pin".
  - [ ] Check both "Home" and "This Subtopic" check boxes in the modal and click Save.
  - [ ] Navigate to Home. Verify the resource appears in the "PINNED" section.
  - [ ] Navigate back to the Subtopic. Verify the `📌` emoji marker is visible next to the file name.

- [ ] **Home Pin Limit (5)**:
  - [ ] Pin 5 different resources to Home.
  - [ ] Select a 6th resource and click "Pin".
  - [ ] Verify the "Home" checkbox is disabled, and the warning text: *"Home is full. Remove a pinned resource before adding another."* is displayed.

- [ ] **Subtopic Pin Limit (3)**:
  - [ ] Pin 3 different resources to the current Subtopic.
  - [ ] Select a 4th resource and click "Pin".
  - [ ] Verify the "This Subtopic" checkbox is disabled, and the warning text: *"This subtopic already has 3 pinned resources."* is displayed.

- [ ] **One-click Unpin from Home**:
  - [ ] Navigate to the Home page.
  - [ ] Click the "📍" unpin button on one of the pinned rows.
  - [ ] Verify the resource is immediately removed from the Pinned list on Home.
