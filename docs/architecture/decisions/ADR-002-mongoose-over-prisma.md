# ADR-002: Mongoose over Prisma

**Status:** Accepted

## Decision

Use Mongoose ODM instead of Prisma for MongoDB access.

## Rationale

- Mongoose has first-class support for MongoDB-specific features (aggregation pipelines, indexes, virtuals)
- Analytics routes require complex `$group`, `$lookup`, and `$project` pipelines — easier in raw Mongoose than Prisma's limited MongoDB support
- Schema definitions live alongside model logic (single file per entity)

## Trade-offs

- No auto-generated types from schema (we maintain `types/index.ts` manually)
- No migration files — schema changes are applied at runtime
