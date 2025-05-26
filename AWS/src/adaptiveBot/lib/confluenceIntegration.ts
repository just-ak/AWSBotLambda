import axios from 'axios';
import { config } from '../internal/config';
import { renderHTMLPage } from './renderAdaptiveHTMLPage';
/**
 * Interface for Confluence page creation parameters
 */
interface ConfluencePageParams {
    title: string;
    description: string;
    location: string;  // This is a space key (e.g., "DEV", "AKFDEV")
}

/**
 * Get the numeric spaceId from a space key
 * 
 * @param spaceKey - The key of the space (e.g., "DEV", "AKFDEV")
 * @returns Promise resolving to the numeric spaceId
 */
async function getSpaceIdFromKey(spaceKey: string): Promise<string> {
    try {
        const auth = Buffer.from(
            `${config.CONFLUENCE_EMAIL}:${config.CONFLUENCE_API_TOKEN}`
        ).toString('base64');

        const apiUrl = `${config.CONFLUENCE_BASE_URL}/wiki/api/v2/spaces`;
        // console.log('Looking up space ID for key:', spaceKey);
        // console.log('Spaces API URL:', apiUrl);

        const response = await axios({
            method: 'GET',
            url: apiUrl,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        });

        // Find the space with matching key
        const space = response.data.results.find((s: any) => s.key === spaceKey);
        
        if (!space) {
            throw new Error(`Space with key "${spaceKey}" not found`);
        }
        
        // console.log(`Found space ID ${space.id} for key ${spaceKey}`);
        return space.id;
    } catch (error) {
        console.error('Error getting space ID from key:', error);
        throw new Error(`Failed to get space ID for key ${spaceKey}: ${error}`);
    }
}

/**
 * Creates a new page in Confluence
 *
 * See Confluence API v2 docs: https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-page/#api-pages-post
 * Example cURL for v2:
 * curl -u '<EMAIL>:<API_TOKEN>' -X POST 'https://your-domain.atlassian.net/wiki/api/v2/pages' \
 *      -H 'Content-Type: application/json' \
 *      -d '{
 *           "title": "My new page",
 *           "spaceId": "123456",
 *           "status": "current",
 *           "body": { "representation": "storage", "value": "<p>Hello World</p>" }
 *      }'
 */
export async function createConfluencePage(params: ConfluencePageParams): Promise<string> {
    try {
        // console.log('Creating Confluence page with data:', JSON.stringify(params, null, 2));
        // console.log('Config:', JSON.stringify(config, null, 2));
        // Check if required config values exist
        if (!config.CONFLUENCE_EMAIL || !config.CONFLUENCE_API_TOKEN || !config.CONFLUENCE_BASE_URL) {
            throw new Error('Missing required Confluence configuration. Check CONFLUENCE_EMAIL, CONFLUENCE_API_TOKEN, and CONFLUENCE_BASE_URL.');
        }

        // Get the numeric spaceId from the space key
        const spaceId = await getSpaceIdFromKey(params.location);
        
        // Base64 encode the authentication credentials
        const auth = Buffer.from(
            `${config.CONFLUENCE_EMAIL}:${config.CONFLUENCE_API_TOKEN}`
        ).toString('base64');

        const apiUrl = `${config.CONFLUENCE_BASE_URL}/wiki/api/v2/pages`;
        // console.log('Confluence API URL:', apiUrl);
        // console.log('Authorization header:', `Basic ${auth}`);

        const response = await axios({
            method: 'POST',
            url: apiUrl,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: {
                title: params.title,
                status: 'current',
                spaceId: spaceId, // Use the numeric spaceId here
                body: {
                    representation: 'storage',
                    value: renderHTMLPage('confluence-health-page',{data:{ description :params.description}} ),
                }
            }
        });

        return response.data.id; // Return the created page ID
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 401) {
                console.error('Confluence authentication failed: Check your email and API token.');
                throw new Error('Confluence authorization failed: Invalid credentials (401 Unauthorized)');
            } else {
                console.error(`Confluence API error: ${error.response.status} ${error.response.statusText}`);
                console.error('Response data:', JSON.stringify(error.response.data, null, 2));
                throw new Error(`Confluence API error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
            }
        } else {
            console.error('Error creating Confluence page:', error);
            throw new Error(`Failed to create Confluence page: ${error}`);
        }
    }
};
