import { SeedClient } from './client'

export default async (sc: SeedClient) => {
  await sc.createAccount('alice', users.alice)
  await sc.createAccount('bob', users.bob)
  await sc.createAccount('carol', users.carol)
  await sc.createAccount('dan', users.dan)
  const alice = sc.dids.alice
  const bob = sc.dids.bob
  const carol = sc.dids.carol
  const dan = sc.dids.dan

  await sc.createProfile(
    alice,
    users.alice.displayName,
    users.alice.description,
  )
  await sc.createProfile(bob, users.bob.displayName, users.bob.description)
  await sc.follow(alice, sc.actorRef(bob))
  await sc.follow(alice, sc.actorRef(carol))
  await sc.follow(alice, sc.actorRef(dan))
  await sc.follow(carol, sc.actorRef(alice))
  await sc.follow(bob, sc.actorRef(alice))
  await sc.follow(bob, sc.actorRef(carol))
  await sc.follow(dan, sc.actorRef(bob))
  await sc.post(alice, posts.alice[0])
  await sc.post(bob, posts.bob[0])
  await sc.post(carol, posts.carol[0])
  await sc.post(dan, posts.dan[0])
  await sc.post(dan, posts.dan[1], [
    {
      index: { start: 0, end: 18 },
      type: 'mention',
      value: alice,
    },
  ])
  await sc.post(alice, posts.alice[1])
  await sc.post(bob, posts.bob[1])
  await sc.post(alice, posts.alice[2])
  await sc.vote('up', bob, sc.posts[alice][1].ref)
  await sc.vote('down', bob, sc.posts[alice][2].ref)
  await sc.vote('down', carol, sc.posts[alice][1].ref)
  await sc.vote('up', carol, sc.posts[alice][2].ref)
  await sc.vote('up', dan, sc.posts[alice][1].ref)
  await sc.reply(
    bob,
    sc.posts[alice][1].ref,
    sc.posts[alice][1].ref,
    replies.bob[0],
  )
  await sc.reply(
    carol,
    sc.posts[alice][1].ref,
    sc.posts[alice][1].ref,
    replies.carol[0],
  )
  await sc.reply(
    alice,
    sc.posts[alice][1].ref,
    sc.replies[bob][0].ref,
    replies.alice[0],
  )
  await sc.repost(carol, sc.posts[dan][1].ref)
  await sc.repost(dan, sc.posts[alice][1].ref)

  await sc.createScene(bob, 'scene.test')
  await sc.inviteToScene('scene.test', sc.actorRef(alice))
  await sc.inviteToScene('scene.test', sc.actorRef(carol))
  await sc.inviteToScene('scene.test', sc.actorRef(dan))
  await sc.acceptSceneInvite(
    alice,
    'scene.test',
    sc.sceneInvites['scene.test'][alice],
  )
  await sc.acceptSceneInvite(
    carol,
    'scene.test',
    sc.sceneInvites['scene.test'][carol],
  )
  await sc.acceptSceneInvite(
    dan,
    'scene.test',
    sc.sceneInvites['scene.test'][dan],
  )

  await sc.createScene(alice, 'alice-scene.test')

  await sc.createScene(bob, 'other-scene.test')
  await sc.inviteToScene('other-scene.test', sc.actorRef(alice))
  await sc.inviteToScene('other-scene.test', sc.actorRef(carol))

  await sc.createScene(carol, 'carol-scene.test')
  await sc.inviteToScene('carol-scene.test', sc.actorRef(alice))
  await sc.inviteToScene('carol-scene.test', sc.actorRef(bob))
  await sc.inviteToScene('carol-scene.test', sc.actorRef(dan))
  await sc.acceptSceneInvite(
    alice,
    'carol-scene.test',
    sc.sceneInvites['carol-scene.test'][alice],
  )
  await sc.acceptSceneInvite(
    dan,
    'carol-scene.test',
    sc.sceneInvites['carol-scene.test'][dan],
  )

  return sc
}

const users = {
  alice: {
    email: 'alice@test.com',
    handle: 'alice.test',
    password: 'alice-pass',
    displayName: 'ali',
    description: 'its me!',
  },
  bob: {
    email: 'bob@test.com',
    handle: 'bob.test',
    password: 'bob-pass',
    displayName: 'bobby',
    description: 'hi im bob',
  },
  carol: {
    email: 'carol@test.com',
    handle: 'carol.test',
    password: 'carol-pass',
    displayName: undefined,
    description: undefined,
  },
  dan: {
    email: 'dan@test.com',
    handle: 'dan.test',
    password: 'dan-pass',
    displayName: undefined,
    description: undefined,
  },
}

export const posts = {
  alice: ['hey there', 'again', 'yoohoo'],
  bob: ['bob back at it again!', 'bobby boy here', 'yoohoo'],
  carol: ['hi im carol'],
  dan: ['dan here!', '@alice.bluesky.xyz is the best'],
}

export const replies = {
  alice: ['thanks bob'],
  bob: ['hear that'],
  carol: ['of course'],
}
