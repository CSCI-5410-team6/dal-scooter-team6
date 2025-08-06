import {
  CognitoIdentityClient,
  GetIdCommand,
  GetCredentialsForIdentityCommand
} from "@aws-sdk/client-cognito-identity";
import { Auth } from "aws-amplify"; // or however you get the user session

const REGION = "ca-central-1";
const IDENTITY_POOL_ID = "ca-central-1:e3ec729b-d828-42ee-b752-7400071b905d";
const USER_POOL_ID = "ca-central-1_ZrlF5Fnvd";

const cognitoClient = new CognitoIdentityClient({ region: REGION });

export const getCredentials = async () => {
  let logins;
  let userType = "guest";

  try {
    const session = await Auth.currentSession();
    const idToken = session.getIdToken().getJwtToken();

    logins = {
      [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]: idToken
    };

    userType = "customer";
  } catch {
    logins = undefined;
  }

  const idCommand = new GetIdCommand({
    IdentityPoolId: IDENTITY_POOL_ID,
    Logins: logins
  });

  const idResponse = await cognitoClient.send(idCommand);

  if (!idResponse.IdentityId) {
    throw new Error("No IdentityId returned from Cognito");
  }

  const credsCommand = new GetCredentialsForIdentityCommand({
    IdentityId: idResponse.IdentityId,
    Logins: logins
  });

  const credsResponse = await cognitoClient.send(credsCommand);

  if (!credsResponse.Credentials) {
    throw new Error("No credentials returned");
  }

  return {
    credentials: credsResponse.Credentials,
    identityId: idResponse.IdentityId,
    userType
  };
};
