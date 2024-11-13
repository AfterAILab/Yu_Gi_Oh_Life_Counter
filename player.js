const { getMain, setMain } = require('./flapsClient');

// class for a player
class Player {
    constructor(name, flapsUrl) {
        this.name = name;
        this.flapsUrl = flapsUrl;
    }

    async getLp() {
        const data = await getMain(this.flapsUrl);
        const parsedAsNumber = Number.parseInt(data.text);
        return isNaN(parsedAsNumber) ? 8000 : parsedAsNumber;
    }

    async addLp(diff) { 
        const data = await getMain(this.flapsUrl);
        console.log(`[addLp] data: ${data}`);
        const lp = Math.max(0, Number.parseInt(data.text) + diff);
        await setMain(this.flapsUrl, { 
            ...data,
            text: lp.toString()
        });
    }
}

function getPlayer(players, currentPlayer) {
    return players[currentPlayer];
} 

module.exports = { Player };
