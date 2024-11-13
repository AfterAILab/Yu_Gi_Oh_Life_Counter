var vosk = require('vosk')
const fs = require("fs");
var mic = require("mic");
const { Player } = require('./player');
const { interpretText } = require('./llmClient');
const { updateText } = require('./flapsClient');
const { MODEL_PATH, SAMPLE_RATE, PLAYER_0_NAME, PLAYER_1_NAME, PLAYER_0_FLAPS_URL, PLAYER_1_FLAPS_URL, TURN_FLAPS_URL } = require('./config');

const player0 = new Player(PLAYER_0_NAME, PLAYER_0_FLAPS_URL);
const player1 = new Player(PLAYER_1_NAME, PLAYER_1_FLAPS_URL);
const state = {
    currentPlayer: 0,
    players: [player0, player1]
}

if (!fs.existsSync(MODEL_PATH)) {
    console.log("Please download the model from https://alphacephei.com/vosk/models and unpack as " + MODEL_PATH + " in the current folder.")
    process.exit()
}

vosk.setLogLevel(0);
const model = new vosk.Model(MODEL_PATH);
const rec = new vosk.Recognizer({ model: model, sampleRate: SAMPLE_RATE });

var micInstance = mic({
    rate: String(SAMPLE_RATE),
    channels: '1',
    debug: false,
    device: 'default',
});

var micInputStream = micInstance.getAudioStream();

micInputStream.on('data', async (data) => {
    if (rec.acceptWaveform(data)) {
        const resultTextWithoutSpaces = rec.result().text.replace(/\s+/g, '');
        const response = await interpretText(state, resultTextWithoutSpaces);
        switch (response["action"]) {
            case "lifePoints": {
                console.log(`inside lifePoints`);
                response["diff"].forEach(async (diff, index) => {
                    console.log(`[lifePoints] diff: ${diff}`);
                    const player = state.players[index];
                    await player.addLp(diff);
                });
            }
            break;
            case "nextTurn": {
                state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
                await updateText(TURN_FLAPS_URL, state.players[state.currentPlayer].name);
            }
            break;
            default: {
                console.log("Unknown action");
            }
        }
    }
    else {
        console.log(rec.partialResult());
    }
});


micInputStream.on('audioProcessExitComplete', function () {
    console.log("Cleaning up");
    console.log(rec.finalResult());
    rec.free();
    model.free();
});

process.on('SIGINT', function () {
    console.log("\nStopping");
    micInstance.stop();
});

micInstance.start();