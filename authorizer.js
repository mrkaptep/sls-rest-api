const { CognitoJwtVerifier } = require('aws-jwt-verify');
const COGNITO_USERPOOL_ID = process.env.COGNITO_USERPOOL_ID;
const COGNITO_WEB_CLIENT_ID = process.env.COGNITO_WEB_CLIENT_ID;

const jwtVerifier = CognitoJwtVerifier.create({
   userPoolId: COGNITO_USERPOOL_ID,
   tokenUse:"id",
   clientId: COGNITO_WEB_CLIENT_ID,
});


// A function to generate an authorization policy
const generatePolicy = (principalId, effect, resource) => {
   // Create an empty authorization response object
   var authResponse = {};

   // Set the principal ID for the response
   authResponse.principalId = principalId;

   // If an effect and resource are provided, add a policy document to the response
   if (effect && resource) {
   let policyDocument = {
      Version: '2012-10-17',
      Statement: [{
         Effect: effect,
         Resource: resource,
         Action: 'execute-api:Invoke',
      }]
   };
   authResponse.policyDocument = policyDocument;
   }

   // Add a context object to the response
   authResponse.context = {
   foo: 'bar'
   };

   // Log the authorization response to the console
   console.log(JSON.stringify(authResponse));

   // Return the authorization response
   return authResponse;
}

// Lambda function to authorize API requests
exports.handler = async (event, context, callback) => {
   // Get the authorization token from the event
   var token = event.authorizationToken;
   console.log(token);
   //Validate the token
   try{
      const payload = await jwtVerifier.verify(token);
      // console.log(Json.stringify(payload));
      callback(null, generatePolicy('user', 'Allow', event.methodArn));
   }catch(err){
      callback("Unauthorized");
   }
}
