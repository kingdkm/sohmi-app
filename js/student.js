import { supabase } from "./supabase.js";
import { requireUser, wireLogout } from "./auth.js";

/* =========================================================
   STUDENT MANAGEMENT ELEMENTS
   ========================================================= */

const studentTable = document.getElementById("studentTable");
const studentMessage = document.getElementById("studentMessage");
const studentModal = document.getElementById("studentModal");
const modalTitle = document.getElementById("modalTitle");
const studentForm = document.getElementById("studentForm");
const formMessage = document.getElementById("formMessage");

const editingId = document.getElementById("editingId");
const fullName = document.getElementById("fullName");
const studentCode = document.getElementById("studentCode");
const admissionNumber = document.getElementById("admissionNumber");
const dateOfBirth = document.getElementById("dateOfBirth");
const gender = document.getElementById("gender");
const mobile = document.getElementById("mobile");
const email = document.getElementById("email");
const joiningDate = document.getElementById("joiningDate");
const status = document.getElementById("status");
const branchId = document.getElementById("branchId");
const courseId = document.getElementById("courseId");
const instrumentId = document.getElementById("instrumentId");
const teacherId = document.getElementById("teacherId");
const packageId = document.getElementById("packageId");
const address = document.getElementById("address");
const notes = document.getElementById("notes");

const addStudentBtn = document.getElementById("addStudentBtn");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const userEmail = document.getElementById("userEmail");


/* =========================================================
   PROGRESS ELEMENTS
   ========================================================= */

const progressModal = document.getElementById("progressModal");
const closeProgressModal = document.getElementById("closeProgressModal");
const progressDoneBtn = document.getElementById("progressDoneBtn");

const progressStudentName =
  document.getElementById("progressStudentName");

const progressStudentInfo =
  document.getElementById("progressStudentInfo");

const progressInstrument =
  document.getElementById("progressInstrument");

const progressCourse =
  document.getElementById("progressCourse");

const progressTeacher =
  document.getElementById("progressTeacher");

const progressCurrentUnit =
  document.getElementById("progressCurrentUnit");

const progressCurrentLesson =
  document.getElementById("progressCurrentLesson");

const progressStatus =
  document.getElementById("progressStatus");

const nextLessonTitle =
  document.getElementById("nextLessonTitle");

const nextLessonObjective =
  document.getElementById("nextLessonObjective");

const progressTeacherNotes =
  document.getElementById("progressTeacherNotes");

const progressHomework =
  document.getElementById("progressHomework");

const repeatLessonBtn =
  document.getElementById("repeatLessonBtn");

const reviewLessonBtn =
  document.getElementById("reviewLessonBtn");

const completeContinueBtn =
  document.getElementById("completeContinueBtn");

const moveAheadBtn =
  document.getElementById("moveAheadBtn");

const progressMessage =
  document.getElementById("progressMessage");


/* =========================================================
   DATA
   ========================================================= */

let branches = [];
let courses = [];
let instruments = [];
let teachers = [];
let packages = [];
let students = [];

let currentProgressStudent = null;
let currentLesson = null;
let currentProgress = null;
let availableLessons = [];


/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function showMessage(message, isError = false) {
  studentMessage.textContent = message || "";
  studentMessage.className = isError
    ? "message error"
    : "message";
}


function showFormMessage(message, isError = false) {
  formMessage.textContent = message || "";
  formMessage.className = isError
    ? "message error"
    : "message";
}


function showProgressMessage(message, isError = false) {
  progressMessage.textContent = message || "";
  progressMessage.className = isError
    ? "message error"
    : "message";
}


function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}


function getName(map, id) {
  return map.get(id) || "";
}


/* =========================================================
   MASTER DATA MAPS
   ========================================================= */

function buildMaps() {

  return {

    branchesMap: new Map(
      branches.map(item => [
        item.id,
        `${item.branch_code || ""}${
          item.branch_code && item.branch_name ? " - " : ""
        }${item.branch_name || ""}`
      ])
    ),

    coursesMap: new Map(
      courses.map(item => [
        item.id,
        `${item.course_code || ""}${
          item.course_code && item.course_name ? " - " : ""
        }${item.course_name || ""}`
      ])
    ),

    instrumentsMap: new Map(
      instruments.map(item => [
        item.id,
        `${item.instrument_code || ""}${
          item.instrument_code && item.instrument_name ? " - " : ""
        }${item.instrument_name || ""}`
      ])
    ),

    teachersMap: new Map(
      teachers.map(item => [
        item.id,
        `${item.teacher_code || ""}${
          item.teacher_code && item.full_name ? " - " : ""
        }${item.full_name || ""}`
      ])
    ),

    packagesMap: new Map(
      packages.map(item => [
        item.id,
        `${item.package_code || ""}${
          item.package_code && item.package_name ? " - " : ""
        }${item.package_name || ""}`
      ])
    )

  };
}


/* =========================================================
   LOAD MASTER DATA
   ========================================================= */

async function loadMasterData() {

  const [
    branchResult,
    courseResult,
    instrumentResult,
    teacherResult,
    packageResult
  ] = await Promise.all([

    supabase
      .from("branches")
      .select("id,branch_code,branch_name")
      .eq("status", "active")
      .order("branch_name"),

    supabase
      .from("courses")
      .select("id,course_code,course_name")
      .eq("status", "active")
      .order("created_at"),

    supabase
      .from("instruments")
      .select("id,instrument_code,instrument_name")
      .eq("status", "active")
      .order("instrument_name"),

    supabase
      .from("teachers")
      .select("id,teacher_code,full_name")
      .eq("status", "active")
      .order("full_name"),

    supabase
      .from("packages")
      .select("id,package_code,package_name")
      .eq("status", "active")
      .order("package_name")

  ]);


  if (branchResult.error) throw branchResult.error;
  if (courseResult.error) throw courseResult.error;
  if (instrumentResult.error) throw instrumentResult.error;
  if (teacherResult.error) throw teacherResult.error;
  if (packageResult.error) throw packageResult.error;


  branches = branchResult.data || [];
  courses = courseResult.data || [];
  instruments = instrumentResult.data || [];
  teachers = teacherResult.data || [];
  packages = packageResult.data || [];


  populateSelect(
    branchId,
    branches,
    "Select Branch",
    item =>
      `${item.branch_code || ""}${
        item.branch_code && item.branch_name ? " - " : ""
      }${item.branch_name || ""}`
  );


  populateSelect(
    courseId,
    courses,
    "Select Course",
    item =>
      `${item.course_code || ""}${
        item.course_code && item.course_name ? " - " : ""
      }${item.course_name || ""}`
  );


  populateSelect(
    instrumentId,
    instruments,
    "Select Instrument",
    item =>
      `${item.instrument_code || ""}${
        item.instrument_code && item.instrument_name ? " - " : ""
      }${item.instrument_name || ""}`
  );


  populateSelect(
    teacherId,
    teachers,
    "Select Teacher",
    item =>
      `${item.teacher_code || ""}${
        item.teacher_code && item.full_name ? " - " : ""
      }${item.full_name || ""}`
  );


  populateSelect(
    packageId,
    packages,
    "Select Package",
    item =>
      `${item.package_code || ""}${
        item.package_code && item.package_name ? " - " : ""
      }${item.package_name || ""}`
  );

}


/* =========================================================
   SELECT HELPER
   ========================================================= */

function populateSelect(select, items, placeholder, labelFunction) {

  select.innerHTML = "";

  const placeholderOption =
    document.createElement("option");

  placeholderOption.value = "";
  placeholderOption.textContent = placeholder;

  select.appendChild(placeholderOption);


  items.forEach(item => {

    const option =
      document.createElement("option");

    option.value = item.id;
    option.textContent = labelFunction(item);

    select.appendChild(option);

  });

}


/* =========================================================
   LOAD STUDENTS
   ========================================================= */

async function loadStudents() {

  showMessage("Loading students...");


  const { data, error } = await supabase

    .from("students")

    .select(`
      id,
      student_code,
      admission_number,
      full_name,
      date_of_birth,
      gender,
      mobile,
      email,
      address,
      branch_id,
      course_id,
      instrument_id,
      teacher_id,
      package_id,
      joining_date,
      status,
      notes,
      photo_url
    `)

    .order("full_name");


  if (error) {

    console.error(error);

    studentTable.innerHTML =
      `<tr><td colspan="13">Unable to load students.</td></tr>`;

    showMessage(error.message, true);

    return;
  }


  students = data || [];

  renderStudents();

}


/* =========================================================
   RENDER STUDENTS
   ========================================================= */

function renderStudents() {

  const {
    branchesMap,
    coursesMap,
    instrumentsMap,
    teachersMap,
    packagesMap
  } = buildMaps();


  if (!students.length) {

    studentTable.innerHTML =
      `<tr>
        <td colspan="13">
          No students found. Click “+ Add Student” to add the first student.
        </td>
      </tr>`;

    showMessage("");

    return;
  }


  studentTable.innerHTML = students.map(student => `

    <tr>

      <td>
        ${escapeHtml(student.student_code)}
      </td>

      <td>
        ${escapeHtml(student.admission_number || "")}
      </td>

      <td>
        <strong>
          ${escapeHtml(student.full_name)}
        </strong>
      </td>

      <td>
        ${escapeHtml(formatDate(student.date_of_birth))}
      </td>

      <td>
        ${escapeHtml(student.gender || "")}
      </td>

      <td>
        ${escapeHtml(student.mobile || "")}
      </td>

      <td>
        ${escapeHtml(
          getName(branchesMap, student.branch_id)
        )}
      </td>

      <td>
        ${escapeHtml(
          getName(coursesMap, student.course_id)
        )}
      </td>

      <td>
        ${escapeHtml(
          getName(instrumentsMap, student.instrument_id)
        )}
      </td>

      <td>
        ${escapeHtml(
          getName(teachersMap, student.teacher_id)
        )}
      </td>

      <td>
        ${escapeHtml(
          getName(packagesMap, student.package_id)
        )}
      </td>

      <td>

        <span
          class="status ${
            student.status === "active"
              ? "active"
              : "inactive"
          }">

          ${escapeHtml(student.status || "")}

        </span>

      </td>

      <td>

        <div class="actions">

          <button
            class="primary small-btn"
            data-action="progress"
            data-id="${student.id}">
            Progress
          </button>

          <button
            class="secondary small-btn"
            data-action="edit"
            data-id="${student.id}">
            Edit
          </button>

          ${
            student.status === "active"
              ? `<button
                   class="danger small-btn"
                   data-action="deactivate"
                   data-id="${student.id}">
                   Deactivate
                 </button>`
              : ""
          }

        </div>

      </td>

    </tr>

  `).join("");


  showMessage(
    `${students.length} student${
      students.length === 1 ? "" : "s"
    } found.`
  );

}


/* =========================================================
   GENERATE STUDENT CODE
   ========================================================= */

async function generateStudentCode() {

  const { data, error } = await supabase

    .from("students")

    .select("student_code")

    .like("student_code", "STU%");


  if (error) {

    console.error(error);

    return "STU001";
  }


  let highest = 0;


  (data || []).forEach(row => {

    const match =
      String(row.student_code || "")
        .match(/^STU(\d+)$/i);


    if (match) {

      highest =
        Math.max(
          highest,
          Number(match[1])
        );

    }

  });


  return `STU${String(
    highest + 1
  ).padStart(3, "0")}`;

}


/* =========================================================
   ADD STUDENT MODAL
   ========================================================= */

function openAddModal() {

  studentForm.reset();

  editingId.value = "";

  modalTitle.textContent =
    "Add Student";

  showFormMessage("");

  status.value = "active";


  const today =
    new Date()
      .toISOString()
      .slice(0, 10);


  joiningDate.value = today;


  branchId.value =
    branches.length === 1
      ? branches[0].id
      : "";


  studentModal.classList.remove("hidden");

}


/* =========================================================
   EDIT STUDENT MODAL
   ========================================================= */

function openEditModal(student) {

  editingId.value =
    student.id;

  modalTitle.textContent =
    "Edit Student";


  fullName.value =
    student.full_name || "";

  studentCode.value =
    student.student_code || "";

  admissionNumber.value =
    student.admission_number || "";

  dateOfBirth.value =
    student.date_of_birth || "";

  gender.value =
    student.gender || "";

  mobile.value =
    student.mobile || "";

  email.value =
    student.email || "";

  joiningDate.value =
    student.joining_date || "";

  status.value =
    student.status || "active";

  branchId.value =
    student.branch_id || "";

  courseId.value =
    student.course_id || "";

  instrumentId.value =
    student.instrument_id || "";

  teacherId.value =
    student.teacher_id || "";

  packageId.value =
    student.package_id || "";

  address.value =
    student.address || "";

  notes.value =
    student.notes || "";


  showFormMessage("");

  studentModal.classList.remove("hidden");

}


/* =========================================================
   CLOSE STUDENT MODAL
   ========================================================= */

function closeStudentModal() {

  studentModal.classList.add("hidden");

  studentForm.reset();

  editingId.value = "";

  showFormMessage("");

}


/* =========================================================
   SAVE STUDENT
   ========================================================= */

async function saveStudent(event) {

  event.preventDefault();

  showFormMessage("Saving...");


  const name =
    fullName.value.trim();


  if (!name) {

    showFormMessage(
      "Please enter the student's full name.",
      true
    );

    return;
  }


  if (!branchId.value) {

    showFormMessage(
      "Please select a branch.",
      true
    );

    return;
  }


  const wasEditing =
    Boolean(editingId.value);


  let code =
    studentCode.value.trim();


  if (!code) {

    code =
      await generateStudentCode();

  }


  const payload = {

    student_code: code,

    admission_number:
      admissionNumber.value.trim() || null,

    full_name:
      name,

    date_of_birth:
      dateOfBirth.value || null,

    gender:
      gender.value || null,

    mobile:
      mobile.value.trim() || null,

    email:
      email.value.trim() || null,

    address:
      address.value.trim() || null,

    branch_id:
      branchId.value || null,

    course_id:
      courseId.value || null,

    instrument_id:
      instrumentId.value || null,

    teacher_id:
      teacherId.value || null,

    package_id:
      packageId.value || null,

    joining_date:
      joiningDate.value || null,

    status:
      status.value || "active",

    notes:
      notes.value.trim() || null

  };


  let result;


  if (editingId.value) {

    result =
      await supabase

        .from("students")

        .update(payload)

        .eq("id", editingId.value);

  } else {

    result =
      await supabase

        .from("students")

        .insert(payload);

  }


  if (result.error) {

    console.error(result.error);

    showFormMessage(
      result.error.message,
      true
    );

    return;
  }


  closeStudentModal();

  await loadStudents();


  showMessage(
    wasEditing
      ? "Student updated successfully."
      : "Student added successfully."
  );

}


/* =========================================================
   DEACTIVATE STUDENT
   ========================================================= */

async function deactivateStudent(id) {

  const student =
    students.find(
      item => item.id === id
    );


  if (!student) return;


  const confirmed =
    window.confirm(
      `Deactivate ${student.full_name}?`
    );


  if (!confirmed) return;


  showMessage(
    "Deactivating student..."
  );


  const { error } =
    await supabase

      .from("students")

      .update({
        status: "inactive"
      })

      .eq("id", id);


  if (error) {

    console.error(error);

    showMessage(
      error.message,
      true
    );

    return;
  }


  await loadStudents();


  showMessage(
    `${student.full_name} has been deactivated.`
  );

}


/* =========================================================
   FIND LESSONS FOR STUDENT
   ========================================================= */

async function loadStudentLessons(student) {

  /*
   * Load the student's lessons first.
   *
   * IMPORTANT:
   * lesson_number starts again at 1 inside each curriculum unit.
   * Therefore we must NOT sort by curriculum_unit_id (UUID).
   *
   * We load the curriculum unit numbers separately and then sort:
   *
   * Unit 1 -> Lesson 1, 2, 3...
   * Unit 2 -> Lesson 1, 2, 3...
   * Unit 3 -> Lesson 1, 2, 3...
   */

  let query =
    supabase
      .from("lessons")
      .select(`
        id,
        lesson_code,
        course_id,
        instrument_id,
        curriculum_unit_id,
        lesson_number,
        lesson_title,
        objective,
        homework,
        status
      `)
      .eq("status", "active");


  /*
   * First preference:
   * student's course.
   */

  if (student.course_id) {

    query =
      query.eq(
        "course_id",
        student.course_id
      );

  }


  /*
   * If the student has an instrument
   * but no course, use instrument.
   */

  else if (student.instrument_id) {

    query =
      query.eq(
        "instrument_id",
        student.instrument_id
      );

  }


  const { data, error } =
    await query;


  if (error) {

    console.error(
      "Unable to load lessons:",
      error
    );

    throw error;

  }


  const lessons =
    data || [];


  /*
   * No lessons means there is nothing
   * further to process.
   */

  if (!lessons.length) {

    availableLessons = [];

    return availableLessons;

  }


  /*
   * Get the curriculum units used by these lessons.
   */

  const unitIds =
    [
      ...new Set(
        lessons
          .map(
            lesson =>
              lesson.curriculum_unit_id
          )
          .filter(Boolean)
      )
    ];


  let units = [];


  if (unitIds.length) {

    const {
      data: unitData,
      error: unitError
    } =
      await supabase
        .from("curriculum_units")
        .select(`
          id,
          unit_number,
          unit_title
        `)
        .in("id", unitIds);


    if (unitError) {

      console.error(
        "Unable to load curriculum units:",
        unitError
      );

      throw unitError;

    }


    units =
      unitData || [];

  }


  /*
   * Create a lookup:
   *
   * curriculum unit UUID
   *        ->
   * unit_number / unit_title
   */

  const unitMap =
    new Map(
      units.map(
        unit => [
          unit.id,
          unit
        ]
      )
    );


  /*
   * Attach unit information to each lesson.
   */

  lessons.forEach(
    lesson => {

      const unit =
        unitMap.get(
          lesson.curriculum_unit_id
        );


      lesson._unitNumber =
        unit?.unit_number ?? 999999;

      lesson._unitTitle =
        unit?.unit_title || "";

    }
  );


  /*
   * CORRECT SOHMI CURRICULUM ORDER
   *
   * 1. Curriculum Unit Number
   * 2. Lesson Number
   *
   * We deliberately do NOT sort by UUID.
   */

  lessons.sort(
    (a, b) => {

      const unitDifference =
        a._unitNumber -
        b._unitNumber;


      if (unitDifference !== 0) {

        return unitDifference;

      }


      return (
        (a.lesson_number ?? 999999) -
        (b.lesson_number ?? 999999)
      );

    }
  );


  availableLessons =
    lessons;


  return availableLessons;

}


/* =========================================================
   LOAD CURRENT STUDENT PROGRESS
   ========================================================= */

async function loadStudentProgress(studentId) {

  const { data, error } =
    await supabase

      .from("student_lesson_progress")

      .select(`
        id,
        student_id,
        lesson_id,
        teacher_id,
        status,
        started_at,
        completed_at,
        teacher_notes,
        homework,
        created_at,
        updated_at
      `)

      .eq(
        "student_id",
        studentId
      )

      .order(
        "created_at",
        { ascending: false }
      );


  if (error) {

    console.error(
      "Unable to load progress:",
      error
    );

    throw error;
  }


  return data || [];

}


/* =========================================================
   DETERMINE CURRENT LESSON
   ========================================================= */

function determineCurrentLesson(
  lessons,
  progressRows
) {

  if (!lessons.length) {

    return null;
  }


  /*
   * No progress yet:
   * Start with first lesson.
   */

  if (!progressRows.length) {

    return lessons[0];

  }


  /*
   * Find the latest progress row
   * whose lesson still exists.
   */

  let latestProgress = null;


  for (const row of progressRows) {

    const lesson =
      lessons.find(
        item =>
          item.id === row.lesson_id
      );


    if (lesson) {

      latestProgress = row;

      break;

    }

  }


  if (!latestProgress) {

    return lessons[0];

  }


  const latestLessonIndex =
    lessons.findIndex(
      item =>
        item.id === latestProgress.lesson_id
    );


  if (latestLessonIndex === -1) {

    return lessons[0];

  }


  /*
   * Mastered:
   * recommend the next lesson.
   */

  if (
    latestProgress.status ===
    "mastered"
  ) {

    if (
      latestLessonIndex <
      lessons.length - 1
    ) {

      return lessons[
        latestLessonIndex + 1
      ];

    }


    return lessons[
      latestLessonIndex
    ];

  }


  /*
   * Covered, developing,
   * review_needed and repeat:
   *
   * Teacher should normally
   * continue working on the
   * current lesson.
   */

  return lessons[
    latestLessonIndex
  ];

}


/* =========================================================
   LOAD UNIT INFORMATION
   ========================================================= */

async function loadUnitName(unitId) {

  if (!unitId) {

    return "";

  }


  /*
   * curriculum_units is used only
   * to display the current unit.
   *
   * If the table/field is unavailable,
   * we gracefully fall back to
   * "Current Unit".
   */

  const { data, error } =
    await supabase

      .from("curriculum_units")

      .select("*")

      .eq("id", unitId)

      .maybeSingle();


  if (error) {

    console.warn(
      "Unit information unavailable:",
      error.message
    );

    return "";

  }


  if (!data) {

    return "";

  }


  return (
    data.unit_name ||
    data.title ||
    data.name ||
    data.unit_title ||
    ""
  );

}


/* =========================================================
   OPEN PROGRESS MODAL
   ========================================================= */

async function openProgressModal(student) {

  currentProgressStudent =
    student;

  currentLesson = null;

  currentProgress = null;

  availableLessons = [];


  progressStudentName.textContent =
    student.full_name ||
    "Student Progress";


  progressStudentInfo.textContent =
    `${student.student_code || ""}${
      student.admission_number
        ? ` • Admission ${student.admission_number}`
        : ""
    }`;


  const {
    coursesMap,
    instrumentsMap,
    teachersMap
  } = buildMaps();


  progressInstrument.value =
    getName(
      instrumentsMap,
      student.instrument_id
    );


  progressCourse.value =
    getName(
      coursesMap,
      student.course_id
    );


  progressTeacher.value =
    getName(
      teachersMap,
      student.teacher_id
    );


  progressCurrentUnit.value =
    "Loading...";

  progressCurrentLesson.value =
    "Loading...";

  progressStatus.value =
    "not_started";

  nextLessonTitle.textContent =
    "Loading recommendation...";

  nextLessonObjective.textContent =
    "";

  progressTeacherNotes.value =
    "";

  progressHomework.value =
    "";

  showProgressMessage(
    "Loading learning progress..."
  );


  progressModal.classList.remove(
    "hidden"
  );


  try {

    const lessons =
      await loadStudentLessons(
        student
      );


    const progressRows =
      await loadStudentProgress(
        student.id
      );


    currentLesson =
      determineCurrentLesson(
        lessons,
        progressRows
      );


    /*
     * Find the progress row
     * belonging to current lesson.
     */

    if (currentLesson) {

      currentProgress =
        progressRows.find(
          row =>
            row.lesson_id ===
            currentLesson.id
        ) || null;

    }


    if (!currentLesson) {

      progressCurrentUnit.value =
        "No curriculum found";

      progressCurrentLesson.value =
        "No lesson available";

      nextLessonTitle.textContent =
        "No lesson is currently available.";

      nextLessonObjective.textContent =
        "Please make sure the student's course and instrument are assigned and that lessons have been added.";

      showProgressMessage(
        "No lessons found for this student's course.",
        true
      );

      return;
    }


    progressCurrentLesson.value =
      `${currentLesson.lesson_number}. ${currentLesson.lesson_title}`;


    progressStatus.value =
      currentProgress?.status ||
      "not_started";


    progressTeacherNotes.value =
      currentProgress?.teacher_notes ||
      "";


    progressHomework.value =
      currentProgress?.homework ||
      "";


    nextLessonTitle.textContent =
      `${currentLesson.lesson_number}. ${currentLesson.lesson_title}`;


    nextLessonObjective.textContent =
      currentLesson.objective ||
      "No objective has been entered for this lesson.";


    const unitName =
      await loadUnitName(
        currentLesson.curriculum_unit_id
      );


    progressCurrentUnit.value =
      unitName ||
      (
        currentLesson.curriculum_unit_id
          ? "Current Unit"
          : "Not assigned"
      );


    showProgressMessage(
      currentProgress
        ? "Current progress loaded."
        : "This student has no progress recorded yet."
    );

  }

  catch (error) {

    console.error(error);

    showProgressMessage(
      error.message ||
      "Unable to load student progress.",
      true
    );

  }

}


/* =========================================================
   SAVE PROGRESS
   ========================================================= */

async function saveProgress(
  newStatus,
  moveToNext = false
) {

  if (!currentProgressStudent) {

    return;

  }


  if (!currentLesson) {

    showProgressMessage(
      "No current lesson is available.",
      true
    );

    return;

  }


  showProgressMessage(
    "Saving progress..."
  );


  const teacherIdValue =
    currentProgressStudent.teacher_id ||
    null;


  const payload = {

    student_id:
      currentProgressStudent.id,

    lesson_id:
      currentLesson.id,

    teacher_id:
      teacherIdValue,

    status:
      newStatus,

    teacher_notes:
      progressTeacherNotes.value.trim() ||
      null,

    homework:
      progressHomework.value.trim() ||
      null,

    completed_at:
      newStatus === "mastered"
        ? new Date().toISOString()
        : null

  };


  let result;


  /*
   * Update existing progress row
   * when one exists.
   */

  if (currentProgress) {

    result =
      await supabase

        .from(
          "student_lesson_progress"
        )

        .update(payload)

        .eq(
          "id",
          currentProgress.id
        );

  }


  /*
   * Otherwise create a new row.
   */

  else {

    result =
      await supabase

        .from(
          "student_lesson_progress"
        )

        .insert(payload);

  }


  if (result.error) {

    console.error(
      result.error
    );

    showProgressMessage(
      result.error.message,
      true
    );

    return;

  }


  /*
   * If the teacher chooses
   * Complete & Continue or Move Ahead,
   * immediately show the next lesson.
   */

  if (
    moveToNext &&
    newStatus === "mastered"
  ) {

    const currentIndex =
      availableLessons.findIndex(
        lesson =>
          lesson.id ===
          currentLesson.id
      );


    if (
      currentIndex !== -1 &&
      currentIndex <
        availableLessons.length - 1
    ) {

      currentLesson =
        availableLessons[
          currentIndex + 1
        ];


      currentProgress = null;


      progressCurrentLesson.value =
        `${currentLesson.lesson_number}. ${currentLesson.lesson_title}`;


      progressStatus.value =
        "not_started";


      progressTeacherNotes.value =
        "";

      progressHomework.value =
        "";


      nextLessonTitle.textContent =
        `${currentLesson.lesson_number}. ${currentLesson.lesson_title}`;


      nextLessonObjective.textContent =
        currentLesson.objective ||
        "No objective has been entered for this lesson.";


      const unitName =
        await loadUnitName(
          currentLesson.curriculum_unit_id
        );


      progressCurrentUnit.value =
        unitName ||
        (
          currentLesson.curriculum_unit_id
            ? "Current Unit"
            : "Not assigned"
        );


      showProgressMessage(
        "Lesson completed. Next lesson is now recommended."
      );


      return;

    }


    /*
     * Student has reached the
     * final lesson in the curriculum.
     */

    showProgressMessage(
      "Lesson completed. This is currently the final lesson available in the curriculum."
    );


    return;

  }


  /*
   * Reload current progress after
   * Repeat / Review actions.
   */

  const progressRows =
    await loadStudentProgress(
      currentProgressStudent.id
    );


  currentProgress =
    progressRows.find(
      row =>
        row.lesson_id ===
        currentLesson.id
    ) || null;


  progressStatus.value =
    newStatus;


  showProgressMessage(
    newStatus === "repeat"
      ? "Lesson marked for repetition."
      : newStatus === "review_needed"
        ? "Lesson marked as needing review."
        : "Progress saved successfully."
  );

}


/* =========================================================
   PROGRESS BUTTON ACTIONS
   ========================================================= */

repeatLessonBtn.addEventListener(
  "click",
  async () => {

    await saveProgress(
      "repeat",
      false
    );

  }
);


reviewLessonBtn.addEventListener(
  "click",
  async () => {

    await saveProgress(
      "review_needed",
      false
    );

  }
);


completeContinueBtn.addEventListener(
  "click",
  async () => {

    await saveProgress(
      "mastered",
      true
    );

  }
);


moveAheadBtn.addEventListener(
  "click",
  async () => {

    const confirmed =
      window.confirm(
        "Move this student ahead to the next lesson?"
      );


    if (!confirmed) {

      return;

    }


    await saveProgress(
      "mastered",
      true
    );

  }
);


/* =========================================================
   CLOSE PROGRESS MODAL
   ========================================================= */

function closeProgress() {

  progressModal.classList.add(
    "hidden"
  );

  currentProgressStudent = null;
  currentLesson = null;
  currentProgress = null;
  availableLessons = [];

  showProgressMessage("");

}


closeProgressModal.addEventListener(
  "click",
  closeProgress
);


progressDoneBtn.addEventListener(
  "click",
  closeProgress
);


progressModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      progressModal
    ) {

      closeProgress();

    }

  }
);


/* =========================================================
   STUDENT TABLE ACTIONS
   ========================================================= */

studentTable.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "button[data-action]"
      );


    if (!button) {

      return;

    }


    const id =
      button.dataset.id;


    const action =
      button.dataset.action;


    const student =
      students.find(
        item =>
          item.id === id
      );


    if (!student) {

      return;

    }


    if (action === "edit") {

      openEditModal(
        student
      );

    }


    if (action === "deactivate") {

      deactivateStudent(
        id
      );

    }


    if (action === "progress") {

      openProgressModal(
        student
      );

    }

  }
);


/* =========================================================
   STUDENT MODAL EVENTS
   ========================================================= */

addStudentBtn.addEventListener(
  "click",
  openAddModal
);


closeModal.addEventListener(
  "click",
  closeStudentModal
);


cancelBtn.addEventListener(
  "click",
  closeStudentModal
);


studentModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      studentModal
    ) {

      closeStudentModal();

    }

  }
);


studentForm.addEventListener(
  "submit",
  saveStudent
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function init() {

  try {

    const user =
      await requireUser();


    if (!user) {

      return;

    }


    userEmail.textContent =
      user.email || "";


    wireLogout(
      "logoutBtn"
    );


    await loadMasterData();

    await loadStudents();

  }

  catch (error) {

    console.error(error);

    showMessage(
      error.message ||
      "Unable to load student module.",
      true
    );

  }

}


init();
