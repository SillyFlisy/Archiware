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

// Détecter si on est sur mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768

// Événements lockscreen
lockscreenContent.addEventListener("click", (e) => {
  if (isLocked) {
    if (isMobile) {
      // Sur mobile : déverrouillage direct
      unlockDevice()
    } else if (!codeEntry.classList.contains("visible")) {
      // Sur desktop : afficher le champ de saisie
      timeDisplay.classList.add("moved-up")
      codeEntry.classList.add("visible")
      setTimeout(() => {
        codeInput.focus()
      }, 400)
    }
  }
})

// Événement tactile pour mobile
lockscreenContent.addEventListener("touchstart", (e) => {
  if (isLocked && isMobile) {
    e.preventDefault()
    unlockDevice()
  }
}, { passive: false })

function unlockDevice() {
  const lockscreen = document.getElementById("lockscreen")
  const desktop = document.getElementById("desktop")

  isLocked = false

  // Jouer le son de démarrage
  const startupSound = new Audio('Assets/UI Sounds/startup.mp3')
  startupSound.play().catch(e => console.log('Erreur audio:', e))

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
    const isOccupied = windowPositions.some(wp => 
      Math.abs(wp.x - pos.x) < 100 && Math.abs(wp.y - pos.y) < 100
    )
    if (!isOccupied) {
      return pos
    }
  }
  
  // Si toutes les positions sont occupées, utiliser une position aléatoire
  return {
    x: centerX + (Math.random() - 0.5) * 200,
    y: centerY + (Math.random() - 0.5) * 200
  }
}

function openWindow(windowId) {
  const window = document.getElementById(windowId)
  if (window) {
    window.style.display = "block"
    window.style.animation = "none"
    
    // Trouver une position libre
    const pos = findAvailablePosition()
    window.style.left = pos.x + 'px'
    window.style.top = pos.y + 'px'
    window.style.transform = 'translate(-50%, -50%)'
    
    // Enregistrer la position
    windowPositions.push({ id: windowId, x: pos.x, y: pos.y })
    
    focusWindow(window)
    setTimeout(() => {
      window.style.animation = ""
    }, 10)
  }
}

function closeWindow(windowId) {
  const window = document.getElementById(windowId)
  if (window) {
    window.style.animation = "windowDisappear 0.3s cubic-bezier(0.4, 0, 1, 1) forwards"
    
    // Supprimer la position de la liste
    windowPositions = windowPositions.filter(wp => wp.id !== windowId)
    
    setTimeout(() => {
      window.style.display = "none"
      window.style.animation = ""
      window.classList.remove('focused')
    }, 300)
  }
}

function focusWindow(window) {
  // Retirer le focus de toutes les fenêtres
  document.querySelectorAll('.window').forEach(w => {
    w.classList.remove('focused')
  })
  
  // Donner le focus à la fenêtre cliquée
  window.classList.add('focused')
  window.style.zIndex = ++windowZIndex
}

// Ajouter les événements de clic sur les fenêtres
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.window').forEach(window => {
    window.addEventListener('mousedown', () => {
      focusWindow(window)
    })
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

// Make windows draggable (souris et tactile)
document.querySelectorAll(".window").forEach((window) => {
  const header = window.querySelector(".window-header")
  let isDragging = false
  let currentX = 0
  let currentY = 0
  let initialX
  let initialY
  let xOffset = 0
  let yOffset = 0

  // Événements souris
  header.addEventListener("mousedown", dragStart)
  document.addEventListener("mousemove", drag)
  document.addEventListener("mouseup", dragEnd)
  
  // Événements tactiles
  header.addEventListener("touchstart", dragStart, { passive: false })
  document.addEventListener("touchmove", drag, { passive: false })
  document.addEventListener("touchend", dragEnd)

  function dragStart(e) {
    if (e.target.closest(".window-controls")) return

    const clientX = e.clientX || e.touches[0].clientX
    const clientY = e.clientY || e.touches[0].clientY
    
    initialX = clientX - xOffset
    initialY = clientY - yOffset

    if (e.target === header || header.contains(e.target)) {
      isDragging = true
      window.classList.add('dragging')
      focusWindow(window)
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault()
      
      const clientX = e.clientX || (e.touches && e.touches[0].clientX)
      const clientY = e.clientY || (e.touches && e.touches[0].clientY)
      
      if (clientX !== undefined && clientY !== undefined) {
        currentX = clientX - initialX
        currentY = clientY - initialY
        xOffset = currentX
        yOffset = currentY

        window.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`
      }
    }
  }

  function dragEnd(e) {
    if (isDragging) {
      initialX = currentX
      initialY = currentY
      isDragging = false
      window.classList.remove('dragging')
    }
  }
})

// Créer le conteneur de notifications
let notificationsContainer = document.querySelector('.notifications-container')
if (!notificationsContainer) {
  notificationsContainer = document.createElement('div')
  notificationsContainer.className = 'notifications-container'
  document.body.appendChild(notificationsContainer)
}

// Fonction pour afficher les notifications
function showNotification(message) {
  // Jouer le son de notification
  const notificationSound = new Audio('Assets/UI Sounds/notification.mp3')
  notificationSound.play().catch(e => console.log('Erreur audio:', e))

  // Créer l'élément de notification
  const notification = document.createElement('div')
  notification.className = 'notification'
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

  // Animation d'apparition
  setTimeout(() => notification.classList.add('show'), 100)

  // Suppression après 3 secondes
  setTimeout(() => {
    notification.classList.remove('show')
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 400)
  }, 3000)
}

// Island interactions
function showUserMenu() {
  showNotification("Menu utilisateur - Arrive bientôt !")
}

function showAppGrid() {
  showNotification("Grille d'applications - Arrive bientôt !")
}

function showControlCenter() {
  showNotification("Centre de contrôle - Arrive bientôt !")
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
let currentSite = 'google'
let browserHistory = ['google']
let historyIndex = 0

function navigateToUrl() {
  const urlBar = document.getElementById('urlBar')
  let url = urlBar.value.trim().toLowerCase()
  
  if (url.includes('youtube')) {
    loadSite('youtube')
  } else if (url.includes('github')) {
    loadSite('github')
  } else if (url.includes('stackoverflow')) {
    loadSite('stackoverflow')
  } else {
    loadSite('google')
  }
}

function loadSite(siteName) {
  document.querySelectorAll('.fake-site').forEach(site => {
    site.style.display = 'none'
  })
  
  document.getElementById(siteName).style.display = 'block'
  currentSite = siteName
  
  // Mettre à jour l'historique
  if (historyIndex < browserHistory.length - 1) {
    browserHistory = browserHistory.slice(0, historyIndex + 1)
  }
  browserHistory.push(siteName)
  historyIndex = browserHistory.length - 1
  
  // Mettre à jour l'URL
  const urlBar = document.getElementById('urlBar')
  const urls = {
    google: 'https://www.google.com',
    youtube: 'https://www.youtube.com',
    github: 'https://www.github.com',
    stackoverflow: 'https://stackoverflow.com'
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
const urlBar = document.getElementById('urlBar')
if (urlBar) {
  urlBar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      navigateToUrl()
    }
  })
}
