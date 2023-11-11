/**
 * @jest-environment jsdom
 */
const listen = require('../src/listen');
const fs = require("node:fs");
const path = require("node:path");

let stubOscillator;
let stubEventSource;
let waitForEventListener;
let resolveWaitForEventListener;

const spyCreateOscillator = jest.fn(() => {
    return stubOscillator;
});
const stubAudioContext = {
    createOscillator: spyCreateOscillator,
    destination: {}
};

const randomFrequency = Math.floor(Math.random() * 1000);
const deserialisedNoteOnEventData = {
    frequency: randomFrequency
};
const stubNoteOnEvent = {
    data: JSON.stringify(deserialisedNoteOnEventData)
}

const listenTemplatePath = path.resolve(__dirname, '../../views/listen.erb');
const listenTemplateContent = fs.readFileSync(listenTemplatePath, 'utf8');

beforeEach(() => {
    jest.clearAllMocks();
    stubOscillator = {
        connect: jest.fn(),
        start: jest.fn(),
        frequency: {
            setValueAtTime: jest.fn()
        }
    };
    stubEventSource = {
        _url: null,
        addEventListener: (eventType, handleEventFn) => {
            resolveWaitForEventListener(handleEventFn);
        },
        _receiveNoteOnEvent: async () => {
            waitForEventListener
                .then(handleEventFn => handleEventFn(stubNoteOnEvent));
        }
    };
    waitForEventListener = new Promise(resolve => (resolveWaitForEventListener = resolve));
});

describe("listen page", () => {
    test('After clicking power on and receiving a note-on event, a note is sent to the oscillator', async () => {
        document.body.innerHTML = listenTemplateContent;
        delete window.location;
        window.location = { origin: "https://www.example.org" };
        window.AudioContext = jest.fn().mockImplementation(() => stubAudioContext);
        window.EventSource = jest.fn().mockImplementation((url) => {
            stubEventSource._url = url;
            return stubEventSource;
        });
        const powerOnButton = document.querySelector("#power-on-button");

        listen(); // run the script, which sets up the power button 'onclick' event listener
        powerOnButton.click() // click the power on button
        await stubEventSource._receiveNoteOnEvent(); // receive one note-on event

        expect(stubEventSource._url).toBe(`${window.location.origin}/api/listen`);
        expect(spyCreateOscillator).toHaveBeenCalledTimes(1);
        expect(stubOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(deserialisedNoteOnEventData.frequency, 0);
        expect(stubOscillator.connect).toHaveBeenCalledTimes(1);
        expect(stubOscillator.connect).toHaveBeenCalledWith(stubAudioContext.destination);
        expect(stubOscillator.start).toHaveBeenCalledTimes(1);
        expect(stubOscillator.start).toHaveBeenCalledWith();
    });

    test('No audio output or event stream if power-on button hasn\'t been clicked', async () => {
        document.body.innerHTML = listenTemplateContent;
        window.AudioContext = jest.fn().mockImplementation(() => stubAudioContext);
        window.EventSource = jest.fn().mockImplementation((url) => {
            stubEventSource._url = url;
            return stubEventSource;
        });

        listen();
        await stubEventSource._receiveNoteOnEvent();

        expect(spyCreateOscillator).toHaveBeenCalledTimes(0);
        expect(stubEventSource._url).toBe(null);
    });

    test('No audio output until note-on events are received, even after power-on has been clicked', () => {
        document.body.innerHTML = listenTemplateContent;
        window.AudioContext = jest.fn().mockImplementation(() => stubAudioContext);
        window.EventSource = jest.fn().mockImplementation((url) => {
            stubEventSource._url = url;
            return stubEventSource;
        });
        const powerOnButton = document.querySelector("#power-on-button");

        listen();
        powerOnButton.click()

        expect(spyCreateOscillator).toHaveBeenCalledTimes(0);
    });

    test('Power on button is disabled after clicking once', () => {
        document.body.innerHTML = listenTemplateContent;
        window.AudioContext = jest.fn().mockImplementation(() => stubAudioContext);
        window.EventSource = jest.fn().mockImplementation((url) => {
            stubEventSource._url = url;
            return stubEventSource;
        });
        const powerOnButton = document.querySelector("#power-on-button");

        listen();
        powerOnButton.click();

        expect(powerOnButton.getAttribute("disabled")).toBe("true");
    });

    test('Throws exception if power on button is not found', () => {
        document.body.innerHTML = '<div></div>';

        expect(listen).toThrowError(Error("Power on button not found."));
    });
});