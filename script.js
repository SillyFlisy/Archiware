let isLocked = true
let isBooting = true
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
let use24HourFormat = true
const notificationQueue = []
let isNotificationShowing = false
let userMenuVisible = false
const minimizedWindows = new Set()

// Load saved settings
function loadSettings() {
  const savedUsername = localStorage.getItem("archiware_username")
  const savedWallpaper = localStorage.getItem("archiware_wallpaper")
  const savedProfile = localStorage.getItem("archiware_profile")
  const savedTimeFormat = localStorage.getItem("archiware_timeformat")

  if (savedUsername) {
    document.getElementById("usernameDisplay").textContent = savedUsername
    document.getElementById("menuUsername").textContent = savedUsername
    document.getElementById("usernameInput").value = savedUsername
    document.getElementById("avatarText").textContent = savedUsername.charAt(0).toUpperCase()
    document.getElementById("menuAvatarText").textContent = savedUsername.charAt(0).toUpperCase()
  }

  if (savedWallpaper) {
    document.querySelectorAll(".liquid-bg").forEach((bg) => {
      bg.style.backgroundImage = `url(${savedWallpaper})`
    })
  }

  if (savedProfile) {
    document.getElementById("profileImage").src = savedProfile
    document.getElementById("profileImage").style.display = "block"
    document.getElementById("menuProfileImage").src = savedProfile
    document.getElementById("menuProfileImage").style.display = "block"
    document.getElementById("avatarText").style.display = "none"
    document.getElementById("menuAvatarText").style.display = "none"
  }

  if (savedTimeFormat) {
    use24HourFormat = savedTimeFormat === "24"
    document.getElementById("timeFormatSelect").value = savedTimeFormat
  }
}

// Boot Animation
function startBootSequence() {
  const bootScreen = document.getElementById("bootScreen")

  // Play startup sound
  playSound("Assets/UI Sounds/startup.mp3")

  setTimeout(() => {
    if (!f2Pressed) {
      bootScreen.classList.add("hidden")
      setTimeout(() => {
        if (!f2Pressed) {
          bootScreen.style.display = "none"
          isBooting = false
          // Afficher le lockscreen
          const lockscreen = document.getElementById("lockscreen")
          lockscreen.classList.add("active")
        }
      }, 1000)
    }
  }, 4000)
}

function shouldShowBoot() {
  const hasBooted = localStorage.getItem("archiware_has_booted")
  return !hasBooted
}

function markAsBooted() {
  localStorage.setItem("archiware_has_booted", "true")
}

// BIOS Functions
const f2Pressed = false

function showBios() {
  const biosScreen = document.getElementById("biosScreen")
  const bootScreen = document.getElementById("bootScreen")

  bootScreen.style.display = "none"
  biosScreen.style.display = "block"

  updateBiosTime()
  setInterval(updateBiosTime, 1000)
}

function exitBios() {
  const biosScreen = document.getElementById("biosScreen")
  biosScreen.style.display = "none"

  // Continuer le boot normal
  const lockscreen = document.getElementById("lockscreen")
  lockscreen.classList.add("active")
  isBooting = false
}

function resetBios() {
  showNotification("Paramètres BIOS réinitialisés")
}

function updateBiosTime() {
  const now = new Date()
  const timeElement = document.getElementById("biosTime")
  const dateElement = document.getElementById("biosDate")

  if (timeElement) {
    timeElement.textContent = now.toLocaleTimeString("fr-FR")
  }
  if (dateElement) {
    dateElement.textContent = now.toLocaleDateString("fr-FR")
  }
}

// BIOS Tab Navigation
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".bios-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs
      document.querySelectorAll(".bios-tab").forEach((t) => t.classList.remove("active"))
      document.querySelectorAll(".bios-tab-content").forEach((c) => (c.style.display = "none"))

      // Activate clicked tab
      tab.classList.add("active")
      const tabId = tab.getAttribute("data-tab")
      const content = document.getElementById(tabId)
      if (content) content.style.display = "block"
    })
  })
})

// F2 Detection during boot
document.addEventListener("keydown", (e) => {
  if (e.key === "F2" && isBooting) {
    e.preventDefault()
    // Rediriger vers le dossier UEFI
    window.location.href = "UEFI/index.html"
  }
})

// Start boot sequence on page load
window.addEventListener("load", () => {
  loadSettings()

  // Vérifier si on revient du UEFI
  const showBootAfterUefi = localStorage.getItem("show_boot_after_uefi")

  if (showBootAfterUefi || shouldShowBoot()) {
    localStorage.removeItem("show_boot_after_uefi")
    startBootSequence()
    if (!showBootAfterUefi) markAsBooted()
  } else {
    document.getElementById("bootScreen").style.display = "none"
    isBooting = false
  }
})

function updateTime() {
  const now = new Date()
  const hours = use24HourFormat ? now.getHours() : now.getHours() % 12 || 12
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const ampm = use24HourFormat ? "" : now.getHours() >= 12 ? " PM" : " AM"
  const timeString = `${String(hours).padStart(2, "0")}:${minutes}${ampm}`

  const lockTime = document.getElementById("lockTime")
  if (lockTime) lockTime.textContent = timeString

  const topBarTime = document.getElementById("topBarTime")
  if (topBarTime) topBarTime.textContent = timeString

  const lockDate = document.getElementById("lockDate")
  if (lockDate) {
    const options = { weekday: "long", day: "numeric", month: "long", timeZone: userTimezone }
    const dateString = now.toLocaleDateString("fr-FR", options)
    lockDate.textContent = dateString.charAt(0).toUpperCase() + dateString.slice(1)
  }
}

// Initialize
updateTime()
setInterval(updateTime, 1000)

// Prevent dragging of images and other elements
document.addEventListener("dragstart", (e) => {
  e.preventDefault()
})

// Close user menu when opening windows
function openWindow(windowId) {
  hideUserMenu()
  const window = document.getElementById(windowId)
  if (window) {
    window.style.display = "block"
    window.style.animation = "none"

    // Find available position
    const pos = findAvailablePosition()
    window.style.left = pos.x + "px"
    window.style.top = pos.y + "px"
    window.style.transform = "translate(-50%, -50%)"

    // Register position
    windowPositions.push({ id: windowId, x: pos.x, y: pos.y })

    focusWindow(window)
    setTimeout(() => {
      window.style.animation = ""
      checkWindowOverlap()
    }, 10)
  }
}

const lockscreenContent = document.getElementById("lockscreenContent")
const timeDisplay = document.getElementById("timeDisplay")
const codeEntry = document.getElementById("codeEntry")
const codeInput = document.getElementById("codeInput")

// Détecter si on est sur mobile
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768

function showUserSelection() {
  const timeDisplay = document.getElementById("timeDisplay")
  const codeEntry = document.getElementById("codeEntry")
  const userSelection = document.getElementById("userSelection")
  const switchAccountBtn = document.getElementById("switchAccountBtn")

  // Masquer le champ de code et le bouton
  if (codeEntry) codeEntry.classList.remove("visible")
  if (switchAccountBtn) switchAccountBtn.style.display = "none"
  if (timeDisplay) timeDisplay.classList.remove("moved-up")

  // Mettre à jour les infos utilisateur et afficher la sélection
  updateUserSelectionInfo()
  if (userSelection) {
    userSelection.style.display = "block"
    setTimeout(() => {
      userSelection.classList.add("visible")
    }, 100)
  }
}

// Événements lockscreen
lockscreenContent.addEventListener("click", (e) => {
  if (isLocked) {
    const userSelection = document.getElementById("userSelection")
    const switchAccountBtn = document.getElementById("switchAccountBtn")

    if (isMobile) {
      // Sur mobile : déverrouillage direct
      unlockDevice()
    } else if (userSelection && userSelection.style.display === "block") {
      // Ne rien faire si on est sur l'écran de sélection d'utilisateur
      return
    } else if (!codeEntry.classList.contains("visible")) {
      // Sur desktop : afficher le champ de saisie et le bouton
      timeDisplay.classList.add("moved-up")
      codeEntry.classList.add("visible")
      if (switchAccountBtn) switchAccountBtn.style.display = "block"
      setTimeout(() => {
        codeInput.focus()
      }, 400)
    }
  }
})

// Événement tactile pour mobile
lockscreenContent.addEventListener(
  "touchstart",
  (e) => {
    if (isLocked && isMobile) {
      e.preventDefault()
      unlockDevice()
    }
  },
  { passive: false },
)

function unlockDevice() {
  const lockscreen = document.getElementById("lockscreen")
  const desktop = document.getElementById("desktop")
  const fingerprintSensor = document.getElementById("fingerprintSensor")
  const userSelection = document.getElementById("userSelection")

  isLocked = false

  // Play login sound
  playSound("Assets/UI Sounds/login.mp3")

  // Animation mobile : fingerprint vers dock
  if (isMobile && fingerprintSensor) {
    fingerprintSensor.classList.add("fingerprint-unlock")
    setTimeout(() => {
      // Faire apparaître le dock à la place
      const dock = document.querySelector(".dock")
      if (dock) {
        dock.style.opacity = "1"
        dock.style.transform = "translateX(-50%) translateY(0)"
      }
    }, 750)
  }

  lockscreen.style.transition = "opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
  lockscreen.style.opacity = "0"
  lockscreen.style.transform = "scale(0.95)"

  setTimeout(() => {
    lockscreen.classList.remove("active")
    lockscreen.style.display = "none"

    // Réinitialiser complètement le desktop
    desktop.style.display = "block"
    desktop.style.opacity = "1"
    desktop.style.transform = "scale(1)"
    desktop.classList.add("active")

    // Réinitialiser tous les éléments du lockscreen
    timeDisplay.classList.remove("moved-up")
    codeEntry.classList.remove("visible")
    if (codeInput) codeInput.value = ""
    if (userSelection) {
      userSelection.classList.remove("visible")
      userSelection.style.display = "none"
    }
  }, 800)
}

if (codeInput) {
  codeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && isLocked) {
      e.preventDefault()
      unlockDevice()
    }
  })
}

// Window Management
let windowZIndex = 50
let windowPositions = []

function findAvailablePosition() {
  const centerX = window.innerWidth / 2
  const centerY = (window.innerHeight - 80) / 2

  // Positions possibles (centre, puis décalées)
  const positions = [
    { x: centerX, y: centerY }, // Centre
    { x: centerX - 50, y: centerY - 50 }, // Haut gauche
    { x: centerX + 50, y: centerY + 50 }, // Bas droite
    { x: centerX + 50, y: centerY - 50 }, // Haut droite
    { x: centerX - 50, y: centerY + 50 }, // Bas gauche
    { x: centerX - 100, y: centerY }, // Gauche
    { x: centerX + 100, y: centerY }, // Droite
  ]

  // Vérifier quelle position est libre
  for (const pos of positions) {
    const isOccupied = windowPositions.some((wp) => Math.abs(wp.x - pos.x) < 100 && Math.abs(wp.y - pos.y) < 100)
    if (!isOccupied) {
      return pos
    }
  }

  // Si toutes les positions sont occupées, utiliser une position aléatoire
  return {
    x: centerX + (Math.random() - 0.5) * 200,
    y: centerY + (Math.random() - 0.5) * 200,
  }
}

function closeWindow(windowId) {
  const window = document.getElementById(windowId)
  if (window) {
    window.style.animation = "windowDisappear 0.3s cubic-bezier(0.4, 0, 1, 1) forwards"

    // Supprimer la position de la liste
    windowPositions = windowPositions.filter((wp) => wp.id !== windowId)

    setTimeout(() => {
      window.style.display = "none"
      window.style.animation = ""
      window.classList.remove("focused")
      checkWindowOverlap()
    }, 300)
  }
}

function focusWindow(window) {
  // Retirer le focus de toutes les fenêtres
  document.querySelectorAll(".window").forEach((w) => {
    w.classList.remove("focused")
  })

  // Donner le focus à la fenêtre cliquée
  window.classList.add("focused")
  window.style.zIndex = ++windowZIndex
}

// Auto-hide dock and islands when window overlaps
let dockHidden = false
let leftIslandHidden = false
let rightIslandHidden = false

function checkWindowOverlap() {
  const dock = document.querySelector(".dock")
  const leftIsland = document.querySelector(".left-island")
  const rightIsland = document.querySelector(".right-island")
  const windows = document.querySelectorAll('.window:not([style*="display: none"])')

  let hideDock = false
  let hideLeftIsland = false
  let hideRightIsland = false

  windows.forEach((window) => {
    const rect = window.getBoundingClientRect()

    // Check dock overlap (bottom 80px)
    if (rect.bottom > window.innerHeight - 80) {
      hideDock = true
    }

    // Check left island overlap (top 60px, left 250px)
    if (rect.top < 60 && rect.left < 250) {
      hideLeftIsland = true
    }

    // Check right island overlap (top 60px, right 250px)
    if (rect.top < 60 && rect.right > window.innerWidth - 250) {
      hideRightIsland = true
    }
  })

  // Apply hiding for dock
  if (hideDock !== dockHidden) {
    dockHidden = hideDock
    dock.style.transform = hideDock ? "translateX(-50%) translateY(100%)" : "translateX(-50%) translateY(0)"
    dock.style.opacity = hideDock ? "0" : "1"
  }

  // Apply hiding for left island
  if (hideLeftIsland !== leftIslandHidden && leftIsland) {
    leftIslandHidden = hideLeftIsland
    leftIsland.style.transform = hideLeftIsland ? "translateY(-100%)" : "translateY(0)"
    leftIsland.style.opacity = hideLeftIsland ? "0" : "1"
  }

  // Apply hiding for right island
  if (hideRightIsland !== rightIslandHidden && rightIsland) {
    rightIslandHidden = hideRightIsland
    rightIsland.style.transform = hideRightIsland ? "translateY(-100%)" : "translateY(0)"
    rightIsland.style.opacity = hideRightIsland ? "0" : "1"
  }
}

// Hover zones to show hidden elements
function initHoverZones() {
  // Dock hover zone
  const dockZone = document.createElement("div")
  dockZone.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 10px;
    z-index: 9999;
    pointer-events: all;
    background: transparent;
  `
  document.body.appendChild(dockZone)

  dockZone.addEventListener("mouseenter", () => {
    const dock = document.querySelector(".dock")
    dock.style.transform = "translateX(-50%) translateY(0)"
    dock.style.opacity = "1"
  })

  dockZone.addEventListener("mouseleave", () => {
    setTimeout(checkWindowOverlap, 100)
  })

  // Left island hover zone
  const leftZone = document.createElement("div")
  leftZone.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 250px;
    height: 10px;
    z-index: 9999;
    pointer-events: all;
    background: transparent;
  `
  document.body.appendChild(leftZone)

  leftZone.addEventListener("mouseenter", () => {
    const leftIsland = document.querySelector(".left-island")
    if (leftIsland) {
      leftIsland.style.transform = "translateY(0)"
      leftIsland.style.opacity = "1"
    }
  })

  leftZone.addEventListener("mouseleave", () => {
    setTimeout(checkWindowOverlap, 100)
  })

  // Right island hover zone
  const rightZone = document.createElement("div")
  rightZone.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 250px;
    height: 10px;
    z-index: 9999;
    pointer-events: all;
    background: transparent;
  `
  document.body.appendChild(rightZone)

  rightZone.addEventListener("mouseenter", () => {
    const rightIsland = document.querySelector(".right-island")
    if (rightIsland) {
      rightIsland.style.transform = "translateY(0)"
      rightIsland.style.opacity = "1"
    }
  })

  rightZone.addEventListener("mouseleave", () => {
    setTimeout(checkWindowOverlap, 100)
  })

  // Add window hover detection to re-hide elements
  document.querySelectorAll(".window").forEach((window) => {
    window.addEventListener("mouseenter", () => {
      setTimeout(checkWindowOverlap, 50)
    })
  })
}

// Initialize hover zones after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    initHoverZones()
    // Initial check
    checkWindowOverlap()
  }, 1000)
})

// Focus windows on click
document.querySelectorAll(".window").forEach((window) => {
  window.addEventListener("mousedown", () => {
    focusWindow(window)
  })
})

const style = document.createElement("style")
style.textContent = `
    @keyframes windowDisappear {
        to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
        }
    }
`
document.head.appendChild(style)

const usernameInput = document.getElementById("usernameInput")
const timeFormatSelect = document.getElementById("timeFormatSelect")
const transparencySlider = document.getElementById("transparencySlider")
const animationsToggle = document.getElementById("animationsToggle")

if (usernameInput) {
  usernameInput.addEventListener("input", (e) => {
    const newUsername = e.target.value
    document.getElementById("usernameDisplay").textContent = newUsername
    document.getElementById("menuUsername").textContent = newUsername
    document.getElementById("avatarText").textContent = newUsername.charAt(0).toUpperCase()
    document.getElementById("menuAvatarText").textContent = newUsername.charAt(0).toUpperCase()
    localStorage.setItem("archiware_username", newUsername)
  })
}

// Button Customization
const originalButtonContent = {
  close:
    '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="2"/></svg>',
  maximize:
    '<svg width="12" height="12" viewBox="0 0 12 12"><rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  minimize:
    '<svg width="12" height="12" viewBox="0 0 12 12"><line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" stroke-width="2"/></svg>',
}

function applyButtonStyle() {
  try {
    const styleSelect = document.getElementById("buttonStyleSelect")
    if (!styleSelect) return

    const style = styleSelect.value || "default"
    const windows = document.querySelectorAll(".window")

    windows.forEach((window) => {
      window.classList.remove("simplisme", "custom")

      // Restaurer le contenu original
      const closeBtn = window.querySelector(".close-btn")
      const maxBtn = window.querySelector(".maximize-btn")
      const minBtn = window.querySelector(".minimize-btn")

      if (closeBtn) {
        closeBtn.innerHTML = originalButtonContent.close
        closeBtn.style.background = ""
        closeBtn.style.borderRadius = ""
      }
      if (maxBtn) {
        maxBtn.innerHTML = originalButtonContent.maximize
        maxBtn.style.background = ""
        maxBtn.style.borderRadius = ""
      }
      if (minBtn) {
        minBtn.innerHTML = originalButtonContent.minimize
        minBtn.style.background = ""
        minBtn.style.borderRadius = ""
      }

      if (style === "simplisme") {
        window.classList.add("simplisme")
      } else if (style === "custom") {
        window.classList.add("custom")
        applyCustomButtonStyles(window)
      }
    })
  } catch (e) {
    console.log("Button style error:", e)
  }
}

function applyCustomButtonStyles(window) {
  const closeBtn = window.querySelector(".close-btn")
  const maxBtn = window.querySelector(".maximize-btn")
  const minBtn = window.querySelector(".minimize-btn")

  // Paramètres généraux
  const size = document.getElementById("buttonSize")?.value || "24"
  const showContent = document.getElementById("showContent")?.checked !== false

  const buttons = [closeBtn, maxBtn, minBtn]
  buttons.forEach((btn) => {
    if (btn) {
      btn.style.setProperty("width", size + "px", "important")
      btn.style.setProperty("height", size + "px", "important")
    }
  })

  if (closeBtn) {
    const shape = document.getElementById("closeShape")?.value || "rounded"
    const color = document.getElementById("closeColor")?.value || "#ef4444"
    const content = document.getElementById("closeContent")?.value

    closeBtn.style.background = color
    closeBtn.style.borderRadius = shape === "circle" ? "50%" : shape === "square" ? "2px" : "6px"
    if (showContent && content && content.trim()) {
      closeBtn.innerHTML = content
    } else if (!showContent) {
      closeBtn.innerHTML = ""
    }
  }

  if (maxBtn) {
    const shape = document.getElementById("maxShape")?.value || "rounded"
    const color = document.getElementById("maxColor")?.value || "#22c55e"
    const content = document.getElementById("maxContent")?.value

    maxBtn.style.background = color
    maxBtn.style.borderRadius = shape === "circle" ? "50%" : shape === "square" ? "2px" : "6px"
    if (showContent && content && content.trim()) {
      maxBtn.innerHTML = content
    } else if (!showContent) {
      maxBtn.innerHTML = ""
    }
  }

  if (minBtn) {
    const shape = document.getElementById("minShape")?.value || "rounded"
    const color = document.getElementById("minColor")?.value || "#fbbf24"
    const content = document.getElementById("minContent")?.value

    minBtn.style.background = color
    minBtn.style.borderRadius = shape === "circle" ? "50%" : shape === "square" ? "2px" : "6px"
    if (showContent && content && content.trim()) {
      minBtn.innerHTML = content
    } else if (!showContent) {
      minBtn.innerHTML = ""
    }
  }
}

// Settings Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Button Style Selector
  const buttonStyleSelect = document.getElementById("buttonStyleSelect")
  const customButtonSettings = document.getElementById("customButtonSettings")

  if (buttonStyleSelect) {
    buttonStyleSelect.addEventListener("change", (e) => {
      const isCustom = e.target.value === "custom"
      if (customButtonSettings) {
        customButtonSettings.style.display = isCustom ? "block" : "none"
      }
      applyButtonStyle()
    })
  }

  // Custom button controls
  const customControls = [
    "closeShape",
    "closeColor",
    "closeContent",
    "maxShape",
    "maxColor",
    "maxContent",
    "minShape",
    "minColor",
    "minContent",
    "buttonSize",
    "showContent",
  ]
  customControls.forEach((id) => {
    const element = document.getElementById(id)
    if (element) {
      element.addEventListener("input", applyButtonStyle)
      element.addEventListener("change", applyButtonStyle)
    }
  })

  // Update size display
  const buttonSize = document.getElementById("buttonSize")
  const sizeValue = document.getElementById("sizeValue")
  if (buttonSize && sizeValue) {
    buttonSize.addEventListener("input", (e) => {
      sizeValue.textContent = e.target.value + "px"
    })
  }

  const wallpaperInput = document.getElementById("wallpaperInput")
  if (wallpaperInput) {
    wallpaperInput.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageUrl = e.target.result
          document.querySelectorAll(".liquid-bg").forEach((bg) => {
            bg.style.backgroundImage = `url(${imageUrl})`
          })
          localStorage.setItem("archiware_wallpaper", imageUrl)
          showNotification("Fond d'écran modifié avec succès")
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const profileInput = document.getElementById("profileInput")
  if (profileInput) {
    profileInput.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageUrl = e.target.result
          document.getElementById("profileImage").src = imageUrl
          document.getElementById("profileImage").style.display = "block"
          document.getElementById("menuProfileImage").src = imageUrl
          document.getElementById("menuProfileImage").style.display = "block"
          document.getElementById("avatarText").style.display = "none"
          document.getElementById("menuAvatarText").style.display = "none"
          localStorage.setItem("archiware_profile", imageUrl)
          showNotification("Photo de profil modifiée avec succès")
        }
        reader.readAsDataURL(file)
      }
    })
  }

  // Control Center Sliders
  const volumeSlider = document.getElementById("volumeSlider")
  const volumeValue = document.getElementById("volumeValue")
  const brightnessSlider = document.getElementById("brightnessSlider")
  const brightnessValue = document.getElementById("brightnessValue")

  if (volumeSlider && volumeValue) {
    volumeSlider.addEventListener("input", (e) => {
      const value = e.target.value
      volumeValue.textContent = value + "%"
      updateVolume(value)
    })
  }

  if (brightnessSlider && brightnessValue) {
    brightnessSlider.addEventListener("input", (e) => {
      const value = e.target.value
      brightnessValue.textContent = value + "%"
      updateBrightness(value)
    })
  }
})

if (timeFormatSelect) {
  timeFormatSelect.addEventListener("change", (e) => {
    use24HourFormat = e.target.value === "24"
    localStorage.setItem("archiware_timeformat", e.target.value)
    updateTime()
  })
}

// Add CSS animations for window controls
const windowAnimations = document.createElement("style")
windowAnimations.textContent = `
  @keyframes windowMinimize {
    to {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.1) translateY(200px);
    }
  }
  
  .window.maximized {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
`
document.head.appendChild(windowAnimations)

if (transparencySlider) {
  transparencySlider.addEventListener("input", (e) => {
    const value = e.target.value / 100
    const opacity = 0.05 + value * 0.4
    const blur = value * 50

    document.documentElement.style.setProperty("--glass-bg", `rgba(0, 0, 0, ${opacity})`)

    // Appliquer le blur à toutes les fenêtres
    document.querySelectorAll(".window, .dock-container, .island, .notification, .user-menu").forEach((element) => {
      element.style.backdropFilter = `blur(${blur}px) saturate(1.8)`
    })
  })
}

if (animationsToggle) {
  animationsToggle.addEventListener("change", (e) => {
    if (!e.target.checked) {
      document.body.style.setProperty("--animation-speed", "0s")
    } else {
      document.body.style.removeProperty("--animation-speed")
    }
  })
}

// Enhanced Window Controls
function minimizeWindow(windowId) {
  const window = document.getElementById(windowId)
  if (window) {
    window.style.animation = "windowMinimize 0.3s cubic-bezier(0.4, 0, 1, 1) forwards"
    minimizedWindows.add(windowId)

    setTimeout(() => {
      window.style.display = "none"
      window.style.animation = ""
    }, 300)
  }
}

function maximizeWindow(windowId) {
  const window = document.getElementById(windowId)
  if (window) {
    const isMaximized = window.classList.contains("maximized")

    if (isMaximized) {
      // Restore to previous size
      window.classList.remove("maximized")
      window.style.width = "700px"
      window.style.height = "500px"
      window.style.left = "50%"
      window.style.top = "50%"
      window.style.transform = "translate(-50%, -50%)"
    } else {
      // Maximize with margins (not fullscreen)
      window.classList.add("maximized")
      window.style.width = "calc(100vw - 80px)"
      window.style.height = "calc(100vh - 160px)"
      window.style.left = "40px"
      window.style.top = "60px"
      window.style.transform = "none"
    }
  }
}

document.querySelectorAll(".minimize-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation()
    const windowId = e.target.closest(".window").id
    minimizeWindow(windowId)
  })
})

document.querySelectorAll(".maximize-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation()
    const windowId = e.target.closest(".window").id
    maximizeWindow(windowId)
  })
})

// Simple window dragging
document.querySelectorAll(".window").forEach((window) => {
  const header = window.querySelector(".window-header")
  let isDragging = false
  let startX, startY, startLeft, startTop

  header.addEventListener("mousedown", (e) => {
    if (e.target.closest(".window-controls")) return
    isDragging = true
    startX = e.clientX
    startY = e.clientY
    const rect = window.getBoundingClientRect()
    startLeft = rect.left
    startTop = rect.top
    window.style.transform = "none"
    focusWindow(window)
    e.preventDefault()
  })

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return
    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY
    window.style.left = startLeft + deltaX + "px"
    window.style.top = startTop + deltaY + "px"
    checkWindowOverlap()
  })

  document.addEventListener("mouseup", () => {
    isDragging = false
    setTimeout(checkWindowOverlap, 100)
  })

  // Touch events for mobile
  header.addEventListener("touchstart", (e) => {
    if (e.target.closest(".window-controls")) return
    isDragging = true
    const touch = e.touches[0]
    startX = touch.clientX
    startY = touch.clientY
    const rect = window.getBoundingClientRect()
    startLeft = rect.left
    startTop = rect.top
    window.style.transform = "none"
    focusWindow(window)
    e.preventDefault()
  })

  document.addEventListener("touchmove", (e) => {
    if (!isDragging) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY
    window.style.left = startLeft + deltaX + "px"
    window.style.top = startTop + deltaY + "px"
    checkWindowOverlap()
    e.preventDefault()
  })

  document.addEventListener("touchend", () => {
    isDragging = false
    setTimeout(checkWindowOverlap, 100)
  })
})

// Simple window resizing
document.querySelectorAll(".window").forEach((window) => {
  const handles = window.querySelectorAll(".resize-handle")
  let isResizing = false
  let resizeType = ""
  let startX, startY, startWidth, startHeight, startLeft, startTop

  handles.forEach((handle) => {
    handle.addEventListener("mousedown", (e) => {
      isResizing = true
      resizeType = handle.classList[1]
      startX = e.clientX
      startY = e.clientY
      const rect = window.getBoundingClientRect()
      startWidth = rect.width
      startHeight = rect.height
      startLeft = rect.left
      startTop = rect.top
      e.preventDefault()
      e.stopPropagation()
    })
  })

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return

    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY

    let newWidth = startWidth
    let newHeight = startHeight
    let newLeft = startLeft
    let newTop = startTop

    if (resizeType.includes("e")) newWidth = startWidth + deltaX
    if (resizeType.includes("w")) {
      newWidth = startWidth - deltaX
      newLeft = startLeft + deltaX
    }
    if (resizeType.includes("s")) newHeight = startHeight + deltaY
    if (resizeType.includes("n")) {
      newHeight = startHeight - deltaY
      newTop = startTop + deltaY
    }

    newWidth = Math.max(300, newWidth)
    newHeight = Math.max(200, newHeight)

    window.style.width = newWidth + "px"
    window.style.height = newHeight + "px"
    window.style.left = newLeft + "px"
    window.style.top = newTop + "px"
    checkWindowOverlap()
  })

  document.addEventListener("mouseup", () => {
    isResizing = false
    setTimeout(checkWindowOverlap, 100)
  })
})

// Window controls
document.querySelectorAll(".minimize-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation()
    const windowId = e.target.closest(".window").id
    minimizeWindow(windowId)
  })
})

document.querySelectorAll(".maximize-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation()
    const windowId = e.target.closest(".window").id
    maximizeWindow(windowId)
  })
})

// Créer le conteneur de notifications
let notificationsContainer = document.querySelector(".notifications-container")
if (!notificationsContainer) {
  notificationsContainer = document.createElement("div")
  notificationsContainer.className = "notifications-container"
  document.body.appendChild(notificationsContainer)
}

// Enhanced Notification System with Queue
function showNotification(message) {
  // Vérifier si la notification existe déjà dans la file d'attente
  if (!notificationQueue.includes(message)) {
    notificationQueue.push(message)
  }
  processNotificationQueue()
}

function processNotificationQueue() {
  if (isNotificationShowing || notificationQueue.length === 0) return

  isNotificationShowing = true
  const message = notificationQueue.shift()

  // Hide right island on mobile when notification appears
  if (isMobile) {
    const rightIsland = document.querySelector(".right-island")
    if (rightIsland) {
      rightIsland.classList.add("hidden")
    }
  }

  // Play notification sound
  playSound("Assets/UI Sounds/notification.mp3")

  // Create notification element
  const notification = document.createElement("div")
  notification.className = "notification"
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <div class="notification-text">${message}</div>
    </div>
  `

  notificationsContainer.appendChild(notification)

  // Show animation
  setTimeout(() => notification.classList.add("show"), 100)

  // Hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show")
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
      isNotificationShowing = false

      // Show right island again on mobile
      if (isMobile) {
        const rightIsland = document.querySelector(".right-island")
        if (rightIsland) {
          rightIsland.classList.remove("hidden")
        }
      }

      // Process next notification in queue
      processNotificationQueue()
    }, 400)
  }, 3000)
}

// User Menu Functions
function toggleUserMenu() {
  const userMenu = document.getElementById("userMenu")
  userMenuVisible = !userMenuVisible

  if (userMenuVisible) {
    userMenu.classList.add("show")
    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener("click", closeUserMenuOnClickOutside)
    }, 100)
  } else {
    hideUserMenu()
  }
}

function hideUserMenu() {
  const userMenu = document.getElementById("userMenu")
  userMenu.classList.remove("show")
  userMenuVisible = false
  document.removeEventListener("click", closeUserMenuOnClickOutside)
}

function closeUserMenuOnClickOutside(e) {
  const userMenu = document.getElementById("userMenu")
  const userProfile = document.querySelector(".user-profile")

  if (!userMenu.contains(e.target) && !userProfile.contains(e.target)) {
    hideUserMenu()
  }
}

// System Functions
function restartSystem() {
  playSound("Assets/UI Sounds/restart.mp3")

  showNotification("Redémarrage en cours...")
  localStorage.removeItem("archiware_has_booted")
  setTimeout(() => {
    location.reload()
  }, 2000)
}

function disconnectUser() {
  playSound("Assets/UI Sounds/disconnect.mp3")

  hideUserMenu()

  const lockscreen = document.getElementById("lockscreen")
  const desktop = document.getElementById("desktop")

  isLocked = true

  // Fermer toutes les fenêtres ouvertes
  document.querySelectorAll(".window").forEach((window) => {
    window.style.display = "none"
  })

  // Réinitialiser complètement l'état du lockscreen
  const timeDisplay = document.getElementById("timeDisplay")
  const codeEntry = document.getElementById("codeEntry")
  const codeInput = document.getElementById("codeInput")
  const userSelection = document.getElementById("userSelection")

  // S'assurer que tous les éléments sont dans leur état initial
  if (timeDisplay) timeDisplay.classList.remove("moved-up")
  if (codeEntry) codeEntry.classList.remove("visible")
  if (codeInput) codeInput.value = ""
  if (userSelection) {
    userSelection.classList.remove("visible")
    userSelection.style.display = "none"
  }

  // Mettre à jour les informations utilisateur
  updateUserSelectionInfo()

  // Réinitialiser les styles du desktop
  desktop.style.opacity = "0"
  desktop.style.transform = "scale(1.05)"

  setTimeout(() => {
    desktop.classList.remove("active")
    desktop.style.display = "none"

    // Réinitialiser le lockscreen
    lockscreen.style.display = "block"
    lockscreen.style.opacity = "1"
    lockscreen.style.transform = "scale(1)"
    lockscreen.classList.add("active")

    // S'assurer que timeDisplay est bien centré
    if (timeDisplay) {
      timeDisplay.classList.remove("moved-up")
      timeDisplay.style.transform = "translateY(0)"
    }

    // Afficher l'écran de sélection d'utilisateur
    if (userSelection) {
      userSelection.style.display = "block"
      setTimeout(() => {
        userSelection.classList.add("visible")
      }, 100)
    }
  }, 800)
}

function updateUserSelectionInfo() {
  const savedUsername = localStorage.getItem("archiware_username") || "zetsukae"
  const savedProfile = localStorage.getItem("archiware_profile")

  const lockUserName = document.getElementById("lockUserName")
  const lockUserAvatarText = document.getElementById("lockUserAvatarText")
  const lockUserProfileImage = document.getElementById("lockUserProfileImage")

  if (lockUserName) lockUserName.textContent = savedUsername
  if (lockUserAvatarText) lockUserAvatarText.textContent = savedUsername.charAt(0).toUpperCase()

  if (savedProfile && lockUserProfileImage) {
    lockUserProfileImage.src = savedProfile
    lockUserProfileImage.style.display = "block"
    lockUserAvatarText.style.display = "none"
  } else {
    if (lockUserProfileImage) lockUserProfileImage.style.display = "none"
    if (lockUserAvatarText) lockUserAvatarText.style.display = "block"
  }
}

function selectUser() {
  const userSelection = document.getElementById("userSelection")
  const timeDisplay = document.getElementById("timeDisplay")
  const codeEntry = document.getElementById("codeEntry")
  const codeInput = document.getElementById("codeInput")
  const switchAccountBtn = document.getElementById("switchAccountBtn")

  // Masquer l'écran de sélection
  if (userSelection) {
    userSelection.classList.remove("visible")
    setTimeout(() => {
      userSelection.style.display = "none"
    }, 400)
  }

  // Afficher l'écran de saisie du code
  if (timeDisplay) timeDisplay.classList.add("moved-up")
  if (codeEntry) {
    setTimeout(() => {
      codeEntry.classList.add("visible")
      if (switchAccountBtn) switchAccountBtn.style.display = "block"
      if (codeInput) codeInput.focus()
    }, 400)
  }
}

function shutdownSystem() {
  playSound("Assets/UI Sounds/warning.mp3")

  showNotification("Arrêt du système...")
  setTimeout(() => {
    document.body.style.background = "black"
    document.body.innerHTML =
      '<div style="color: white; text-align: center; padding-top: 45vh; font-family: monospace;">Système arrêté. Vous pouvez fermer cette fenêtre.</div>'
  }, 2000)
}

function resetSystem() {
  if (confirm("Voulez-vous vraiment réinitialiser l'ordinateur ? Toutes les données seront effacées.")) {
    const warningSound = new Audio("Assets/UI Sounds/warning.mp3")
    warningSound.play().catch((e) => console.log("Erreur audio:", e))

    showNotification("Réinitialisation en cours...")

    // Clear all localStorage
    localStorage.clear()

    setTimeout(() => {
      location.reload()
    }, 2000)
  }
}

// Island interactions
function showAppGrid() {
  showNotification("Grille d'applications - Arrive bientôt !")
}

// Control Center Functions
let controlCenterVisible = false
let wifiEnabled = true
let bluetoothEnabled = false
let currentVolume = 50

function showControlCenter() {
  const controlCenter = document.getElementById("controlCenter")
  controlCenterVisible = !controlCenterVisible

  if (controlCenterVisible) {
    controlCenter.classList.add("show")
    updateControlCenter()
    // Close on click outside
    setTimeout(() => {
      document.addEventListener("click", closeControlCenterOnClickOutside)
    }, 100)
  } else {
    hideControlCenter()
  }
}

function hideControlCenter() {
  const controlCenter = document.getElementById("controlCenter")
  controlCenter.classList.remove("show")
  controlCenterVisible = false
  document.removeEventListener("click", closeControlCenterOnClickOutside)
}

function closeControlCenterOnClickOutside(e) {
  const controlCenter = document.getElementById("controlCenter")
  const rightIsland = document.querySelector(".right-island")

  if (!controlCenter.contains(e.target) && !rightIsland.contains(e.target)) {
    hideControlCenter()
  }
}

window.showControlCenter = showControlCenter
window.hideControlCenter = hideControlCenter
window.toggleWifi = toggleWifi
window.toggleBluetooth = toggleBluetooth

function toggleWifi() {
  wifiEnabled = !wifiEnabled
  const status = document.getElementById("wifiStatus")
  const card = document.getElementById("wifiCard")

  if (wifiEnabled) {
    status.textContent = "Connecté"
    card.classList.add("active")
  } else {
    status.textContent = "Désactivé"
    card.classList.remove("active")
  }

  // Mettre à jour l'état du navigateur
  updateBrowserConnection()
}

function toggleBluetooth() {
  bluetoothEnabled = !bluetoothEnabled
  const status = document.getElementById("bluetoothStatus")
  const card = document.getElementById("bluetoothCard")

  if (bluetoothEnabled) {
    status.textContent = "Connecté"
    card.classList.add("active")
  } else {
    status.textContent = "Désactivé"
    card.classList.remove("active")
  }
}

function updateBrowserConnection() {
  const fakeBrowser = document.querySelector(".fake-browser")
  if (!wifiEnabled && fakeBrowser) {
    fakeBrowser.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666; text-align: center; padding: 40px;">
        <img src="Assets/icons/no-internet.png" width="64" height="64" style="margin-bottom: 20px; opacity: 0.5;" alt="No Internet">
        <h3 style="margin-bottom: 10px; color: #333;">Aucune connexion Internet</h3>
        <p style="color: #666; font-size: 14px;">Vérifiez votre connexion Wi-Fi et réessayez.</p>
      </div>
    `
  } else if (wifiEnabled) {
    // Restaurer le contenu normal du navigateur
    fakeBrowser.innerHTML = `
      <div class="fake-site" id="google">
        <div class="google-logo">Google</div>
        <div class="search-container">
          <input type="text" class="fake-search" placeholder="Rechercher sur Google">
          <button class="search-btn">Rechercher</button>
        </div>
        <div class="quick-links">
          <a href="#" onclick="loadSite('youtube')">YouTube</a>
          <a href="#" onclick="loadSite('github')">GitHub</a>
          <a href="#" onclick="loadSite('stackoverflow')">Stack Overflow</a>
        </div>
      </div>
      
      <div class="fake-site" id="youtube" style="display:none">
        <div class="yt-header">
          <div class="yt-logo">YouTube</div>
          <input type="text" class="yt-search" placeholder="Rechercher">
        </div>
        <div class="yt-content">
          <div class="video-grid">
            <div class="video-card">
              <div class="video-thumb"></div>
              <div class="video-title">Tutoriel JavaScript</div>
            </div>
            <div class="video-card">
              <div class="video-thumb"></div>
              <div class="video-title">CSS Animations</div>
            </div>
            <div class="video-card">
              <div class="video-thumb"></div>
              <div class="video-title">Web Development</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="fake-site" id="stackoverflow" style="display:none">
        <div class="so-header">
          <div class="so-logo">Stack Overflow</div>
          <input type="text" class="so-search" placeholder="Rechercher...">
        </div>
        <div class="so-content">
          <div class="question-list">
            <div class="question-item">
              <div class="question-title">Comment créer une animation CSS ?</div>
              <div class="question-tags">
                <span class="tag">css</span>
                <span class="tag">animation</span>
              </div>
            </div>
            <div class="question-item">
              <div class="question-title">JavaScript async/await expliqué</div>
              <div class="question-tags">
                <span class="tag">javascript</span>
                <span class="tag">async</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    // Afficher Google par défaut
    document.getElementById("google").style.display = "block"
  }
}

function updateBrightness(value) {
  let overlay = document.getElementById("brightnessOverlay")

  if (!overlay) {
    overlay = document.createElement("div")
    overlay.id = "brightnessOverlay"
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9998;
      transition: all 0.3s ease;
    `
    document.body.appendChild(overlay)
  }

  // Plus la valeur est basse, plus l'overlay noir est opaque
  const opacity = ((100 - value) / 100) * 0.9
  overlay.style.background = `rgba(0, 0, 0, ${opacity})`
}

function updateVolume(value) {
  currentVolume = value
}

function playSound(audioPath) {
  if (currentVolume > 0) {
    const audio = new Audio(audioPath)
    audio.volume = currentVolume / 100
    audio.play().catch((e) => console.log("Erreur audio:", e))
  }
}

function updateControlCenter() {
  // Update Wi-Fi
  const wifiStatus = document.getElementById("wifiStatus")
  const wifiCard = document.getElementById("wifiCard")
  wifiStatus.textContent = wifiEnabled ? "Connecté" : "Désactivé"
  if (wifiEnabled) wifiCard.classList.add("active")

  // Update Bluetooth
  const bluetoothStatus = document.getElementById("bluetoothStatus")
  const bluetoothCard = document.getElementById("bluetoothCard")
  bluetoothStatus.textContent = bluetoothEnabled ? "Connecté" : "Désactivé"
  if (bluetoothEnabled) bluetoothCard.classList.add("active")
}

// Dock icon bounce effect
document.querySelectorAll(".dock-icon").forEach((icon) => {
  icon.addEventListener("click", function () {
    this.style.animation = "iconBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
    setTimeout(() => {
      this.style.animation = ""
    }, 500)
  })
})

const bounceStyle = document.createElement("style")
bounceStyle.textContent = `
    @keyframes iconBounce {
        0%, 100% {
            transform: translateY(0) scale(1);
        }
        50% {
            transform: translateY(-20px) scale(1.2);
        }
    }
`
document.head.appendChild(bounceStyle)

// Navigation simulée
let currentSite = "google"
let browserHistory = ["google"]
let historyIndex = 0

function navigateToUrl() {
  const urlBar = document.getElementById("urlBar")
  const url = urlBar.value.trim().toLowerCase()

  if (url.includes("youtube")) {
    loadSite("youtube")
  } else if (url.includes("github")) {
    loadSite("github")
  } else if (url.includes("stackoverflow")) {
    loadSite("stackoverflow")
  } else {
    loadSite("google")
  }
}

function loadSite(siteName) {
  if (siteName === "github") {
    window.open("https://github.com/SillyFlisy/Archiware", "_blank")
    return
  }

  document.querySelectorAll(".fake-site").forEach((site) => {
    site.style.display = "none"
  })

  document.getElementById(siteName).style.display = "block"
  currentSite = siteName

  // Mettre à jour l'historique
  if (historyIndex < browserHistory.length - 1) {
    browserHistory = browserHistory.slice(0, historyIndex + 1)
  }
  browserHistory.push(siteName)
  historyIndex = browserHistory.length - 1

  // Mettre à jour l'URL
  const urlBar = document.getElementById("urlBar")
  const urls = {
    google: "https://www.google.com",
    youtube: "https://www.youtube.com",
    github: "https://github.com/SillyFlisy/Archiware",
    stackoverflow: "https://stackoverflow.com",
  }
  urlBar.value = urls[siteName]
}

function goBack() {
  if (historyIndex > 0) {
    historyIndex--
    loadSite(browserHistory[historyIndex])
  }
}

function goForward() {
  if (historyIndex < browserHistory.length - 1) {
    historyIndex++
    loadSite(browserHistory[historyIndex])
  }
}

function refreshPage() {
  loadSite(currentSite)
}

// Navigation avec Entrée
const urlBar = document.getElementById("urlBar")
if (urlBar) {
  urlBar.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      navigateToUrl()
    }
  })
}

// Prevent context menu on long press (mobile)
document.addEventListener("contextmenu", (e) => {
  if (isMobile) {
    e.preventDefault()
  }
})

// Enhanced mobile fingerprint unlock
if (isMobile) {
  const fingerprintSensor = document.getElementById("fingerprintSensor")
  if (fingerprintSensor) {
    fingerprintSensor.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault()
        if (isLocked) {
          unlockDevice()
        }
      },
      { passive: false },
    )
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Make sure dock is visible on desktop
  const desktop = document.getElementById("desktop")
  const dock = document.querySelector(".dock")

  if (desktop && dock) {
    // Observer to show dock when desktop becomes active
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          if (desktop.classList.contains("active")) {
            dock.style.opacity = "1"
            dock.style.transform = "translateX(-50%) translateY(0)"
            dock.style.pointerEvents = "all"
          }
        }
      })
    })

    observer.observe(desktop, { attributes: true })
  }
})
