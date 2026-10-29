import { getDetections } from "./assets/video_process.js";

//DOM elements
const video = (window.video = document.getElementById("webcam_canvas"));
const canvas = (window.canvas = document.getElementById("out_canvas"));
const duckCoordinates = document.getElementById('duck-coordinates')

const audio = new Audio('assets/quack_5.mp3');
audio.preload = 'auto';

audio.addEventListener('canplaythrough', () => {
  console.log('Quack audio is ready');
});

audio.addEventListener('error', () => {
  console.error('Audio failed to load:', audio.error);
});

const endScreenBackground = document.getElementById("endScreenBackground")
const endScreen = document.getElementById("endScreen")

let fanRotation = 0;

const fanValue = document.getElementById('fanValue');

let time = 100;

let duckAddTimeout = 3000

const fanScreen = document.getElementById('fanScreen')

let fanStarted = false;

let hitPopUp = document.getElementById("hit-pop-up")

let defaultScreen = document.getElementById("mainScreen")

const duckcounter = document.getElementById("duckcounter");
const duckadder = document.getElementById("addduck")

const triggeredDuckCounts = new Set();

const titleDiv = document.getElementById("titleObject")

const titleText = new String("Duck Moving Time")

let loadingCounter = 0

let timerWeight = 0

let numHits = 0
const activeCollisions = new Set();

const hitBox = document.getElementById("hits")
hitBox.style.fontVariationSettings = `'wght' ${300}`

let hitBoxWeight = 300

let previousNumDucks = 0;
let pendingDuckCount = null;
let duckCountTimeout = null;

let duckAddCounter = 0

let duckPositions = {

  0: { x: 0, y: 0 },
  1: { x: 0, y: 0 },
  2: { x: 0, y: 0 },
  4: { x: 0, y: 0 }

};

let rotation = 40;
let weight = 300;
let size = 100;

const weightSetting = document.getElementById("weight-setting")
const sizeSetting = document.getElementById("size-setting")
const rotaSetting = document.getElementById("rotation-setting")


let tiles = ["#7EA2DE", "#91E1F8", "#F4F4F4"]

let tilesOpposite = ["#F4F4F4", "#91E1F8", "#7EA2DE"]

let gridTile

let alphabet = ["Aa", "Bb", "Cc", "Dd", "Ee", "Ff", "Gg", "Hh", "Ii", "Jj", "Kk", "Ll", "Mm", "Nn", "Oo", "Pp", "Qq", "Rr", "Ss", "Tt", "Uu", "Vv", "Ww", "Xx", "Yy", "Zz", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

const letterShowcase = document.getElementById('lettershowcase')
const loadingScreen = document.getElementById('loading')

let grid = document.getElementById("grid")
let counter = 0

let canvasRect = canvas.getBoundingClientRect()

let numDucks = 0


//dimensions for canvas
canvas.width = 480;
canvas.height = 360;

//constraints for webcam
const constraints = {
  audio: false,
  video: true,
  video: { width: 1280, height: 720 },
};

//success
function handleSuccess(stream) {
  window.stream = stream;
  video.srcObject = stream;
}

//potential error
function handleError(error) {
  console.log(
    "navigator.MediaDevices.getUserMedia error: ",
    error.message,
    error.name
  );
}
//webcam
navigator.mediaDevices
  .getUserMedia(constraints)
  .then(handleSuccess)
  .catch(handleError);


function map(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

createTitle()


function loop() {

  requestAnimationFrame(loop);

  if(time == 0){

    changeRotation()
  }
  
  updateFan()

  updateFontSettings()

  animateTitle()

  animateLoading()

  const highlightedTiles = new Set();

  const detections = getDetections();

  numDucks = detections.length

  duckCoordinates.innerHTML = duckAddCounter

  checkNumDucksChanged()

  const currentCollisions = new Set();

  const activeDuckIds = Object.keys(duckPositions)
  .map(Number)
  .filter(id => detections.some(det => det.id === id));

  for (let i = 0; i < activeDuckIds.length; i++) {
    for (let j = i + 1; j < activeDuckIds.length; j++) {
      const idA = activeDuckIds[i];
      const idB = activeDuckIds[j];

      const a = duckPositions[idA];
      const b = duckPositions[idB];

      const pairKey = `${idA}-${idB}`;

      if (checkCollision(a, b)) {
        currentCollisions.add(pairKey);

        if (!activeCollisions.has(pairKey)) {

          hitHappened()

        }
      }
    }
  }

activeCollisions.clear();
currentCollisions.forEach(pair => activeCollisions.add(pair));

  detections.forEach((det) => {

    const { id , center } = det

    const rect = grid.getBoundingClientRect();

        const xMainScreen = map(
            center.x, 0, canvas.width, rect.left, rect.left + rect.width
        );
        const yMainScreen = map(
            center.y, 0, canvas.height, rect.top, rect.top + rect.height

    );

    for (let a = 0; a < alphabet.length; a++) {

            gridTile = document.getElementById(a)

            let tile = gridTile.getBoundingClientRect()

            if (
                xMainScreen >= tile.left &&
                xMainScreen <= tile.right &&
                yMainScreen >= tile.top &&
                yMainScreen <= tile.bottom)

            {

                highlightedTiles.add(a)

                if(id === 0){

                  letterShowcase.innerHTML = alphabet[a]

                }

            }

            if (highlightedTiles.has(a)) {

                gridTile.style.backgroundColor = "#FEEC2B";

            } else {
                gridTile.style.backgroundColor = tiles[a % tiles.length];
            }

    }

    if (id === 5){

      fanStarted = true
      fanIsOn()

    }

    if (!duckPositions[id]) return;

    duckPositions[id].x = map(center.x, 350,950,0,1920)
    duckPositions[id].y = map(center.y, 350,950,0,1920)


  })

  rotation = Math.floor(map(calcAngleDegrees(duckPositions[1].x - (canvasRect.left + canvasRect.width/2), duckPositions[1].y - (canvasRect.top + canvas.height/2)), -360, 360, 0, 360))
  size = Math.floor(map(duckPositions[2].x,0,1920,0,100))
  weight = Math.floor(map(duckPositions[4].y,0,1920,300,700))


  

  
  letterShowcase.style.fontVariationSettings = `'ROTA' ${rotation}, 'SIZE' ${size}, 'wght' ${weight}`

  

}

function calcAngleDegrees(x, y) {
    return (Math.atan2(y, x) * 180) / Math.PI;
}

function init() {

  loadingScreen.style.display = "";
  endScreen.style.display = "none";

  addElements();
  onStart();
  timer();
  loop();

}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function addElements() {

    for (let i = 0; i < alphabet.length; i++) {

        const newDiv = document.createElement('div')
        const newText = document.createTextNode("")


        newDiv.appendChild(newText)
        newDiv.setAttribute("class", "grid-item");
        newDiv.setAttribute("id", `${i}`);

        grid.appendChild(newDiv);

        let gridTile = document.getElementById(i)

        counter = i % tiles.length

        gridTile.style.backgroundColor = tiles[counter]

    }


}

function timer() {

    const timer = setInterval(function() {
        time--;

        let minutes = Math.floor(time / 60)
        let seconds = time % 60

        timerWeight = map(time, 90, 0, 700, 300)

        document.getElementById("timer").innerHTML = `${minutes}:${String(seconds).padStart(2, "0")}`;
        document.getElementById("timer").style.fontVariationSettings = `"wght" ${timerWeight}`

        if (time === 0) {

            endScreenStart()
            clearInterval(timer);

        }
    }, 1000);

}

function onStart() {

    loadingScreen.style.display = ""
    defaultScreen.style.display = "none";
    duckadder.style.display = "none"
    fanScreen.style.display = "none"
    endScreen.style.display = "none"


    if (numDucks > 0) {
        defaultScreen.style.display = "";
        loadingScreen.style.display = "none"
    };

}

function checkNumDucksChanged() {
    const current = numDucks;
    const previous = previousNumDucks;

    previousNumDucks = current;

    // Only react when the number of ducks increases
    if (current > previous) {

        // Cancel any pending trigger
        clearTimeout(duckCountTimeout);

        pendingDuckCount = current;

        duckCountTimeout = setTimeout(() => {

            // Check that the count is still stable
            if (
                numDucks === pendingDuckCount &&
                !triggeredDuckCounts.has(pendingDuckCount && numDucks)
            ) {
                if(numDucks != 5){
                triggeredDuckCounts.add(pendingDuckCount);
                duckAdd();}

            }

            pendingDuckCount = null;
            duckCountTimeout = null;

        }, 250);
    }

    // Cancel the pending trigger if the count decreases
    else if (current < previous) {
        clearTimeout(duckCountTimeout);
        duckCountTimeout = null;
        pendingDuckCount = null;
    }
}

function duckAdd() {


    defaultScreen.style.display = "none";
    duckadder.style.display = ""
    loadingScreen.style.display = "none"
    hitPopUp.style.display = "none"

    audio.currentTime = 0;

    audio.play().catch(error => {
      console.error('Audio playback failed:', error);
    });

    updateCounter()

    setTimeout(() => {

        defaultScreen.style.display = "";
        duckadder.style.display = "none"

    }, duckAddTimeout);

}

function updateCounter() {

    duckAddCounter += 1

    duckcounter.textContent = String(duckAddCounter).padStart(2, "0");


    console.log("updateCounter started")


    duckcounter.classList.remove("pop");
    void duckcounter.offsetWidth;
    duckcounter.classList.add("pop");

}

function animateLoading(size,wght,rota) {

    for (let i = 1; i <= 12; i++) {

        loadingCounter += 1;

        let singularRect = document.getElementById(`loading${i}`)
        let sinMap = map(i, 1, 12, 0, Math.PI)

        let sinMapMouse = map(loadingCounter, 0, 640, 0, Math.PI)

        let mouseSin = Math.sin(sinMapMouse) * (100 / 2);

        size = map(mouseSin, 0, 100 / 2, 0, 100)
        wght = map(mouseSin, 0, 100 / 2, 300, 400)
        rota = map(mouseSin, 0, 100 / 2, 0, 360)

        singularRect.style.fontVariationSettings = `'wght' ${wght * Math.sin(sinMap)}, 'ROTA' ${rota * Math.sin(sinMap)}, 'SIZE' ${size * Math.sin(sinMap)}`


    }


}

function checkCollision(objectA, objectB, radius = 150) {
  const dx = objectA.x - objectB.x;
  const dy = objectA.y - objectB.y;

  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < radius * 2;

}

function hitHappened(){

  hitBoxWeight += 50

  numHits++;
  console.log("-10hp");

  hitBox.textContent = numHits;

  hitBox.style.fontVariationSettings = `'wght' ${hitBoxWeight}`
  
  hitPopUp.style.display = "inline"
  hitPopUp.style.animation = "hitpop 2s infinite"

  setTimeout(() => {

    hitPopUp.style.display = "none"

  }, 2000)

}

function createTitle(){

  for(let i = 0; i < titleText.length; i++){

  const titleLetter = document.createElement("div")
  const letterText = document.createTextNode(titleText[i])
  titleLetter.setAttribute("id",`letter${i}`)

  titleLetter.appendChild(letterText)

  titleDiv.appendChild(titleLetter)

  }

}

function animateTitle(){

  for(let i = 0; i < titleText.length; i++){

		let colorChanger = Math.floor(Math.abs(Math.sin(loadingCounter * 0.005 + i * 1) * 3))

    let sizeChanger = map(colorChanger,0,3,3,5)

    let weightChanger = map(colorChanger,0,3,400,700)

    document.getElementById(`letter${i}`).style.color = `${tilesOpposite[colorChanger]}`
    document.getElementById(`letter${i}`).style.fontSize = `${sizeChanger}vw`
    document.getElementById(`letter${i}`).style.fontVariationSettings = `'wght' ${weightChanger}`

  }

}

function updateFontSettings(){


  weightSetting.innerHTML = `weight: ${weight}`
  sizeSetting.innerHTML = `size: ${size}`
  rotaSetting.innerHTML = `rotation: ${rotation}`

}

function fanIsOn() {
  
  defaultScreen.style.display = "none";
  duckadder.style.display = "none"
  loadingScreen.style.display = "none"
  fanScreen.style.display = ""
  
  console.log("yep")

  setTimeout(() => {
    
    defaultScreen.style.display = "";
    fanScreen.style.display = "none"
    
  }, 3000);
  
}

function updateFan() {
  
      const speed = sound * 0.8;
      const fanWeight = map(sound, 0, 255, 300, 900);

      fanRotation += speed;

      fanValue.style.fontVariationSettings = `"wght" ${fanWeight}`;
      fanValue.style.transform = `rotate(${fanRotation}deg)`;

      fanValue.innerHTML = "*";

  }


function changeRotation() {

    let rota = Math.sin(loadingCounter * 0.005) * 200;

    if (rota < 0) {
        rota += 360;
    }

    endScreenBackground.style.fontVariationSettings =
        `"SIZE" 30, "ROTA" ${rota}, "wght" 450`;
}

function endScreenStart(){

    defaultScreen.style.display = "none";
    duckadder.style.display = ""
    loadingScreen.style.display = "none"
    endScreen.style.display = ""

}