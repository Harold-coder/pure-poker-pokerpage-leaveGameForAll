const AWS = require('aws-sdk');
const mysql = require('mysql');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const gameTableName = process.env.GAME_TABLE;

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

exports.handler = async (event) => {
    const gameId = event.gameId;
    console.log("GameId:", gameId);
    if (!gameId) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Game ID is required' }) };
    }

    try {
        const game = await getGameState(gameId);
        if (!game || !game.players || game.players.length === 0) {
            return { statusCode: 404, body: JSON.stringify({ message: 'No players found in the game' }) };
        }

        if (!game.gameInProgress) {
            const promises = game.players.map(player => updateChipsBalance(player.id, player.chips));

            console.log("Player Chips:", game.players);
            console.log("Promises:", promises);
    
            // Wait for all updateChips invocations to complete
            await Promise.all(promises);
            await deleteGame(gameId);

            console.log("Done.")

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

    // Construct the SQS queue URL or name from gameId
    const queueUrl = `https://sqs.us-east-1.amazonaws.com/767398087790/${gameId}.fifo`;

    // Delete the corresponding SQS queue
    const sqsParams = {
        QueueUrl: queueUrl
    };
    await sqs.deleteQueue(sqsParams).promise();
    console.log(`SQS queue for game ${gameId} deleted.`);
}

async function getGameState(gameId) {
    const params = {
        TableName: gameTableName,
        Key: { gameId }
    };
    const { Item } = await dynamoDb.get(params).promise();
    return Item;
}


const updateChipsBalance = async (playerId, buyIn) => {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        connection.connect(err => {
            if (err) {
                console.error('Database connection failed:', err);
                reject(new Error('Database connection failed', host, user, password, databse));
                return;
            }

            const playerChipsQuery = 'SELECT chips FROM users WHERE username = ?';
            connection.query(playerChipsQuery, [playerId], (err, results) => {
                if (err) {
                    connection.end();
                    reject(new Error(`Failed to fetch player chips. Error: ${err.message}`));
                    return;
                }

                if (results.length === 0) {
                    connection.end();
                    reject(new Error(`Player not found. Searched for playerId: '${playerId}'`));
                    return;
                }

                const currentChips = results[0].chips;
                const newChipsAmount = currentChips + buyIn;

                if (newChipsAmount < 0) {
                    connection.end();
                    reject(new Error('Not enough chips'));
                    return;
                }

                const updateQuery = 'UPDATE users SET chips = ? WHERE username = ?';
                connection.query(updateQuery, [newChipsAmount, playerId], (err) => {
                    connection.end();
                    if (err) {
                        reject(new Error(`Failed to update chips balance. Error: ${err.message}`));
                        return;
                    }
                    resolve(true);
                });
            });
        });
    });
};