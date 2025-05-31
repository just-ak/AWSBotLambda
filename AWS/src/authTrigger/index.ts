import { PreTokenGenerationTriggerHandler } from 'aws-lambda';

/**
 * Pre-token generation Lambda function that validates Azure AD groups 
 * and adds them to the user's claims
 */
export const handler: PreTokenGenerationTriggerHandler = async (event) => {
  console.log('Pre-token generation event:', JSON.stringify(event, null, 2));

  try {
    // Get the user's Azure groups from the identity token
    const identityProviderName = event.request?.userAttributes?.identities ?
      JSON.parse(event.request.userAttributes.identities)[0].providerName : null;
    
    if (identityProviderName === 'AzureAD' && event.request.groupConfiguration) {
      // Get groups from the OIDC claims
      const groups = event.request.groupConfiguration.groupsToOverride || [];
      
      // Filter to only include authorized groups
      const authorizedGroups = ['CAG_Users', 'BCA_Staff']; // Replace with your Azure group names
      const userGroups = groups.filter(group => authorizedGroups.includes(group));
      
      // Add groups to the ID token
      if (!event.response.claimsOverrideDetails) {
        event.response.claimsOverrideDetails = {};
      }

      event.response.claimsOverrideDetails.groupOverrideDetails = {
        groupsToOverride: userGroups
      };
    }

    return event;
  } catch (error) {
    console.error('Error in pre-token generation:', error);
    return event;
  }
};