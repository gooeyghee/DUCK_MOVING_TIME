let sound = 0;

async function startMicrophone() {

    try {

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        const audioContext = new AudioContext();

        const analyser = audioContext.createAnalyser();

        const microphone =
            audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.8;

        microphone.connect(analyser);

        const array =
            new Uint8Array(analyser.frequencyBinCount);

        function getSound() {

            analyser.getByteFrequencyData(array);

            let values = 0;

            for (let i = 0; i < array.length; i++) {
                values += array[i];
            }

            sound = Math.round(values / array.length);

            requestAnimationFrame(getSound);
        }

        getSound();

    } catch (error) {

        console.error("Microphone error:", error);

    }
}


if (
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
) {

    startMicrophone();

} else {

    console.error(
        "Microphone access is not available in this browser/context."
    );

}