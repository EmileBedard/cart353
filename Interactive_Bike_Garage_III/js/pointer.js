let currentTargetElement = null;
let hoverTimer = null;
let animationFrameId = null;
const hoverDuration = 2300; //in milliseconds

// handles mapping of names and values fo each question
const bikeNames = ['Raleigh Grand Prix', 'Opus Vivace F1', 'Cervelo s1'];
const groupsets = {
    1: 'SRAM',
    2: 'Shimano',
    3: 'Campagnolo'
};
const bikeSpeeds = ['Single Speed', '3 speeds', '6 speeds', '7 speeds', '8 speeds', '11 speeds', '12 speeds', '14 speeds', '18 speeds', '21 speeds', '24 speeds',]

const bikeAnswers = [];

function getAnswer(questionIndex, slider) {
    const value = Number(slider.value);

    if (questionIndex === 0) return bikeNames[value - 1];
    if (questionIndex === 1) return bikeSpeeds[value - 1];
    if (questionIndex === 2) return groupsets[value];

    return value;
}

function updateAnswerDisplay(question, questionIndex, slider) {
    const output = question.querySelector('.value p');
    if (output) {
        output.textContent = String(getAnswer(questionIndex, slider));
    }
}

const idleDelay = 250; // wait this long after movement before starting dwell
let bikeQuestions = [];
let questionIndex = 0;
let idleTimer = null;
let dwellFrame = null;
let dwellStartedAt = null;
let lastX = null;

// start is used for animations
let start = null;

document.addEventListener('DOMContentLoaded', () => {

    const isIndexPage = window.location.pathname.includes('index.html');
    if (isIndexPage) {
        const customCursor = document.createElement("div");
        customCursor.id = "custom-cursor";
        document.body.appendChild(customCursor);
        updateCursorPosition(600);
    }

    const isIDPage = window.location.pathname.includes('bike_id.html');
    if (isIDPage) {
        initializeBikeQuestions();
    }

    const isMaintenancePage = window.location.pathname.includes('maintenance.html');
    if (isMaintenancePage) {
        const customCursor = document.createElement("div");
        customCursor.id = "custom-cursor";
        document.body.appendChild(customCursor);
        updateCursorPosition(600);
    }

    //PROTOTYPING calls updateCursorPosition(xPos) with browsers mouseX position. will be commented when the IMU is implemented
    document.addEventListener('mousemove', (event) => {
        updateCursorPosition(event.clientX);

        if (isIDPage) {
            handleBikeCursorMove(event.clientX);
        }
    });

});

// here this functions needs to be called by the data updates from the imu passing from the websocket. the xPos parameter here will be the data from the imu used to control the pointer.
function updateCursorPosition(xPos) {

    //index page cursor logic
    const isIndexpage = window.location.pathname.includes('index.html');
    const isMaintenancepage = window.location.pathname.includes('maintenance.html');

    if (isIndexpage) {
        const minX = 500;
        const maxX = window.innerWidth - 500;
        //clampedX outputs the position of the cursor limited to minX and maxX. Math.min outputs the min from the sequence and Math.max does similarly with maximum value
        const clampedX = Math.max(minX, Math.min(maxX, xPos));
        const fixedY = window.innerHeight / 2;

        if (document.querySelector('.spotLight')) {
            const spotCenter = document.querySelector('.spotLight');
            spotCenter.style.left = `${clampedX}px`;
            spotCenter.style.top = `${fixedY}px`;
        }

        if (document.getElementById("custom-cursor")) {
            const customCursor = document.getElementById("custom-cursor");
            customCursor.style.left = `${clampedX}px`;
            customCursor.style.top = `${fixedY}px`;
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
    if (isMaintenancepage) {
        const minX = 50;
        const maxX = window.innerWidth - 50;
        //clampedX outputs the position of the cursor limited to minX and maxX. Math.min outputs the min from the sequence and Math.max does similarly with maximum value
        const clampedX = Math.max(minX, Math.min(maxX, xPos));
        const fixedY = window.innerHeight / 2;

        if (document.getElementById("custom-cursor")) {
            const customCursor = document.getElementById("custom-cursor");
            customCursor.style.left = `${clampedX}px`;
            customCursor.style.top = `${fixedY}px`;
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




}

function handleHoverLogic(newTarget) {
    //animation logics to be triggered for the three.js scene
    //index animations
    const wasOnId = currentTargetElement?.closest("#bike-id-button");
    const isOnId = newTarget?.closest("#bike-id-button");
    if (wasOnId !== isOnId) {
        window.dispatchEvent(new CustomEvent("id-anim", { detail: !!isOnId }));
    }
    const wasOnMaintenance = currentTargetElement?.closest("#maintenance-button");
    const isOnMaintenance = newTarget?.closest("#maintenance-button");
    if (wasOnMaintenance !== isOnMaintenance) {
        window.dispatchEvent(new CustomEvent("maintenance-anim", { detail: !!isOnMaintenance }));
    }

    //maintenance animations
    const wasOnChain = currentTargetElement?.closest("#chain-button");
    const isOnChain = newTarget?.closest("#chain-button");
    if (wasOnChain !== isOnChain) {
        window.dispatchEvent(new CustomEvent("chain-anim", { detail: !!isOnChain }));
    }
    const wasOninnertube = currentTargetElement?.closest("#innertube-button");
    const isOninnertube = newTarget?.closest("#innertube-button");
    if (wasOninnertube !== isOninnertube) {
        window.dispatchEvent(new CustomEvent("innertube-anim", { detail: !!isOninnertube }));
    }
    const wasOnpads = currentTargetElement?.closest("#pads-button");
    const isOnpads = newTarget?.closest("#pads-button");
    if (wasOnpads !== isOnpads) {
        window.dispatchEvent(new CustomEvent("pads-anim", { detail: !!isOnpads }));
    }

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

function initializeBikeQuestions() {
    bikeQuestions = [...document.querySelectorAll('.question')];
    bikeQuestions.forEach((question, index) => {
        question.hidden = index !== 0;
    });
}

function updateBikeSlider(x) {
    const question = bikeQuestions[questionIndex];
    const valueText = question?.querySelector('.value')
    const slider = question?.querySelector('.slider');
    if (!slider || !valueText) return;

    const rect = slider.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    const min = Number(slider.min);
    const max = Number(slider.max);
    slider.value = String(Math.round(min + fraction * (max - min)));

    let valueTextPos = reMap(fraction, 0, 1, 0, 100);
    valueText.style.left = `${valueTextPos}%`;
    updateAnswerDisplay(question, questionIndex, slider);

}

function handleBikeCursorMove(x) {
    updateBikeSlider(x);

    if (lastX !== null && Math.abs(x - lastX) < 2) return;
    lastX = x;

    clearTimeout(idleTimer);
    cancelAnimationFrame(dwellFrame);
    dwellStartedAt = null;

    const question = bikeQuestions[questionIndex];
    const progressBar = question?.querySelector('.progressBar');
    if (!question || !progressBar) return; //making sure we have these elements before going further

    progressBar.style.width = '0%';

    idleTimer = setTimeout(() => {
        const tick = (timestamp) => {
            if (dwellStartedAt === null) dwellStartedAt = timestamp;

            const progress = Math.min((timestamp - dwellStartedAt) / hoverDuration, 1);
            progressBar.style.width = `${progress * 100}%`;

            if (progress === 1) {
                saveBikeAnswer(question);
            } else {
                dwellFrame = requestAnimationFrame(tick);
            }
        };

        dwellFrame = requestAnimationFrame(tick);
    }, idleDelay);
}

function saveBikeAnswer(question) {
    const slider = question.querySelector('.slider');
    const keys = ['bikeName', 'speeds', 'groupset'];
    // const link = 

    if (!(slider instanceof HTMLInputElement)) return;

    bikeAnswers[questionIndex] = getAnswer(questionIndex, slider);
    question.hidden = true;
    questionIndex++;

    if (questionIndex < bikeQuestions.length) {
        bikeQuestions[questionIndex].hidden = false;
    } else {
        console.log('Bike ID answers:', bikeAnswers);
        window.dispatchEvent(new CustomEvent("three-camera-move", {
            detail: {
                position: [1.423, 1.497, 6.699], // Replace with the index camera position
                onComplete: () => { window.location.href = "index.html" }
            }
        }));
    }
}


function triggerDwellClick(element) {
    if (element !== currentTargetElement) return;
    console.log(element)
    resetHoverTimer();
    hideElements(element);
    currentTargetElement = null;
    const link = element.closest("a");
    console.log(link)

    if (element.closest("#bike-id-button")) {
        window.dispatchEvent(new CustomEvent("three-camera-move", {
            detail: {
                position: [-24, 1.1, 9], // Replace with the destination camera position
                onComplete: () => link?.click()
            }
        }));
    }
    if (element.closest("#maintenance-button")) {
        window.dispatchEvent(new CustomEvent("three-camera-move", {
            detail: {
                position: [28, 1.1, 8], // Replace with the destination camera position
                onComplete: () => link?.click()
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
