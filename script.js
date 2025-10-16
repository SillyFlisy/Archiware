// Time Update
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    // Update lockscreen time
    const lockTime = document.getElementById('lockTime');
    if (lockTime) lockTime.textContent = timeString;
    
    // Update top bar time
    const topBarTime = document.getElementById('topBarTime');
    if (topBarTime) topBarTime.textContent = timeString;
    
    // Update date
    const lockDate = document.getElementById('lockDate');
    if (lockDate) {
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        const dateString = now.toLocaleDateString('fr-FR', options);
        lockDate.textContent = dateString.charAt(0).toUpperCase() + dateString.slice(1);
    }
}

// Initialize time
updateTime();
setInterval(updateTime, 1000);

// Lockscreen Swipe to Unlock
const lockscreen = document.getElementById('lockscreen');
const swipeArea = document.getElementById('swipeArea');
let startY = 0;
let currentY = 0;
let isDragging = false;

swipeArea.addEventListener('touchstart', handleTouchStart, { passive: false });
swipeArea.addEventListener('touchmove', handleTouchMove, { passive: false });
swipeArea.addEventListener('touchend', handleTouchEnd);

swipeArea.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mouseup', handleMouseUp);

function handleTouchStart(e) {
    startY = e.touches[0].clientY;
    isDragging = true;
}

function handleTouchMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    currentY = e.touches[0].clientY;
    const deltaY = startY - currentY;
    
    if (deltaY > 0) {
        const opacity = Math.max(0, 1 - deltaY / 300);
        lockscreen.style.opacity = opacity;
    }
}

function handleTouchEnd() {
    if (!isDragging) return;
    isDragging = false;
    
    const deltaY = startY - currentY;
    
    if (deltaY > 150) {
        unlockScreen();
    } else {
        lockscreen.style.opacity = '1';
    }
}

function handleMouseDown(e) {
    startY = e.clientY;
    isDragging = true;
    swipeArea.style.cursor = 'grabbing';
}

function handleMouseMove(e) {
    if (!isDragging) return;
    currentY = e.clientY;
    const deltaY = startY - currentY;
    
    if (deltaY > 0) {
        const opacity = Math.max(0, 1 - deltaY / 300);
        lockscreen.style.opacity = opacity;
    }
}

function handleMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    swipeArea.style.cursor = 'grab';
    
    const deltaY = startY - currentY;
    
    if (deltaY > 150) {
        unlockScreen();
    } else {
        lockscreen.style.opacity = '1';
    }
}

function unlockScreen() {
    lockscreen.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    lockscreen.style.opacity = '0';
    lockscreen.style.transform = 'translateY(-100%)';
    
    setTimeout(() => {
        lockscreen.classList.remove('active');
        lockscreen.style.transition = '';
        lockscreen.style.transform = '';
    }, 600);
}

// Window Management
let activeWindow = null;
let isDraggingWindow = false;
let windowStartX = 0;
let windowStartY = 0;
let mouseStartX = 0;
let mouseStartY = 0;

function openWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;
    
    // Close other windows
    document.querySelectorAll('.window').forEach(w => {
        if (w.id !== windowId) {
            w.style.display = 'none';
        }
    });
    
    // Show and center window
    window.style.display = 'block';
    centerWindow(window);
    
    // Setup drag
    const header = window.querySelector('.window-header');
    header.addEventListener('mousedown', startDragWindow);
}

function closeWindow(windowId) {
    const window = document.getElementById(windowId);
    if (!window) return;
    
    window.style.animation = 'windowDisappear 0.3s cubic-bezier(0.4, 0, 1, 1)';
    setTimeout(() => {
        window.style.display = 'none';
        window.style.animation = '';
    }, 300);
}

function centerWindow(window) {
    const containerRect = document.getElementById('windowsContainer').getBoundingClientRect();
    const windowRect = window.getBoundingClientRect();
    
    const left = (containerRect.width - windowRect.width) / 2;
    const top = (containerRect.height - windowRect.height) / 2;
    
    window.style.left = `${left}px`;
    window.style.top = `${top}px`;
}

function startDragWindow(e) {
    activeWindow = e.target.closest('.window');
    if (!activeWindow) return;
    
    isDraggingWindow = true;
    
    const rect = activeWindow.getBoundingClientRect();
    windowStartX = rect.left;
    windowStartY = rect.top;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
    
    document.addEventListener('mousemove', dragWindow);
    document.addEventListener('mouseup', stopDragWindow);
}

function dragWindow(e) {
    if (!isDraggingWindow || !activeWindow) return;
    
    const deltaX = e.clientX - mouseStartX;
    const deltaY = e.clientY - mouseStartY;
    
    activeWindow.style.left = `${windowStartX + deltaX}px`;
    activeWindow.style.top = `${windowStartY + deltaY}px`;
}

function stopDragWindow() {
    isDraggingWindow = false;
    activeWindow = null;
    document.removeEventListener('mousemove', dragWindow);
    document.removeEventListener('mouseup', stopDragWindow);
}

// Add window disappear animation
const style = document.createElement('style');
style.textContent = `
    @keyframes windowDisappear {
        to {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
        }
    }
`;
document.head.appendChild(style);

// Initialize - Show lockscreen on load
window.addEventListener('load', () => {
    lockscreen.classList.add('active');
});
