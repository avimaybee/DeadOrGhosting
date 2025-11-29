---
description: How to test the Quick Advice Screenshot Input feature
---

1. Navigate to the "Quick Advice" (or "Quick Mode") section of the app.
2. Observe the new input layout:
   - "EVIDENCE (SCREENSHOTS)" should be the primary input at the top.
   - "OR PASTE TEXT" should be secondary below it.
3. Test Screenshot Upload:
   - Click "UPLOAD SCREENSHOTS" or the upload icon.
   - Select one or more image files.
   - Verify that previews appear in a grid.
   - Verify that you can remove a screenshot by clicking the "X" button.
   - Verify that the "RUN DIAGNOSTIC" button becomes enabled once a screenshot is added, even if text fields are empty.
4. Test Text Input:
   - Enter text in "OR PASTE TEXT".
   - Verify that "RUN DIAGNOSTIC" enables if text is present (even without screenshots).
5. Test Combined Input:
   - Upload a screenshot.
   - Add text context (e.g., "He sent this late at night").
   - Click "RUN DIAGNOSTIC".
6. Verify Analysis:
   - The AI should acknowledge the screenshots (if the prompt logic works as expected, though this is internal).
   - The advice should be relevant to the conversation context.
