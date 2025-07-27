// import { Amplify, API } from 'aws-amplify';

// const amplifyConfig = {
//   Auth: {
//     region: 'ca-central-1',
//     userPoolId: 'ca-central-1_ZdVusg55K', // after running the terraform script you need to update this with the actual user pool ID
//     userPoolWebClientId: '334u311hm8k1cpvgftthuvu2eh', //after running the terraform script you need to update this with the actual client ID
//     authenticationFlowType: 'CUSTOM_AUTH'
//   },
//   API: {
//     endpoints: [
//       {
//         name: 'lexApi',
//         endpoint: 'https://runtime.lex.ca-central-1.amazonaws.com',
//         region: 'ca-central-1',
//       },
//       {
//         name: 'snsApi',
//         endpoint: 'https://sns.ca-central-1.amazonaws.com',
//         region: 'ca-central-1',
//       },
//     ],
//   },
// }

// Amplify.configure(amplifyConfig);

// export default amplifyConfig;

import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    region: "ca-central-1",
    userPoolId: "ca-central-1_ZrlF5Fnvd", // From Terraform output
    userPoolWebClientId: "2l46jge03ucuee9tlb0milvehl", // From Terraform output
    identityPoolId: "ca-central-1:86fa591a-3bcc-4793-918b-9bc1ebd2d5b7", // From Terraform output
    authenticationFlowType: "CUSTOM_AUTH",
  },
});

export const lexConfig = {
  botId: "GFI0AFBTIS", // From Terraform output
  botAliasId: "TSTALIASID", // Set after creating Lex bot alias
  localeId: "en_US",
  region: "ca-central-1",
};

export const snsConfig = {
  registrationTopicArn:
    "arn:aws:sns:ca-central-1:796973501829:DALScooterRegistrationTopic-dev", // From Terraform output
  signInTopicArn:
    "arn:aws:sns:ca-central-1:796973501829:DALScooterRegistrationTopic-dev", // From Terraform output
};
