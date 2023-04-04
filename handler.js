'use strict';

// Import the DynamoDB SDK and create a DocumentClient object
const DynamoDB = require('aws-sdk/clients/dynamodb');
// Create a new instance of the DynamoDB DocumentClient with configuration options
const documentClient = new DynamoDB.DocumentClient({ 
  // Set the AWS region to 'us-east-1'
  region: 'us-east-1',
  // Set the maximum number of retries for failed requests to 3
  maxRetries: 3,
  // Set the HTTP request timeout to 5 seconds
  httpOptions: {
    timeout: 5000,
  }
});

// Set the name of the DynamoDB table using the environment variable
const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;

// Utility function to create a response object
const send = (statusCode, data) => ({
  statusCode,
  body: JSON.stringify(data),
});

// Lambda function to create a new note
module.exports.createNote = async (event, context, callback) => {
  // Set the callbackWaitsForEmptyEventLoop property to false to prevent function timeouts
  context.callbackWaitsForEmptyEventLoop = false;

  // Parse the request body and extract the note data
  let data = JSON.parse(event.body);

  try {
    // Create a new item in the DynamoDB table with the note data
    const params = {
      TableName: NOTES_TABLE_NAME,
      Item:{
        notesId: data.id,
        title: data.title,
        body: data.body,
      },
      // Add a condition to ensure that the note doesn't already exist
      ConditionExpression: 'attribute_not_exists(notesId)',
    }
    await documentClient.put(params).promise();
    // Return a success response with the created note data
    callback(null, send(201, data))
  } catch (err) {
    // Return an error response if the operation failed
    callback(null, send(500, err.message))
  }
};

// Lambda function to update an existing note
module.exports.updateNote = async (event, context, callback) => {
  // Set the callbackWaitsForEmptyEventLoop property to false to prevent function timeouts
  context.callbackWaitsForEmptyEventLoop = false;

  // Extract the note ID from the path parameters and parse the request body
  let notesId = event.pathParameters.id;
  let data = JSON.parse(event.body);

  try {
    // Update the specified note with the new title and body values
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: { notesId },
      UpdateExpression: 'set #title = :title, #body = :body',
      ExpressionAttributeNames: {
        '#title': 'title',
        '#body': 'body'
      },
      ExpressionAttributeValues: {
        ':title': data.title,
        ':body': data.body
      },
      // Add a condition to ensure that the note exists
      ConditionExpression: 'attribute_exists(notesId)',
    };
    await documentClient.update(params).promise();
    // Return a success response with the updated note data
    callback(null, send(200, data))
  } catch(err){
    // Return an error response if the operation failed
    callback(null, send(500, err.message))
  }
};

// Lambda function to delete an existing note
module.exports.deleteNote = async (event, context, callback) => {
  // Set the callbackWaitsForEmptyEventLoop property to false to prevent function timeouts
  context.callbackWaitsForEmptyEventLoop = false;

  // Extract the note ID from the path parameters
  let notesId = event.pathParameters.id;

  try {
    // Delete the specified note from the DynamoDB table
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: { notesId },
      // Add a condition to ensure that the note exists
      ConditionExpression: 'attribute_exists(notesId)',
    };
    await documentClient.delete(params).promise();
    // Return a success response with a message indicating that the
    callback(null, send(200, { message: `Note id ${notesId} was deleted successfully` }))
  }catch(err){
    // Return an error response if the operation failed
    callback(null, send(500, err.message))
  }

};

// Lambda function to retrieve all notes from the DynamoDB table
module.exports.getAllNotes = async (event, context, callback) => {
  // Set the callbackWaitsForEmptyEventLoop property to false to prevent function timeouts
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    // Retrieve all items from the DynamoDB table
    const params = {
      TableName: NOTES_TABLE_NAME,
    };
    const notes = await documentClient.scan(params).promise();
    // Return a success response with the retrieved notes data
    callback(null, send(200, notes))
  } catch(err) {
    // Return an error response if the operation failed
    callback(null, send(500, err.message))
  }
};

