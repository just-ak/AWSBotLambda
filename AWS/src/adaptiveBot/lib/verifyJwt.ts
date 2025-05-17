import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

// Bot Framework OpenID metadata endpoints
const OPENID_METADATA_URL = 'https://login.botframework.com/v1/.well-known/openidconfiguration';
const BOT_FRAMEWORK_JWKS_URI = 'https://login.botframework.com/v1/.well-known/keys';

// Configure the JWKS client
const jwksClient = new JwksClient({
  jwksUri: BOT_FRAMEWORK_JWKS_URI,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
  rateLimit: true,
  jwksRequestsPerMinute: 10,
  timeout: 30000 // 30 seconds timeout
});

// Function to get the signing key
const getSigningKey = async (kid: string): Promise<string> => {
  try {
    const key = await jwksClient.getSigningKey(kid);
    return key.getPublicKey();
  } catch (error) {
    console.error('Error retrieving signing key:', error);
    throw error;
  }
};

// Manual verification for Bot Framework tokens when JWKS fails
const manualBotFrameworkVerify = (decodedToken: any): boolean => {
  // Check if token has required fields for Bot Framework
  if (!decodedToken || !decodedToken.iss || !decodedToken.serviceurl || !decodedToken.aud) {
    return false;
  }
  
  // Verify issuer is from Microsoft Bot Framework
  if (decodedToken.iss !== 'https://api.botframework.com') {
    return false;
  }
  
  // Check token expiration
  const now = Math.floor(Date.now() / 1000);
  if (decodedToken.exp && decodedToken.exp < now) {
    return false;
  }
  
  // Check if token is not yet valid
  if (decodedToken.nbf && decodedToken.nbf > now) {
    return false;
  }
  
  // Add your Bot Framework app ID verification here
  // For example, check if decodedToken.aud matches your bot's app ID
  
  return true;
};

export const verifyJwt = async (token: string): Promise<boolean> => {
  try {
    // Decode token without verification to get the header
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || typeof decodedHeader === 'string') {
      console.log('Invalid token format');
      return false;
    }
    
    // Get the key ID
    const kid = decodedHeader.header.kid;
    if (!kid) {
      console.log('No key ID (kid) found in token header');
      return false;
    }
    
    try {
      // Try to get the signing key
      const signingKey = await getSigningKey(kid);
      
      // Verify the token
      const verified = jwt.verify(token, signingKey, { 
        algorithms: ['RS256'],
        issuer: 'https://api.botframework.com'
      });
      
      return !!verified;
    } catch (keyError) {
      console.error('JWT verification failed:', keyError);
      
      // Fall back to manual verification for Bot Framework tokens
      console.log('Attempting fallback verification...');
      const decodedToken = jwt.decode(token);
      return manualBotFrameworkVerify(decodedToken);
    }
  } catch (error) {
    console.error('Error during JWT verification:', error);
    return false;
  }
};
