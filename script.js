/* PROGRESS - X 2.0 | Task management, filters, analytics and local storage */
(() => {
  "use strict";

  const STORAGE_KEY = "progress-x.tasks.v2";
  const $ = (selector) => document.querySelector(selector);
  const elements = {
    form: $("#taskForm"), title: $("#taskTitle"), category: $("#taskCategory"),
    priority: $("#taskPriority"), dueDate: $("#taskDueDate"), hint: $("#formHint"),
    list: $("#taskList"), empty: $("#emptyState"), total: $("#totalTasks"),
    completed: $("#completedTasks"), remaining: $("#remainingTasks"),
    badge: $("#taskCountBadge"), ring: $("#progressRing"), percentage: $("#progressPercentage"),
    fill: $("#progressFill"), message: $("#progressMessage"), fraction: $("#progressFraction"),
    filterSummary: $("#filterSummary"), completeAll: $("#completeAllBtn"), restart: $("#restartBtn"),
    modal: $("#confirmModal"), cancelRestart: $("#cancelRestart"), confirmRestart: $("#confirmRestart"),
    export: $("#exportBtn"), toast: $("#toast")
  };

  let tasks = loadTasks();
  let currentFilter = "all";
  let toastTimeout;

  function loadTasks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((task) => task && typeof task.id === "string" && typeof task.title === "string")
        .map((task) => ({
          id: task.id, title: task.title.slice(0, 160),
          category: ["Personal", "Study", "Work", "Project", "Health"].includes(task.category) ? task.category : "Personal",
          priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium",
          dueDate: typeof task.dueDate === "string" ? task.dueDate : "",
          completed: Boolean(task.completed), createdAt: Number(task.createdAt) || Date.now()
        }));
    } catch (error) {
      console.warn("Could not load saved tasks:", error);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error("Could not save tasks:", error);
      showToast("Browser storage is unavailable. Export your tasks for a backup.");
      return false;
    }
  }

  function makeId() {
    return typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => elements.toast.classList.remove("show"), 2800);
  }

  function setHint(message, isError = false) {
    elements.hint.textContent = message;
    elements.hint.classList.toggle("error", isError);
  }

  function isOverdue(task) {
    if (!task.dueDate || task.completed) return false;
    return task.dueDate < new Date().toISOString().slice(0, 10);
  }

  function formatDueDate(value) {
    if (!value) return "No due date";
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? value : `Due ${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  }

  function addPill(text, className = "") {
    const pill = document.createElement("span");
    pill.className = `pill ${className}`.trim();
    pill.textContent = text;
    return pill;
  }

  function renderTask(task) {
    const item = document.createElement("article");
    item.className = `task-item${task.completed ? " is-completed" : ""}`;
    item.dataset.id = task.id;

    const check = document.createElement("input");
    check.className = "task-check";
    check.type = "checkbox";
    check.checked = task.completed;
    check.setAttribute("aria-label", `Mark ${task.title} as ${task.completed ? "active" : "completed"}`);
    check.addEventListener("change", () => toggleTask(task.id));

    const content = document.createElement("div");
    content.className = "task-content";
    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;
    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.append(addPill(task.category), addPill(`${task.priority[0].toUpperCase()}${task.priority.slice(1)} priority`, `priority-${task.priority}`));
    const due = document.createElement("span");
    due.textContent = formatDueDate(task.dueDate);
    if (isOverdue(task)) due.className = "overdue";
    meta.append(due);
    content.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = `task-action ${task.completed ? "undo-btn" : "complete-btn"}`;
    toggle.textContent = task.completed ? "Undo" : "Complete";
    toggle.addEventListener("click", () => toggleTask(task.id));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "task-action delete-btn";
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", `Delete ${task.title}`);
    remove.addEventListener("click", () => deleteTask(task.id));

    actions.append(toggle, remove);
    item.append(check, content, actions);
    return item;
  }

  function render() {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const remaining = total - completed;
    const percentage = total ? Math.round((completed / total) * 100) : 0;

    elements.total.textContent = total;
    elements.completed.textContent = completed;
    elements.remaining.textContent = remaining;
    elements.badge.textContent = `${total} ${total === 1 ? "TASK" : "TASKS"}`;
    elements.percentage.textContent = `${percentage}%`;
    elements.ring.style.setProperty("--progress", `${percentage}%`);
    elements.ring.setAttribute("aria-valuenow", String(percentage));
    elements.fill.style.width = `${percentage}%`;
    elements.fraction.textContent = `${completed} of ${total} ${total === 1 ? "task" : "tasks"}`;
    elements.message.textContent = total === 0 ? "Your journey starts here." :
      percentage === 100 ? "Excellent work — everything is complete!" :
      percentage >= 60 ? "You're building great momentum." : "Every completed task moves you forward.";

    const filtered = tasks.filter((task) => currentFilter === "all" ||
      (currentFilter === "active" && !task.completed) ||
      (currentFilter === "completed" && task.completed));
    elements.list.replaceChildren(...filtered.map(renderTask));
    elements.empty.hidden = filtered.length > 0;
    elements.empty.querySelector("h3").textContent = currentFilter === "completed" ? "No completed tasks yet" :
      currentFilter === "active" ? "All caught up?" : "Ready to make progress?";
    elements.empty.querySelector("p").textContent = currentFilter === "completed" ? "Complete a task and it will appear here." :
      currentFilter === "active" ? "There are no active tasks in this view." : "Add your first task above and start building your next level.";
    elements.filterSummary.textContent = currentFilter === "all" ? "All your tasks in one place." :
      currentFilter === "active" ? "Tasks that still need your attention." : "A record of what you have finished.";
    document.querySelectorAll(".filter-btn").forEach((button) => {
      const active = button.dataset.filter === currentFilter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.completeAll.disabled = total === 0 || remaining === 0;
    saveTasks();
  }

  function addTask(title) {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setHint("Please enter a task name before adding it.", true);
      elements.title.focus();
      return;
    }
    tasks.unshift({
      id: makeId(), title: cleanTitle, category: elements.category.value,
      priority: elements.priority.value, dueDate: elements.dueDate.value,
      completed: false, createdAt: Date.now()
    });
    currentFilter = "all";
    elements.title.value = "";
    elements.dueDate.value = "";
    setHint("Task added. Your changes are saved automatically.");
    render();
    elements.title.focus();
    showToast("Task added to your workspace.");
  }

  function toggleTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    task.completed = !task.completed;
    render();
  }

  function deleteTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    tasks = tasks.filter((item) => item.id !== id);
    render();
    showToast("Task deleted.");
  }

  function openModal() {
    elements.modal.classList.add("show");
    elements.modal.setAttribute("aria-hidden", "false");
    elements.cancelRestart.focus();
  }

  function closeModal() {
    elements.modal.classList.remove("show");
    elements.modal.setAttribute("aria-hidden", "true");
    elements.restart.focus();
  }

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    addTask(elements.title.value);
  });

  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      render();
    });
  });

  elements.completeAll.addEventListener("click", () => {
    let changed = false;
    tasks.forEach((task) => {
      if (!task.completed) { task.completed = true; changed = true; }
    });
    if (changed) {
      render();
      showToast("All tasks completed. Great work!");
    }
  });

  elements.restart.addEventListener("click", openModal);
  elements.cancelRestart.addEventListener("click", closeModal);
  elements.modal.addEventListener("click", (event) => {
    if (event.target === elements.modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.modal.classList.contains("show")) closeModal();
  });
  elements.confirmRestart.addEventListener("click", () => {
    tasks = [];
    currentFilter = "all";
    saveTasks();
    closeModal();
    render();
    showToast("Workspace restarted. You're ready for a fresh start.");
  });

  elements.export.addEventListener("click", () => {
    const payload = {
      app: "PROGRESS - X", exportedAt: new Date().toISOString(), tasks
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `progress-x-tasks-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Task backup exported.");
  });

  render();

  // Progressive Web App: cache the static interface for repeat/offline visits.
  // Service workers require HTTPS or localhost; skip file:// previews.
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch((error) => {
        console.warn("Offline support could not be enabled:", error);
      });
    });
  }
})();
