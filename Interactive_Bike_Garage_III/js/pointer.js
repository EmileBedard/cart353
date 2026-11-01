let currentTargetElement = null;
let hoverTimer = null;
let animationFrameId = null;
const hoverDuration = 2300; //in milliseconds

// start is used for animations
let start = null;

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

    }

}

function handleHoverLogic(newTarget) {
    const textElement = document.getElementById

    if (newTarget !== currentTargetElement) {
        resetHoverTimer();
        currentTargetElement = newTarget;

        if (!currentTargetElement) return;

        currentTargetElement.classList.add('hover-active');
        currentTargetElement.style.strokeDasharray = '0 100';

        if (currentTargetElement.parentElement.parentElement.firstElementChild.nodeName === "P") {
            const pText = currentTargetElement.parentElement.parentElement.firstElementChild
            pText.classList.add('hover-active');
        }

        animationFrameId = requestAnimationFrame(timestamp => animateProgress(currentTargetElement, timestamp));
        hoverTimer = setTimeout(() => {
            triggerDwellClick(currentTargetElement);

        }, hoverDuration);
    }

}



//used to animate the selectable shapes
function animateProgress(target, timestamp) {
    if (target !== currentTargetElement) return;

    if (start === null) {
        start = timestamp;
    }

    const elapsed = timestamp - start;
    const progress = Math.min(100 * elapsed / hoverDuration, 100);
    target.style.strokeDasharray = `${progress} 100`;

    if (progress < 100) {
        animationFrameId = requestAnimationFrame(nextTimestamp =>
            animateProgress(target, nextTimestamp)
        );
    } else {
        animationFrameId = null;
    }
}


function triggerDwellClick(element) {
    if (element !== currentTargetElement) return;

    resetHoverTimer();
    currentTargetElement = null;
    element.click();
}

function resetHoverTimer() {
    if (hoverTimer !== null) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
    }

    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    if (currentTargetElement) {
        currentTargetElement.style.strokeDasharray = '100 100';
        currentTargetElement.classList.remove('hover-active');
        currentTargetElement.closest('a')?.querySelector('p')?.classList.remove('hover-active');
    }

    start = null;
}