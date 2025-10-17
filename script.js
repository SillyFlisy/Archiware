let isLocked = true
let isBooting = true
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
let use24HourFormat = true
let notificationQueue = []
let isNotificationShowing = false
let userMenuVisible = false
let minimizedWindows = new Set()

// Load saved settings
function loadSettings() {
  const savedUsername = localStorage.getItem('archiware_username')
  const savedWallpaper = localStorage.getItem('archiware_wallpaper')
  const savedProfile = localStorage.getItem('archiware_profile')
  const savedTimeFormat = localStorage.getItem('archiware_timeformat')
  
  if (savedUsername) {
    document.getElementById('usernameDisplay').textContent = savedUsername
    document.getElementById('menuUsername').textContent = savedUsername
    document.getElementById('usernameInput').value = savedUsername
    document.getElementById('avatarText').textContent = savedUsername.charAt(0).toUpperCase()
    document.getElementById('menuAvatarText').textContent = savedUsername.charAt(0).toUpperCase()
  }
  
  if (savedWallpaper) {
    document.querySelectorAll('.liquid-bg').forEach(bg => {
      bg.style.backgroundImage = `url(${savedWallpaper})`
    })
  }
  
  if (savedProfile) {
    document.getElementById('profileImage').src = savedProfile
    document.getElementById('profileImage').style.display = 'block'
    document.getElementById('menuProfileImage').src = savedProfile
    document.getElementById('menuProfileImage').style.display = 'block'
    document.getElementById('avatarText').style.display = 'none'
    document.getElementById('menuAvatarText').style.display = 'none'
  }
  
  if (savedTimeFormat) {
    use24HourFormat = savedTimeFormat === '24'
    document.getElementById('timeFormatSelect').value = savedTimeFormat
  }
}

// Boot Animation
function startBootSequence() {
  const bootScreen = document.getElementById('bootScreen')
  
  // Play startup sound
  const startupSound = new Audio('Assets/UI Sounds/startup.mp3')
  startupSound.play().catch(e => console.log('Erreur audio:', e))
  
  setTimeout(() => {
    bootScreen.classList.add('hidden')
    setTimeout(() => {
      bootScreen.style.display = 'none'
      isBooting = false
    }, 1000)
  }, 4000)
}

function shouldShowBoot() {
  const hasBooted = localStorage.getItem('archiware_has_booted')
  return !hasBooted
}

function markAsBooted() {
  localStorage.setItem('archiware_has_booted', 'true')
}



// Start boot sequence on page load
window.addEventListener('load', () => {
  loadSettings()
  if (shouldShowBoot()) {
    startBootSequence()
    markAsBooted()
  } else {
    document.getElementById('bootScreen').style.display = 'none'
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
document.addEventListener('dragstart', (e) => {
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
    window.style.left = pos.x + 'px'
    window.style.top = pos.y + 'px'
    window.style.transform = 'translate(-50%, -50%)'
    
    // Register position
    windowPositions.push({ id: windowId, x: pos.x, y: pos.y })
    
    focusWindow(window)
    setTimeout(() => {
      window.style.animation = ""
    }, 10)
  }
}

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
  const fingerprintSensor = document.getElementById("fingerprintSensor")

  isLocked = false

  // Animation mobile : fingerprint vers dock
  if (isMobile && fingerprintSensor) {
    fingerprintSensor.classList.add('fingerprint-unlock')
    setTimeout(() => {
      // Faire apparaître le dock à la place
      const dock = document.querySelector('.dock')
      if (dock) {
        dock.style.opacity = '1'
        dock.style.transform = 'translateX(-50%) translateY(0)'
      }
    }, 750)
  }

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
  usernameInput.addEventListener("input", (e) => {
    const newUsername = e.target.value
    document.getElementById('usernameDisplay').textContent = newUsername
    document.getElementById('menuUsername').textContent = newUsername
    document.getElementById('avatarText').textContent = newUsername.charAt(0).toUpperCase()
    document.getElementById('menuAvatarText').textContent = newUsername.charAt(0).toUpperCase()
    localStorage.setItem('archiware_username', newUsername)
  })
}

// Settings Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const wallpaperInput = document.getElementById('wallpaperInput')
  if (wallpaperInput) {
    wallpaperInput.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageUrl = e.target.result
          document.querySelectorAll('.liquid-bg').forEach(bg => {
            bg.style.backgroundImage = `url(${imageUrl})`
          })
          localStorage.setItem('archiware_wallpaper', imageUrl)
          showNotification('Fond d\'écran modifié avec succès')
        }
        reader.readAsDataURL(file)
      }
    })
  }
  
  const profileInput = document.getElementById('profileInput')
  if (profileInput) {
    profileInput.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageUrl = e.target.result
          document.getElementById('profileImage').src = imageUrl
          document.getElementById('profileImage').style.display = 'block'
          document.getElementById('menuProfileImage').src = imageUrl
          document.getElementById('menuProfileImage').style.display = 'block'
          document.getElementById('avatarText').style.display = 'none'
          document.getElementById('menuAvatarText').style.display = 'none'
          localStorage.setItem('archiware_profile', imageUrl)
          showNotification('Photo de profil modifiée avec succès')
        }
        reader.readAsDataURL(file)
      }
    })
  }
})

if (timeFormatSelect) {
  timeFormatSelect.addEventListener("change", (e) => {
    use24HourFormat = e.target.value === "24"
    localStorage.setItem('archiware_timeformat', e.target.value)
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

// Enhanced Window Controls
function minimizeWindow(windowId) {
  const window = document.getElementById(windowId)
  if (window) {
    window.style.animation = 'windowMinimize 0.3s cubic-bezier(0.4, 0, 1, 1) forwards'
    minimizedWindows.add(windowId)
    
    setTimeout(() => {
      window.style.display = 'none'
      window.style.animation = ''
    }, 300)
  }
}

function maximizeWindow(windowId) {
  const window = document.getElementById(windowId)
  if (window) {
    const isMaximized = window.classList.contains('maximized')
    
    if (isMaximized) {
      window.classList.remove('maximized')
      window.style.width = '700px'
      window.style.height = '500px'
      window.style.left = '50%'
      window.style.top = '50%'
      window.style.transform = 'translate(-50%, -50%)'
    } else {
      window.classList.add('maximized')
      window.style.width = 'calc(100vw - 40px)'
      window.style.height = 'calc(100vh - 120px)'
      window.style.left = '20px'
      window.style.top = '20px'
      window.style.transform = 'none'
    }
  }
}

// Add window control event listeners
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.minimize-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const windowId = e.target.closest('.window').id
      minimizeWindow(windowId)
    })
  })
  
  document.querySelectorAll('.maximize-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const windowId = e.target.closest('.window').id
      maximizeWindow(windowId)
    })
  })
})

// Enhanced dragging with teleportation fix
document.querySelectorAll(".window").forEach((window) => {
  const header = window.querySelector(".window-header")
  let isDragging = false
  let currentX = 0
  let currentY = 0
  let initialX
  let initialY
  let xOffset = 0
  let yOffset = 0
  let dragStartTime = 0

  header.addEventListener("mousedown", dragStart)
  document.addEventListener("mousemove", drag)
  document.addEventListener("mouseup", dragEnd)
  
  header.addEventListener("touchstart", dragStart, { passive: false })
  document.addEventListener("touchmove", drag, { passive: false })
  document.addEventListener("touchend", dragEnd)

  function dragStart(e) {
    if (e.target.closest(".window-controls")) return

    dragStartTime = Date.now()
    const clientX = e.clientX || e.touches[0].clientX
    const clientY = e.clientY || e.touches[0].clientY
    
    const rect = window.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(window)
    const transform = computedStyle.transform
    
    if (transform && transform !== 'none') {
      const matrix = new DOMMatrix(transform)
      xOffset = matrix.m41
      yOffset = matrix.m42
    } else {
      xOffset = 0
      yOffset = 0
    }
    
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
        
        // Prevent teleportation by limiting movement speed
        const dragDuration = Date.now() - dragStartTime
        if (dragDuration > 50) { // Only update position after 50ms
          xOffset = currentX
          yOffset = currentY
          window.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`
        }
      }
    }
  }

  function dragEnd(e) {
    if (isDragging) {
      isDragging = false
      window.classList.remove('dragging')
    }
  }
})

// Window Resizing
document.querySelectorAll('.window').forEach(window => {
  const resizeHandles = window.querySelectorAll('.resize-handle')
  let isResizing = false
  let resizeType = ''
  let startX, startY, startWidth, startHeight, startLeft, startTop

  resizeHandles.forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      isResizing = true
      resizeType = handle.className.split(' ')[1]
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

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return
    
    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY
    
    let newWidth = startWidth
    let newHeight = startHeight
    let newLeft = startLeft
    let newTop = startTop
    
    if (resizeType.includes('e')) newWidth = startWidth + deltaX
    if (resizeType.includes('w')) {
      newWidth = startWidth - deltaX
      newLeft = startLeft + deltaX
    }
    if (resizeType.includes('s')) newHeight = startHeight + deltaY
    if (resizeType.includes('n')) {
      newHeight = startHeight - deltaY
      newTop = startTop + deltaY
    }
    
    newWidth = Math.max(300, newWidth)
    newHeight = Math.max(200, newHeight)
    
    window.style.width = newWidth + 'px'
    window.style.height = newHeight + 'px'
    window.style.left = newLeft + 'px'
    window.style.top = newTop + 'px'
    window.style.transform = 'none'
  })

  document.addEventListener('mouseup', () => {
    isResizing = false
    resizeType = ''
  })
})

// Créer le conteneur de notifications
let notificationsContainer = document.querySelector('.notifications-container')
if (!notificationsContainer) {
  notificationsContainer = document.createElement('div')
  notificationsContainer.className = 'notifications-container'
  document.body.appendChild(notificationsContainer)
}

// Enhanced Notification System with Queue
function showNotification(message) {
  notificationQueue.push(message)
  processNotificationQueue()
}

function processNotificationQueue() {
  if (isNotificationShowing || notificationQueue.length === 0) return
  
  isNotificationShowing = true
  const message = notificationQueue.shift()
  
  // Hide right island on mobile when notification appears
  if (isMobile) {
    const rightIsland = document.querySelector('.right-island')
    if (rightIsland) {
      rightIsland.classList.add('hidden')
    }
  }
  
  // Play notification sound
  const notificationSound = new Audio('Assets/UI Sounds/notification.mp3')
  notificationSound.play().catch(e => console.log('Erreur audio:', e))

  // Create notification element
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

  // Show animation
  setTimeout(() => notification.classList.add('show'), 100)

  // Hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show')
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
      isNotificationShowing = false
      
      // Show right island again on mobile
      if (isMobile) {
        const rightIsland = document.querySelector('.right-island')
        if (rightIsland) {
          rightIsland.classList.remove('hidden')
        }
      }
      
      // Process next notification in queue
      processNotificationQueue()
    }, 400)
  }, 3000)
}

// User Menu Functions
function toggleUserMenu() {
  const userMenu = document.getElementById('userMenu')
  userMenuVisible = !userMenuVisible
  
  if (userMenuVisible) {
    userMenu.classList.add('show')
    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', closeUserMenuOnClickOutside)
    }, 100)
  } else {
    hideUserMenu()
  }
}

function hideUserMenu() {
  const userMenu = document.getElementById('userMenu')
  userMenu.classList.remove('show')
  userMenuVisible = false
  document.removeEventListener('click', closeUserMenuOnClickOutside)
}

function closeUserMenuOnClickOutside(e) {
  const userMenu = document.getElementById('userMenu')
  const userProfile = document.querySelector('.user-profile')
  
  if (!userMenu.contains(e.target) && !userProfile.contains(e.target)) {
    hideUserMenu()
  }
}

// System Functions
function restartSystem() {
  const restartSound = new Audio('Assets/UI Sounds/restart.mp3')
  restartSound.play().catch(e => console.log('Erreur audio:', e))
  
  showNotification('Redémarrage en cours...')
  localStorage.removeItem('archiware_has_booted')
  setTimeout(() => {
    location.reload()
  }, 2000)
}

function shutdownSystem() {
  const warningSound = new Audio('Assets/UI Sounds/warning.mp3')
  warningSound.play().catch(e => console.log('Erreur audio:', e))
  
  showNotification('Arrêt du système...')
  setTimeout(() => {
    document.body.style.background = 'black'
    document.body.innerHTML = '<div style="color: white; text-align: center; padding-top: 45vh; font-family: monospace;">Système arrêté. Vous pouvez fermer cette fenêtre.</div>'
  }, 2000)
}

// Island interactions
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

// Prevent context menu on long press (mobile)
document.addEventListener('contextmenu', (e) => {
  if (isMobile) {
    e.preventDefault()
  }
})

// Enhanced mobile fingerprint unlock
if (isMobile) {
  const fingerprintSensor = document.getElementById('fingerprintSensor')
  if (fingerprintSensor) {
    fingerprintSensor.addEventListener('touchstart', (e) => {
      e.preventDefault()
      if (isLocked) {
        unlockDevice()
      }
    }, { passive: false })
  }
}
