import { redirect } from "solid-start/server"
import { createCookieSessionStorage } from "solid-start/session"
import { db, type LoginForm } from "."

export async function register({ username, password }: LoginForm) {
  return db.user.create({
    data: { username, password },
  })
}

export async function login({ username, password }: LoginForm) {
  const user = await db.user.findUnique({ where: { username } })
  if (!user) return null
  const isCorrectPassword = password === user.password
  if (!isCorrectPassword) return null
  return user
}

const sessionSecret = import.meta.env.SESSION_SECRET || "hello"

const storage = createCookieSessionStorage({
  cookie: {
    name: "RJ_session",
    // secure doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    secure: import.meta.env.PROD,
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
})

export function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"))
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request)
  const userId = session.get("userId")
  if (userId == null) return null
  if (typeof userId !== "number" && typeof userId !== "string") return null
  if (Number.isNaN(Number.parseInt(`${userId}`))) throw logout(request)
  return +userId
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getUserId(request)
  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]])
    throw redirect(`/login?${searchParams}`)
  }
  return userId
}

export async function getUser(request: Request) {
  const userId = await getUserId(request)

  if (!userId) return null

  return db.user.findUnique({ where: { id: userId } })
}

export async function logout(request: Request) {
  const session = await storage.getSession(request.headers.get("Cookie"))
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  })
}

export async function createUserSession(userId: number, redirectTo: string) {
  const session = await storage.getSession()
  session.set("userId", userId)
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  })
}
