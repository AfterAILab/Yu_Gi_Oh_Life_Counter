const OpenAI = require("openai");
const { OPENAI_MODEL, OPENAI_ORGANIZATION } = require('./config');
const openai = new OpenAI({
    organization: OPENAI_ORGANIZATION,
});

function generatePrompt(state, text) {
    const input = JSON.stringify({
        currentPlayer: state.currentPlayer,
        text: text
    });
    return `
You are a game judge for a Yu-Gi-Oh! card game.
You will be given a string of text that describes either:
    1. A card effect (which may involve damage or healing)
    2. A player's turn announcement
    3. Or an irrelevant statement.
Your task is to interpret the text and return the appropriate action in JSON format.
Instructions:
1. Card Effect (Damage or Healing):
    - If the text describes a damage or healing effect, you must extract the amount of damage or healing. Note the number it is always given, so you don't need to guess.
    - Damage always affects the opponent, and healing always affects the current player.
    - The result should be represented as a diff array, where:
        - The first element is the life point change for player0.
        - The second element is the life point change for player1.
    - Positive values represent healing, while negative values represent damage.
2. Player's Turn:
    - If the text indicates that it's a player's turn, return an action of "nextTurn".
3. Irrelevant Text:
    - If the text does not describe a card effect or a player's turn, return an action of "none".
Clarifications:
1. How to Handle Damage:
    - Damage always applies to the opponent:
        - If "currentPlayer": 0, damage affects player1.
        - If "currentPlayer": 1, damage affects player0.
2. How to Handle Healing:
    - Healing always applies to the current player:
        - If "currentPlayer": 0, healing affects player0.
        - If "currentPlayer": 1, healing affects player1.
2. How to Extract Numbers from Text:
    - For numbers written in Japanese (e.g., "六百" = 600, "千" = 1000), extract the numeric value.
Ensure that you correctly interpret both damage and healing amounts from these numbers.
Output Format:
    - Always return a JSON object with two keys: "action" and "diff".
"action" will be either "lifePoints", "nextTurn", or "none".
"diff" will be an array representing life point changes for both players when applicable.
Examples:
1. Damage Effect
    - Input: { "currentPlayer": 0, "text": "ダイレクトアタック六百のダメージ" }
    - Current player: player0
    - Action: Damage
    - Damage amount: 600
    - Opponent (player1) takes damage.
    - Output: { "action": "lifePoints", "diff": [0, -600]}
2. Healing Effect
    - Input: { "currentPlayer": 0, "text": "ライフを千回復" }
    - Current player: player0
    - Action: Healing
    - Healing amount: 1000
    - Current player (player0) heals.
    - Output: { "action": "lifePoints", "diff": [1000, 0]}
3: Damage Effect
    - Input: { "currentPlayer": 1, "text": "相手モンスターを破壊して三百のダメージ" }
    - Current player: player1
    - Action: Damage
    - Damage amount: 300
    - Opponent (player0) takes damage.
    - Output: { "action": "lifePoints", "diff": [-300, 0]}
4. Healing Effect
    - Input: { "currentPlayer": 1, "text": "ライフを千回復" }
    - Current player: player1
    - Action: Healing
    - Healing amount: 1000
    - Current player (player1) heals.
    - Output: { "action": "lifePoints", "diff": [0, 1000]}
5. Player's Turn Announcement
    - Input: { "currentPlayer": 0, "text": "僕のターンドロー" }
    - Output: { "action": "nextTurn" }
6. Irrelevant Text
    - Input: { "currentPlayer": 1, "text": "面白いよね" }
    - Output: { "action": "none" }
7. Irrelevant Text
    - Input: { "currentPlayer": 1, "text": "２体のモンスターを生贄に捧げ、ブラックマジシャンを召喚" }
    - Output: { "action": "none" }
Now process this input:
Input: ${input}
Output:

`
}

async function interpretText(state, text) {
    const result = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
            { role: "system", content: generatePrompt(state, text) },
        ],
        temperature: 0,
        n: 1,
        response_format: { type: "json_object" },
    })
    return JSON.parse(result.choices[0].message.content);
    }

module.exports = {
    interpretText
}