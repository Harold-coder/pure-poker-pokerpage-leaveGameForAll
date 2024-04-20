const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const gameId = event.gameId;
    if (!gameId) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Game ID is required' }) };
    }

    try {
        // Fetch the game state
        const game = await getGameState(gameId);
        if (!game || !game.players || game.players.length === 0) {
            return { statusCode: 404, body: JSON.stringify({ message: 'No players found in the game' }) };
        }

        // Invoke leaveGame for each player
        const promises = game.players.map(player => 
            invokeLeaveGame(player.id, gameId));
        
        // Wait for all leaveGame invocations to complete
        await Promise.all(promises);

        return { statusCode: 200, body: JSON.stringify({ message: 'All players have been processed for leaveGame.' }) };
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
    const payload = JSON.stringify({
        playerId: playerId,
        gameId: gameId
    });

    const params = {
        FunctionName: 'poker-game-leaveGame', // Ensure this is the correct ARN or function name for your leaveGame lambda
        InvocationType: 'Event', // Use 'Event' to invoke the function asynchronously
        Payload: payload
    };

    return lambda.invoke(params).promise();
}
