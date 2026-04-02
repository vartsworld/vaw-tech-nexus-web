import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts"

import { findAuthUserByEmail } from "./index.ts"

Deno.test('findAuthUserByEmail resolves an existing auth user via generateLink', async () => {
  const supabaseClient = {
    auth: {
      admin: {
        generateLink: async () => {
          return {
            data: {
              user: { id: 'target-user', email: 'target@example.com' },
            },
            error: null,
          }
        },
      },
    },
  }

  const user = await findAuthUserByEmail(supabaseClient as any, 'target@example.com')

  assertEquals(user?.id, 'target-user')
})

Deno.test('findAuthUserByEmail returns null when generateLink has no matching user', async () => {
  const supabaseClient = {
    auth: {
      admin: {
        generateLink: async () => ({
          data: {
            user: null,
          },
          error: null,
        }),
      },
    },
  }

  const user = await findAuthUserByEmail(supabaseClient as any, 'missing@example.com')

  assertEquals(user, null)
})

Deno.test('findAuthUserByEmail throws when generateLink fails', async () => {
  const supabaseClient = {
    auth: {
      admin: {
        generateLink: async () => ({
          data: { user: null },
          error: new Error('lookup failed'),
        }),
      },
    },
  }

  await assertRejects(
    () => findAuthUserByEmail(supabaseClient as any, 'target@example.com'),
    Error,
    'lookup failed',
  )
})