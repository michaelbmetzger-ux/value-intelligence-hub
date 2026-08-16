import { describe, expect, it } from 'vitest'
import {
  acceptInvitation,
  buildInitialAuthState,
  createInvitation,
  signIn,
  visibleClientsForSession,
} from './authModel'

describe('authModel', () => {
  it('starts Mike as owner and Troy as advisor with advisor portal access', () => {
    const state = buildInitialAuthState(['lifepoint', 'lifted'])

    const mike = signIn(state, 'mike@lifepointfd.com')
    const troy = signIn(state, 'troy@cvga.com')

    expect(mike?.role).toBe('owner')
    expect(troy?.role).toBe('advisor')
    expect(visibleClientsForSession(state, mike)).toEqual(['lifepoint', 'lifted'])
    expect(visibleClientsForSession(state, troy)).toEqual(['lifepoint', 'lifted'])
  })

  it('creates a reusable invitation record for an advisor or client', () => {
    const state = buildInitialAuthState(['lifepoint'])

    const next = createInvitation(state, {
      email: 'owner@example.com',
      role: 'client',
      clientIds: ['lifepoint'],
      invitedBy: 'mike@lifepointfd.com',
    })

    expect(next.invitation.token).toMatch(/^invite-/)
    expect(next.state.invitations[next.invitation.token]).toMatchObject({
      email: 'owner@example.com',
      role: 'client',
      clientIds: ['lifepoint'],
      status: 'pending',
    })
  })

  it('accepts an invite, creates the account, and limits a client to assigned companies', () => {
    const state = buildInitialAuthState(['lifepoint', 'lifted'])
    const { state: invitedState, invitation } = createInvitation(state, {
      email: 'client@example.com',
      role: 'client',
      clientIds: ['lifted'],
      invitedBy: 'mike@lifepointfd.com',
    })

    const accepted = acceptInvitation(invitedState, {
      token: invitation.token,
      name: 'Client Owner',
      password: 'not-real-auth',
    })
    const session = signIn(accepted, 'client@example.com')

    expect(session?.role).toBe('client')
    expect(visibleClientsForSession(accepted, session)).toEqual(['lifted'])
    expect(accepted.invitations[invitation.token].status).toBe('accepted')
  })

  it('blocks invalid or already-used invite tokens', () => {
    const state = buildInitialAuthState(['lifepoint'])
    const { state: invitedState, invitation } = createInvitation(state, {
      email: 'client@example.com',
      role: 'client',
      clientIds: ['lifepoint'],
      invitedBy: 'mike@lifepointfd.com',
    })

    const accepted = acceptInvitation(invitedState, {
      token: invitation.token,
      name: 'Client Owner',
      password: 'not-real-auth',
    })

    expect(() => acceptInvitation(accepted, {
      token: invitation.token,
      name: 'Second Try',
      password: 'not-real-auth',
    })).toThrow('Invitation is no longer pending')
    expect(() => acceptInvitation(accepted, {
      token: 'missing-token',
      name: 'Missing',
      password: 'not-real-auth',
    })).toThrow('Invitation not found')
  })
})
