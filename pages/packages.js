import { supabase } from "./supabase.js";
import { requireUser, wireLogout } from "./auth.js";

const packageTable = document.getElementById("packageTable");
const packageMessage = document.getElementById("packageMessage");
const packageModal = document.getElementById("packageModal");
const modalTitle = document.getElementById("modalTitle");
const packageForm = document.getElementById("packageForm");
const formMessage = document.getElementById("formMessage");

const editingId = document.getElementById("editingId");
const packageCode = document.getElementById("packageCode");
const packageName = document.getElementById("packageName");
const description = document.getElementById("description");
const durationMonths = document.getElementById("durationMonths");
const classesPerMonth = document.getElementById("classesPerMonth");
const fee = document.getElementById("fee");
const discountPercent = document.getElementById("discountPercent");
const status = document.getElementById("status");

const addPackageBtn = document.getElementById("addPackageBtn");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const userEmail = document.getElementById("userEmail");

const regularFeePreview = document.getElementById("regularFeePreview");
const discountPreview = document.getElementById("discountPreview");
const discountAmountPreview = document.getElementById("discountAmountPreview");
const finalFeePreview = document.getElementById("finalFeePreview");

let packages = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2
  })}`;
}

function calculateFinalFee(baseFee, discount) {
  const feeAmount = Number(baseFee || 0);
  const discountAmount = Number(discount || 0);

  return feeAmount - (feeAmount * discountAmount / 100);
}

function updateFeePreview() {
  const baseFee = Number(fee.value || 0);
  const discount = Number(discountPercent.value || 0);

  const discountAmount = baseFee * discount / 100;
  const finalFee = calculateFinalFee(baseFee, discount);

  regularFeePreview.textContent = formatCurrency(baseFee);
  discountPreview.textContent = `${discount}%`;
  discountAmountPreview.textContent = formatCurrency(discountAmount);
  finalFeePreview.textContent = formatCurrency(finalFee);
}

function showMessage(message, isError = false) {
  packageMessage.textContent = message || "";
  packageMessage.className = isError
    ? "message error"
    : "message";
}

function showFormMessage(message, isError = false) {
  formMessage.textContent = message || "";
  formMessage.className = isError
    ? "message error"
    : "message";
}

async function loadPackages() {
  showMessage("Loading packages...");

  const { data, error } = await supabase
    .from("packages")
    .select(`
      id,
      package_code,
      package_name,
      description,
      duration_months,
      classes_per_month,
      fee,
      discount_percent,
      status,
      created_at
    `)
    .order("created_at");

  if (error) {
    console.error(error);

    packageTable.innerHTML =
      `<tr><td colspan="10">Unable to load packages.</td></tr>`;

    showMessage(error.message, true);
    return;
  }

  packages = data || [];

  renderPackages();
}

function renderPackages() {
  if (!packages.length) {
    packageTable.innerHTML =
      `<tr><td colspan="10">No packages found. Click “+ Add Package” to create one.</td></tr>`;

    showMessage("");
    return;
  }

  packageTable.innerHTML = packages.map(pkg => {
    const baseFee = Number(pkg.fee || 0);
    const discount = Number(pkg.discount_percent || 0);
    const discountAmount = baseFee * discount / 100;
    const finalFee = baseFee - discountAmount;

    return `
      <tr>
        <td>${escapeHtml(pkg.package_code)}</td>

        <td>
          <strong>${escapeHtml(pkg.package_name)}</strong>
        </td>

        <td>
          ${escapeHtml(pkg.description || "")}
        </td>

        <td>
          ${escapeHtml(pkg.duration_months || "")} month${Number(pkg.duration_months) === 1 ? "" : "s"}
        </td>

        <td>
          ${escapeHtml(pkg.classes_per_month || "")}
        </td>

        <td>
          ${formatCurrency(baseFee)}
        </td>

        <td>
          ${escapeHtml(discount)}%
        </td>

        <td>
          <strong>${formatCurrency(finalFee)}</strong>
        </td>

        <td>
          <span class="status ${pkg.status === "active" ? "active" : "inactive"}">
            ${escapeHtml(pkg.status || "")}
          </span>
        </td>

        <td>
          <div class="actions">

            <button
              class="secondary small-btn"
              data-action="edit"
              data-id="${pkg.id}"
            >
              Edit
            </button>

            ${
              pkg.status === "active"
                ? `
                  <button
                    class="danger small-btn"
                    data-action="deactivate"
                    data-id="${pkg.id}"
                  >
                    Deactivate
                  </button>
                `
                : ""
            }

          </div>
        </td>
      </tr>
    `;
  }).join("");

  showMessage(
    `${packages.length} package${packages.length === 1 ? "" : "s"} found.`
  );
}

function openAddModal() {
  packageForm.reset();

  editingId.value = "";
  modalTitle.textContent = "Add Package";

  durationMonths.value = "3";
  classesPerMonth.value = "20";
  discountPercent.value = "0";
  status.value = "active";

  showFormMessage("");
  updateFeePreview();

  packageModal.classList.remove("hidden");
}

function openEditModal(pkg) {
  editingId.value = pkg.id;
  modalTitle.textContent = "Edit Package";

  packageCode.value = pkg.package_code || "";
  packageName.value = pkg.package_name || "";
  description.value = pkg.description || "";
  durationMonths.value = pkg.duration_months || "";
  classesPerMonth.value = pkg.classes_per_month || "";
  fee.value = pkg.fee || "";
  discountPercent.value = pkg.discount_percent || 0;
  status.value = pkg.status || "active";

  showFormMessage("");
  updateFeePreview();

  packageModal.classList.remove("hidden");
}

function closePackageModal() {
  packageModal.classList.add("hidden");
  packageForm.reset();
  editingId.value = "";
  showFormMessage("");
}

async function savePackage(event) {
  event.preventDefault();

  showFormMessage("Saving...");

  const code = packageCode.value.trim();
  const name = packageName.value.trim();
  const packageDescription = description.value.trim();

  const duration = Number(durationMonths.value);
  const classes = Number(classesPerMonth.value);
  const baseFee = Number(fee.value);
  const discount = Number(discountPercent.value);

  if (!code) {
    showFormMessage("Please enter a package code.", true);
    return;
  }

  if (!name) {
    showFormMessage("Please enter a package name.", true);
    return;
  }

  if (!duration || duration < 1) {
    showFormMessage("Duration must be at least 1 month.", true);
    return;
  }

  if (!classes || classes < 1) {
    showFormMessage("Classes per month must be at least 1.", true);
    return;
  }

  if (baseFee < 0) {
    showFormMessage("Fee cannot be negative.", true);
    return;
  }

  if (discount < 0 || discount > 100) {
    showFormMessage("Discount must be between 0% and 100%.", true);
    return;
  }

  const payload = {
    package_code: code,
    package_name: name,
    description: packageDescription || null,
    duration_months: duration,
    classes_per_month: classes,
    fee: baseFee,
    discount_percent: discount,
    status: status.value || "active"
  };

  let result;

  if (editingId.value) {
    result = await supabase
      .from("packages")
      .update(payload)
      .eq("id", editingId.value);
  } else {
    result = await supabase
      .from("packages")
      .insert(payload);
  }

  if (result.error) {
    console.error(result.error);
    showFormMessage(result.error.message, true);
    return;
  }

  closePackageModal();

  await loadPackages();

  showMessage(
    editingId.value
      ? "Package updated successfully."
      : "Package added successfully."
  );
}

async function deactivatePackage(id) {
  const pkg = packages.find(item => item.id === id);

  if (!pkg) return;

  const confirmed = window.confirm(
    `Deactivate ${pkg.package_name}?`
  );

  if (!confirmed) return;

  showMessage("Deactivating package...");

  const { error } = await supabase
    .from("packages")
    .update({ status: "inactive" })
    .eq("id", id);

  if (error) {
    console.error(error);
    showMessage(error.message, true);
    return;
  }

  await loadPackages();

  showMessage(`${pkg.package_name} has been deactivated.`);
}

packageTable.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  const pkg = packages.find(item => item.id === id);

  if (!pkg) return;

  if (action === "edit") {
    openEditModal(pkg);
  }

  if (action === "deactivate") {
    deactivatePackage(id);
  }
});

addPackageBtn.addEventListener("click", openAddModal);

closeModal.addEventListener("click", closePackageModal);

cancelBtn.addEventListener("click", closePackageModal);

packageModal.addEventListener("click", event => {
  if (event.target === packageModal) {
    closePackageModal();
  }
});

fee.addEventListener("input", updateFeePreview);

discountPercent.addEventListener("input", updateFeePreview);

packageForm.addEventListener("submit", savePackage);

async function init() {
  try {
    const user = await requireUser();

    if (!user) return;

    userEmail.textContent = user.email || "";

    wireLogout("logoutBtn");

    await loadPackages();

  } catch (error) {
    console.error(error);

    showMessage(
      error.message || "Unable to load package management.",
      true
    );
  }
}

init();
