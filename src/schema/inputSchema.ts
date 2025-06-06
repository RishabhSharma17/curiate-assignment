import { z } from "zod";

export const inputSchema = z.object({
    content: z.string().min(5,"Content must be at least 5 characters long").max(800,"content must be less than 200 characters long"),
    language: z.string().optional()
})