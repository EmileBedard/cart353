let currentTargetElement = null;
let hoverTimer = null;
let animationFrameId = null;
const hoverDuration = 2300; //in milliseconds

// start is used for animations
let start = null;

document.addEventListener('DOMContentLoaded', () => {

    const isIndexpage = window.location.pathname.includes('index.html');
    if (isIndexpage) {
        const customCursor = document.createElement("div");
        customCursor.id = "custom-cursor";
        document.body.appendChild(customCursor);
        updateCursorPosition(600);
    }
    const isIDpage = window.location.pathname.includes('bike_id.html');
    if (isIDpage) {
        console.log("id page detected")
        updateCursorPosition(600);
    }

    //PROTOTYPING calls updateCursorPosition(xPos) with browsers mouseX position. will be commented when the IMU is implemented
    document.addEventListener('mousemove', function (event) {
        let mouseX = event.clientX;
        updateCursorPosition(mouseX);
    });

});




// here this functions needs to be called by the data updates from the imu passing from the websocket. the xPos parameter here will be the data from the imu used to control the pointer.
function updateCursorPosition(xPos) {

    //index page cursor logic
    const isIndexpage = window.location.pathname.includes('index.html');
    if (isIndexpage) {
        const minX = 500;
        const maxX = window.innerWidth - 500;
        //clampedX outputs the position of the cursor limited to minX and maxX. Math.min outputs the min from the sequence and Math.max does similarly with maximum value
        const clampedX = Math.max(minX, Math.min(maxX, xPos));
        const fixedY = window.innerHeight / 2;

        if (document.getElementById("custom-cursor")) {
            const customCursor = document.getElementById("custom-cursor");
            customCursor.style.left = `${clampedX}px`;
            customCursor.style.top = `${fixedY}px`;
        }

        if (document.querySelector('.spotLight')) {
            const spotCenter = document.querySelector('.spotLight');
            spotCenter.style.left = `${clampedX}px`;
            spotCenter.style.top = `${fixedY}px`;
        }

        // returns the element underneath
        let currentElement = null;
        const elementAtPoint = document.elementFromPoint(clampedX, fixedY);

        if (currentElement !== elementAtPoint) {
            currentElement = elementAtPoint;
            const interactiveElement = currentElement?.closest('button, a, .clickable, circle');
            handleHoverLogic(interactiveElement);

        }
    }

    //bikeId page cursor logic
    const isIDpage = window.location.pathname.includes('bike_id.html');
    if (isIDpage) {
        const minX = 100;
        const maxX = window.innerWidth - 100;
        let xPerctange = reMap(xPos, minX, maxX, 0, 100);
        console.log(xPerctange);

        const slider = document.querySelector('.question:not([hidden]) .slider');
        if (slider instanceof HTMLInputElement) {
            const rect = slider.getBoundingClientRect();
            const fraction = Math.max(0, Math.min(1, (xPos - rect.left) / rect.width));
            const min = Number(slider.min);
            const max = Number(slider.max);

            slider.value = String(min + fraction * (max - min));
        }

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
    console.log(element)
    resetHoverTimer();
    hideElements(element);
    currentTargetElement = null;
    const link = element.closest("a");

    if (element.closest("#bike-id-button")) {
        window.dispatchEvent(new CustomEvent("three-camera-move", {
            detail: {
                position: [-24, 1.1, 9], // Replace with the destination camera position
                // onComplete: () => link?.click()
            }
        }));
    }
    if (element.closest("#maintenance-button")) {
        window.dispatchEvent(new CustomEvent("three-camera-move", {
            detail: {
                position: [28, 1.1, 8], // Replace with the destination camera position
                // onComplete: () => link?.click()
            }
        }));
    }

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

function hideElements() {
    document.querySelector(".main-zone").style.display = "none";
}

// Source - https://stackoverflow.com/a/23202637
// Posted by August Miller, modified by community. See post 'Timeline' for change history
// Retrieved 2026-11-11, License - CC BY-SA 4.0

function reMap(number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}
