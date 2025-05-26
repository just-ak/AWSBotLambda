import axios from 'axios';
import { config } from '../internal/config';

interface PagerDutyIncidentData {
  title: string;
  description: string;
  serviceId: string;
  urgency?: string;
  assigneeId?: string;
  escalationPolicyId?: string;
  priority?: string;
  customDetails?: Record<string, any>;
}

// Validate PagerDuty credentials
export const validatePagerDutyCredentials = async (): Promise<boolean> => {
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://api.pagerduty.com/users/me',
      headers: {
        'Authorization': `Token token=${config.PAGERDUTY_API_KEY}`,
        'Accept': 'application/vnd.pagerduty+json;version=2',
        'Content-Type': 'application/json'
      }
    });
    
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        console.error('PagerDuty authentication failed: Invalid API key.');
      } else {
        console.error(`PagerDuty authentication failed with status ${error.response.status}: ${error.response.statusText}`);
      }
    } else {
      console.error('PagerDuty authentication failed:', error);
    }
    return false;
  }
};

// Create a PagerDuty incident
export const createPagerDutyIncident = async (incidentData: PagerDutyIncidentData): Promise<string> => {
  try {
    if (!config.PAGERDUTY_API_KEY) {
      throw new Error('Missing required PagerDuty configuration. Check PAGERDUTY_API_KEY.');
    }
    
    const response = await axios({
      method: 'POST',
      url: 'https://api.pagerduty.com/incidents',
      headers: {
        'Authorization': `Token token=${config.PAGERDUTY_API_KEY}`,
        'Accept': 'application/vnd.pagerduty+json;version=2',
        'Content-Type': 'application/json'
      },
      data: {
        incident: {
          type: 'incident',
          title: incidentData.title,
          service: {
            id: incidentData.serviceId,
            type: 'service_reference'
          },
          body: {
            type: 'incident_body',
            details: incidentData.description
          },
          ...(incidentData.urgency && { urgency: incidentData.urgency }),
          ...(incidentData.priority && {
            priority: {
              id: incidentData.priority,
              type: 'priority_reference'
            }
          }),
          ...(incidentData.escalationPolicyId && {
            escalation_policy: {
              id: incidentData.escalationPolicyId,
              type: 'escalation_policy_reference'
            }
          }),
          ...(incidentData.assigneeId && {
            assignments: [
              {
                assignee: {
                  id: incidentData.assigneeId,
                  type: 'user_reference'
                }
              }
            ]
          }),
          ...(incidentData.customDetails && { custom_details: incidentData.customDetails })
        }
      }
    });
    
    return response.data.incident.id; // Return the created incident ID
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        console.error('PagerDuty authentication failed: Check your API key.');
        throw new Error('PagerDuty authorization failed: Invalid credentials (401 Unauthorized)');
      } else {
        console.error(`PagerDuty API error: ${error.response.status} ${error.response.statusText}`);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        throw new Error(`PagerDuty API error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
      }
    } else {
      console.error('Error creating PagerDuty incident:', error);
      throw new Error(`Failed to create PagerDuty incident: ${error}`);
    }
  }
};

// Get PagerDuty incident details
export const getPagerDutyIncident = async (incidentId: string): Promise<any> => {
  try {
    if (!config.PAGERDUTY_API_KEY) {
      throw new Error('Missing required PagerDuty configuration. Check PAGERDUTY_API_KEY.');
    }
    
    const response = await axios({
      method: 'GET',
      url: `https://api.pagerduty.com/incidents/${incidentId}`,
      headers: {
        'Authorization': `Token token=${config.PAGERDUTY_API_KEY}`,
        'Accept': 'application/vnd.pagerduty+json;version=2',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.incident;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        console.error('PagerDuty authentication failed: Check your API key.');
        throw new Error('PagerDuty authorization failed: Invalid credentials (401 Unauthorized)');
      } else {
        console.error(`PagerDuty API error: ${error.response.status} ${error.response.statusText}`);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        throw new Error(`PagerDuty API error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
      }
    } else {
      console.error('Error retrieving PagerDuty incident:', error);
      throw new Error(`Failed to retrieve PagerDuty incident: ${error}`);
    }
  }
};