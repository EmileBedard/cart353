// Execute once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {

    const customCursor = document.createElement("div");
    customCursor.id = "custom-cursor";

    // 2. Style the custom cursor element directly
    Object.assign(customCursor.style, {
        position: 'fixed',
        top: '50%',                  // Center vertically (or set to your preferred fixed Y position)
        left: '0px',
        width: '20px',               // Set cursor size
        height: '20px',
        backgroundColor: '#ffffff',  // Custom visual indicator
        borderRadius: '50%',
        pointerEvents: 'none',       // Crucial: lets clicks pass through to the Three.js canvas
        zIndex: '5',              // Ensures it stays on top of all canvas layers
        transform: 'translate(-50%, -50%)', // Centers the dot on the X position
        transition: 'transform 0.05s ease-out'
    });

    // 3. Append to the document body dynamically
    document.body.appendChild(customCursor);

    // 4. Pointer Lock & Movement Logic
    const minX = 100; // Minimum screen X limit in pixels
    const maxX = window.innerWidth - 100; // Maximum screen X limit in pixels
    let currentX = window.innerWidth / 2;

    // Click anywhere to activate pointer lock
    document.body.addEventListener('click', () => {
        if (document.pointerLockElement !== document.body) {
            document.body.requestPointerLock();
        }
    });

    // Update position on mouse movement
    document.addEventListener('mousemove', (event) => {
        if (document.pointerLockElement === document.body) {
            currentX += event.movementX;

            // Clamp between min and max bounds
            currentX = Math.max(minX, Math.min(maxX, currentX));

            // Move the custom cursor along X only (Y stays at fixed 50% viewport height)
            customCursor.style.left = `${currentX}px`;
        }
    });
});