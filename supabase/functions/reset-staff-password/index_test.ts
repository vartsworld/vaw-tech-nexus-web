import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts"

import { findAuthUserByEmail } from "./index.ts"

Deno.test('findAuthUserByEmail checks subsequent auth pages for existing users', async () => {
  const visitedPages: number[] = []

  const supabaseClient = {
    auth: {
      admin: {
        listUsers: async ({ page = 1, perPage = 1000 } = {}) => {
          visitedPages.push(page)
          assertEquals(perPage, 1000)

          if (page === 1) {
            return {
              data: {
                users: [{ id: 'first-page-user', email: 'first@example.com' }],
                nextPage: 2,
                lastPage: 2,
                total: 2,
              },
              error: null,
            }
          }

          return {
            data: {
              users: [{ id: 'target-user', email: 'target@example.com' }],
              nextPage: null,
              lastPage: 2,
              total: 2,
            },
            error: null,
          }
        },
      },
    },
  }

  const user = await findAuthUserByEmail(supabaseClient as any, 'target@example.com')

  assertEquals(user?.id, 'target-user')
  assertEquals(visitedPages, [1, 2])
})

Deno.test('findAuthUserByEmail returns null when no auth user matches', async () => {
  const supabaseClient = {
    auth: {
      admin: {
        listUsers: async ({ page = 1 } = {}) => ({
          data: {
            users: page === 1 ? [{ id: 'someone-else', email: 'other@example.com' }] : [],
            nextPage: null,
            lastPage: 1,
            total: 1,
          },
          error: null,
        }),
      },
    },
  }

  const user = await findAuthUserByEmail(supabaseClient as any, 'missing@example.com')

  assertEquals(user, null)
})