/* =====================================================================
   script.js  -  ALL JavaScript for the Student Management Website
   ---------------------------------------------------------------------
   This one file is loaded by every page (index, about, courses, contact).
   Each page only has some of the elements below, so every section first
   checks "does this element exist on this page?" before using it.
   Nothing is saved to localStorage / sessionStorage: records live in the
   `students` array and disappear when the page is refreshed.
   ===================================================================== */

/* =====================================================================
   SECTION 1 - DATA (variables, arrays, objects)
   ===================================================================== */

// The ARRAY OF OBJECTS that stores every student while the site is open.
// Each OBJECT represents one student (id, name, age, gender, course, marks).
let students = [
  {
    id: 1,
    name: "Mary Wanjiku",
    age: 21,
    gender: "Female",
    course: "Software Development",
    marks: 85,
  },
  {
    id: 2,
    name: "John Kamau",
    age: 23,
    gender: "Male",
    course: "Software Development",
    marks: 65,
  },
];

// Gives every new student a unique id. Starts after the sample students.
let nextStudentId = 3;

// The mark needed to pass (a number). Change it here to change it everywhere.
const PASS_MARK = 50;

// Remembers which student's marks are currently being edited (null = none).
let editingStudentId = null;

// Remembers what the user chose in the course filter and sort controls.
let currentCourseFilter = "All";
let sortByMarksHighToLow = false;

/* =====================================================================
   SECTION 2 - SMALL HELPER FUNCTIONS (reusable operations)
   ===================================================================== */

// Shortcut: find one element by its id. Returns null if the page doesn't have it.
function byId(elementId) {
  return document.getElementById(elementId);
}

// Works out the performance CLASSIFICATION from the marks
// using conditional statements (if / else if / else).
function getClassification(marks) {
  if (marks >= 80) {
    return "Excellent";
  } else if (marks >= 70) {
    return "Very Good";
  } else if (marks >= 60) {
    return "Good";
  } else if (marks >= 50) {
    return "Average";
  } else {
    return "Failed";
  }
}

// Works out the performance STATUS (Passed / Failed).
// A comparison operator (>=) gives a boolean, which picks the text.
function getStatus(marks) {
  const hasPassed = marks >= PASS_MARK; // boolean: true or false
  return hasPassed ? "Passed" : "Failed";
}

// Turns a classification such as "Very Good" into a CSS class "very-good",
// so the label can be colour-coded in the stylesheet.
function getClassificationCssClass(classification) {
  return "badge-" + classification.toLowerCase().replace(" ", "-");
}

// Shows a message inside a message box. type is "error" or "success".
// The CSS colours the box red (error) or green (success).
function showMessage(box, text, type) {
  box.textContent = text;
  box.className = "message " + type; // resets any old classes
}

// Hides and clears a message box.
function clearMessage(box) {
  box.textContent = "";
  box.className = "message";
}

// Creates an element, adds text and optional CSS class (used when building rows).
function createElementWithText(tagName, text, cssClass) {
  const element = document.createElement(tagName);
  element.textContent = text; // textContent is safe from HTML injection
  if (cssClass) {
    element.className = cssClass;
  }
  return element;
}

/* =====================================================================
   SECTION 3 - STATISTICS (loops + calculations)
   ===================================================================== */

// Goes through every student with a loop and returns an object of totals.
function calculateStatistics() {
  let totalStudents = students.length;
  let passedCount = 0;
  let failedCount = 0;
  let marksSum = 0;
  let highest = null;
  let lowest = null;

  // Count of students in each performance band
  const bandCounts = {
    Excellent: 0,
    "Very Good": 0,
    Good: 0,
    Average: 0,
    Failed: 0,
  };

  // LOOP: visit each student object once.
  for (let i = 0; i < students.length; i++) {
    const student = students[i];

    marksSum += student.marks; // add up the marks
    bandCounts[getClassification(student.marks)]++; // add 1 to this student's band

    if (student.marks >= PASS_MARK) {
      passedCount++;
    } else {
      failedCount++;
    }

    // Track the highest and lowest student so far.
    if (highest === null || student.marks > highest.marks) {
      highest = student;
    }
    if (lowest === null || student.marks < lowest.marks) {
      lowest = student;
    }
  }

  // Average = total marks / number of students (avoid dividing by zero).
  const averageMarks = totalStudents > 0 ? marksSum / totalStudents : 0;

  return {
    totalStudents,
    passedCount,
    failedCount,
    averageMarks,
    highest,
    lowest,
    bandCounts,
  };
}

// Writes the numbers into the dashboard cards and performance summary.
// Called every time the student array changes, so stats always stay current.
function updateDashboard() {
  const stats = calculateStatistics();

  // Dashboard statistic cards (only exist on index.html)
  if (byId("statTotal")) {
    byId("statTotal").textContent = stats.totalStudents;
    byId("statPassed").textContent = stats.passedCount;
    byId("statFailed").textContent = stats.failedCount;
    byId("statAverage").textContent = stats.averageMarks.toFixed(1); // 1 decimal place
  }

  // Small summary under the records table
  if (byId("recordsTotal")) {
    byId("recordsTotal").textContent = stats.totalStudents;
    byId("recordsAverage").textContent = stats.averageMarks.toFixed(1);
    byId("recordsPassed").textContent = stats.passedCount;
    byId("recordsFailed").textContent = stats.failedCount;
  }

  // Performance summary section: highest, lowest and bar for each band
  if (byId("summaryHighest")) {
    byId("summaryHighest").textContent = stats.highest
      ? stats.highest.name + " (" + stats.highest.marks + ")"
      : "No students yet";
    byId("summaryLowest").textContent = stats.lowest
      ? stats.lowest.name + " (" + stats.lowest.marks + ")"
      : "No students yet";
    renderPerformanceBars(stats);
  }
}

// Draws one horizontal bar per performance band (width = share of students).
function renderPerformanceBars(stats) {
  const container = byId("performanceBars");
  container.innerHTML = ""; // clear old bars

  const bands = Object.keys(stats.bandCounts); // ["Excellent", "Very Good", ...]
  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    const count = stats.bandCounts[band];
    const percent =
      stats.totalStudents > 0 ? (count / stats.totalStudents) * 100 : 0;

    const row = document.createElement("div");
    row.className = "bar-row";

    const label = createElementWithText("span", band, "bar-label");
    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = "bar-fill " + getClassificationCssClass(band);
    fill.style.width = percent + "%"; // bar length
    track.appendChild(fill);
    const value = createElementWithText("span", String(count), "bar-value");

    row.append(label, track, value);
    container.appendChild(row);
  }
}

/* =====================================================================
   SECTION 4 - DISPLAYING STUDENT RECORDS (DOM manipulation)
   ===================================================================== */

// Returns the students that should be shown, after applying the
// course filter and the optional "highest marks first" sort.
function getVisibleStudents() {
  const visible = [];

  for (let i = 0; i < students.length; i++) {
    if (
      currentCourseFilter === "All" ||
      students[i].course === currentCourseFilter
    ) {
      visible.push(students[i]);
    }
  }

  if (sortByMarksHighToLow) {
    // sort() with a compare function: bigger marks come first.
    visible.sort(function (a, b) {
      return b.marks - a.marks;
    });
  }
  return visible;
}

// Builds one <tr> table row for a student.
function buildStudentRow(student) {
  const row = document.createElement("tr");
  const classification = getClassification(student.marks);

  row.appendChild(createElementWithText("td", student.name));
  row.appendChild(createElementWithText("td", String(student.age)));
  row.appendChild(createElementWithText("td", student.gender));
  row.appendChild(createElementWithText("td", student.course));

  // Marks cell: normal number, OR an input box when this student is being edited.
  const marksCell = document.createElement("td");
  if (editingStudentId === student.id) {
    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.max = 100;
    input.value = student.marks;
    input.className = "marks-edit-input";
    input.id = "editMarksInput";
    input.setAttribute("aria-label", "New marks for " + student.name);
    marksCell.appendChild(input);
  } else {
    marksCell.textContent = student.marks;
  }
  row.appendChild(marksCell);

  // Status cell (Passed/Failed) with colour
  const status = getStatus(student.marks);
  const statusCell = document.createElement("td");
  statusCell.appendChild(
    createElementWithText(
      "span",
      status,
      status === "Passed" ? "badge badge-excellent" : "badge badge-failed",
    ),
  );
  row.appendChild(statusCell);

  // Classification cell with colour-coded label
  const classCell = document.createElement("td");
  classCell.appendChild(
    createElementWithText(
      "span",
      classification,
      "badge " + getClassificationCssClass(classification),
    ),
  );
  row.appendChild(classCell);

  // Action buttons. data-action / data-id tell the click handler what to do.
  const actionsCell = document.createElement("td");
  actionsCell.className = "actions-cell";
  if (editingStudentId === student.id) {
    actionsCell.append(
      makeActionButton("Save", "save", student.id, "btn-small btn-success"),
      makeActionButton(
        "Cancel",
        "cancel",
        student.id,
        "btn-small btn-secondary",
      ),
    );
  } else {
    actionsCell.append(
      makeActionButton(
        "Update marks",
        "edit",
        student.id,
        "btn-small btn-secondary",
      ),
      makeActionButton("Delete", "delete", student.id, "btn-small btn-danger"),
    );
  }
  row.appendChild(actionsCell);

  return row;
}

// Creates a small button carrying data attributes for the click handler.
function makeActionButton(text, action, studentId, cssClass) {
  const button = createElementWithText("button", text, cssClass);
  button.type = "button";
  button.dataset.action = action;
  button.dataset.id = studentId;
  return button;
}

// Redraws the whole records table from the `students` array,
// then refreshes the dashboard. Call this after ANY change.
function renderStudents() {
  const tableBody = byId("studentTableBody");
  if (!tableBody) {
    return;
  } // not on this page

  tableBody.innerHTML = ""; // remove old rows
  const visibleStudents = getVisibleStudents();

  // LOOP: add one row per visible student.
  for (let i = 0; i < visibleStudents.length; i++) {
    tableBody.appendChild(buildStudentRow(visibleStudents[i]));
  }

  // Show a friendly message when there is nothing to display.
  byId("noRecordsMessage").hidden = visibleStudents.length > 0;

  updateDashboard();
}

/* =====================================================================
   SECTION 5 - TASK 1: REGISTRATION FORM (validation + adding)
   ===================================================================== */

// Checks the form values. Returns an error text, or "" if everything is valid.
function validateStudentForm(name, ageText, gender, course, marksText) {
  // 1. All required fields must be filled.
  if (
    name === "" ||
    ageText === "" ||
    gender === "" ||
    course === "" ||
    marksText === ""
  ) {
    return "Please fill in all the fields.";
  }

  // 2. Age must be a valid whole number in a sensible range.
  const age = Number(ageText);
  if (isNaN(age) || !Number.isInteger(age) || age < 5 || age > 100) {
    return "Age must be a valid whole number (between 5 and 100).";
  }

  // 3. Marks must be a number from 0 to 100.
  const marks = Number(marksText);
  if (isNaN(marks) || marks < 0 || marks > 100) {
    return "Marks must be a number between 0 and 100.";
  }

  // 4. The name should contain letters (not just digits or symbols).
  if (!/[A-Za-z]/.test(name)) {
    return "Please enter a valid full name.";
  }
  return ""; // empty text = no problems found
}

// Sets up the registration form (only on index.html).
function setupRegistrationForm() {
  const form = byId("registrationForm");
  if (!form) {
    return;
  }
  const messageBox = byId("formMessage");

  // EVENT: runs when the user clicks "Register Student" / presses Enter.
  form.addEventListener("submit", function (event) {
    event.preventDefault(); // stop the page reloading

    // Collect what the user typed. trim() removes extra spaces.
    const name = byId("studentName").value.trim();
    const ageText = byId("studentAge").value.trim();
    const gender = byId("studentGender").value;
    const course = byId("studentCourse").value;
    const marksText = byId("studentMarks").value.trim();

    const errorText = validateStudentForm(
      name,
      ageText,
      gender,
      course,
      marksText,
    );
    if (errorText !== "") {
      showMessage(messageBox, errorText, "error"); // red message
      return; // stop - do not register
    }

    // Valid: create a new student OBJECT and push it into the ARRAY.
    const newStudent = {
      id: nextStudentId,
      name: name,
      age: Number(ageText), // convert text -> number
      gender: gender,
      course: course,
      marks: Number(marksText),
    };
    nextStudentId++;
    students.push(newStudent);

    showMessage(messageBox, name + " was registered successfully!", "success"); // green
    form.reset(); // clear the form
    renderStudents(); // refresh table + stats
  });

  // Remove the old message as soon as the user starts typing again.
  form.addEventListener("input", function () {
    clearMessage(messageBox);
  });
}

// If the visitor came from a "Register now" button on courses.html
// (link looks like index.html?course=Web%20Design#register),
// pre-select that course in the form.
function preselectCourseFromLink() {
  const select = byId("studentCourse");
  if (!select) {
    return;
  }
  const requestedCourse = new URLSearchParams(window.location.search).get(
    "course",
  );
  if (requestedCourse) {
    select.value = requestedCourse;
  }
}

/* =====================================================================
   SECTION 6 - TASK 4: UPDATE & DELETE (event delegation)
   ===================================================================== */

// Removes a student after the user confirms (bonus: confirmation message).
function deleteStudent(studentId) {
  const student = students.find(function (s) {
    return s.id === studentId;
  });
  if (!student) {
    return;
  }

  if (window.confirm("Delete " + student.name + "? This cannot be undone.")) {
    // filter() keeps every student EXCEPT the deleted one.
    students = students.filter(function (s) {
      return s.id !== studentId;
    });
    renderStudents();
    refreshSearchResults();
  }
}

// Saves new marks for a student after validating them.
function saveEditedMarks(studentId) {
  const input = byId("editMarksInput");
  const text = input.value.trim();
  const newMarks = Number(text);
  const messageBox = byId("recordsMessage");

  if (text === "" || isNaN(newMarks) || newMarks < 0 || newMarks > 100) {
    showMessage(
      messageBox,
      "Marks must be a number between 0 and 100.",
      "error",
    );
    return;
  }

  for (let i = 0; i < students.length; i++) {
    if (students[i].id === studentId) {
      students[i].marks = newMarks; // update the object
      showMessage(
        messageBox,
        "Marks updated for " + students[i].name + ".",
        "success",
      );
    }
  }
  editingStudentId = null; // leave edit mode
  renderStudents();
  refreshSearchResults();
}

// ONE click listener on the table body handles every row's buttons.
function setupRecordButtons() {
  const tableBody = byId("studentTableBody");
  if (!tableBody) {
    return;
  }

  tableBody.addEventListener("click", function (event) {
    const button = event.target.closest("button"); // which button was clicked?
    if (!button) {
      return;
    }

    const studentId = Number(button.dataset.id);
    const action = button.dataset.action;
    clearMessage(byId("recordsMessage"));

    if (action === "delete") {
      deleteStudent(studentId);
    } else if (action === "edit") {
      editingStudentId = studentId; // switch this row to edit mode
      renderStudents();
      byId("editMarksInput").focus();
    } else if (action === "save") {
      saveEditedMarks(studentId);
    } else if (action === "cancel") {
      editingStudentId = null;
      renderStudents();
    }
  });

  // Course filter dropdown (bonus)
  byId("courseFilter").addEventListener("change", function (event) {
    currentCourseFilter = event.target.value;
    renderStudents();
  });

  // Sort button toggles "highest marks first" (bonus)
  byId("sortButton").addEventListener("click", function (event) {
    sortByMarksHighToLow = !sortByMarksHighToLow;
    event.target.textContent = sortByMarksHighToLow
      ? "Sorted: Highest first (click to reset)"
      : "Sort by marks (high to low)";
    renderStudents();
  });

  // Clear-all button with confirmation (bonus)
  byId("clearAllButton").addEventListener("click", function () {
    if (students.length === 0) {
      return;
    }
    if (window.confirm("Remove ALL registered students?")) {
      students = [];
      editingStudentId = null;
      renderStudents();
      refreshSearchResults();
    }
  });
}

/* =====================================================================
   SECTION 7 - TASK 3: SEARCH BY NAME
   ===================================================================== */

// Looks through the array and shows students whose name contains the text.
function searchStudents(searchText) {
  const resultsBox = byId("searchResults");
  resultsBox.innerHTML = "";

  const query = searchText.trim().toLowerCase(); // ignore capitals/extra spaces
  if (query === "") {
    resultsBox.appendChild(
      createElementWithText("p", "Type a name to search.", "muted"),
    );
    return;
  }

  const matches = [];
  for (let i = 0; i < students.length; i++) {
    if (students[i].name.toLowerCase().includes(query)) {
      matches.push(students[i]);
    }
  }

  // No match -> show a message.
  if (matches.length === 0) {
    resultsBox.appendChild(
      createElementWithText("p", "No matching student found.", "message error"),
    );
    return;
  }

  // Show a card for each match.
  for (let i = 0; i < matches.length; i++) {
    const student = matches[i];
    const classification = getClassification(student.marks);

    const card = document.createElement("div");
    card.className = "result-card";
    card.appendChild(createElementWithText("h4", student.name));
    card.appendChild(
      createElementWithText(
        "p",
        student.course + " | Age " + student.age + " | " + student.gender,
      ),
    );
    card.appendChild(
      createElementWithText(
        "p",
        "Marks: " + student.marks + " (" + getStatus(student.marks) + ")",
      ),
    );
    card.appendChild(
      createElementWithText(
        "span",
        classification,
        "badge " + getClassificationCssClass(classification),
      ),
    );
    resultsBox.appendChild(card);
  }
}

// Re-runs the current search (so results don't go stale after a delete/update).
function refreshSearchResults() {
  const input = byId("searchInput");
  if (input && input.value.trim() !== "") {
    searchStudents(input.value);
  }
}

function setupSearch() {
  const form = byId("searchForm");
  if (!form) {
    return;
  }

  form.addEventListener("submit", function (event) {
    // pressing Search / Enter
    event.preventDefault();
    searchStudents(byId("searchInput").value);
  });
  byId("searchInput").addEventListener("input", function (event) {
    // live search
    searchStudents(event.target.value);
  });
}

/* =====================================================================
   SECTION 8 - CONTACT FORM VALIDATION (contact.html)
   ===================================================================== */

function setupContactForm() {
  const form = byId("contactForm");
  if (!form) {
    return;
  }
  const messageBox = byId("contactMessageBox");

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const fullName = byId("contactName").value.trim();
    const email = byId("contactEmail").value.trim();
    const subject = byId("contactSubject").value.trim();
    const message = byId("contactMessage").value.trim();

    // Rule 1: every field is required.
    if (fullName === "" || email === "" || subject === "" || message === "") {
      showMessage(messageBox, "Please fill in all the fields.", "error");
      return;
    }
    // Rule 2: email must contain "@" and a "." after it (e.g. a@b.com).
    const atPosition = email.indexOf("@");
    const dotPosition = email.lastIndexOf(".");
    const emailIsValid =
      atPosition > 0 && // something before @
      dotPosition > atPosition + 1 && // a dot after the @
      dotPosition < email.length - 1 && // something after the dot
      !email.includes(" ");
    if (!emailIsValid) {
      showMessage(
        messageBox,
        "Please enter a valid email address (it must contain @ and a dot).",
        "error",
      );
      return;
    }
    // Rule 3: message must be at least 10 characters.
    if (message.length < 10) {
      showMessage(
        messageBox,
        "Your message must be at least 10 characters long.",
        "error",
      );
      return;
    }

    // All good: nothing is really sent (no backend), just show success and clear.
    showMessage(
      messageBox,
      "Thank you, your message has been sent.",
      "success",
    );
    form.reset();
  });
}

/* =====================================================================
   SECTION 9 - MOBILE (HAMBURGER) MENU - runs on every page
   ===================================================================== */

function setupMobileMenu() {
  const toggleButton = byId("menuToggle");
  const navigation = byId("mainNav");
  if (!toggleButton || !navigation) {
    return;
  }

  // Click on the hamburger: open if closed, close if open.
  toggleButton.addEventListener("click", function () {
    const isOpen = navigation.classList.toggle("open");
    toggleButton.setAttribute("aria-expanded", String(isOpen)); // for screen readers
  });

  // Close the menu after choosing a link (nicer on phones).
  navigation.addEventListener("click", function (event) {
    if (event.target.tagName === "A") {
      navigation.classList.remove("open");
      toggleButton.setAttribute("aria-expanded", "false");
    }
  });
}

/* =====================================================================
   SECTION 10 - START-UP: runs once when the page has loaded
   ===================================================================== */
document.addEventListener("DOMContentLoaded", function () {
  setupMobileMenu(); // every page
  setupContactForm(); // only does something on contact.html
  setupRegistrationForm(); // index.html
  preselectCourseFromLink(); // index.html
  setupRecordButtons(); // index.html
  setupSearch(); // index.html
  renderStudents(); // draw the first table + statistics
  if (byId("searchResults")) {
    searchStudents("");
  }

  // Footer year, so the copyright never goes out of date.
  const yearSpan = byId("currentYear");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
