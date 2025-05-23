import genericCard from '../adaptiveCards/generic-card.json';
import ssmCard from '../adaptiveCards/ssm-card.json'; 
import echoCard from '../adaptiveCards/echo-card.json'; 
import helloCard from '../adaptiveCards/hello-card.json';
import confirmationCard from '../adaptiveCards/confirmation-card.json';
import repoFormCard from '../adaptiveCards/repo-form-card.json';


// Card template registry
const cardTemplates: { [key: string]: any } = {
  'generic-card': genericCard,
  'ssm-card': ssmCard, 
  'echo-card': echoCard,
  'hello-card': helloCard,
  'confirmation-card': confirmationCard,
  'repo-form-card': repoFormCard,
};

/**
 * Renders an Adaptive Card with the provided data.
 * @param {any} data - The data to populate the Adaptive Card.
 * @returns {any} - The rendered Adaptive Card.
 */
export function renderAdaptiveCard(data: any): any {
  let cardTemplate;

  // If adaptiveCard is specified, try to use it from registry
  if (data.adaptiveCard && cardTemplates[data.adaptiveCard]) {
    cardTemplate = cardTemplates[data.adaptiveCard];
  } else {
    // Use default card if adaptiveCard is not specified
    console.warn(`Card template '${data.adaptiveCard}' not found, using generic card.`);
    cardTemplate = cardTemplates['generic-card'];
  }
  // Deep clone
  const card = JSON.parse(JSON.stringify(cardTemplate));

  function replacePlaceholders(obj: any): void {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/\${([\w.\-]+)}/g, (match, placeholder) => {
          // Handle properties with hyphens like detail-type
          if (placeholder.includes('-')) {
            // Direct property lookup for hyphenated names
            return data[placeholder] !== undefined ? data[placeholder] : match;
          }
          
          // Handle nested properties like detail.name
          const props = placeholder.split('.');
          let value = data;
          
          for (const prop of props) {
            if (value === undefined || value === null) {
              return match; // Return original placeholder if path is invalid
            }
            value = value[prop];
          }
          
          return value !== undefined ? value : match;
        });
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        replacePlaceholders(obj[key]);
      }
    }
  }

  replacePlaceholders(card);

  
  return card;
}
