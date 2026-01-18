const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'Project TNA - TNA Management System',
    version: '1.0.0',
    description: `
      An address-masking API allowing visitors to use Temporary National Addresses (TNA).
      
      ### Key Business Rules:
      * **Max 5 TNAs**: Visitors are limited to 5 active TNA codes.
      * **Transit Lock**: Bindings cannot be unlinked if a shipment is 'IN_TRANSIT'.
      * **Role-Based Access**: Specific endpoints for Visitors, Owners, and Carriers.
    `,
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

module.exports = swaggerDef;