let isLocked = true
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
let use24HourFormat = true

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

updateTime()
setInterval(updateTime, 1000)

const lockscreenContent = document.getElementById("lockscreenContent")
const timeDisplay = document.getElementById("timeDisplay")
const codeEntry = document.getElementById("codeEntry")
const codeInput = document.getElementById("codeInput")

lockscreenContent.addEventListener("click", (e) => {
  if (isLocked && !codeEntry.classList.contains("visible")) {
    timeDisplay.classList.add("moved-up")
    codeEntry.classList.add("visible")
    setTimeout(() => {
      codeInput.focus()
    }, 400)
  }
})

function unlockDevice() {
  const lockscreen = document.getElementById("lockscreen")
  const desktop = document.getElementById("desktop")

  isLocked = false

  lockscreen.style.transition = "opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
  lockscreen.style.opacity = "0"
  lockscreen.style.transform = "scale(0.95)"

  setTimeout(() => {
    lockscreen.classList.remove("active")
    lockscreen.style.display = "none"
    desktop.classList.add("active")

    timeDisplay.classList.remove("moved-up")
    codeEntry.classList.remove("visible")
    if (codeInput) codeInput.value = ""
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
function openWindow(windowId) {
  const window = document.getElementById(windowId)
  if (window) {
    window.style.display = "block"
    window.style.animation = "none"
    setTimeout(() => {
      window.style.animation = ""
    }, 10)
  }
}

function closeWindow(windowId) {
  const window = document.getElementById(windowId)
  if (window) {
    window.style.animation = "windowDisappear 0.3s cubic-bezier(0.4, 0, 1, 1) forwards"
    setTimeout(() => {
      window.style.display = "none"
      window.style.animation = ""
    }, 300)
  }
}

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
  usernameInput.addEventListener("change", (e) => {
    const username = document.querySelector(".username")
    if (username) username.textContent = e.target.value
  })
}

if (timeFormatSelect) {
  timeFormatSelect.addEventListener("change", (e) => {
    use24HourFormat = e.target.value === "24"
    updateTime()
  })
}

if (transparencySlider) {
  transparencySlider.addEventListener("input", (e) => {
    const value = e.target.value / 100
    const opacity = 0.05 + value * 0.15
    document.documentElement.style.setProperty("--glass-bg", `rgba(255, 255, 255, ${opacity})`)
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

// Make windows draggable
document.querySelectorAll(".window").forEach((window) => {
  const header = window.querySelector(".window-header")
  let isDragging = false
  let currentX
  let currentY
  let initialX
  let initialY
  let xOffset = 0
  let yOffset = 0

  header.addEventListener("mousedown", dragStart)
  document.addEventListener("mousemove", drag)
  document.addEventListener("mouseup", dragEnd)

  function dragStart(e) {
    if (e.target.closest(".window-controls")) return

    initialX = e.clientX - xOffset
    initialY = e.clientY - yOffset

    if (e.target === header || header.contains(e.target)) {
      isDragging = true
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault()
      currentX = e.clientX - initialX
      currentY = e.clientY - initialY
      xOffset = currentX
      yOffset = currentY

      setTranslate(currentX, currentY, window)
    }
  }

  function dragEnd(e) {
    initialX = currentX
    initialY = currentY
    isDragging = false
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(calc(-50% + ${xPos}px), calc(-50% + ${yPos}px))`
  }
})

// Island interactions
function showUserMenu() {
  alert("Menu utilisateur - Fonctionnalité à venir !")
}

function showAppGrid() {
  alert("Grille d'applications - Fonctionnalité à venir !")
}

function showControlCenter() {
  alert("Centre de contrôle - Fonctionnalité à venir !")
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
