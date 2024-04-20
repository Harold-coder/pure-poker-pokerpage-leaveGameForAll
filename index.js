const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

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
            const promises = game.players.map(player => {
                console.log("Player:", player.id);
                console.log("GameId:", gameId);
                return invokeLeaveGame(player.id, gameId);  // Ensure promises are returned
            });

            await Promise.all(promises);

            return { statusCode: 200, body: JSON.stringify({ message: 'All players have been processed for leaveGame.' }) };
        } else {
            return { statusCode: 400, body: JSON.stringify({ message: 'Game is in progress!' }) };
        }
    } catch (error) {
        console.error('Error processing leaveGame for all players:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

async function getGameState(gameId) {
    const params = {
        TableName: process.env.GAME_TABLE,
        Key: { gameId }
    };
    const { Item } = await dynamoDb.get(params).promise();
    return Item;
}

function invokeLeaveGame(playerId, gameId) {
    const leaveGamePayload = {
        gameId: gameId, 
        playerId: playerId,
    };

    console.log("Invoking leaveGame with payload:", payload);

    return lambda.invoke({
        FunctionName: 'poker-game-leaveGame',
        InvocationType: 'Event',
        Payload: JSON.stringify(leaveGamePayload),
    }).promise();
}
