// UEFI Functions
function updateUefiTime() {
  const now = new Date()
  const timeElement = document.getElementById('uefiTime')
  const dateElement = document.getElementById('uefiDate')
  
  if (timeElement) {
    timeElement.textContent = now.toLocaleTimeString('fr-FR')
  }
  if (dateElement) {
    dateElement.textContent = now.toLocaleDateString('fr-FR')
  }
}

function exitUefi() {
  // Retourner à la page principale
  window.location.href = '../index.html'
}

function resetUefi() {
  alert('Paramètres UEFI réinitialisés aux valeurs par défaut')
}

// Tab Navigation
document.addEventListener('DOMContentLoaded', () => {
  // Update time immediately and then every second
  updateUefiTime()
  setInterval(updateUefiTime, 1000)
  
  // Tab navigation
  document.querySelectorAll('.uefi-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      document.querySelectorAll('.uefi-tab').forEach(t => t.classList.remove('active'))
      document.querySelectorAll('.uefi-tab-content').forEach(c => c.style.display = 'none')
      
      // Activate clicked tab
      tab.classList.add('active')
      const tabId = tab.getAttribute('data-tab')
      const content = document.getElementById(tabId)
      if (content) content.style.display = 'block'
    })
  })
})

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'Escape':
      exitUefi()
      break
    case 'F10':
      exitUefi()
      break
  }
})