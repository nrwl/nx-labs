import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { handler } from './handler.ts';

const port = Number(Deno.env.get('PORT') || 4200)

await serve(handler, { port });

