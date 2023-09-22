function listen() {
    const audioOutput = new AudioOutput(new AudioContext());
    const powerOnButton = document.querySelector("#power-on-button");
    if (powerOnButton !== null) {
        powerOnButton.addEventListener('click', () => {
            audioOutput.receiveInput()
            powerOnButton.setAttribute("disabled", "true");
        });
    } else {
        throw new Error("Power on button not found.");
    }
}

class AudioOutput {
    constructor(audioContext) {
        this.audioContext = audioContext;
    }

    receiveInput() {
        const eventsource = new EventSource("https://www.example.org/api/listen");
        eventsource.addEventListener("note-on", (event) => {
          const oscillator = this.audioContext.createOscillator();
          oscillator.frequency.setValueAtTime(123, 0);
          oscillator.connect(this.audioContext.destination);
          oscillator.start(); 
        });
    }

};

module.exports = listen;