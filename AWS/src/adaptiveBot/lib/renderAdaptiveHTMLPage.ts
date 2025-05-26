import { confluenceHealthPage } from '../adaptiveHTMLPages/confluenceHealthPage';
import { genericPage } from '../adaptiveHTMLPages/genericPage';

const pageTemplates: { [key: string]: any } = {
  'confluence-health-page': confluenceHealthPage,
  'generic-page': genericPage
}

/**
 * Renders an HTML page with the provided data using {PLACEHOLDER} format
 * @param {string} templateName - The name of the HTML template file (without .html extension)
 * @param {any} data - The data to populate the HTML template
 * @returns {string} - The rendered HTML page
 */
export function renderHTMLPage(templateName: string, data: any): string {
 let pageTemplate;
 console.log(`Rendering HTML page with template: ${templateName}`, data);
  // If adaptiveCard is specified, try to use it from registry
  if (pageTemplates[templateName]) {
    pageTemplate = pageTemplates[templateName];
  } else {
    // Use default card if adaptiveCard is not specified
    console.warn(`Card template '${data.adaptiveCard}' not found, using generic page.`);
    pageTemplate = pageTemplates['generic-page'];
  }

  // Add null/undefined check before replace
  if (!pageTemplate) {
    console.error("Page template is undefined. Using empty template.");
    return "Error: Template not found";
  }

  // Replace placeholders in the format {PLACEHOLDER}
  const templateContent = pageTemplate.replace(/{([\w.\-]+)}/g, (match: string, placeholder: string) => {
    console.log(`Replacing placeholder: ${placeholder} in match: ${match}`);
    try {
      // Handle properties with hyphens like detail-type
      if (placeholder.includes('-')) {
        // Direct property lookup for hyphenated names
        return data[placeholder] !== undefined ? String(data[placeholder]) : match;
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
      
      // Only return original placeholder if value is undefined
      // Convert to string to handle boolean, number, etc.
      return value !== undefined ? String(value) : match;
    } catch (error) {
      console.warn(`Error replacing placeholder "${placeholder}":`, error);
      return match; // Return original placeholder on error
    }
  });

  return templateContent;
}
