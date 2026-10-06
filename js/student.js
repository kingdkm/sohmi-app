import { supabase } from "./supabase.js";
import { requireUser, wireLogout } from "./auth.js";

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

let branches = [];
let courses = [];
let instruments = [];
let teachers = [];
let packages = [];
let students = [];

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

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getName(map, id) {
  return map.get(id) || "";
}

function buildMaps() {
  return {
    branchesMap: new Map(
      branches.map(item => [
        item.id,
        `${item.branch_code || ""}${item.branch_code && item.branch_name ? " - " : ""}${item.branch_name || ""}`
      ])
    ),

    coursesMap: new Map(
      courses.map(item => [
        item.id,
        `${item.course_code || ""}${item.course_code && item.course_name ? " - " : ""}${item.course_name || ""}`
      ])
    ),

    instrumentsMap: new Map(
      instruments.map(item => [
        item.id,
        `${item.instrument_code || ""}${item.instrument_code && item.instrument_name ? " - " : ""}${item.instrument_name || ""}`
      ])
    ),

    teachersMap: new Map(
      teachers.map(item => [
        item.id,
        `${item.teacher_code || ""}${item.teacher_code && item.full_name ? " - " : ""}${item.full_name || ""}`
      ])
    ),

    packagesMap: new Map(
      packages.map(item => [
        item.id,
        `${item.package_code || ""}${item.package_code && item.package_name ? " - " : ""}${item.package_name || ""}`
      ])
    )
  };
}

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
    item => `${item.branch_code || ""}${item.branch_code && item.branch_name ? " - " : ""}${item.branch_name || ""}`
  );

  populateSelect(
    courseId,
    courses,
    "Select Course",
    item => `${item.course_code || ""}${item.course_code && item.course_name ? " - " : ""}${item.course_name || ""}`
  );

  populateSelect(
    instrumentId,
    instruments,
    "Select Instrument",
    item => `${item.instrument_code || ""}${item.instrument_code && item.instrument_name ? " - " : ""}${item.instrument_name || ""}`
  );

  populateSelect(
    teacherId,
    teachers,
    "Select Teacher",
    item => `${item.teacher_code || ""}${item.teacher_code && item.full_name ? " - " : ""}${item.full_name || ""}`
  );

  populateSelect(
    packageId,
    packages,
    "Select Package",
    item => `${item.package_code || ""}${item.package_code && item.package_name ? " - " : ""}${item.package_name || ""}`
  );
}

function populateSelect(select, items, placeholder, labelFunction) {
  select.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = placeholder;
  select.appendChild(placeholderOption);

  items.forEach(item => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = labelFunction(item);
    select.appendChild(option);
  });
}

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
      `<tr><td colspan="13">No students found. Click “+ Add Student” to add the first student.</td></tr>`;

    showMessage("");
    return;
  }

  studentTable.innerHTML = students.map(student => `
    <tr>
      <td>${escapeHtml(student.student_code)}</td>
      <td>${escapeHtml(student.admission_number || "")}</td>
      <td><strong>${escapeHtml(student.full_name)}</strong></td>
      <td>${escapeHtml(formatDate(student.date_of_birth))}</td>
      <td>${escapeHtml(student.gender || "")}</td>
      <td>${escapeHtml(student.mobile || "")}</td>
      <td>${escapeHtml(getName(branchesMap, student.branch_id))}</td>
      <td>${escapeHtml(getName(coursesMap, student.course_id))}</td>
      <td>${escapeHtml(getName(instrumentsMap, student.instrument_id))}</td>
      <td>${escapeHtml(getName(teachersMap, student.teacher_id))}</td>
      <td>${escapeHtml(getName(packagesMap, student.package_id))}</td>
      <td>
        <span class="status ${student.status === "active" ? "active" : "inactive"}">
          ${escapeHtml(student.status || "")}
        </span>
      </td>
      <td>
        <div class="actions">
          <button class="secondary small-btn" data-action="edit" data-id="${student.id}">
            Edit
          </button>
          ${
            student.status === "active"
              ? `<button class="danger small-btn" data-action="deactivate" data-id="${student.id}">
                   Deactivate
                 </button>`
              : ""
          }
        </div>
      </td>
    </tr>
  `).join("");

  showMessage(`${students.length} student${students.length === 1 ? "" : "s"} found.`);
}

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
    const match = String(row.student_code || "").match(/^STU(\d+)$/i);

    if (match) {
      highest = Math.max(highest, Number(match[1]));
    }
  });

  return `STU${String(highest + 1).padStart(3, "0")}`;
}

function openAddModal() {
  studentForm.reset();

  editingId.value = "";
  modalTitle.textContent = "Add Student";

  showFormMessage("");

  status.value = "active";

  const today = new Date().toISOString().slice(0, 10);
  joiningDate.value = today;

  branchId.value = branches.length === 1 ? branches[0].id : "";

  studentModal.classList.remove("hidden");
}

function openEditModal(student) {
  editingId.value = student.id;
  modalTitle.textContent = "Edit Student";

  fullName.value = student.full_name || "";
  studentCode.value = student.student_code || "";
  admissionNumber.value = student.admission_number || "";
  dateOfBirth.value = student.date_of_birth || "";
  gender.value = student.gender || "";
  mobile.value = student.mobile || "";
  email.value = student.email || "";
  joiningDate.value = student.joining_date || "";
  status.value = student.status || "active";
  branchId.value = student.branch_id || "";
  courseId.value = student.course_id || "";
  instrumentId.value = student.instrument_id || "";
  teacherId.value = student.teacher_id || "";
  packageId.value = student.package_id || "";
  address.value = student.address || "";
  notes.value = student.notes || "";

  showFormMessage("");

  studentModal.classList.remove("hidden");
}

function closeStudentModal() {
  studentModal.classList.add("hidden");
  studentForm.reset();
  editingId.value = "";
  showFormMessage("");
}

async function saveStudent(event) {
  event.preventDefault();

  showFormMessage("Saving...");

  const name = fullName.value.trim();

  if (!name) {
    showFormMessage("Please enter the student's full name.", true);
    return;
  }

  if (!branchId.value) {
    showFormMessage("Please select a branch.", true);
    return;
  }

  let code = studentCode.value.trim();

  if (!code) {
    code = await generateStudentCode();
  }

  const payload = {
    student_code: code,
    admission_number: admissionNumber.value.trim() || null,
    full_name: name,
    date_of_birth: dateOfBirth.value || null,
    gender: gender.value || null,
    mobile: mobile.value.trim() || null,
    email: email.value.trim() || null,
    address: address.value.trim() || null,
    branch_id: branchId.value || null,
    course_id: courseId.value || null,
    instrument_id: instrumentId.value || null,
    teacher_id: teacherId.value || null,
    package_id: packageId.value || null,
    joining_date: joiningDate.value || null,
    status: status.value || "active",
    notes: notes.value.trim() || null
  };

  let result;

  if (editingId.value) {
    result = await supabase
      .from("students")
      .update(payload)
      .eq("id", editingId.value);
  } else {
    result = await supabase
      .from("students")
      .insert(payload);
  }

  if (result.error) {
    console.error(result.error);
    showFormMessage(result.error.message, true);
    return;
  }

  closeStudentModal();
  await loadStudents();

  showMessage(
    editingId.value
      ? "Student updated successfully."
      : "Student added successfully."
  );
}

async function deactivateStudent(id) {
  const student = students.find(item => item.id === id);

  if (!student) return;

  const confirmed = window.confirm(
    `Deactivate ${student.full_name}?`
  );

  if (!confirmed) return;

  showMessage("Deactivating student...");

  const { error } = await supabase
    .from("students")
    .update({ status: "inactive" })
    .eq("id", id);

  if (error) {
    console.error(error);
    showMessage(error.message, true);
    return;
  }

  await loadStudents();

  showMessage(`${student.full_name} has been deactivated.`);
}

studentTable.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  const student = students.find(item => item.id === id);

  if (!student) return;

  if (action === "edit") {
    openEditModal(student);
  }

  if (action === "deactivate") {
    deactivateStudent(id);
  }
});

addStudentBtn.addEventListener("click", openAddModal);
closeModal.addEventListener("click", closeStudentModal);
cancelBtn.addEventListener("click", closeStudentModal);

studentModal.addEventListener("click", event => {
  if (event.target === studentModal) {
    closeStudentModal();
  }
});

studentForm.addEventListener("submit", saveStudent);

async function init() {
  try {
    const user = await requireUser();

    if (!user) return;

    userEmail.textContent = user.email || "";

    wireLogout("logoutBtn");

    await loadMasterData();
    await loadStudents();

  } catch (error) {
    console.error(error);
    showMessage(error.message || "Unable to load student module.", true);
  }
}

init();
