// Time Update
function updateTime() {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const timeString = `${hours}:${minutes}`

  // Update lockscreen time
  const lockTime = document.getElementById("lockTime")
  if (lockTime) lockTime.textContent = timeString

  // Update top bar time
  const topBarTime = document.getElementById("topBarTime")
  if (topBarTime) topBarTime.textContent = timeString

  // Update lockscreen date
  const lockDate = document.getElementById("lockDate")
  if (lockDate) {
    const options = { weekday: "long", day: "numeric", month: "long" }
    const dateString = now.toLocaleDateString("fr-FR", options)
    lockDate.textContent = dateString.charAt(0).toUpperCase() + dateString.slice(1)
  }
}

// Initialize time and update every second
updateTime()
setInterval(updateTime, 1000)

let enteredCode = ""
const maxCodeLength = 4

function updateCodeDots() {
  const dots = document.querySelectorAll(".code-dot")
  dots.forEach((dot, index) => {
    if (index < enteredCode.length) {
      dot.classList.add("filled")
    } else {
      dot.classList.remove("filled")
    }
  })
}

function unlockDevice() {
  const lockscreen = document.getElementById("lockscreen")
  const desktop = document.getElementById("desktop")
  const codeInput = document.getElementById("codeInput")

  // Unlock animation
  lockscreen.style.transition = "opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
  lockscreen.style.opacity = "0"
  lockscreen.style.transform = "scale(0.9)"

  setTimeout(() => {
    lockscreen.classList.remove("active")
    lockscreen.style.transition = ""
    lockscreen.style.transform = ""
    lockscreen.style.opacity = "1"
    desktop.classList.add("active")
    if (codeInput) codeInput.value = ""
  }, 800)
}

function handleCodeEntry(num) {
  if (enteredCode.length < maxCodeLength) {
    enteredCode += num

    // Add haptic feedback with animation
    const dots = document.querySelectorAll(".code-dot")
    const currentDot = dots[enteredCode.length - 1]
    currentDot.style.animation = "none"
    setTimeout(() => {
      currentDot.style.animation = ""
    }, 10)

    updateCodeDots()

    // Auto-submit when 4 digits entered
    if (enteredCode.length === maxCodeLength) {
      setTimeout(() => {
        handleCodeSubmit()
      }, 200)
    }
  }
}

function handleCodeDelete() {
  if (enteredCode.length > 0) {
    enteredCode = enteredCode.slice(0, -1)
    updateCodeDots()
    document.getElementById("codeMessage").textContent = "Entrez le code"
    document.getElementById("codeMessage").classList.remove("error")
  }
}

function handleCodeSubmit() {
  // Accept any code (as requested)
  if (enteredCode.length === maxCodeLength) {
    unlockDevice()
  }
}

// Numpad event listeners
document.querySelectorAll(".numpad-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    const num = this.getAttribute("data-num")
    const action = this.getAttribute("data-action")

    // Button press animation
    this.style.transform = "scale(0.9)"
    setTimeout(() => {
      this.style.transform = ""
    }, 150)

    if (num) {
      handleCodeEntry(num)
    } else if (action === "delete") {
      handleCodeDelete()
    } else if (action === "enter") {
      handleCodeSubmit()
    }
  })
})

// Keyboard support
document.addEventListener("keydown", (e) => {
  const lockscreen = document.getElementById("lockscreen")
  if (!lockscreen.classList.contains("active")) return

  if (e.key >= "0" && e.key <= "9") {
    handleCodeEntry(e.key)
  } else if (e.key === "Backspace") {
    e.preventDefault()
    handleCodeDelete()
  } else if (e.key === "Enter") {
    handleCodeSubmit()
  }
})

// Window Management
function openWindow(windowId) {
  const window = document.getElementById(windowId)
  if (window) {
    window.style.display = "block"

    // Reset animation
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

// Add window disappear animation
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

// Dock icon bounce effect on click
document.querySelectorAll(".dock-icon").forEach((icon) => {
  icon.addEventListener("click", function () {
    this.style.animation = "iconBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
    setTimeout(() => {
      this.style.animation = ""
    }, 500)
  })
})

// Add icon bounce animation
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

const codeInput = document.getElementById("codeInput")

if (codeInput) {
  codeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      unlockDevice()
    }
  })

  // Auto-focus input when lockscreen is active
  const lockscreen = document.getElementById("lockscreen")
  if (lockscreen && lockscreen.classList.contains("active")) {
    setTimeout(() => {
      codeInput.focus()
    }, 500)
  }
}

console.log("[v0] WebOS initialized successfully")
