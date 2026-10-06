import { supabase } from "./supabase.js";
import { requireUser, wireLogout } from "./auth.js";

const lessonTable = document.getElementById("lessonTable");
const lessonMessage = document.getElementById("lessonMessage");

const lessonModal = document.getElementById("lessonModal");
const modalTitle = document.getElementById("modalTitle");
const lessonForm = document.getElementById("lessonForm");
const formMessage = document.getElementById("formMessage");

const editingId = document.getElementById("editingId");
const lessonCode = document.getElementById("lessonCode");
const lessonNumber = document.getElementById("lessonNumber");
const instrumentId = document.getElementById("instrumentId");
const courseId = document.getElementById("courseId");
const level = document.getElementById("level");
const lessonTitle = document.getElementById("lessonTitle");
const objective = document.getElementById("objective");
const lessonContent = document.getElementById("lessonContent");
const homework = document.getElementById("homework");
const videoUrl = document.getElementById("videoUrl");
const sheetMusicUrl = document.getElementById("sheetMusicUrl");
const estimatedMinutes = document.getElementById("estimatedMinutes");
const prerequisiteLesson = document.getElementById("prerequisiteLesson");
const status = document.getElementById("status");

const filterInstrument = document.getElementById("filterInstrument");
const filterCourse = document.getElementById("filterCourse");
const filterLevel = document.getElementById("filterLevel");
const searchLesson = document.getElementById("searchLesson");

const addLessonBtn = document.getElementById("addLessonBtn");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");

let instruments = [];
let courses = [];
let lessons = [];

async function init() {
  await requireUser();
  wireLogout();

  await loadMasterData();
  await loadLessons();

  addLessonBtn.addEventListener("click", openAddModal);
  closeModal.addEventListener("click", closeLessonModal);
  cancelBtn.addEventListener("click", closeLessonModal);

  lessonForm.addEventListener("submit", saveLesson);

  filterInstrument.addEventListener("change", renderLessons);
  filterCourse.addEventListener("change", renderLessons);
  filterLevel.addEventListener("change", renderLessons);
  searchLesson.addEventListener("input", renderLessons);
}

async function loadMasterData() {
  const [instrumentResult, courseResult] = await Promise.all([
    supabase
      .from("instruments")
      .select("id, instrument_code, instrument_name")
      .eq("status", "active")
      .order("created_at"),

    supabase
      .from("courses")
      .select("id, course_code, course_name, level")
      .eq("status", "active")
      .order("created_at")
  ]);

  if (instrumentResult.error) {
    throw instrumentResult.error;
  }

  if (courseResult.error) {
    throw courseResult.error;
  }

  instruments = instrumentResult.data || [];
  courses = courseResult.data || [];

  fillInstrumentDropdowns();
  fillCourseDropdowns();
}

function fillInstrumentDropdowns() {
  instrumentId.innerHTML = `<option value="">Select Instrument</option>`;
  filterInstrument.innerHTML = `<option value="">All Instruments</option>`;

  instruments.forEach((instrument) => {
    instrumentId.insertAdjacentHTML(
      "beforeend",
      `<option value="${instrument.id}">
        ${escapeHtml(instrument.instrument_name)}
      </option>`
    );

    filterInstrument.insertAdjacentHTML(
      "beforeend",
      `<option value="${instrument.id}">
        ${escapeHtml(instrument.instrument_name)}
      </option>`
    );
  });
}

function fillCourseDropdowns() {
  courseId.innerHTML = `<option value="">Select Course</option>`;
  filterCourse.innerHTML = `<option value="">All Courses</option>`;

  courses.forEach((course) => {
    courseId.insertAdjacentHTML(
      "beforeend",
      `<option value="${course.id}">
        ${escapeHtml(course.course_name)}
      </option>`
    );

    filterCourse.insertAdjacentHTML(
      "beforeend",
      `<option value="${course.id}">
        ${escapeHtml(course.course_name)}
      </option>`
    );
  });
}

async function loadLessons() {
  showMessage("Loading lessons...", false);

  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .order("created_at");

  if (error) {
    console.error(error);
    lessonTable.innerHTML = `
      <tr>
        <td colspan="9">Unable to load lessons.</td>
      </tr>
    `;
    showMessage(error.message, true);
    return;
  }

  lessons = data || [];

  fillPrerequisiteDropdown();
  renderLessons();

  if (lessons.length === 0) {
    showMessage("No lessons found. Click + Add Lesson to add the first lesson.", false);
  } else {
    showMessage(`${lessons.length} lesson(s) found.`, false);
  }
}

function fillPrerequisiteDropdown(currentLessonId = "") {
  prerequisiteLesson.innerHTML = `<option value="">None</option>`;

  lessons
    .filter((lesson) => lesson.id !== currentLessonId)
    .sort((a, b) => {
      const instrumentA = getInstrumentName(a.instrument_id);
      const instrumentB = getInstrumentName(b.instrument_id);

      if (instrumentA !== instrumentB) {
        return instrumentA.localeCompare(instrumentB);
      }

      const courseA = getCourseName(a.course_id);
      const courseB = getCourseName(b.course_id);

      if (courseA !== courseB) {
        return courseA.localeCompare(courseB);
      }

      return Number(a.lesson_number || 0) - Number(b.lesson_number || 0);
    })
    .forEach((lesson) => {
      const text =
        `${lesson.lesson_code} — ${lesson.lesson_title}`;

      prerequisiteLesson.insertAdjacentHTML(
        "beforeend",
        `<option value="${lesson.id}">
          ${escapeHtml(text)}
        </option>`
      );
    });
}

function renderLessons() {
  const selectedInstrument = filterInstrument.value;
  const selectedCourse = filterCourse.value;
  const selectedLevel = filterLevel.value;
  const search = searchLesson.value.trim().toLowerCase();

  let filtered = lessons.filter((lesson) => {
    if (
      selectedInstrument &&
      lesson.instrument_id !== selectedInstrument
    ) {
      return false;
    }

    if (
      selectedCourse &&
      lesson.course_id !== selectedCourse
    ) {
      return false;
    }

    if (
      selectedLevel &&
      lesson.level !== selectedLevel
    ) {
      return false;
    }

    if (search) {
      const searchable = [
        lesson.lesson_code,
        lesson.lesson_title,
        lesson.objective,
        lesson.lesson_content,
        lesson.homework,
        getInstrumentName(lesson.instrument_id),
        getCourseName(lesson.course_id)
      ]
        .join(" ")
        .toLowerCase();

      if (!searchable.includes(search)) {
        return false;
      }
    }

    return true;
  });

  filtered.sort((a, b) => {
    const instrumentA = getInstrumentName(a.instrument_id);
    const instrumentB = getInstrumentName(b.instrument_id);

    if (instrumentA !== instrumentB) {
      return instrumentA.localeCompare(instrumentB);
    }

    const courseA = getCourseName(a.course_id);
    const courseB = getCourseName(b.course_id);

    if (courseA !== courseB) {
      return courseA.localeCompare(courseB);
    }

    return Number(a.lesson_number || 0) - Number(b.lesson_number || 0);
  });

  if (filtered.length === 0) {
    lessonTable.innerHTML = `
      <tr>
        <td colspan="9">No lessons found.</td>
      </tr>
    `;
    return;
  }

  lessonTable.innerHTML = filtered
    .map((lesson) => {
      const instrumentName = getInstrumentName(lesson.instrument_id);
      const courseName = getCourseName(lesson.course_id);

      const duration = lesson.estimated_minutes
        ? `${lesson.estimated_minutes} min`
        : "—";

      const statusClass =
        lesson.status === "active"
          ? "status-active"
          : "status-inactive";

      return `
        <tr>
          <td>${escapeHtml(lesson.lesson_code || "")}</td>

          <td>
            <strong>${escapeHtml(lesson.lesson_title || "")}</strong>
          </td>

          <td>${escapeHtml(instrumentName)}</td>

          <td>${escapeHtml(courseName)}</td>

          <td>${escapeHtml(lesson.level || "—")}</td>

          <td>${lesson.lesson_number || "—"}</td>

          <td>${duration}</td>

          <td>
            <span class="${statusClass}">
              ${escapeHtml(lesson.status || "")}
            </span>
          </td>

          <td>
            <button
              class="secondary small-btn"
              data-action="edit"
              data-id="${lesson.id}"
            >
              Edit
            </button>

            ${
              lesson.status === "active"
                ? `
                  <button
                    class="danger small-btn"
                    data-action="deactivate"
                    data-id="${lesson.id}"
                  >
                    Deactivate
                  </button>
                `
                : `
                  <button
                    class="secondary small-btn"
                    data-action="activate"
                    data-id="${lesson.id}"
                  >
                    Activate
                  </button>
                `
            }
          </td>
        </tr>
      `;
    })
    .join("");

  lessonTable.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", handleTableAction);
  });
}

async function handleTableAction(event) {
  const button = event.currentTarget;
  const id = button.dataset.id;
  const action = button.dataset.action;

  const lesson = lessons.find((item) => item.id === id);

  if (!lesson) {
    return;
  }

  if (action === "edit") {
    openEditModal(lesson);
    return;
  }

  if (action === "deactivate") {
    await changeLessonStatus(id, "inactive");
    return;
  }

  if (action === "activate") {
    await changeLessonStatus(id, "active");
  }
}

async function changeLessonStatus(id, newStatus) {
  const actionText =
    newStatus === "active"
      ? "activate"
      : "deactivate";

  const confirmed = window.confirm(
    `Are you sure you want to ${actionText} this lesson?`
  );

  if (!confirmed) {
    return;
  }

  const { error } = await supabase
    .from("lessons")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    showMessage(error.message, true);
    return;
  }

  await loadLessons();
}

function openAddModal() {
  lessonForm.reset();

  editingId.value = "";
  modalTitle.textContent = "Add Lesson";

  estimatedMinutes.value = "40";
  status.value = "active";

  fillPrerequisiteDropdown("");

  formMessage.textContent = "";
  formMessage.className = "message";

  lessonModal.classList.remove("hidden");
}

function openEditModal(lesson) {
  editingId.value = lesson.id;
  modalTitle.textContent = "Edit Lesson";

  lessonCode.value = lesson.lesson_code || "";
  lessonNumber.value = lesson.lesson_number || "";
  instrumentId.value = lesson.instrument_id || "";
  courseId.value = lesson.course_id || "";
  level.value = lesson.level || "";
  lessonTitle.value = lesson.lesson_title || "";
  objective.value = lesson.objective || "";
  lessonContent.value = lesson.lesson_content || "";
  homework.value = lesson.homework || "";
  videoUrl.value = lesson.video_url || "";
  sheetMusicUrl.value = lesson.sheet_music_url || "";
  estimatedMinutes.value = lesson.estimated_minutes || "";
  status.value = lesson.status || "active";

  fillPrerequisiteDropdown(lesson.id);
  prerequisiteLesson.value = lesson.prerequisite_lesson_id || "";

  formMessage.textContent = "";
  formMessage.className = "message";

  lessonModal.classList.remove("hidden");
}

function closeLessonModal() {
  lessonModal.classList.add("hidden");
}

async function saveLesson(event) {
  event.preventDefault();

  formMessage.textContent = "";
  formMessage.className = "message";

  const id = editingId.value.trim();

  const payload = {
    lesson_code: lessonCode.value.trim(),
    instrument_id: instrumentId.value || null,
    course_id: courseId.value || null,
    level: level.value || null,
    lesson_number: Number(lessonNumber.value),
    lesson_title: lessonTitle.value.trim(),
    objective: objective.value.trim() || null,
    lesson_content: lessonContent.value.trim() || null,
    homework: homework.value.trim() || null,
    video_url: videoUrl.value.trim() || null,
    sheet_music_url: sheetMusicUrl.value.trim() || null,
    estimated_minutes:
      estimatedMinutes.value === ""
        ? null
        : Number(estimatedMinutes.value),
    prerequisite_lesson_id:
      prerequisiteLesson.value || null,
    status: status.value || "active",
    updated_at: new Date().toISOString()
  };

  if (!payload.lesson_code) {
    showFormMessage("Lesson Code is required.", true);
    return;
  }

  if (!payload.lesson_title) {
    showFormMessage("Lesson Title is required.", true);
    return;
  }

  if (!payload.lesson_number || payload.lesson_number < 1) {
    showFormMessage("Lesson Number must be 1 or greater.", true);
    return;
  }

  if (!payload.instrument_id) {
    showFormMessage("Please select an instrument.", true);
    return;
  }

  if (!payload.course_id) {
    showFormMessage("Please select a course.", true);
    return;
  }

  if (!payload.level) {
    showFormMessage("Please select a level.", true);
    return;
  }

  let result;

  if (id) {
    result = await supabase
      .from("lessons")
      .update(payload)
      .eq("id", id);
  } else {
    result = await supabase
      .from("lessons")
      .insert(payload);
  }

  if (result.error) {
    console.error(result.error);
    showFormMessage(result.error.message, true);
    return;
  }

  closeLessonModal();
  await loadLessons();

  showMessage(
    id
      ? "Lesson updated successfully."
      : "Lesson added successfully.",
    false
  );
}

function getInstrumentName(id) {
  const instrument = instruments.find(
    (item) => item.id === id
  );

  return instrument
    ? instrument.instrument_name
    : "—";
}

function getCourseName(id) {
  const course = courses.find(
    (item) => item.id === id
  );

  return course
    ? course.course_name
    : "—";
}

function showMessage(message, isError) {
  lessonMessage.textContent = message;
  lessonMessage.className =
    isError
      ? "message error"
      : "message";
}

function showFormMessage(message, isError) {
  formMessage.textContent = message;
  formMessage.className =
    isError
      ? "message error"
      : "message";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init().catch((error) => {
  console.error(error);
  showMessage(error.message || "Unable to load Lesson Management.", true);
});
