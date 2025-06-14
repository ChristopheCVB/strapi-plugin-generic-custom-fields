<div align="center" width="150px">
  <img style="width: 150px; height: auto;" src="assets/logo.png" alt="Logo - Strapi Plugin Generic Custom Fields" />
</div>
<div align="center">
  <h1>Strapi v5 - Plugin Generic Custom Fields</h1>
  <p>Powerful Strapi Plugin to easily create Custom Fields</p>
  <a href="https://www.npmjs.org/package/strapi-plugin-generic-custom-fields">
    <img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/ChristopheCVB/strapi-plugin-generic-custom-fields?label=npm&logo=npm">
  </a>
  <a href="https://www.npmjs.org/package/strapi-plugin-generic-custom-fields">
    <img src="https://img.shields.io/npm/dm/strapi-plugin-generic-custom-fields.svg" alt="Monthly download on NPM" />
  </a>
</div>

---

<div style="margin: 20px 0" align="center">
  <img style="width: 100%; height: auto;" src="assets/preview.png" alt="UI preview" />
</div>

A plugin for [Strapi Headless CMS](https://github.com/strapi/strapi) that provides a powerful and easy way to add custom fields to your Strapi entities.

## Features
- Add custom fields to entities with a simple configuration.

### What can it be used for?
- Create an Enum field with labels
- Fetch items from an API (with or without authentication)
- Fetch items from a local source (json file, database, etc.)

## Roadmap
- Support pagination for fetching items
- Support for different field types (text, number, date, etc.)
- Validation rules for custom fields
- Any idea? [Open an issue](https://github.com/ChristopheCVB/strapi-plugin-generic-custom-fields/issues)

## Usage

To configure the Generic Custom Fields plugin, add your custom fields configuration to the plugin settings. Each custom field should follow this structure:

```typescript
type Config = {
  customFields: Array<{
    name: string;         // The unique name of the custom field.
    description?: string; // A description for the custom field.
    icon?: string;        // One of the supported StrapiIcon names, e.g. 'Alien', 'Archive', 'ArrowDown', etc.
    inputSize?: {
      default: 4 | 6 | 8 | 12; // Default input size.
      isResizable: boolean;    // Whether the input size can be changed.
    };
    searchable?: boolean; // Whether the custom field is searchable (calls fetchItems with query).
    fetchItems: ({ query: string | undefined }): { items: Item[] } | Promise<{ items: Item[] }>; // Function to fetch multiple items. This function is called on server-side.
    fetchItem: ({ value: string }): Item | Promise<Item>; // Function to fetch a single item. This function is called on server-side.
  }>,
}
type Item = {
    value: string; // Unique identifier for the item. This is used to store the value of the custom field.
    label: string; // Label of the item.
    icon?: {
      src: string; // URL of the icon.
      colorMask?: boolean; // Whether the icon should be masked with the color of the field.
    }
};
```
This configuration allows you to define custom fields that can fetch items either synchronously or asynchronously. The `fetchItems` function is used to retrieve a list of items based on a query string that can be empty, while the `fetchItem` function retrieves a single item based on its value.

### Example Configuration

Check Wiki page for [Example Implementations](https://github.com/ChristopheCVB/strapi-plugin-generic-custom-fields/wiki/Example-implementations)
