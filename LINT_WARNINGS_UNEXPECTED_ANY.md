# TypeScript Unexpected Any Lint Warnings

This document lists all the "unexpected any" TypeScript lint warnings found during build time that need to be fixed.

## Summary
Total unexpected any warnings: **28**

## Warnings by File

### API Routes (6 warnings)

#### `/app/api/feedback/[id]/route.ts`
- **Line 80:23** - `Warning: Unexpected any. Specify a different type.`

#### `/app/api/projects/[id]/customization/route.ts`
- **Line 185:23** - `Warning: Unexpected any. Specify a different type.`

#### `/app/api/projects/[id]/route.ts`
- **Line 43:20** - `Warning: Unexpected any. Specify a different type.`

#### `/app/api/projects/route.ts`
- **Line 210:37** - `Warning: Unexpected any. Specify a different type.`

#### `/app/api/scrape/route.ts`
- **Line 20:30** - `Warning: Unexpected any. Specify a different type.`
- **Line 54:58** - `Warning: Unexpected any. Specify a different type.`

### Components (3 warnings)

#### `/components/admin/payment-history.tsx`
- **Line 93:65** - `Warning: Unexpected any. Specify a different type.`

#### `/components/project-dashboard.tsx`
- **Line 228:57** - `Warning: Unexpected any. Specify a different type.`

#### `/components/user-payment-history.tsx`
- **Line 27:17** - `Warning: Unexpected any. Specify a different type.`

### Library Files (19 warnings)

#### `/lib/ai-analysis.ts`
- **Line 19:18** - `Warning: Unexpected any. Specify a different type.`

#### `/lib/error-handler.ts`
- **Line 6:13** - `Warning: Unexpected any. Specify a different type.`
- **Line 61:40** - `Warning: Unexpected any. Specify a different type.`

#### `/lib/sanitization.ts`
- **Line 6:36** - `Warning: Unexpected any. Specify a different type.`

#### `/lib/services/feedback-visibility-service.ts`
- **Line 190:24** - `Warning: Unexpected any. Specify a different type.`

#### `/lib/services/payment-service.ts`
- **Line 123:26** - `Warning: Unexpected any. Specify a different type.`

#### `/lib/services/stripe-service.ts`
- **Line 218:33** - `Warning: Unexpected any. Specify a different type.`
- **Line 219:33** - `Warning: Unexpected any. Specify a different type.`
- **Line 239:54** - `Warning: Unexpected any. Specify a different type.`
- **Line 240:52** - `Warning: Unexpected any. Specify a different type.`
- **Line 305:42** - `Warning: Unexpected any. Specify a different type.`
- **Line 338:32** - `Warning: Unexpected any. Specify a different type.`
- **Line 344:46** - `Warning: Unexpected any. Specify a different type.`
- **Line 351:40** - `Warning: Unexpected any. Specify a different type.`
- **Line 364:40** - `Warning: Unexpected any. Specify a different type.`
- **Line 381:41** - `Warning: Unexpected any. Specify a different type.`
- **Line 400:48** - `Warning: Unexpected any. Specify a different type.`

#### `/lib/services/subscription-service.ts`
- **Line 213:23** - `Warning: Unexpected any. Specify a different type.`

#### `/lib/types/api.ts`
- **Line 8:13** - `Warning: Unexpected any. Specify a different type.`
- **Line 77:34** - `Warning: Unexpected any. Specify a different type.`

#### `/lib/utils/project-limits.ts`
- **Line 18:13** - `Warning: Unexpected any. Specify a different type.`
- **Line 27:14** - `Warning: Unexpected any. Specify a different type.`

## Fix Priority

### High Priority (API Routes - 6 warnings)
These are in critical API endpoints and should be fixed first:
1. `/app/api/feedback/[id]/route.ts` - Line 80
2. `/app/api/projects/[id]/customization/route.ts` - Line 185
3. `/app/api/projects/[id]/route.ts` - Line 43
4. `/app/api/projects/route.ts` - Line 210
5. `/app/api/scrape/route.ts` - Lines 20, 54

### Medium Priority (Services - 13 warnings)
Core business logic services:
1. `/lib/services/stripe-service.ts` - 11 warnings (Lines 218, 219, 239, 240, 305, 338, 344, 351, 364, 381, 400)
2. `/lib/services/payment-service.ts` - Line 123
3. `/lib/services/subscription-service.ts` - Line 213
4. `/lib/services/feedback-visibility-service.ts` - Line 190

### Lower Priority (Utilities & Components - 9 warnings)
1. `/lib/types/api.ts` - Lines 8, 77
2. `/lib/utils/project-limits.ts` - Lines 18, 27
3. `/lib/error-handler.ts` - Lines 6, 61
4. `/lib/ai-analysis.ts` - Line 19
5. `/lib/sanitization.ts` - Line 6
6. Components - 3 warnings in payment history and dashboard components

## Next Steps
1. Start with high priority API routes
2. Move to services layer
3. Finish with utilities and components
4. Test after each fix to ensure no breaking changes
