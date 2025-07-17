import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    region: 'ca-central-1',
    userPoolId: 'ca-central-1_tlOn4aieM', // after running the terraform script you need to update this with the actual user pool ID
    userPoolWebClientId: '7447smel9uptr04pg86nmfbi0c', //after running the terraform script you need to update this with the actual client ID
    authenticationFlowType: 'CUSTOM_AUTH'
  }
};

Amplify.configure(amplifyConfig);

export default amplifyConfig;

