// import { Auth } from 'aws-amplify';
// import { AwsCredentialIdentity } from '@aws-sdk/types';

// export const getCredentials = async (): Promise<AwsCredentialIdentity> => {
//   const creds = await Auth.currentCredentials();
//   console.log("Creds",creds)
//   return {
//     accessKeyId: creds.accessKeyId,
//     secretAccessKey: creds.secretAccessKey,
//     sessionToken: creds.sessionToken,
//     expiration: creds.expiration
//   };
// };
import {
  CognitoIdentityClient,
  GetIdCommand,
  GetCredentialsForIdentityCommand,
} from "@aws-sdk/client-cognito-identity";

const cognitoClient = new CognitoIdentityClient({
  region: "ca-central-1",
});

export const getCredentials = async () => {
  const idCommand = new GetIdCommand({
    IdentityPoolId: "ca-central-1:86fa591a-3bcc-4793-918b-9bc1ebd2d5b7",
  });

  const idResponse = await cognitoClient.send(idCommand);

  if (!idResponse.IdentityId) {
    throw new Error("No IdentityId returned from Cognito Identity Pool");
  }

  const credsCommand = new GetCredentialsForIdentityCommand({
    IdentityId: idResponse.IdentityId,
  });

  const credsResponse = await cognitoClient.send(credsCommand);

  if (!credsResponse.Credentials) {
    throw new Error("No credentials returned from Cognito");
  }

  return {
    accessKeyId: credsResponse.Credentials.AccessKeyId!,
    secretAccessKey: credsResponse.Credentials.SecretKey!,
    sessionToken: credsResponse.Credentials.SessionToken!,
  };
};

