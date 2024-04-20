const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const gameTableName = process.env.GAME_TABLE;

exports.handler = async (event) => {
    const gameId = event.gameId;
    if (!gameId) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Game ID is required' }) };
    }

    try {
        const game = await getGameState(gameId);
        if (!game || !game.players || game.players.length === 0) {
            return { statusCode: 404, body: JSON.stringify({ message: 'No players found in the game' }) };
        }

        if (!game.gameInProgress) {
            await deleteGame(gameId);

            return { statusCode: 200, body: JSON.stringify({ message: 'Game is deleted!' }) };
        } else {
            return { statusCode: 400, body: JSON.stringify({ message: 'Game is in progress!' }) };
        }
    } catch (error) {
        console.error('Error processing leaveGame for all players:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

// Function to delete a game from the gameSessions table
async function deleteGame(gameId) {
    const params = {
        TableName: gameTableName,
        Key: {
            gameId: gameId
        }
    };

    await dynamoDb.delete(params).promise();
}

async function getGameState(gameId) {
    const params = {
        TableName: gameTableName,
        Key: { gameId }
    };
    const { Item } = await dynamoDb.get(params).promise();
    return Item;
}
