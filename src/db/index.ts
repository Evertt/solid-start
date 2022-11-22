export type User = {
  id: number
  username: string
  password: string
}

export type LoginForm = Omit<User, "id">

let users: User[] = [{ id: 1, username: "kody", password: "twixrox" }]

type CreateOptions = {
  data: LoginForm
}

type FindContraints = {
  where: { id: number } | { username: string }
}

export type DB = {
  user: {
    create: (options: CreateOptions) => Promise<User>
    findUnique: (constraints: FindContraints) => Promise<User | undefined>
  }
}

export const db: DB = {
  user: {
    async create({ data }) {
      let user = { ...data, id: users.length }
      users.push(user)
      return user
    },
    async findUnique({ where }) {
      if ("id" in where) {
        return users.find(user => user.id === where.id)
      } else {
        return users.find(user => user.username === where.username)
      }
    },
  },
}
