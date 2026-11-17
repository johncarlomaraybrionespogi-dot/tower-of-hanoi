

const diskCount = document.getElementById("diskCount");
const solveBtn = document.getElementById("solveBtn");
const resetBtn = document.getElementById("resetBtn");

const moveCount = document.getElementById("moveCount");
const minimumMoves = document.getElementById("minimumMoves");
const gameStatus = document.getElementById("gameStatus");

const soundToggle = document.getElementById("soundToggle");


let disks = 5;
let moves = 0;
let solving = false;



let towers = {
    left: [],
    middle: [],
    right: []
};



const colors = [
    "#ff595e",
    "#ff924c",
    "#ffca3a",
    "#8ac926",
    "#1982c4",
    "#6a4c93",
    "#f15bb5"
];



function initializeGame() {

    disks = Number(diskCount.value);

    moves = 0;

    towers = {
        left: [],
        middle: [],
        right: []
    };

   

    for (let i = disks; i >= 1; i--) {
        towers.left.push(i);
    }

    updateGame();
    renderTowers();

    gameStatus.textContent = "Ready";
    solveBtn.disabled = false;
    solveBtn.textContent = "▶ AUTO SOLVE";
}


function renderTowers() {

    const towerNames = ["left", "middle", "right"];

    towerNames.forEach(towerName => {

        const diskContainer = document.querySelector(
            '#'+towerName+' .disks'
        );

        diskContainer.innerHTML = "";

        towers[towerName].forEach(diskSize => {

            const disk = document.createElement("div");

            disk.className = "disk";

            disk.dataset.size = diskSize;

            

            disk.style.width =
                (45 + diskSize * 25) + "px";

            

            disk.style.background =
                colors[(diskSize - 1) % colors.length];

            disk.title = "Ring " + diskSize;

            diskContainer.appendChild(disk);

        });

    });

}



function updateGame() {

    moveCount.textContent = moves;

    minimumMoves.textContent =
        Math.pow(2, disks) - 1;

}



let audioContext = null;

function playRingSound() {

    if (!soundToggle.checked) {
        return;
    }

    try {

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            return;
        }

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();

        const gain = audioContext.createGain();

        oscillator.type = "sine";

        

        oscillator.frequency.setValueAtTime(
            520,
            audioContext.currentTime
        );

        oscillator.frequency.exponentialRampToValueAtTime(
            260,
            audioContext.currentTime + 0.12
        );

        gain.gain.setValueAtTime(
            0.15,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + 0.15
        );

        oscillator.connect(gain);

        gain.connect(audioContext.destination);

        oscillator.start();

        oscillator.stop(audioContext.currentTime + 0.15);

    } catch (error) {

        console.log("Sound unavailable:", error);

    }

}



function wait(milliseconds) {

    return new Promise(resolve => {

        setTimeout(resolve, milliseconds);

    });

}



async function moveDisk(from, to) {

    const source = towers[from];
    const destination = towers[to];

    
    if (!source || source.length === 0) {
        throw new Error("The source tower is empty.");
    }

    if (!destination) {
        throw new Error("Destination tower not found.");
    }

    const diskSize = source[source.length - 1];

    
    if (
        destination.length > 0 &&
        destination[destination.length - 1] < diskSize
    ) {
        throw new Error("Invalid ring movement.");
    }

   
    const oldDisk = document.querySelector(
        '#' + from + ' .disk[data-size="' + diskSize + '"]'
    );

    if (!oldDisk) {
        throw new Error("Cannot find the moving ring in " + from);
    }

    const oldPosition = oldDisk.getBoundingClientRect();

    
    source.pop();
    destination.push(diskSize);

    
    renderTowers();

    
    const newDisk = document.querySelector(
        '#' + to + ' .disks .disk[data-size="' + diskSize + '"]'
    );

    if (!newDisk) {
        throw new Error("Cannot find the moving ring in " + to);
    }

    const newPosition = newDisk.getBoundingClientRect();

    
    const moveX = oldPosition.left - newPosition.left;
    const moveY = oldPosition.top - newPosition.top;

    
    newDisk.animate(
        [
            {transform: 'translate(${moveX}px, ${moveY}px)'},
            {transform: "translate(0px, 0px)"}   
        ],
        {duration: 450, easing: "ease-in-out"}
      );

    
    playRingSound();

    
    moves++;
    updateGame();

    
    await wait(500);

}



async function getPrologSolution(numberOfDisks) {

    const response = await fetch("/api/solve", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            disks: numberOfDisks
        })

    });

    if (!response.ok) {

        throw new Error(
            "Prolog server returned an error."
        );

    }

    const data = await response.json();

    if (data.error) {

        throw new Error(data.error);

    }

    if (!Array.isArray(data.moves)) {

        throw new Error(
            "Invalid solution received from Prolog."
        );

    }

    return data.moves;

}



async function autoSolve() {

    if (solving) {
        return;
    }

   

    initializeGame();

    solving = true;

    solveBtn.disabled = true;
    resetBtn.disabled = true;
    diskCount.disabled = true;

    gameStatus.textContent = "Solving...";

    try {

        
        const solution =
            await getPrologSolution(disks);

        

        for (const move of solution) {

            await moveDisk(move.from, move.to);

            gameStatus.textContent =
                "Moving " + moves + " / " + solution.length;

        }

        gameStatus.textContent = "Solved!";

        solveBtn.textContent = "✓ COMPLETED";

    } catch (error) {

        console.error(error);

        gameStatus.textContent = "Error";

        alert(
            "Unable to solve the puzzle.\n\n" +
            error.message +
            "\n\nPlease check that the Prolog server is running."
        );

    } finally {

        solving = false;

        solveBtn.disabled = false;
        resetBtn.disabled = false;
        diskCount.disabled = false;

        if (gameStatus.textContent === "Error") {

            solveBtn.textContent = "▶ AUTO SOLVE";

        }

    }

}



function resetGame() {

    if (solving) {
        return;
    }

    initializeGame();

}



solveBtn.addEventListener("click", autoSolve);

resetBtn.addEventListener("click", resetGame);


diskCount.addEventListener("change", () => {

    if (!solving) {

        initializeGame();

    }

});


initializeGame();

console.log("Tower of Hanoi Game Loaded!");