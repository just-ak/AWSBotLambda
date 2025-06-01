import { PreTokenGenerationTriggerHandler } from 'aws-lambda';
const PROVIDER_NAME = process.env.PROVIDER_NAME || 'AzureAD'; // Default to AzureAD if not set
/**
 * Pre-token generation Lambda function that validates Azure AD groups 
 * and adds them to the user's claims
 */
export const handler: PreTokenGenerationTriggerHandler = async (event) => {
  try {
    // Get the user's Azure groups from the identity token
    const identityProviderName = event.request?.userAttributes?.identities ?
      JSON.parse(event.request.userAttributes.identities)[0].providerName : null;
    
    if (identityProviderName === PROVIDER_NAME && event.request.groupConfiguration) {
      // Extract groups from Azure identity token claims
      const idTokenGroups = event.request.clientMetadata?.idToken ? 
        JSON.parse(event.request.clientMetadata.idToken)?.groups : [];
      
      if (idTokenGroups && Array.isArray(idTokenGroups)) {
        // Filter to only include authorized groups if needed
        const userGroups = idTokenGroups;
        
        // Add groups to the ID token
        if (!event.response.claimsOverrideDetails) {
          event.response.claimsOverrideDetails = {};
        }
        
        event.response.claimsOverrideDetails.groupOverrideDetails = {
          groupsToOverride: userGroups
        };
      }
    }
    return event;
  } catch (error) {
    console.error('Error in pre-token generation:', error);
    return event;
  }
};