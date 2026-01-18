/**
 * @swagger
 * components:
 * schemas:
 * TNA:
 * type: object
 * properties:
 * id: { type: integer, example: 19 }
 * tna_code: { type: string, example: "TNA-FQXT6252$" }
 * status: { type: string, enum: [ACTIVE, INACTIVE], example: "ACTIVE" }
 * Error:
 * type: object
 * properties:
 * error: { type: string, example: "FOREIGN KEY constraint failed" }
 */