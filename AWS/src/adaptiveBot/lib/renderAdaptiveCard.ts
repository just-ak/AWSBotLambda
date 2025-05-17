import notificationDefault from '../adaptiveCards/notification-default.json';

/**
 * Renders an Adaptive Card with the provided data.
 * @param {any} data - The data to populate the Adaptive Card.
 * @returns {any} - The rendered Adaptive Card.
 */
export function renderAdaptiveCard(data: any): any {
    // Deep clone
    const card = JSON.parse(JSON.stringify(notificationDefault));
  
    function replacePlaceholders(obj: any): void {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key]
            .replace("${title}", data.title)
            .replace("${appName}", data.appName)
            .replace("${description}", data.description)
            .replace("${notificationUrl}", data.notificationUrl);
        } else if (typeof obj[key] === 'object') {
          replacePlaceholders(obj[key]);
        }
      }
    }
  
    replacePlaceholders(card);
    return card;
  }
  