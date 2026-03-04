# SKILL: Academic Content Upload Page (Teacher Dashboard)

## Purpose
This skill teaches Claude how to generate, fix, and extend the Academic Content page in an online tuition web app. Teachers use this page to upload notes, assignments, and tests (with Google Form links or PDF) for their students, filtered by subject and class.

---

## When to Use
- User asks to build or modify the Academic Content / content upload page
- User mentions notes, assignments, or test upload for teachers
- User asks to add/fix upload functionality, file handling, or Firestore CRUD on this page
- User mentions teacher dashboard content management
- User asks to fix or improve the notes/assignments/tests list panel
- User asks to add a separate upload button, progress bar, or form validation

---

## Tech Stack
- **Framework**: React (Next.js pages router)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage (`uploadBytesResumable`, `getDownloadURL`)
- **Auth**: Custom `useAuth` hook (`user.uid`, `user.subject`)
- **Layout**: `DashboardLayout` wrapper component
- **Responsive**: `useIsMobile(breakpoint)` hook

---

## App Context

### User Roles
- **Teacher**: Logs in and sees only their assigned subject. Subject is read from `user.subject` (set by admin). Teachers cannot change their subject.
- **Admin**: Manages courses, syllabus, and teacher profiles separately.

### Subjects Supported
- Accountancy, Business Studies (Commerce stream, Class 11 & 12)
- Subject metadata (color, bg, icon) stored in `SUB_META` constant

### Course Key Pattern
```js
const courseKey = `${teacherSubject}__${selectedClass}`;
// e.g. "Accountancy__Class 11"
```
This key scopes all Firestore queries — every note, assignment, and test is tagged with `courseKey`.

---

## Firestore Collections & Document Schema

### `notes`
```js
{
  courseKey: "Accountancy__Class 11",
  subject: "Accountancy",
  class: "Class 11",
  teacherId: "uid_string",
  title: "Partnership Notes",
  fileURL: "https://firebasestorage...",
  fileName: "partnership.pdf",
  uploadedAt: serverTimestamp()
}
```

### `assignments`
```js
{
  courseKey: "Accountancy__Class 11",
  subject: "Accountancy",
  class: "Class 11",
  teacherId: "uid_string",
  title: "Chapter 3 Assignment",
  description: "Solve all questions from pg 45",
  dueDate: Timestamp | null,
  fileURL: "https://firebasestorage..." | null,
  fileName: "assignment.pdf" | null,
  createdAt: serverTimestamp()
}
```

### `tests`
```js
{
  courseKey: "Accountancy__Class 11",
  subject: "Accountancy",
  class: "Class 11",
  teacherId: "uid_string",
  title: "Unit Test 1",
  link: "https://forms.google.com/..." | null,    // Google Form URL
  fileURL: "https://firebasestorage..." | null,   // PDF test paper
  fileName: "test1.pdf" | null,
  availableFrom: Timestamp | null,
  availableTo: Timestamp | null,
  createdAt: serverTimestamp()
}
```
> ⚠️ For tests: either `link` (Google Form) OR `fileURL` (PDF) is **compulsory**. Validate before saving.

### `courses` (syllabus — read only by teacher)
```js
{
  subject: "Accountancy",
  class: "Class 11" | "Both",
  description: "...",
  chapters: [{ name: "Chapter Name", description: "..." }]
}
```

---

## Firebase Storage Paths
```
notes/{courseKey}/{timestamp}_{filename}
assignments/{courseKey}/{timestamp}_{filename}
tests/{courseKey}/{timestamp}_{filename}
```
Max file size: **30MB**. Validate `file.size > 30 * 1024 * 1024` before upload.

---

## Component Structure

```
AcademicContent (page)
├── Subject badge (read-only from user.subject)
├── Class selector (Class 11 / Class 12 toggle buttons)
├── Syllabus accordion (reads from `courses` collection)
├── Tab bar (Notes | Assignments | Tests)
└── Two-column grid (isMobile → single column)
    ├── LEFT: Upload / Create / Edit form panel
    └── RIGHT: List panel (items for current courseKey)
```

---

## Key Behaviors & Rules

### Upload Flow
1. Teacher fills form fields (title, description, due date etc.)
2. Clicks a **separate Upload button** — do NOT trigger upload on file input `onChange`
3. File is uploaded to Firebase Storage with `uploadBytesResumable`
4. Progress bar updates during upload (`bytesTransferred / totalBytes * 100`)
5. After upload completes, `getDownloadURL` is called and Firestore doc is created/updated
6. Form resets after successful save

### Notes Form Fields
- `title` — required string
- `file` — PDF/DOC/DOCX/PPT/PPTX, max 30MB, required on create, optional on edit
- Separate **Upload** button (do not auto-upload on file select)
- On edit: show "Keep current file" option if no new file selected

### Assignments Form Fields
- `title` — required string
- `description` — optional textarea
- `dueDate` — optional datetime-local input
- `file` — PDF/DOC/DOCX, max 30MB, optional
- Separate **Upload / Save** button

### Tests Form Fields
- `title` — required string
- `link` — Google Form URL (optional if PDF uploaded)
- `file` — PDF test paper (optional if link provided)
- `availableFrom` — datetime-local, optional
- `availableTo` — datetime-local, optional
- **Validation**: At least one of `link` or `fileURL` must be present before saving
- Separate **Save** button (no file upload progress needed if only link)

### Edit Flow
- Clicking Edit on any list item pre-fills the form with existing data
- `id` field in form state signals edit mode vs create mode
- On edit without new file: preserve existing `fileURL` and `fileName`
- Cancel button resets form to empty state

### Delete Flow
- `window.confirm()` before deletion
- `deleteDoc` from Firestore (does NOT delete file from Storage — leave as-is)
- Remove item from local state immediately after deletion

### Date Handling
- Firestore returns `Timestamp` objects — always call `.toDate()` before passing to `new Date()`
- Use `formatDateForInput(dateObj)` helper to convert Firestore Timestamp → `datetime-local` string
- Display dates with `toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })`

---

## State Shape Reference

```js
// Notes form
{ title: "", id: null, fileURL: null, fileName: null }

// Assignments form
{ title: "", description: "", dueDate: "", id: null, fileURL: null, fileName: null }

// Tests form
{ title: "", link: "", availableFrom: "", availableTo: "", id: null, fileURL: null, fileName: null }

// Shared upload state
uploading: boolean
uploadProgress: number (0–100)
```

---

## Design Tokens
```js
// Primary
"#3B5BDB"  // blue — notes & assignments
"#FF6B6B"  // red-orange — tests, delete buttons

// Subject colors
Accountancy:      bg "#EEF2FF", color "#4F46E5"
Business Studies: bg "#E6FCF5", color "#0D9488"

// Common
border-radius: 10–20px (cards), 30px (pills/tabs)
box-shadow: "0 4px 24px rgba(0,0,0,0.07)"
font-weight: 700–900 for headings, 700 for labels
```

---

## Common Mistakes to Avoid
- ❌ Don't trigger file upload on `onChange` of file input — always use a separate button
- ❌ Don't skip test validation — either `link` or `fileURL` must exist before saving a test
- ❌ Don't call `toDate()` on a plain JS Date — check `dateObj.toDate` exists first
- ❌ Don't delete from Storage on doc delete — only delete the Firestore document
- ❌ Don't use `user.id` alone — use `user.uid || user.id` for teacher ID
- ❌ Don't forget to scope all Firestore queries with `where("courseKey", "==", courseKey)`
- ❌ Don't disable the entire UI during upload — only disable the form inputs and button
- ❌ Don't reset form state before upload completes

---

## Imports Template
```js
import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db, storage } from "../../firebase";
import {
  collection, query, where, getDocs, addDoc,
  serverTimestamp, doc, updateDoc, deleteDoc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import useIsMobile from "../../hooks/useIsMobile";
```

---

## Output Checklist
When generating or modifying this page, verify:
- [ ] Subject badge is read-only (from `user.subject`)
- [ ] Class toggle switches `courseKey` and re-fetches all content
- [ ] Upload is triggered by a button, not by file selection
- [ ] Progress bar shows during upload
- [ ] Test form validates: link OR file required
- [ ] Edit mode pre-fills form and preserves existing file if no new file chosen
- [ ] All Firestore docs include `courseKey`, `subject`, `class`, `teacherId`
- [ ] Dates from Firestore handled safely with `.toDate?.()` check
- [ ] Mobile layout collapses to single column
- [ ] Loading/disabled states applied during upload