// UEFI Functions
let currentTabIndex = 0
let currentItemIndex = 0
const tabs = ["main", "advanced", "security", "boot", "exit"]

function updateUefiTime() {
  const now = new Date()
  const timeElement = document.getElementById("uefiTime")
  const dateElement = document.getElementById("uefiDate")

  if (timeElement) {
    timeElement.textContent = now.toLocaleTimeString("fr-FR")
  }
  if (dateElement) {
    dateElement.textContent = now.toLocaleDateString("fr-FR")
  }
}

function exitUefi() {
  // Écran noir pendant 2 secondes
  document.body.style.background = "#000"
  document.querySelector(".uefi-screen").style.display = "none"

  setTimeout(() => {
    localStorage.setItem("show_boot_after_uefi", "true")
    window.location.href = "../index.html"
  }, 2000)
}

function resetUefi() {
  alert("Paramètres UEFI réinitialisés aux valeurs par défaut")
}

function switchTab(direction) {
  currentTabIndex += direction
  if (currentTabIndex < 0) currentTabIndex = tabs.length - 1
  if (currentTabIndex >= tabs.length) currentTabIndex = 0

  // Update active tab
  document.querySelectorAll(".uefi-tab").forEach((t) => t.classList.remove("active"))
  document.querySelectorAll(".uefi-tab-content").forEach((c) => (c.style.display = "none"))

  const activeTab = document.querySelector(`[data-tab="${tabs[currentTabIndex]}"]`)
  const activeContent = document.getElementById(tabs[currentTabIndex])

  if (activeTab) activeTab.classList.add("active")
  if (activeContent) activeContent.style.display = "block"

  currentItemIndex = 0
  updateSelection()
}

function updateSelection() {
  document.querySelectorAll(".uefi-item.selected").forEach((item) => {
    item.classList.remove("selected")
  })

  const currentTab = document.getElementById(tabs[currentTabIndex])
  const selectableItems = currentTab.querySelectorAll(".uefi-item.selectable")

  if (selectableItems.length > 0) {
    if (currentItemIndex >= selectableItems.length) currentItemIndex = 0
    if (currentItemIndex < 0) currentItemIndex = selectableItems.length - 1
    selectableItems[currentItemIndex].classList.add("selected")
  }
}

// Tab Navigation
document.addEventListener("DOMContentLoaded", () => {
  // Update time immediately and then every second
  updateUefiTime()
  setInterval(updateUefiTime, 1000)

  // Tab navigation
  document.querySelectorAll(".uefi-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs
      document.querySelectorAll(".uefi-tab").forEach((t) => t.classList.remove("active"))
      document.querySelectorAll(".uefi-tab-content").forEach((c) => (c.style.display = "none"))

      // Activate clicked tab
      tab.classList.add("active")
      const tabId = tab.getAttribute("data-tab")
      const content = document.getElementById(tabId)
      if (content) content.style.display = "block"
    })
  })
})

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "Escape":
    case "F10":
      exitUefi()
      break
    case "ArrowLeft":
      switchTab(-1)
      break
    case "ArrowRight":
      switchTab(1)
      break
    case "ArrowUp":
      currentItemIndex--
      updateSelection()
      break
    case "ArrowDown":
      currentItemIndex++
      updateSelection()
      break
    case "Enter":
      const selectedItem = document.querySelector(".uefi-item.selected")
      if (selectedItem && selectedItem.onclick) {
        selectedItem.onclick()
      }
      break
  }
})
