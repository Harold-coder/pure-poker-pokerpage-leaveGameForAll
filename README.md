# Lambda Function: `leaveGameForAll`

This Lambda function is designed to facilitate the automated process of removing all players from a specified poker game. It fetches the current game state from a DynamoDB table and invokes another Lambda function, `leaveGame`, for each player in the game. This function is particularly useful for managing games that need to be reset or cleared due to inactivity or special administrative conditions.

## Functionality

- **Get Game State:** Retrieves the state of the game, including the list of all players, from a DynamoDB table.
- **Invoke Leave Game:** Calls the `leaveGame` function for each player found in the game state to gracefully handle their exit from the game.

## Deployment

### Prerequisites

- AWS Account: You need an AWS account to create and deploy AWS Lambda functions and DynamoDB tables.
- AWS CLI: Install and configure the AWS CLI with appropriate credentials.
- Node.js: Ensure that Node.js is installed if you plan to test the function locally.

### IAM Permissions

The execution role associated with this Lambda function must have the following permissions:
- **DynamoDB Read Access:** Permission to read the game state from a DynamoDB table.
- **Lambda Invocation:** Permission to invoke another Lambda function (specifically, the `leaveGame` function).

You can attach the following policy to the execution role to ensure proper permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem"
      ],
      "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/GAME_TABLE"
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "arn:aws:lambda:REGION:ACCOUNT_ID:function:leaveGame"
    }
  ]
}
```
Replace `REGION`, `ACCOUNT_ID`, and `GAME_TABLE` with your actual AWS region, account ID, and DynamoDB table name.

### Environment Variables

Set the following environment variable in the Lambda function configuration:

- **GAME_TABLE:** The name of the DynamoDB table where game states are stored.

### Deployment Steps

1. **Package the Function:**
   - Navigate to the directory containing the Lambda function code.
   - Install dependencies and package the function using AWS CLI or any preferred deployment tool.

2. **Deploy the Function:**
   - Use the AWS Management Console or AWS CLI to create and deploy the Lambda function.
   - Ensure that the function is configured with the correct execution role and environment variables.

3. **Testing:**
   - Manually invoke the function using the AWS Lambda Console or AWS CLI with a test event:
     ```json
     {
       "gameId": "your_game_id"
     }
     ```
   - Verify that the function executes successfully and that all players are processed as expected.

## Logging and Monitoring

- The function uses console logging for basic debugging and operational tracking.
- Detailed monitoring and logging can be enabled using AWS CloudWatch to track executions and capture detailed logs for troubleshooting.

## Security Considerations

- Ensure that the execution role used by the Lambda function adheres to the principle of least privilege to minimize security risks.
- Securely manage and rotate AWS credentials and access keys used in the AWS configuration.

By following these guidelines, you can effectively deploy and manage the `leaveGameForAll` Lambda function to ensure reliable and secure automation of game player management.