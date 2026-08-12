export type PortalRole = 'owner' | 'advisor' | 'client'

export type Account = {
  id: string
  email: string
  name: string
  role: PortalRole
  clientIds: string[]
  createdAt: string
}

export type Session = Pick<Account, 'id' | 'email' | 'name' | 'role' | 'clientIds'>

export type Invitation = {
  token: string
  email: string
  role: PortalRole
  clientIds: string[]
  invitedBy: string
  status: 'pending' | 'accepted' | 'revoked'
  createdAt: string
  acceptedAt?: string
}

export type AuthState = {
  accounts: Record<string, Account>
  invitations: Record<string, Invitation>
  allClientIds: string[]
}

type CreateInvitationInput = {
  email: string
  role: PortalRole
  clientIds: string[]
  invitedBy: string
}

type AcceptInvitationInput = {
  token: string
  name: string
  password: string
}

const now = () => new Date().toISOString()

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function slug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function accountId(email: string) {
  return `acct-${slug(email)}`
}

export function buildInitialAuthState(allClientIds: string[]): AuthState {
  const clientIds = [...allClientIds]
  const accounts: Record<string, Account> = {
    'mike@lifepointfd.com': {
      id: accountId('mike@lifepointfd.com'),
      email: 'mike@lifepointfd.com',
      name: 'Mike Metzger',
      role: 'owner',
      clientIds,
      createdAt: now(),
    },
    'troy@cvga.com': {
      id: accountId('troy@cvga.com'),
      email: 'troy@cvga.com',
      name: 'Troy Hildenbrand',
      role: 'advisor',
      clientIds,
      createdAt: now(),
    },
  }

  return {
    accounts,
    invitations: {},
    allClientIds: clientIds,
  }
}

export function signIn(state: AuthState, email: string): Session | null {
  const account = state.accounts[normalizeEmail(email)]
  if (!account) return null

  return {
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.role,
    clientIds: account.clientIds,
  }
}

export function visibleClientsForSession(state: AuthState, session: Session | null | undefined) {
  if (!session) return []
  if (session.role === 'owner') return [...state.allClientIds]

  const allowed = new Set(session.clientIds)
  return state.allClientIds.filter((clientId) => allowed.has(clientId))
}

export function createInvitation(state: AuthState, input: CreateInvitationInput) {
  const email = normalizeEmail(input.email)
  const token = `invite-${slug(email)}-${Date.now().toString(36)}`
  const allowedClientIds = input.role === 'owner' ? [...state.allClientIds] : input.clientIds.filter((clientId) => state.allClientIds.includes(clientId))
  const invitation: Invitation = {
    token,
    email,
    role: input.role,
    clientIds: allowedClientIds,
    invitedBy: normalizeEmail(input.invitedBy),
    status: 'pending',
    createdAt: now(),
  }

  return {
    invitation,
    state: {
      ...state,
      invitations: {
        ...state.invitations,
        [token]: invitation,
      },
    },
  }
}

export function acceptInvitation(state: AuthState, input: AcceptInvitationInput): AuthState {
  const invitation = state.invitations[input.token]
  if (!invitation) throw new Error('Invitation not found')
  if (invitation.status !== 'pending') throw new Error('Invitation is no longer pending')
  if (!input.name.trim()) throw new Error('Name is required')
  if (input.password.length < 8) throw new Error('Password must be at least 8 characters')

  const acceptedAt = now()
  const account: Account = {
    id: accountId(invitation.email),
    email: invitation.email,
    name: input.name.trim(),
    role: invitation.role,
    clientIds: invitation.role === 'owner' ? [...state.allClientIds] : invitation.clientIds,
    createdAt: acceptedAt,
  }

  return {
    ...state,
    accounts: {
      ...state.accounts,
      [account.email]: account,
    },
    invitations: {
      ...state.invitations,
      [input.token]: {
        ...invitation,
        status: 'accepted',
        acceptedAt,
      },
    },
  }
}
