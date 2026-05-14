const DOCTRINE_TRACK_DEFAULTS = {
  land: ["", "", "", ""],
  navy: ["", "", "", ""],
  air: ["", "", "", ""]
};

const tableDefinitions = {
  focusTable: ["order", "focus", "timing", "notes"],
  constructionTable: ["order", "what", "where", "when", "notes"],
  productionTable: ["order", "line", "factories", "when", "notes"],
  ppTable: ["order", "item", "pp", "timing", "notes"],
  researchSlot1: ["order", "tech", "when", "notes", "techId"],
  researchSlot2: ["order", "tech", "when", "notes", "techId"],
  researchSlot3: ["order", "tech", "when", "notes", "techId"],
  researchSlot4: ["order", "tech", "when", "notes", "techId"],
  researchSlot5: ["order", "tech", "when", "notes", "techId"],
  researchSlot6: ["order", "tech", "when", "notes", "techId"],
  researchSlot7: ["order", "tech", "when", "notes", "techId"],
  researchSlot8: ["order", "tech", "when", "notes", "techId"],
  templateTable: ["name", "role", "battalions", "support", "combatWidth", "timing", "notes"]
};

function autoGrow(element) {
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

function syncRowHeight(textarea) {
  const row = textarea.closest("tr");
  if (!row) return;
  const textareas = [...row.querySelectorAll("textarea")];

  textareas.forEach(t => { t.style.height = "auto"; });
  const maxHeight = Math.max(...textareas.map(t => t.scrollHeight), 42);
  textareas.forEach(t => { t.style.height = `${maxHeight}px`; });
}

function bindAutoGrow(textarea) {
  textarea.classList.add("auto-grow");
  textarea.addEventListener("input", () => {
    if (textarea.closest("tr")) syncRowHeight(textarea);
    else autoGrow(textarea);
  });

  requestAnimationFrame(() => {
    if (textarea.closest("tr")) syncRowHeight(textarea);
    else autoGrow(textarea);
  });
}

document.querySelectorAll(".auto-grow").forEach(bindAutoGrow);


const researchState = {
  techs: [],
  techByName: new Map(),
  techById: new Map(),
  loadedMod: "",
  startingTechsByCountry: {},
  currentStartingTechIds: new Set()
};

async function loadStartingTechDataForMod(modName) {
  researchState.startingTechsByCountry = {};
  researchState.currentStartingTechIds = new Set();

  if (modName !== "FUWG") return;

  try {
    const response = await fetch("./data/fuwg/starting_techs.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load data/fuwg/starting_techs.json (${response.status})`);
    const data = await response.json();
    researchState.startingTechsByCountry = data.countries || {};
  } catch (error) {
    console.warn("Could not load FUWG starting tech data:", error);
  }
}

function setCurrentCountryStartingTechs(tag) {
  const ids = researchState.startingTechsByCountry?.[tag] || [];
  researchState.currentStartingTechIds = new Set(ids);
  updateResearchStartingTechStatus(tag);
  populateResearchOptions();
  document.querySelectorAll('input.research-tech-input').forEach(updateResearchInputMatch);
}

function updateResearchStartingTechStatus(tag = "") {
  const status = document.getElementById("researchDataStatus");
  if (!status) return;

  const count = researchState.currentStartingTechIds?.size || 0;
  if (researchState.loadedMod === "FUWG") {
    status.textContent = count
      ? `Loaded ${researchState.techs.length} FUWG research options. ${tag} starts with ${count} researched tech(s). Autocomplete hides already-known or prerequisite-locked techs.`
      : `Loaded ${researchState.techs.length} FUWG research options. No starting tech list loaded for ${tag || "this country"}.`;
  }
}

function isResearchAlreadyKnown(techId) {
  return !!techId && researchState.currentStartingTechIds?.has(techId);
}

async function loadResearchDataForMod(modName) {
  await loadStartingTechDataForMod(modName);
  const list = document.getElementById("researchOptionsList");
  const status = document.getElementById("researchDataStatus");
  if (list) list.innerHTML = "";

  researchState.techs = [];
  researchState.techByName = new Map();
  researchState.techById = new Map();
  researchState.loadedMod = "";
  researchState.currentStartingTechIds = new Set();

  if (modName !== "FUWG") {
    if (status) status.textContent = "Research autocomplete is manual unless FUWG is selected.";
    return;
  }

  try {
    const response = await fetch("./data/fuwg/research.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load data/fuwg/research.json (${response.status})`);
    const data = await response.json();

    researchState.techs = data.techs || [];
    researchState.loadedMod = "FUWG";

    researchState.techs.forEach((tech) => {
      researchState.techById.set(tech.id, tech);
      researchState.techByName.set(String(tech.name || "").toLowerCase(), tech);
    });

    populateResearchOptions();

    if (status) status.textContent = `Loaded ${researchState.techs.length} FUWG research options. Select a country to load starting techs.`;
  } catch (error) {
    if (status) status.textContent = `Could not load FUWG research data: ${error.message}`;
  }
}


function getSelectedResearchTechIdsBeforeInput(targetInput = null) {
  const known = new Set(researchState.currentStartingTechIds || []);
  const inputs = Array.from(document.querySelectorAll('input.research-tech-input'));

  for (const input of inputs) {
    if (targetInput && input === targetInput) break;

    const value = String(input.value || "").trim().toLowerCase();
    const matched = researchState.techByName.get(value);
    const id = input.dataset.techId || matched?.id || "";
    if (id) known.add(id);
  }

  return known;
}

function areResearchPrereqsMet(tech, knownIds) {
  const reqs = tech?.requires || [];
  if (!reqs.length) return true;
  return reqs.every((id) => knownIds.has(id));
}

function getAvailableResearchTechsForInput(targetInput = null) {
  const knownIds = getSelectedResearchTechIdsBeforeInput(targetInput);

  return researchState.techs.filter((tech) => {
    if (knownIds.has(tech.id)) return false;
    return areResearchPrereqsMet(tech, knownIds);
  });
}

function populateResearchOptions(targetInput = null) {
  const list = document.getElementById("researchOptionsList");
  if (!list) return;

  list.innerHTML = "";

  getAvailableResearchTechsForInput(targetInput).forEach((tech) => {
    const option = document.createElement("option");
    option.value = tech.name;
    list.appendChild(option);
  });

  document.querySelectorAll('input.research-tech-input').forEach(updateResearchInputMatch);
}

function updateResearchInputMatch(input) {
  if (!input) return;

  input.classList.remove("focus-known", "focus-unknown");

  const value = String(input.value || "").trim().toLowerCase();
  if (!value || !researchState.techs.length) {
    input.dataset.techId = input.dataset.techId || "";
    input.title = "";
    return;
  }

  const tech = researchState.techByName.get(value);
  if (tech) {
    input.dataset.techId = tech.id;

    const knownBefore = getSelectedResearchTechIdsBeforeInput(input);
    const missing = (tech.requires || []).filter((id) => !knownBefore.has(id));
    const missingNames = missing.map((id) => researchState.techById.get(id)?.name || id);

    if (isResearchAlreadyKnown(tech.id)) {
      input.title = `Already researched at game start${tech.category ? ` | Category: ${tech.category}` : ""}`;
      input.classList.add("focus-unknown");
    } else if (missing.length) {
      input.title = `Missing prerequisite(s): ${missingNames.join(", ")}`;
      input.classList.add("focus-unknown");
    } else {
      input.title = tech.category ? `Category: ${tech.category}` : "";
      input.classList.add("focus-known");
    }
  } else {
    input.dataset.techId = "";
    input.title = "No exact match in loaded research data.";
    input.classList.add("focus-unknown");
  }
}

const smartFocusState = {
  countries: [],
  activeTree: null,
  focusByName: new Map(),
  focusById: new Map()
};

async function initialiseSmartFocusControls() {
  const modSelect = document.getElementById("patchInput");
  const countrySelect = document.getElementById("countrySelect");
  const manualCountryInput = document.getElementById("countryInput");

  if (!modSelect || !countrySelect || !manualCountryInput) return;

  function showManualCountry() {
    manualCountryInput.style.display = "";
    manualCountryInput.disabled = false;
    countrySelect.style.display = "none";
    countrySelect.disabled = true;
  }

  function showFuwgCountry() {
    manualCountryInput.style.display = "none";
    manualCountryInput.disabled = true;
    countrySelect.style.display = "";
    countrySelect.disabled = false;
  }

  function resetCountrySelect(message = "Select country/tree...") {
    countrySelect.innerHTML = `<option value="">${message}</option>`;
  }

  async function handleModChange() {
    const selectedMod = String(modSelect.value || "").trim();
    loadResearchDataForMod(selectedMod);

    if (selectedMod === "FUWG") {
      showFuwgCountry();
      await loadSmartFocusCountries();
      return;
    }

    showManualCountry();
    resetCountrySelect("Select FUWG first");
    clearSmartFocusData();
    setFocusDataStatus(selectedMod === "Vanilla"
      ? "Vanilla focus data is not added yet. Manual focus entry is active."
      : "Manual focus entry is active.");
  }

  modSelect.addEventListener("change", handleModChange);

  countrySelect.addEventListener("change", async () => {
    if (String(modSelect.value || "").trim() !== "FUWG") return;

    const tag = String(countrySelect.value || "").trim();
    if (!tag) {
      clearSmartFocusData();
      setFocusDataStatus("Choose a FUWG country/tree to load focus data.");
      return;
    }

    await loadSmartFocusTree(tag);
  });

  await handleModChange();
}

function setFocusDataStatus(message) {
  const status = document.getElementById("focusDataStatus");
  if (status) status.textContent = message;
}

function clearSmartFocusData() {
  smartFocusState.activeTree = null;
  smartFocusState.focusByName = new Map();
  smartFocusState.focusById = new Map();
  const list = document.getElementById("focusOptionsList");
  if (list) list.innerHTML = "";
  document.querySelectorAll('input[data-field="focus"]').forEach(updateFocusInputMatch);
  updateAvailableFocusOptions();
  validateFocusOrder();
  validateFocusOrder();
}

async function loadSmartFocusCountries() {
  const countrySelect = document.getElementById("countrySelect");
  if (!countrySelect) return;

  countrySelect.disabled = false;
  countrySelect.innerHTML = '<option value="">Loading FUWG countries...</option>';
  setFocusDataStatus("Loading FUWG country list...");

  try {
    const response = await fetch("./data/fuwg/countries.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load data/fuwg/countries.json (${response.status})`);

    const data = await response.json();
    smartFocusState.countries = data.countries || [];

    countrySelect.innerHTML = '<option value="">Choose country/tree...</option>';

    smartFocusState.countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country.tag;
      option.textContent = `${country.name} (${country.tag})`;
      countrySelect.appendChild(option);
    });

    countrySelect.disabled = false;

    if (!smartFocusState.countries.length) {
      countrySelect.innerHTML = '<option value="">No FUWG countries found</option>';
      countrySelect.disabled = true;
      setFocusDataStatus("FUWG data loaded, but no countries were found.");
      return;
    }

    setFocusDataStatus(`Loaded ${smartFocusState.countries.length} FUWG country/tree entries. Choose a country/tree from the top Country dropdown.`);
  } catch (error) {
    countrySelect.innerHTML = '<option value="">Could not load FUWG data</option>';
    countrySelect.disabled = true;
    setFocusDataStatus(`Could not load FUWG countries: ${error.message}. Check that data/fuwg/countries.json exists next to index.html.`);
  }
}

async function loadSmartFocusTree(tag) {
  setFocusDataStatus(`Loading FUWG focus tree for ${tag}...`);

  try {
    const response = await fetch(`./data/fuwg/focus_trees/${encodeURIComponent(tag)}.json`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load ${tag}.json (${response.status})`);

    const tree = await response.json();
    smartFocusState.activeTree = tree;
    smartFocusState.focusByName = new Map();
    smartFocusState.focusById = new Map();

    const list = document.getElementById("focusOptionsList");
    list.innerHTML = "";

    (tree.focuses || []).forEach((focus) => {
      smartFocusState.focusById.set(focus.id, focus);
      smartFocusState.focusByName.set(focus.name.toLowerCase(), focus);
      // Keep ID lookup internal only. Do not add IDs to the visible datalist.
      smartFocusState.focusById.set(focus.id, focus);
    });

    updateAvailableFocusOptions();

    setValue("patchInput", "FUWG");
    setValue("countryInput", `${tree.country} (${tree.tag})`);
    setCurrentCountryStartingTechs(tree.tag);

    document.querySelectorAll('input[data-field="focus"]').forEach(updateFocusInputMatch);
    validateFocusOrder();
    setFocusDataStatus(`Loaded ${tree.country} (${tree.tag}) — ${tree.focusCount} focuses. Focus rows now show only currently available FUWG focus options.`);
  } catch (error) {
    setFocusDataStatus(`Could not load FUWG focus tree: ${error.message}`);
  }
}


function getSelectedFocusIdsBeforeRow(targetInput = null) {
  const selected = new Set();
  const rows = [...document.querySelectorAll("#focusTable tbody tr")];

  for (const row of rows) {
    const input = row.querySelector('input[data-field="focus"]');
    if (targetInput && input === targetInput) break;

    const id = input?.dataset.focusId || "";
    if (id) selected.add(id);
  }

  return selected;
}

function isFocusAvailable(focus, selectedIds) {
  if (!focus) return false;
  if (selectedIds.has(focus.id)) return false;

  const prereqs = focus.prerequisites || [];
  if (prereqs.some((focusId) => !selectedIds.has(focusId))) return false;

  const exclusive = focus.mutuallyExclusive || [];
  if (exclusive.some((focusId) => selectedIds.has(focusId))) return false;

  return true;
}

function updateAvailableFocusOptions(targetInput = null) {
  const list = document.getElementById("focusOptionsList");
  if (!list) return;

  list.innerHTML = "";

  if (!smartFocusState.activeTree) return;

  const selectedIds = getSelectedFocusIdsBeforeRow(targetInput);
  const currentId = targetInput?.dataset.focusId || "";

  const available = (smartFocusState.activeTree.focuses || [])
    .filter((focus) => isFocusAvailable(focus, selectedIds) || focus.id === currentId)
    .sort((a, b) => {
      const ay = Number.isFinite(a.y) ? a.y : 9999;
      const by = Number.isFinite(b.y) ? b.y : 9999;
      const ax = Number.isFinite(a.x) ? a.x : 9999;
      const bx = Number.isFinite(b.x) ? b.x : 9999;
      return ay - by || ax - bx || a.name.localeCompare(b.name);
    });

  available.forEach((focus) => {
    const option = document.createElement("option");
    option.value = focus.name;
    // Important: no label or textContent here, otherwise browsers may show the internal ID.
    list.appendChild(option);
  });

  setFocusDataStatus(`Loaded ${smartFocusState.activeTree.country} (${smartFocusState.activeTree.tag}). Showing ${available.length} currently available focus option(s) for the selected row.`);
}

function updateFocusInputMatch(input) {
  if (!input) return;

  const value = String(input.value || "").trim().toLowerCase();
  const focus = smartFocusState.focusByName.get(value);

  input.classList.remove("focus-known", "focus-unknown");

  if (!value || !smartFocusState.activeTree) {
    input.dataset.focusId = input.dataset.focusId || "";
    return;
  }

  if (focus) {
    input.dataset.focusId = focus.id;
    input.title = focus.prerequisites?.length
      ? `Requires: ${focus.prerequisites.map(readableFocusName).join(", ")}`
      : "";
    input.classList.add("focus-known");
  } else {
    input.dataset.focusId = "";
    input.title = "No exact match in loaded FUWG focus tree.";
    input.classList.add("focus-unknown");
  }
}

function readableFocusName(focusId) {
  const focus = smartFocusState.focusById.get(focusId);
  return focus?.name || focusId;
}

function getFocusRowsForValidation() {
  return [...document.querySelectorAll("#focusTable tbody tr")].map((row, index) => {
    const input = row.querySelector('input[data-field="focus"]');
    const orderInput = row.querySelector('[data-field="order"]');
    const name = input?.value?.trim() || "";
    const id = input?.dataset.focusId || "";
    const focus = id ? smartFocusState.focusById.get(id) : null;

    return {
      row,
      index,
      order: orderInput?.value?.trim() || String(index + 1),
      name,
      id,
      focus
    };
  });
}

function setFocusValidationStatus(kind, label, messages) {
  const badge = document.getElementById("focusValidationBadge");
  const box = document.getElementById("focusValidationMessages");

  if (badge) {
    badge.className = `focus-validation-badge ${kind}`;
    badge.textContent = label;
  }

  if (!box) return;

  if (!messages.length) {
    box.innerHTML = "";
    return;
  }

  box.innerHTML = messages.map((message) => {
    const cls = message.kind || kind;
    return `<div class="focus-validation-message ${cls}">${message.text}</div>`;
  }).join("");
}

function validateFocusOrder() {
  const rows = getFocusRowsForValidation();

  rows.forEach(({ row }) => {
    row.classList.remove("focus-row-warning", "focus-row-ok");
  });

  if (!smartFocusState.activeTree) {
    setFocusValidationStatus("neutral", "Manual / not checked", [
      { kind: "neutral", text: "Load FUWG focus data to check prerequisites and mutually exclusive focuses." }
    ]);
    return;
  }

  const selectedById = new Map();
  const selectedOrder = [];
  const warnings = [];

  for (const current of rows) {
    if (!current.name) continue;

    if (!current.id || !current.focus) {
      current.row.classList.add("focus-row-warning");
      warnings.push({
        kind: "warn",
        text: `Row ${current.order}: "${escapeHtml(current.name)}" does not exactly match a loaded FUWG focus.`
      });
      continue;
    }

    if (selectedById.has(current.id)) {
      current.row.classList.add("focus-row-warning");
      const previous = selectedById.get(current.id);
      warnings.push({
        kind: "warn",
        text: `Row ${current.order}: "${escapeHtml(current.focus.name)}" is already selected earlier at row ${previous.order}.`
      });
    }

    const missingPrereqs = (current.focus.prerequisites || []).filter((focusId) => !selectedById.has(focusId));
    if (missingPrereqs.length) {
      current.row.classList.add("focus-row-warning");
      warnings.push({
        kind: "warn",
        text: `Row ${current.order}: "${escapeHtml(current.focus.name)}" may require earlier focus(es): ${missingPrereqs.map(readableFocusName).map(escapeHtml).join(", ")}.`
      });
    }

    const exclusivePicked = (current.focus.mutuallyExclusive || []).filter((focusId) => selectedById.has(focusId));
    if (exclusivePicked.length) {
      current.row.classList.add("focus-row-warning");
      warnings.push({
        kind: "warn",
        text: `Row ${current.order}: "${escapeHtml(current.focus.name)}" is mutually exclusive with already selected focus(es): ${exclusivePicked.map(readableFocusName).map(escapeHtml).join(", ")}.`
      });
    }

    if (!current.row.classList.contains("focus-row-warning")) {
      current.row.classList.add("focus-row-ok");
    }

    selectedById.set(current.id, current);
    selectedOrder.push(current.id);
  }

  if (!selectedOrder.length) {
    setFocusValidationStatus("neutral", "Ready", [
      { kind: "neutral", text: `Loaded ${smartFocusState.activeTree.country} (${smartFocusState.activeTree.tag}). Add focuses to begin checking the order.` }
    ]);
    return;
  }

  if (!warnings.length) {
    setFocusValidationStatus("ok", "No issues found", [
      { kind: "ok", text: `Checked ${selectedOrder.length} selected focus(es). No missing prerequisites or mutually exclusive conflicts found.` }
    ]);
    return;
  }

  setFocusValidationStatus("warn", `${warnings.length} issue${warnings.length === 1 ? "" : "s"} found`, warnings);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


initialiseSmartFocusControls();

document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(button.dataset.tab).classList.add("active");

    document.querySelectorAll(`#${button.dataset.tab} textarea`).forEach(t => {
      if (t.closest("tr")) syncRowHeight(t);
      else autoGrow(t);
    });
  });
});

function addRow(tableId, values = {}) {
  const table = document.getElementById(tableId);
  const tbody = table.querySelector("tbody");
  const fields = tableDefinitions[tableId];
  const tr = document.createElement("tr");

  fields.forEach((field) => {
    const td = document.createElement("td");

    if (tableId === "focusTable" && field === "focus") {
      const input = document.createElement("input");
      input.type = "text";
      input.spellcheck = false;
      input.className = "focus-search-input";
      input.setAttribute("list", "focusOptionsList");
      input.value = values[field] || "";
      input.dataset.field = field;
      input.dataset.focusId = values.focusId || "";
      input.addEventListener("focus", () => updateAvailableFocusOptions(input));
      input.addEventListener("click", () => updateAvailableFocusOptions(input));
      input.addEventListener("input", () => {
        updateFocusInputMatch(input);
        updateAvailableFocusOptions(input);
        validateFocusOrder();
      });
      td.appendChild(input);
      tr.appendChild(td);
      requestAnimationFrame(() => updateFocusInputMatch(input));
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.rows = 1;
    textarea.spellcheck = false;

    if (field === "order") textarea.value = values[field] || String(tbody.children.length + 1);
    else textarea.value = values[field] || "";

    textarea.dataset.field = field;
    bindAutoGrow(textarea);
    td.appendChild(textarea);
    tr.appendChild(td);
  });

  const actionTd = document.createElement("td");
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "X";
  deleteButton.className = "delete-btn";
  deleteButton.title = "Delete row";
  deleteButton.addEventListener("click", () => {
    tr.remove();
    renumber(tableId);
    if (tableId === "focusTable") { updateAvailableFocusOptions(); validateFocusOrder(); }
  });
  actionTd.appendChild(deleteButton);
  tr.appendChild(actionTd);

  tbody.appendChild(tr);
  requestAnimationFrame(() => tr.querySelectorAll("textarea").forEach(syncRowHeight));
  if (tableId === "focusTable") { updateAvailableFocusOptions(); validateFocusOrder(); }
}


function addResearchRow(slot, values = {}) {
  addRow(`researchSlot${slot}`, values);
}

function getResearchData() {
  const slots = {};
  for (let slot = 1; slot <= 8; slot++) {
    slots[`slot${slot}`] = tableToData(`researchSlot${slot}`);
  }
  return slots;
}

function setResearchData(research) {
  for (let slot = 1; slot <= 8; slot++) {
    const tableId = `researchSlot${slot}`;
    const newFormatRows = research?.[`slot${slot}`];

    // Backwards compatibility with older app saves, where research was one long list with a slot field.
    const oldFormatRows = Array.isArray(research)
      ? research
          .filter((row) => String(row.slot || "").trim() === String(slot))
          .map((row, index) => ({
            order: row.order || String(index + 1),
            tech: row.tech || "",
            when: row.timing || row.when || "",
            notes: row.notes || ""
          }))
      : [];

    setTableData(tableId, newFormatRows || oldFormatRows || []);
  }
}


function renumber(tableId) {
  const rows = document.querySelectorAll(`#${tableId} tbody tr`);
  rows.forEach((row, index) => {
    const orderInput = row.querySelector('textarea[data-field="order"], input[data-field="order"]');
    if (orderInput) orderInput.value = String(index + 1);
    row.querySelectorAll("textarea").forEach(syncRowHeight);
  });
}

function tableToData(tableId) {
  const rows = [...document.querySelectorAll(`#${tableId} tbody tr`)];
  return rows.map(row => {
    const obj = {};
    row.querySelectorAll("textarea, input").forEach(input => {
      if (!input.dataset.field) return;
      obj[input.dataset.field] = input.value;
      if (input.dataset.field === "tech") {
        const matchedTech = researchState.techByName.get(String(input.value || "").trim().toLowerCase());
        obj.techId = input.dataset.techId || matchedTech?.id || "";
      }
      if (tableId === "focusTable" && input.dataset.field === "focus") {
        const matchedFocus = smartFocusState.focusByName.get(String(input.value || "").trim().toLowerCase());
        obj.focusId = input.dataset.focusId || matchedFocus?.id || "";
      }
    });
    return obj;
  });
}

function setTableData(tableId, rows) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = "";
  rows.forEach(row => addRow(tableId, row));
  renumber(tableId);
}

function getValue(id) {
  return document.getElementById(id).value;
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  if (el.tagName === "SELECT") {
    const wanted = value || "";
    const hasOption = [...el.options].some((option) => option.value === wanted || option.text === wanted);
    el.value = hasOption ? wanted : "";
    return;
  }

  el.value = value || "";
  if (typeof autoGrow === "function") autoGrow(el);
}


function getSelectValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function setSelectValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  const wanted = value || "";
  const hasOption = [...el.options].some((option) => option.value === wanted || option.text === wanted);

  if (hasOption) {
    el.value = wanted;
  } else if (wanted) {
    el.value = "Other / Modded";
  } else {
    el.value = "";
  }
}

function getDoctrinesData() {
  return {
    land: {
      grand: getSelectValue("landGrandDoctrine"),
      sub: [1, 2, 3, 4].map((n) => getSelectValue(`landSubDoctrine${n}`)),
      notes: getValue("landDoctrineNotes")
    },
    navy: {
      grand: getSelectValue("navyGrandDoctrine"),
      sub: [1, 2, 3, 4].map((n) => getSelectValue(`navySubDoctrine${n}`)),
      notes: getValue("navyDoctrineNotes")
    },
    air: {
      grand: getSelectValue("airGrandDoctrine"),
      sub: [1, 2, 3, 4].map((n) => getSelectValue(`airSubDoctrine${n}`)),
      notes: getValue("airDoctrineNotes")
    }
  };
}

function setDoctrinesData(doctrines = {}) {
  setSelectValue("landGrandDoctrine", doctrines.land?.grand || doctrines.army?.main || "");
  setSelectValue("navyGrandDoctrine", doctrines.navy?.grand || doctrines.navy?.main || "");
  setSelectValue("airGrandDoctrine", doctrines.air?.grand || doctrines.air?.main || "");

  for (let i = 1; i <= 4; i++) {
    setSelectValue(`landSubDoctrine${i}`, doctrines.land?.sub?.[i - 1] || doctrines.army?.path?.[i - 1] || "");
    setSelectValue(`navySubDoctrine${i}`, doctrines.navy?.sub?.[i - 1] || doctrines.navy?.path?.[i - 1] || "");
    setSelectValue(`airSubDoctrine${i}`, doctrines.air?.sub?.[i - 1] || doctrines.air?.path?.[i - 1] || "");
  }

  setValue("landDoctrineNotes", doctrines.land?.notes || doctrines.army?.notes || "");
  setValue("navyDoctrineNotes", doctrines.navy?.notes || "");
  setValue("airDoctrineNotes", doctrines.air?.notes || "");
}

function getSpecialForcesData() {
  return {
    mountaineer: {
      path: getValue("sfMountaineerPath"),
      notes: getValue("sfMountaineerNotes")
    },
    marine: {
      path: getValue("sfMarinePath"),
      notes: getValue("sfMarineNotes")
    },
    paratrooper: {
      path: getValue("sfParatrooperPath"),
      notes: getValue("sfParatrooperNotes")
    },
    ranger: {
      path: getValue("sfRangerPath"),
      notes: getValue("sfRangerNotes")
    }
  };
}

function setSpecialForcesData(specialForces = {}) {
  setValue("sfMountaineerPath", specialForces.mountaineer?.path || "");
  setValue("sfMountaineerNotes", specialForces.mountaineer?.notes || "");
  setValue("sfMarinePath", specialForces.marine?.path || "");
  setValue("sfMarineNotes", specialForces.marine?.notes || "");
  setValue("sfParatrooperPath", specialForces.paratrooper?.path || "");
  setValue("sfParatrooperNotes", specialForces.paratrooper?.notes || "");
  setValue("sfRangerPath", specialForces.ranger?.path || "");
  setValue("sfRangerNotes", specialForces.ranger?.notes || "");
}



function formatCreatedDate(date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function setDefaultCreatedDate() {
  const createdDate = document.getElementById("createdDateInput");
  if (createdDate && !createdDate.value.trim()) {
    createdDate.value = formatCreatedDate(new Date());
    autoGrow(createdDate);
  }
}

function collectPlan() {
  return {
    meta: {
      country: getValue("countryInput"),
      patch: getValue("patchInput"),
      buildName: getValue("buildInput"),
      createdDate: getValue("createdDateInput")
    },
    focus: tableToData("focusTable"),
    construction: tableToData("constructionTable"),
    production: tableToData("productionTable"),
    politicalPower: tableToData("ppTable"),
    research: getResearchData(),
    templates: tableToData("templateTable"),
    doctrines: getDoctrinesData(),
    specialForces: getSpecialForcesData(),
    notes: getValue("notesInput")
  };
}

function loadPlanIntoUI(plan) {
  setValue("countryInput", plan.meta?.country || "");
  setValue("patchInput", plan.meta?.patch || "Manual Entry");
  document.getElementById("patchInput")?.dispatchEvent(new Event("change"));
  setValue("buildInput", plan.meta?.buildName || "");
  setValue("createdDateInput", plan.meta?.createdDate || "");
  setTableData("focusTable", plan.focus || []);
  document.querySelectorAll('input[data-field="focus"]').forEach(updateFocusInputMatch);
  setTableData("constructionTable", plan.construction || []);
  setTableData("productionTable", plan.production || []);
  setTableData("ppTable", plan.politicalPower || []);
  setResearchData(plan.research || {});
  setTableData("templateTable", plan.templates || []);
  setDoctrinesData(plan.doctrines || {});
  setSpecialForcesData(plan.specialForces || {});
  setValue("notesInput", plan.notes || "");
}

function planToText(plan) {
  const lines = [];
  lines.push("HOI4 BUILD PLAN");
  lines.push("================");
  lines.push(`Country: ${plan.meta.country || "-"}`);
  lines.push(`Mod: ${plan.meta.patch || "-"}`);
  lines.push(`Build Name: ${plan.meta.buildName || "-"}`);
  lines.push(`Created Date: ${plan.meta.createdDate || "-"}`);
  lines.push("");

  lines.push("FOCUS ORDER");
  lines.push("-----------");
  plan.focus.forEach(x => lines.push(`${x.order}. ${x.focus} | ${x.timing} | ${x.notes}`));
  lines.push("");

  lines.push("CONSTRUCTION ORDER");
  lines.push("------------------");
  plan.construction.forEach(x => lines.push(`${x.order}. ${x.what} | ${x.where} | ${x.when} | ${x.notes}`));
  lines.push("");

  lines.push("PRODUCTION ORDER");
  lines.push("----------------");
  (plan.production || []).forEach(x => lines.push(`${x.order}. ${x.line} | ${x.factories} factories | ${x.when} | ${x.notes}`));
  lines.push("");

  lines.push("POLITICAL POWER ORDER");
  lines.push("---------------------");
  plan.politicalPower.forEach(x => lines.push(`${x.order}. ${x.item} | ${x.pp} PP | ${x.timing} | ${x.notes}`));
  lines.push("");

  lines.push("RESEARCH ORDER");
  lines.push("--------------");
  for (let slot = 1; slot <= 8; slot++) {
    const rows = plan.research?.[`slot${slot}`] || [];
    if (rows.length > 0) {
      lines.push(`Slot ${slot}`);
      rows.forEach(x => lines.push(`  ${x.order}. ${x.tech} | ${x.when} | ${x.notes}`));
    }
  }
  lines.push("");

  lines.push("TEMPLATES");
  lines.push("---------");
  plan.templates.forEach(x => {
    lines.push(`${x.name} (${x.role})`);
    lines.push(`  Battalions / Modules: ${x.battalions}`);
    lines.push(`  Support / Extras: ${x.support}`);
    lines.push(`  Combat Width: ${x.combatWidth || "-"}`);
    lines.push(`  When to Build: ${x.timing}`);
    lines.push(`  Notes: ${x.notes}`);
  });
  lines.push("");

  lines.push("DOCTRINES");
  lines.push("---------");
  const doctrineLabels = [
    ["Land", plan.doctrines?.land],
    ["Navy", plan.doctrines?.navy],
    ["Air", plan.doctrines?.air]
  ];
  doctrineLabels.forEach(([label, doctrine]) => {
    if (!doctrine) return;
    lines.push(`${label} Grand Doctrine: ${doctrine.grand || "-"}`);

    if (label === "Land") {
      lines.push(`  Infantry: ${doctrine.sub?.[0] || "-"}`);
      lines.push(`  Artillery & Combat Support: ${doctrine.sub?.[1] || "-"}`);
      lines.push(`  Armor: ${doctrine.sub?.[2] || "-"}`);
      lines.push(`  Operations: ${doctrine.sub?.[3] || "-"}`);
    } else if (label === "Navy") {
      lines.push(`  Submarines: ${doctrine.sub?.[0] || "-"}`);
      lines.push(`  Screens: ${doctrine.sub?.[1] || "-"}`);
      lines.push(`  Carriers: ${doctrine.sub?.[2] || "-"}`);
      lines.push(`  Capital Ships: ${doctrine.sub?.[3] || "-"}`);
    } else if (label === "Air") {
      lines.push(`  Fighter: ${doctrine.sub?.[0] || "-"}`);
      lines.push(`  Strike Aircraft: ${doctrine.sub?.[1] || "-"}`);
      lines.push(`  Medium Aircraft: ${doctrine.sub?.[2] || "-"}`);
      lines.push(`  Heavy Aircraft: ${doctrine.sub?.[3] || "-"}`);
    }

    if (doctrine.notes) lines.push(`${label} Notes: ${doctrine.notes}`);
  });
  lines.push("");

  lines.push("SPECIAL FORCES DOCTRINES");
  lines.push("------------------------");
  const sf = plan.specialForces || {};
  [["Mountaineers", sf.mountaineer], ["Marines", sf.marine], ["Paratroopers", sf.paratrooper], ["Rangers", sf.ranger]].forEach(([label, branch]) => {
    if (!branch) return;
    lines.push(`${label}: ${branch.path || "-"}`);
    if (branch.notes) lines.push(`  Notes: ${branch.notes}`);
  });
  lines.push("");

  lines.push("GENERAL INFORMATION/NOTES");
  lines.push("-------------------------");
  lines.push(plan.notes || "");
  return lines.join("\n");
}


function showShareMessage(message) {
  const box = document.getElementById("shareMessage");
  box.innerHTML = message;
  box.classList.add("active");
  setTimeout(() => {
    box.classList.remove("active");
  }, 7000);
}

function base64UrlEncode(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => binary += String.fromCharCode(byte));
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(encoded) {
  let base64 = encoded.replaceAll("-", "+").replaceAll("_", "/");
  while (base64.length % 4) base64 += "=";

  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}


function packRow(row, fields) {
  return fields.map((field) => row?.[field] || "");
}

function unpackRow(values, fields) {
  const row = {};
  fields.forEach((field, index) => {
    row[field] = values?.[index] || "";
  });
  return row;
}

function trimTrailingEmptyValues(values) {
  const copy = [...values];
  while (copy.length && copy[copy.length - 1] === "") copy.pop();
  return copy;
}

function packRows(rows, fields) {
  return (rows || []).map((row) => trimTrailingEmptyValues(packRow(row, fields)));
}

function unpackRows(rows, fields) {
  return (rows || []).map((row) => unpackRow(row, fields));
}

function packPlan(plan) {
  const researchSlots = [];
  for (let slot = 1; slot <= 8; slot++) {
    researchSlots.push(packRows(plan.research?.[`slot${slot}`] || [], ["order", "tech", "when", "notes", "techId"]));
  }

  return {
    v: 3,
    m: [
      plan.meta?.country || "",
      plan.meta?.patch || "",
      plan.meta?.buildName || "",
      plan.meta?.createdDate || ""
    ],
    f: packRows(plan.focus, ["order", "focus", "timing", "notes", "focusId"]),
    c: packRows(plan.construction, ["order", "what", "where", "when", "notes"]),
    p: packRows(plan.production, ["order", "line", "factories", "when", "notes"]),
    pp: packRows(plan.politicalPower, ["order", "item", "pp", "timing", "notes"]),
    r: researchSlots,
    t: packRows(plan.templates, ["name", "role", "battalions", "support", "combatWidth", "timing", "notes"]),
    d: [
      [plan.doctrines?.land?.grand || "", ...(plan.doctrines?.land?.sub || []), plan.doctrines?.land?.notes || ""],
      [plan.doctrines?.navy?.grand || "", ...(plan.doctrines?.navy?.sub || []), plan.doctrines?.navy?.notes || ""],
      [plan.doctrines?.air?.grand || "", ...(plan.doctrines?.air?.sub || []), plan.doctrines?.air?.notes || ""]
    ],
    sf: [
      [plan.specialForces?.mountaineer?.path || "", plan.specialForces?.mountaineer?.notes || ""],
      [plan.specialForces?.marine?.path || "", plan.specialForces?.marine?.notes || ""],
      [plan.specialForces?.paratrooper?.path || "", plan.specialForces?.paratrooper?.notes || ""],
      [plan.specialForces?.ranger?.path || "", plan.specialForces?.ranger?.notes || ""]
    ],
    n: plan.notes || ""
  };
}

function unpackPlan(packed) {
  const research = {};
  for (let slot = 1; slot <= 8; slot++) {
    research[`slot${slot}`] = unpackRows(packed.r?.[slot - 1] || [], ["order", "tech", "when", "notes", "techId"]);
  }

  return {
    meta: {
      country: packed.m?.[0] || "",
      patch: packed.m?.[1] || "",
      buildName: packed.m?.[2] || "",
      createdDate: packed.m?.[3] || ""
    },
    focus: unpackRows(packed.f || [], ["order", "focus", "timing", "notes", "focusId"]),
    construction: unpackRows(packed.c || [], ["order", "what", "where", "when", "notes"]),
    production: unpackRows(packed.p || [], ["order", "line", "factories", "when", "notes"]),
    politicalPower: unpackRows(packed.pp || [], ["order", "item", "pp", "timing", "notes"]),
    research,
    templates: unpackRows(packed.t || [], ["name", "role", "battalions", "support", "combatWidth", "timing", "notes"]),
    doctrines: {
      land: { grand: packed.d?.[0]?.[0] || "", sub: (packed.d?.[0] || []).slice(1, 5), notes: packed.d?.[0]?.[5] || "" },
      navy: { grand: packed.d?.[1]?.[0] || "", sub: (packed.d?.[1] || []).slice(1, 5), notes: packed.d?.[1]?.[5] || "" },
      air: { grand: packed.d?.[2]?.[0] || "", sub: (packed.d?.[2] || []).slice(1, 5), notes: packed.d?.[2]?.[5] || "" }
    },
    specialForces: {
      mountaineer: { path: packed.sf?.[0]?.[0] || "", notes: packed.sf?.[0]?.[1] || "" },
      marine: { path: packed.sf?.[1]?.[0] || "", notes: packed.sf?.[1]?.[1] || "" },
      paratrooper: { path: packed.sf?.[2]?.[0] || "", notes: packed.sf?.[2]?.[1] || "" },
      ranger: { path: packed.sf?.[3]?.[0] || "", notes: packed.sf?.[3]?.[1] || "" }
    },
    notes: packed.n || ""
  };
}



async function streamToArrayBuffer(stream) {
  const response = new Response(stream);
  return response.arrayBuffer();
}

function bytesToBase64Url(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(encoded) {
  let base64 = String(encoded || "").replaceAll("-", "+").replaceAll("_", "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function gzipTextToBase64Url(text) {
  if (!window.CompressionStream) {
    return base64UrlEncode(text);
  }

  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  const buffer = await streamToArrayBuffer(stream);
  return bytesToBase64Url(new Uint8Array(buffer));
}

async function gunzipBase64UrlToText(encoded) {
  if (!window.DecompressionStream) {
    throw new Error("This browser cannot decompress compressed share codes. Try Chrome, Edge, or use an uncompressed h4json code.");
  }

  const bytes = base64UrlToBytes(encoded);
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  const buffer = await streamToArrayBuffer(stream);
  return new TextDecoder().decode(buffer);
}

async function createShortShareLink(plan) {
  const packed = packPlan(plan);
  const jsonText = JSON.stringify(packed);

  if (window.CompressionStream) {
    const encoded = await gzipTextToBase64Url(jsonText);
    return `h4web://${encoded}`;
  }

  return `h4json://${base64UrlEncode(jsonText)}`;
}

async function createShareLink(plan) {
  return createShortShareLink(plan);
}

async function parseShareLink(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) throw new Error("No build data found.");

  if (trimmed.includes("h4web://")) {
    const encoded = trimmed.split("h4web://")[1].trim();
    const packed = JSON.parse(await gunzipBase64UrlToText(encoded));
    if (packed.v !== 3) throw new Error("Invalid h4web build code.");
    return unpackPlan(packed);
  }

  if (trimmed.includes("h4json://")) {
    const encoded = trimmed.split("h4json://")[1].trim();
    const packed = JSON.parse(base64UrlDecode(encoded));
    if (packed.v !== 3) throw new Error("Invalid h4json build code.");
    return unpackPlan(packed);
  }

  if (trimmed.includes("h4://") || trimmed.includes("hoi4build://v3/")) {
    throw new Error("This is an older desktop-app Brotli h4 code. Re-copy the build from the web app, or use an older long hoi4build://plan code.");
  }

  if (trimmed.includes("hoi4build://plan/")) {
    const encoded = trimmed.split("hoi4build://plan/")[1].trim();
    const payload = JSON.parse(base64UrlDecode(encoded));
    if (payload.type !== "hoi4-build-planner" || !payload.plan) throw new Error("Invalid old share link.");
    return payload.plan;
  }

  if (trimmed.includes("#build=")) {
    const encoded = trimmed.split("#build=")[1].trim();
    const payload = JSON.parse(base64UrlDecode(encoded));
    if (payload.type !== "hoi4-build-planner" || !payload.plan) throw new Error("Invalid old website share link.");
    return payload.plan;
  }

  // Try raw packed JSON/base64 as a last resort.
  const payload = JSON.parse(base64UrlDecode(trimmed));
  if (payload.v === 3) return unpackPlan(payload);
  if (payload.type === "hoi4-build-planner" && payload.plan) return payload.plan;
  throw new Error("Could not recognise this share code.");
}

async function copyShareLinkToClipboard() {
  const plan = collectPlan();
  const link = await createShortShareLink(plan);

  try {
    await navigator.clipboard.writeText(link);
    showShareMessage("<strong>Share code copied.</strong> Send it to someone else, and they can use Load From Clipboard to import it.");
  } catch {
    showShareMessage(`<strong>Could not access clipboard.</strong><br><textarea class="share-code-box" readonly>${htmlEscape(link)}</textarea>`);
  }
}

async function loadShareLinkFromClipboard() {
  try {
    let text = "";
    try {
      text = await navigator.clipboard.readText();
    } catch {
      text = prompt("Paste the share code here:") || "";
    }

    const plan = await parseShareLink(text);
    loadPlanIntoUI(plan);
    showShareMessage("<strong>Build loaded.</strong>");
  } catch (error) {
    showShareMessage(`<strong>Could not load build:</strong> ${htmlEscape(error.message)}`);
  }
}

const BROWSER_SAVE_KEY = "hoi4-build-planner-saves-v1";

function getBrowserSaves() {
  try {
    return JSON.parse(localStorage.getItem(BROWSER_SAVE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setBrowserSaves(saves) {
  localStorage.setItem(BROWSER_SAVE_KEY, JSON.stringify(saves));
}

function slugifySaveName(name) {
  return String(name || "build").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "build";
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getSuggestedBuildName() {
  const parts = [
    getValue("countryInput"),
    getValue("buildInput"),
    getValue("createdDateInput")
  ].filter(Boolean);

  return parts.join(" - ") || "Untitled Build";
}

function htmlEscape(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function jsStringEscape(value) {
  return String(value || "").replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

function openSaveBuildModal() {
  const modal = document.getElementById("saveBuildModal");
  const input = document.getElementById("saveBuildNameInput");

  if (!modal || !input) {
    showShareMessage("<strong>Could not open save window:</strong> Save UI not found.");
    return;
  }

  input.value = getSuggestedBuildName();
  autoGrow(input);
  modal.classList.remove("hidden");

  setTimeout(() => {
    input.focus();
    input.select();
  }, 0);
}

function closeSaveBuildModal() {
  const modal = document.getElementById("saveBuildModal");
  if (modal) modal.classList.add("hidden");
}

async function saveBuildLocally() {
  const input = document.getElementById("saveBuildNameInput");

  try {
    if (!input) throw new Error("Save name input not found.");
    const name = input.value.trim();
    if (!name) throw new Error("Please enter a save name.");

    const shareCode = await createShortShareLink(collectPlan());
    const saves = getBrowserSaves();
    const id = slugifySaveName(name) + "-" + Date.now();
    saves[id] = { id, name, shareCode, updatedAt: new Date().toISOString() };
    setBrowserSaves(saves);

    closeSaveBuildModal();
    showShareMessage(`<strong>Build saved in this browser:</strong> ${htmlEscape(name)}`);
  } catch (error) {
    showShareMessage(`<strong>Could not save build:</strong> ${htmlEscape(error.message)}`);
  }
}

function closeSavedBuildsModal() {
  const modal = document.getElementById("savedBuildsModal");
  if (modal) modal.classList.add("hidden");
}

function formatSavedBuildDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value || "";
  }
}

async function openSavedBuildsModal() {
  const modal = document.getElementById("savedBuildsModal");
  const list = document.getElementById("savedBuildsList");
  const folderText = document.getElementById("savedBuildsFolderText");

  if (!modal || !list) {
    showShareMessage("<strong>Could not open load window:</strong> Load UI not found.");
    return;
  }

  modal.classList.remove("hidden");
  if (folderText) folderText.textContent = "Saved builds are stored in this browser only.";

  const builds = Object.values(getBrowserSaves()).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

  if (!builds.length) {
    list.innerHTML = `<div class="saved-build-empty">No saved builds yet. Click Save Build first.</div>`;
    return;
  }

  list.innerHTML = builds.map((build) => `
    <div class="saved-build-row">
      <div>
        <div class="saved-build-name">${htmlEscape(build.name)}</div>
        <div class="saved-build-date">Updated: ${htmlEscape(formatSavedBuildDate(build.updatedAt))}</div>
      </div>
      <button type="button" class="primary" data-load-build="${htmlEscape(build.id)}">Load</button>
      <button type="button" data-delete-build="${htmlEscape(build.id)}">Delete</button>
    </div>
  `).join("");
}

async function loadSavedBuild(id) {
  try {
    const build = getBrowserSaves()[id];
    if (!build) throw new Error("Saved build not found.");
    const plan = await parseShareLink(build.shareCode);
    loadPlanIntoUI(plan);
    closeSavedBuildsModal();
    showShareMessage(`<strong>Build loaded:</strong> ${htmlEscape(build.name)}`);
  } catch (error) {
    showShareMessage(`<strong>Could not load build:</strong> ${htmlEscape(error.message)}`);
  }
}

async function deleteSavedBuild(id) {
  if (!confirm("Delete this saved build?")) return;

  try {
    const saves = getBrowserSaves();
    delete saves[id];
    setBrowserSaves(saves);
    await openSavedBuildsModal();
    showShareMessage("<strong>Saved build deleted.</strong>");
  } catch (error) {
    showShareMessage(`<strong>Could not delete build:</strong> ${htmlEscape(error.message)}`);
  }
}

function bindLocalSaveUi() {
  const saveBtn = document.getElementById("saveLocalBtn");
  const loadBtn = document.getElementById("loadLocalBtn");
  const closeSaveBtn = document.getElementById("closeSaveBuildBtn");
  const confirmSaveBtn = document.getElementById("confirmSaveBuildBtn");
  const closeLoadBtn = document.getElementById("closeSavedBuildsBtn");
  const saveNameInput = document.getElementById("saveBuildNameInput");
  const saveModal = document.getElementById("saveBuildModal");
  const loadModal = document.getElementById("savedBuildsModal");
  const savedBuildsList = document.getElementById("savedBuildsList");

  if (saveBtn) saveBtn.addEventListener("click", openSaveBuildModal);
  if (loadBtn) loadBtn.addEventListener("click", openSavedBuildsModal);
  if (closeSaveBtn) closeSaveBtn.addEventListener("click", closeSaveBuildModal);
  if (confirmSaveBtn) confirmSaveBtn.addEventListener("click", saveBuildLocally);
  if (closeLoadBtn) closeLoadBtn.addEventListener("click", closeSavedBuildsModal);

  if (saveNameInput) {
    saveNameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        saveBuildLocally();
      }
      if (event.key === "Escape") closeSaveBuildModal();
    });
  }

  if (saveModal) {
    saveModal.addEventListener("click", (event) => {
      if (event.target === saveModal) closeSaveBuildModal();
    });
  }

  if (loadModal) {
    loadModal.addEventListener("click", (event) => {
      if (event.target === loadModal) closeSavedBuildsModal();
    });
  }

  if (savedBuildsList) {
    savedBuildsList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const loadFile = target.getAttribute("data-load-build");
      const deleteFile = target.getAttribute("data-delete-build");

      if (loadFile) loadSavedBuild(loadFile);
      if (deleteFile) deleteSavedBuild(deleteFile);
    });
  }
}

document.getElementById("exportBtn").addEventListener("click", async () => {
  const plan = collectPlan();
  const text = planToText(plan);
  const safeCountry = (plan.meta.country || "hoi4-build-plan").replace(/[<>:"/\\|?*]+/g, "").trim();
  const safeName = `${safeCountry || "hoi4-build-plan"}.txt`;
  downloadText(safeName, text);
});

document.getElementById("copyShareBtn").addEventListener("click", copyShareLinkToClipboard);

document.getElementById("loadShareBtn").addEventListener("click", loadShareLinkFromClipboard);

document.getElementById("newPlanBtn").addEventListener("click", () => {
  if (!confirm("Clear the current plan?")) return;
  loadPlanIntoUI({
    meta: {},
    focus: [],
    construction: [],
    production: [],
    politicalPower: [],
    research: {},
    templates: [],
    doctrines: {
      land: { grand: "", sub: [...DOCTRINE_TRACK_DEFAULTS.land], notes: "" },
      navy: { grand: "", sub: [...DOCTRINE_TRACK_DEFAULTS.navy], notes: "" },
      air: { grand: "", sub: [...DOCTRINE_TRACK_DEFAULTS.air], notes: "" }
    },
    specialForces: {},
    notes: ""
  });
  setDefaultCreatedDate();
});
addRow("constructionTable", { what: "Civilian Factories", where: "High infrastructure core states", when: "1936 opener", notes: "Build economy before switching to military factories." });
addRow("productionTable", { line: "Infantry Equipment", factories: "5-10", when: "Day 1", notes: "Keep rifles stocked before expanding artillery/tanks/air." });
addRow("ppTable", { item: "Silent Workhorse / Economy Law", pp: "150", timing: "First 150 PP", notes: "Depends on country and build." });

addRow("templateTable", { name: "Infantry 9/1", role: "Line infantry", battalions: "9 infantry, 1 artillery", support: "Engineers, support artillery", combatWidth: "21", timing: "After XP", notes: "General-purpose placeholder." });

setDefaultCreatedDate();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindLocalSaveUi);
} else {
  bindLocalSaveUi();
}



/* Final FUWG top-country selector controller.
   This intentionally sits at the end so it wins over older UI code. */
async function forceCountrySelectorMode() {
  const modSelect = document.getElementById("patchInput");
  const manualCountryInput = document.getElementById("countryInput");
  const countrySelect = document.getElementById("countrySelect");

  if (!modSelect || !manualCountryInput || !countrySelect) return;

  const selectedModForResearch = String(modSelect.value || "").trim();
  loadResearchDataForMod(selectedModForResearch);
  const isFuwg = selectedModForResearch === "FUWG";

  document.body.classList.toggle("fuwg-country-mode", isFuwg);

  if (isFuwg) {
    manualCountryInput.style.display = "none";
    manualCountryInput.disabled = true;
    countrySelect.style.display = "block";
    countrySelect.hidden = false;

    if (!countrySelect.dataset.loaded) {
      await loadSmartFocusCountries();
      countrySelect.dataset.loaded = "1";
    } else {
      countrySelect.disabled = false;
    }
  } else {
    manualCountryInput.style.display = "";
    manualCountryInput.disabled = false;
    countrySelect.style.display = "none";
    countrySelect.disabled = true;
    countrySelect.hidden = true;
    clearSmartFocusData();
  }
}

function bindFinalCountrySelectorMode() {
  const modSelect = document.getElementById("patchInput");
  const countrySelect = document.getElementById("countrySelect");
  const manualCountryInput = document.getElementById("countryInput");

  if (!modSelect || !countrySelect || !manualCountryInput) return;

  modSelect.addEventListener("change", () => {
    countrySelect.dataset.loaded = "";
    forceCountrySelectorMode();
  });

  countrySelect.addEventListener("change", async () => {
    if (String(modSelect.value || "").trim() !== "FUWG") return;
    const tag = String(countrySelect.value || "").trim();

    if (!tag) {
      setValue("countryInput", "");
      clearSmartFocusData();
      setFocusDataStatus("Choose a FUWG country/tree to load focus data.");
      return;
    }

    await loadSmartFocusTree(tag);
  });

  forceCountrySelectorMode();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindFinalCountrySelectorMode);
} else {
  bindFinalCountrySelectorMode();
}


function bindResearchAutocompleteInputs() {
  document.querySelectorAll('textarea[data-field="tech"]').forEach((textarea) => {
    if (textarea.dataset.researchEnhanced === "1") return;

    const input = document.createElement("input");
    input.type = "text";
    input.spellcheck = false;
    input.className = "focus-search-input research-tech-input";
    input.setAttribute("list", "researchOptionsList");
    input.dataset.field = "tech";
    input.dataset.techId = textarea.dataset.techId || "";
    input.value = textarea.value || "";

    input.addEventListener("focus", () => populateResearchOptions(input));
    input.addEventListener("click", () => populateResearchOptions(input));
    input.addEventListener("input", () => { updateResearchInputMatch(input); populateResearchOptions(input); });

    textarea.replaceWith(input);
    updateResearchInputMatch(input);
  });
}

// Re-run after rows are added/rendered.
const originalAddRowForResearchAutocomplete = typeof addRow === "function" ? addRow : null;
if (originalAddRowForResearchAutocomplete) {
  addRow = function(tableId, values = {}) {
    originalAddRowForResearchAutocomplete(tableId, values);
    if (String(tableId || "").startsWith("research")) {
      bindResearchAutocompleteInputs();
    }
  };
}

const originalSetTableDataForResearchAutocomplete = typeof setTableData === "function" ? setTableData : null;
if (originalSetTableDataForResearchAutocomplete) {
  setTableData = function(tableId, rows = []) {
    originalSetTableDataForResearchAutocomplete(tableId, rows);
    if (String(tableId || "").startsWith("research")) {
      bindResearchAutocompleteInputs();
    }
  };
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    bindResearchAutocompleteInputs();
    const modValue = document.getElementById("patchInput")?.value || "";
    loadResearchDataForMod(modValue);
  });
} else {
  bindResearchAutocompleteInputs();
  const modValue = document.getElementById("patchInput")?.value || "";
  loadResearchDataForMod(modValue);
}


function removeDefaultResearchStarterRows() {
  const defaultTechs = new Set(["Basic Machine Tools", "Construction I"]);
  const defaultNotes = new Set(["Standard industry opener.", "Early industry/construction scaling."]);

  document.querySelectorAll('[id^="researchSlot"][id$="Table"] tbody tr').forEach((row) => {
    const techInput = row.querySelector('[data-field="tech"]');
    const notesInput = row.querySelector('[data-field="notes"]');
    const tech = String(techInput?.value || "").trim();
    const notes = String(notesInput?.value || "").trim();

    if (defaultTechs.has(tech) || defaultNotes.has(notes)) {
      row.remove();
    }
  });

  if (typeof renumberTable === "function") {
    for (let i = 1; i <= 8; i += 1) {
      const table = document.getElementById(`researchSlot${i}Table`);
      if (table) renumberTable(table);
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    removeDefaultResearchStarterRows();
    setTimeout(removeDefaultResearchStarterRows, 0);
    setTimeout(removeDefaultResearchStarterRows, 100);
  });
} else {
  removeDefaultResearchStarterRows();
  setTimeout(removeDefaultResearchStarterRows, 0);
  setTimeout(removeDefaultResearchStarterRows, 100);
}


function clearAllResearchRowsHard() {
  for (let i = 1; i <= 8; i += 1) {
    const table = document.getElementById(`researchSlot${i}Table`);
    const body = table?.querySelector("tbody");
    if (body) body.innerHTML = "";
    if (typeof renumberTable === "function" && table) renumberTable(table);
  }
}

function isOnlyStarterResearchRowsPresent() {
  const rows = Array.from(document.querySelectorAll('[id^="researchSlot"][id$="Table"] tbody tr'));
  if (!rows.length) return false;

  const values = rows.map((row) => ({
    tech: String(row.querySelector('[data-field="tech"]')?.value || "").trim(),
    when: String(row.querySelector('[data-field="when"]')?.value || "").trim(),
    notes: String(row.querySelector('[data-field="notes"]')?.value || "").trim()
  }));

  return values.every((row) => {
    return (
      row.tech === "Basic Machine Tools" ||
      row.tech === "Construction I" ||
      row.notes === "Standard industry opener." ||
      row.notes === "Early industry/construction scaling."
    );
  });
}

function removeStarterResearchRowsHard() {
  document.querySelectorAll('[id^="researchSlot"][id$="Table"] tbody tr').forEach((row) => {
    const tech = String(row.querySelector('[data-field="tech"]')?.value || "").trim();
    const notes = String(row.querySelector('[data-field="notes"]')?.value || "").trim();

    if (
      tech === "Basic Machine Tools" ||
      tech === "Construction I" ||
      notes === "Standard industry opener." ||
      notes === "Early industry/construction scaling."
    ) {
      row.remove();
    }
  });

  for (let i = 1; i <= 8; i += 1) {
    const table = document.getElementById(`researchSlot${i}Table`);
    if (typeof renumberTable === "function" && table) renumberTable(table);
  }
}

function scheduleRemoveStarterResearchRowsHard() {
  // Run after the app's own startup/default loading has completed.
  removeStarterResearchRowsHard();
  setTimeout(removeStarterResearchRowsHard, 0);
  setTimeout(removeStarterResearchRowsHard, 50);
  setTimeout(removeStarterResearchRowsHard, 250);
  setTimeout(removeStarterResearchRowsHard, 1000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scheduleRemoveStarterResearchRowsHard);
} else {
  scheduleRemoveStarterResearchRowsHard();
}


function bindHardNewButtonResearchClear() {
  const buttons = Array.from(document.querySelectorAll("button"));
  const newButtons = buttons.filter((button) => {
    const text = String(button.textContent || "").trim().toLowerCase();
    return text === "new" || button.id?.toLowerCase?.().includes("new");
  });

  newButtons.forEach((button) => {
    if (button.dataset.emptyResearchBound === "1") return;
    button.dataset.emptyResearchBound = "1";
    button.addEventListener("click", () => {
      setTimeout(removeStarterResearchRowsHard, 0);
      setTimeout(removeStarterResearchRowsHard, 100);
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindHardNewButtonResearchClear);
} else {
  bindHardNewButtonResearchClear();
}
