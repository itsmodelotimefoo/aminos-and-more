import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { notifyBackInStock } from "../notify.server";

// Back-in-stock signup for a sold-out size. Returns { ok } — true only when the
// signup was actually saved, so the UI never falsely promises an email.
export const requestBackInStock = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      slug: z.string().min(1).max(120),
      size: z.string().min(1).max(60),
      email: z.string().email().max(200),
    }),
  )
  .handler(async ({ data }) => {
    return await notifyBackInStock(data);
  });
