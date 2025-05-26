import axios from 'axios';
import { config } from '../internal/config';

interface JiraTicketData {
  summary: string;
  description: string;
  issueType: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
  components?: string[];
}

// Add a function to validate JIRA credentials
export const validateJiraCredentials = async (): Promise<boolean> => {
  try {
    const auth = Buffer.from(
      `${config.JIRA_EMAIL}:${config.JIRA_API_TOKEN}`
    ).toString('base64');
    
    const response = await axios({
      method: 'GET',
      url: `${config.JIRA_BASE_URL}/rest/api/3/myself`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    
    // console.log('JIRA authentication successful:', response.data.displayName);
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        console.error('JIRA authentication failed: Invalid credentials. Check your email and API token.');
      } else {
        console.error(`JIRA authentication failed with status ${error.response.status}: ${error.response.statusText}`);
      }
    } else {
      console.error('JIRA authentication failed:', error);
    }
    return false;
  }
};

// Modified createJiraTicket with better error handling
export const createJiraTicket = async (ticketData: JiraTicketData): Promise<string> => {
  try {
    // console.log('Creating JIRA ticket with data:', JSON.stringify(ticketData, null, 2));
    // console.log('Config:', JSON.stringify(config, null, 2));
    // Check if required config values exist
    if (!config.JIRA_EMAIL || !config.JIRA_API_TOKEN || !config.JIRA_BASE_URL || !config.JIRA_PROJECT_KEY) {
      throw new Error('Missing required JIRA configuration. Check JIRA_EMAIL, JIRA_API_TOKEN, JIRA_BASE_URL, and JIRA_PROJECT_KEY.');
    }
    
    // Base64 encode the authentication credentials
    const auth = Buffer.from(
      `${config.JIRA_EMAIL}:${config.JIRA_API_TOKEN}`
    ).toString('base64');

    const response = await axios({
      method: 'POST',
      url: `${config.JIRA_BASE_URL}/rest/api/3/issue`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: {
        fields: {
          project: {
            key: config.JIRA_PROJECT_KEY
          },
          summary: ticketData.summary,
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: ticketData.description
                  }
                ]
              }
            ]
          },
          issuetype: {
            name: ticketData.issueType
          },
        //   ...(ticketData.priority && {
        //     priority: {
        //       id: ticketData.priority || '3' // Default to 'Medium' if not provided
        //     }
        //   }),
          ...(ticketData.assignee && {
            assignee: {
              id: ticketData.assignee
            }
          }),
          ...(ticketData.labels && {
            labels: ticketData.labels
          }),
          ...(ticketData.components && {
            components: ticketData.components.map(component => ({ name: component }))
          })
        }
      }
    });
    
    return response.data.key; // Return the created ticket key
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        console.error('JIRA authentication failed: Check your email and API token.');
        throw new Error('JIRA authorization failed: Invalid credentials (401 Unauthorized)');
      } else {
        console.error(`JIRA API error: ${error.response.status} ${error.response.statusText}`);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        throw new Error(`JIRA API error: ${error.response.status} - ${error.response.data?.errorMessages?.join(', ') || error.response.statusText}`);
      }
    } else {
      console.error('Error creating JIRA ticket:', error);
      throw new Error(`Failed to create JIRA ticket: ${error}`);
    }
  }
};

// Apply similar error handling for getJiraTicket
export const getJiraTicket = async (ticketKey: string): Promise<any> => {
  try {
    if (!config.JIRA_EMAIL || !config.JIRA_API_TOKEN || !config.JIRA_BASE_URL) {
      throw new Error('Missing required JIRA configuration. Check JIRA_EMAIL, JIRA_API_TOKEN, and JIRA_BASE_URL.');
    }
    
    const auth = Buffer.from(
      `${config.JIRA_EMAIL}:${config.JIRA_API_TOKEN}`
    ).toString('base64');
    
    const response = await axios({
      method: 'GET',
      url: `${config.JIRA_BASE_URL}/rest/api/3/issue/${ticketKey}`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        console.error('JIRA authentication failed: Check your email and API token.');
        throw new Error('JIRA authorization failed: Invalid credentials (401 Unauthorized)');
      } else {
        console.error(`JIRA API error: ${error.response.status} ${error.response.statusText}`);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        throw new Error(`JIRA API error: ${error.response.status} - ${error.response.data?.errorMessages?.join(', ') || error.response.statusText}`);
      }
    } else {
      console.error('Error retrieving JIRA ticket:', error);
      throw new Error(`Failed to retrieve JIRA ticket: ${error}`);
    }
  }
};