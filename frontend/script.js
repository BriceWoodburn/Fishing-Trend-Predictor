const backendUrl = "https://castiq.onrender.com";
let allCatches = [];
let filteredCatches = [];
let currentPage = 1;
const itemsPerPage = 25;

/* -------------------- Element References -------------------- */
const catchForm = document.getElementById("catchForm");
const searchInput = document.getElementById("search-bar");
const editForm = document.getElementById("editForm");

/* -------------------- Load Catches -------------------- */
// Always load catches if the table exists
if (document.querySelector("#catchesTable")) {
  loadCatches();
}

/* -------------------- Catch Form Submission -------------------- */
if (catchForm) {
  catchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(catchForm);
    const catchData = Object.fromEntries(formData);

    // Default date/time if missing
    if (!catchData.date) catchData.date = new Date().toISOString().slice(0, 10);
    if (!catchData.time) catchData.time = new Date().toLocaleTimeString("en-GB", { hour12: false });

    try {
      const res = await fetch(`${backendUrl}/log-catch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catchData),
      });
      const result = await res.json();
      if (result.success) {
        catchForm.reset();
        await loadCatches();
      } else {
        alert("❌ Error logging catch: " + JSON.stringify(result));
      }
    } catch (err) {
      alert("❌ Network or server error: " + err.message);
    }
  });
}

/* -------------------- Load & Filter Catches -------------------- */
async function loadCatches(keepPage = false) {
  try {
    const res = await fetch(`${backendUrl}/catches`);
    const json = await res.json();
    allCatches = json.data || [];

    // Sort by date/time descending
    allCatches.sort((a, b) => {
      const dtA = new Date(`${a.date}T${a.time || "00:00"}`);
      const dtB = new Date(`${b.date}T${b.time || "00:00"}`);
      return dtB - dtA || b.id - a.id;
    });

    if (searchInput?.value) applyCatchFilter();
    else filteredCatches = [...allCatches];

    renderTablePage(keepPage ? currentPage : 1);
  } catch (err) {
    console.error("Failed to load catches:", err);
  }
}

/* -------------------- Search -------------------- */
if (searchInput) {
  searchInput.addEventListener("input", () => {
    applyCatchFilter();
    renderTablePage(1);
  });
}

function applyCatchFilter() {
  const keyword = searchInput?.value.toLowerCase().trim() || "";
  filteredCatches = allCatches.filter(c => {
    const date = c.date ? formatDate(c.date) : "";
    const time = c.time ? formatTime(c.time) : "";
    return date.toLowerCase().includes(keyword) ||
           time.toLowerCase().includes(keyword) ||
           Object.entries(c).some(([k,v]) => k!=="date" && k!=="time" && String(v || "").toLowerCase().includes(keyword));
  });
  filteredCatches.sort((a,b) => {
    const dtA = new Date(`${a.date}T${a.time || "00:00"}`);
    const dtB = new Date(`${b.date}T${b.time || "00:00"}`);
    return dtB - dtA || b.id - a.id;
  });
}

/* -------------------- Render Table & Pagination -------------------- */
function renderTablePage(page) {
  currentPage = page;
  const tbody = document.querySelector("#catchesTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  filteredCatches.slice(start, end).forEach(catchItem => {
    const tr = document.createElement("tr");
    const formattedDate = catchItem.date ? formatDate(catchItem.date) : "";
    const formattedTime = catchItem.time ? formatTime(catchItem.time) : "";

    tr.innerHTML = `
      <td>${formattedDate}</td>
      <td>${formattedTime}</td>
      <td>${escapeHtml(catchItem.location)}</td>
      <td>${escapeHtml(catchItem.species)}</td>
      <td>${catchItem.length_in ?? ""}</td>
      <td>${catchItem.weight_lbs ?? ""}</td>
      <td>${catchItem.temperature ?? ""}</td>
      <td>${escapeHtml(catchItem.bait || "")}</td>
      <td>
        <button class="edit" onclick='openEditForm(${JSON.stringify(catchItem)})'>Edit</button>
        <button class="delete" onclick='deleteCatch(${catchItem.id})'>Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updatePaginationControls();
}

function updatePaginationControls() {
  const totalPages = Math.ceil(filteredCatches.length / itemsPerPage);
  document.getElementById("pageInfo").textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages;
}

document.getElementById("prevPage")?.addEventListener("click", () => {
  if (currentPage > 1) { renderTablePage(currentPage - 1); scrollToTableTop(); }
});
document.getElementById("nextPage")?.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredCatches.length / itemsPerPage);
  if (currentPage < totalPages) { renderTablePage(currentPage + 1); scrollToTableTop(); }
});

function scrollToTableTop() {
  const tableSection = document.querySelector(".catches-wrap");
  if (tableSection) tableSection.scrollIntoView({ behavior: "smooth" });
}

/* -------------------- Delete Catch -------------------- */
async function deleteCatch(id) {
  try {
    const res = await fetch(`${backendUrl}/delete-catch/${id}`, { method: "DELETE" });
    const result = await res.json();
    if (result.success) loadCatches(true);
    else alert("Error deleting catch: " + (result.message || "Unknown error"));
  } catch (err) {
    alert("Network or server error: " + err.message);
  }
}

/* -------------------- Edit Modal -------------------- */
function openEditForm(catchItem) {
  const modal = document.getElementById("editModal");
  if (!modal) return;
  modal.setAttribute("aria-hidden", "false");
  modal.style.display = "flex";

  let cleanTime = catchItem.time || "";
  if (cleanTime.includes(":")) cleanTime = cleanTime.split(":").slice(0,2).join(":");

  document.getElementById("editId").value = catchItem.id;
  document.getElementById("editDate").value = catchItem.date || "";
  document.getElementById("editTime").value = cleanTime;
  document.getElementById("editLocation").value = catchItem.location || "";
  document.getElementById("editSpecies").value = catchItem.species || "";
  document.getElementById("editLength").value = catchItem.length_in ?? "";
  document.getElementById("editWeight").value = catchItem.weight_lbs ?? "";
  document.getElementById("editTemperature").value = catchItem.temperature ?? "";
  document.getElementById("editBait").value = catchItem.bait || "";
}

function closeEditForm() {
  const modal = document.getElementById("editModal");
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
  modal.style.display = "none";
}

if (editForm) {
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editId").value;
    const payload = {
      date: document.getElementById("editDate").value,
      time: document.getElementById("editTime").value,
      location: document.getElementById("editLocation").value,
      species: document.getElementById("editSpecies").value,
      length_in: parseFloat(document.getElementById("editLength").value) || 0,
      weight_lbs: parseFloat(document.getElementById("editWeight").value) || 0,
      temperature: parseFloat(document.getElementById("editTemperature").value) || 0,
      bait: document.getElementById("editBait").value
    };
    try {
      const res = await fetch(`${backendUrl}/edit-catch/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        alert(`Update failed: ${res.status}`);
      } else {
        closeEditForm();
        await loadCatches(true);
      }
    } catch (err) {
      alert("Network error — see console.");
      console.error(err);
    }
  });
}

// Close modal with Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeEditForm();
});

/* -------------------- Utilities -------------------- */
function escapeHtml(text = "") {
  return String(text).replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}/${year}`;
}

function formatTime(timeString) {
  if (!timeString) return "";
  let [hour, minute] = timeString.split(":").map(Number);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute.toString().padStart(2,"0")} ${ampm}`;
}
