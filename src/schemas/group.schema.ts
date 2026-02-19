import { z } from 'zod';

export const createGroupSchema = z.object({
  body: z.object({
    groupName: z.string().min(1, 'Group name is required'),

    members: z
      .array(
        z.object({
          name: z.string().optional(),
          phone: z.string().min(1, 'Phone number is required'),
          countryCode: z.string().default('91'),
        }),
      )
      .optional(),
  }),
});

export const updateGroupSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Group ID is required'),
  }),
  body: z.object({
    groupName: z.string().min(1, 'Group name is required').optional(),
  }),
});

export const addMembersSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Group ID is required'),
  }),
  body: z.object({
    members: z
      .array(
        z.object({
          name: z.string().optional(),
          phone: z.string().min(1, 'Phone number is required'),
          countryCode: z.string().default('91'),
        }),
      )
      .min(1, 'At least one member is required'),
  }),
});

export const removeMembersSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Group ID is required'),
  }),
  body: z.object({
    memberIds: z
      .array(z.string().min(1, 'User ID is required'))
      .min(1, 'At least one user ID is required'),
  }),
});

export const getAllGroupsSchema = z.object({
  body: z.object({
    options: z
      .object({
        page: z.number().int().min(1).optional(),
        itemsPerPage: z.number().int().min(1).optional(),
        sortBy: z.array(z.string()).optional(),
        sortDesc: z.array(z.boolean()).optional(),
      })
      .optional(),
    search: z
      .array(
        z.object({
          term: z.string(),
          fields: z.array(z.string()),
          startsWith: z.boolean().optional(),
          endsWith: z.boolean().optional(),
        }),
      )
      .optional(),
    project: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const deleteGroupSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Group ID is required'),
  }),
});
