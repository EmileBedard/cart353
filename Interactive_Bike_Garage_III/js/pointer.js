let currentTargetElement = null;
let hoverTimer = null;
const hoverDuration = 5000; // 5 seconds

// Execute once the DOM is ready, create a pointer
document.addEventListener('DOMContentLoaded', () => {

    // 1. Create the container div
    const customCursor = document.createElement("div");
    customCursor.id = "custom-cursor";

    // 2. Style the custom cursor element directly
    Object.assign(customCursor.style, {
        position: 'fixed',
        top: '50%',                  // Center vertically (or set to your preferred fixed Y position)
        left: '50%',
        width: '10px',               // Set cursor size
        height: '10px',
        backgroundColor: 'red',  // Custom visual indicator
        borderRadius: '50%',
        pointerEvents: 'none',       // Crucial: lets clicks pass through to the Three.js canvas
        zIndex: '15',              // Ensures it stays on top of all canvas layers
        transform: 'translate(-50%, -50%)', // Centers the dot on the X position
        transition: 'transform 0.05s ease-out'
    });

    // 3. Append to the document body dynamically
    document.body.appendChild(customCursor);
});

// here this functions needs to be called by the data updates from the imu passing from the websocket. the xPos parameter here will be the data from the imu used to control the pointer.
function updateCursorPosition(xPos) {

    const minX = 50; //minimum range for cursor
    const maxX = window.innerWidth - 50; //maximum range for cursor
    const clampedX = Math.max(minX, Math.min(maxX, xPos));


    const fixedY = window.innerHeight / 2; //fixed along y axis
    customCursor.style.left = `${clampedX}px`;
    customCursor.style.top = `${fixedY}px`;

    // 3. Find the element beneath the cursor's current (X, Y) coordinates
    const elementAtPoint = document.elementFromPoint(clampedX, fixedY);

    // Check if the element (or its parent) is an interactive HTML button/link
    const interactiveElement = elementAtPoint?.closest('button, a, .clickable');

    handleHoverLogic(interactiveElement);
}

function handleHoverLogic(newTarget) {
    // Case 1: Cursor moved away from the target element -> reset timer
    if (newTarget !== currentTargetElement) {
        resetHoverTimer();
        currentTargetElement = newTarget;

        // Case 2: Cursor entered a new clickable element -> start 10s timer
        if (currentTargetElement) {
            console.log("Hover started on element:", currentTargetElement);

            // Optional: Add visual feedback (e.g., CSS loading ring or color change)
            currentTargetElement.classList.add('hover-active');

            hoverTimer = setTimeout(() => {
                triggerDwellClick(currentTargetElement);
            }, hoverDuration);
        }
    }
}

function resetHoverTimer() {
    if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
    }
    if (currentTargetElement) {
        currentTargetElement.classList.remove('hover-active');
    }
}

function triggerDwellClick(element) {

    // Dispatch standard click event
    element.click();

    // Reset target state after activation
    resetHoverTimer();
    currentTargetElement = null;
}