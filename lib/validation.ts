import { z } from "zod";
import { CLASSIFICATIONS, PRIORITIES, ROLES, STATUSES, WBS_STATES } from "./types";

const emptyToNull = (v: unknown) => (v === "" ? null : v);
const str = (max: number) => z.preprocess(emptyToNull, z.string().max(max).nullable().optional());

/* ---------------------------------- auth ---------------------------------- */

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(200),
});

/* ---------------------------------- users --------------------------------- */

export const userCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.email(),
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
  role: z.enum(ROLES).default("member"),
  title: str(80),
  accent: z.string().max(20).optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.email().optional(),
  password: z.string().min(6).max(200).optional(),
  role: z.enum(ROLES).optional(),
  title: str(80),
  accent: z.string().max(20).optional(),
  active: z.boolean().optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

/* ------------------------------- assignments ------------------------------ */

export const assignmentCreateSchema = z.object({
  ownerId: z.string().min(1).optional(), // leaders may set; members are forced to self
  role: str(80),
  title: str(120),
  client: z.string().trim().min(1, "Client / organisation is required").max(160),
  classification: z.enum(CLASSIFICATIONS),
  gnPocName: str(120),
  gnPocEmail: z.preprocess(emptyToNull, z.string().email().nullable().optional()),
  keyPriority: str(120),
  offering: str(120),
  startDate: str(40),
  endDate: str(40),
  wbsProvided: z.enum(WBS_STATES),
  wbsCode: str(60),
  estimatedHours: z.coerce.number().int().min(0).max(100000),
  actualHours: z.coerce.number().int().min(0).max(100000),
  priority: z.enum(PRIORITIES),
  status: z.enum(STATUSES),
  notes: str(2000),
  lastUpdated: str(40),
});

export const assignmentUpdateSchema = assignmentCreateSchema.partial();

export type AssignmentCreateInput = z.infer<typeof assignmentCreateSchema>;
export type AssignmentUpdateInput = z.infer<typeof assignmentUpdateSchema>;
