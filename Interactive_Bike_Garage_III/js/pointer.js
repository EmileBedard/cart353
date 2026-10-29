let currentTargetElement = null;
let hoverTimer = null;
const hoverDuration = 2000; //in milliseconds

// start is used for animations
let start = undefined;

document.addEventListener('DOMContentLoaded', () => {

    const customCursor = document.createElement("div");
    customCursor.id = "custom-cursor";
    document.body.appendChild(customCursor);
    updateCursorPosition(600);

});

//PROTOTYPING calls updateCursorPosition(xPos) with browsers mouseX position. will be commented when the IMU is implemented
document.addEventListener('mousemove', function (event) {
    let mouseX = event.clientX;
    updateCursorPosition(mouseX);
});


// here this functions needs to be called by the data updates from the imu passing from the websocket. the xPos parameter here will be the data from the imu used to control the pointer.
function updateCursorPosition(xPos) {

    const customCursor = document.getElementById("custom-cursor");

    const minX = 50;
    const maxX = window.innerWidth - 50;
    //clampedX outputs the position of the cursor limited to minX and maxX. Math.min outputs the min from the sequence and Math.max does similarly with maximum value
    const clampedX = Math.max(minX, Math.min(maxX, xPos));


    const fixedY = window.innerHeight / 2;
    customCursor.style.left = `${clampedX}px`;
    customCursor.style.top = `${fixedY}px`;

    // returns the element underneath
    let currentElement = null;
    const elementAtPoint = document.elementFromPoint(clampedX, fixedY);

    if (currentElement !== elementAtPoint) {
        currentElement = elementAtPoint;
        const interactiveElement = currentElement?.closest('button, a, .clickable, circle');
        handleHoverLogic(interactiveElement);
        console.log(currentElement);

    }

}

function handleHoverLogic(newTarget) {
    // Case 1: Cursor moved away from the target element -> reset timer
    if (newTarget !== currentTargetElement) {
        resetHoverTimer();
        currentTargetElement = newTarget;

        if (currentTargetElement) {
            console.log("Hover started", currentTargetElement);

            start = undefined;
            currentTargetElement.classList.add('hover-active');
            requestAnimationFrame(timestamp => animateProgress(currentTargetElement, timestamp));

            hoverTimer = setTimeout(() => {
                triggerDwellClick(currentTargetElement);

            }, hoverDuration);
        }

    }

}

//used to animate the selectable shapes
function animateProgress(target, timestamp) {
    if (target === circle) {
        console.log("is_circle")
        if (start === undefined) {
            start = timestamp;
        }
        const elapsed = timestamp - start;

        const arc = Math.min((0.04 * elapsed), 100);
        button.style.backgroundImage = `conic-gradient(at 50% -100%, #ffffff70 0deg, #ffffff70 ${arc}deg, transparent ${arc + 20}deg, transparent 240deg)`;

        if (arc < 240) {
            requestAnimationFrame(timestamp => animateProgress(target, timestamp));
        }
    }
}


function triggerDwellClick(element) {

    element.click();

    resetHoverTimer();
    currentTargetElement = null;
    start = undefined;
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