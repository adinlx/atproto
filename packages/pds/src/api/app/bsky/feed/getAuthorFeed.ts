import { sql } from 'kysely'
import { AuthRequiredError } from '@atproto/xrpc-server'
import { Server } from '../../../../lexicon'
import * as GetAuthorFeed from '../../../../lexicon/types/app/bsky/feed/getAuthorFeed'
import * as locals from '../../../../locals'
import { rowToFeedItem } from '../util/feed'
import { countAll, paginate } from '../../../../db/util'

export default function (server: Server) {
  server.app.bsky.feed.getAuthorFeed(
    async (params: GetAuthorFeed.QueryParams, _input, req, res) => {
      const { auth, db } = locals.get(res)
      const { author, limit, before } = params
      const { ref } = db.db.dynamic

      const requester = auth.getUserDid(req)
      if (!requester) {
        throw new AuthRequiredError()
      }

      const userLookupCol = author.startsWith('did:')
        ? 'did_handle.did'
        : 'did_handle.handle'
      const userQb = db.db
        .selectFrom('did_handle')
        .selectAll()
        .where(userLookupCol, '=', author)

      const postsQb = db.db
        .selectFrom('post')
        .whereExists(
          userQb.whereRef('did_handle.did', '=', ref('post.creator')),
        )
        .select([
          sql<'post' | 'repost'>`${'post'}`.as('type'),
          'uri as postUri',
          'cid as postCid',
          'creator as originatorDid',
          'indexedAt as cursor',
        ])

      const repostsQb = db.db
        .selectFrom('repost')
        .whereExists(
          userQb.whereRef('did_handle.did', '=', ref('repost.creator')),
        )
        .select([
          sql<'post' | 'repost'>`${'repost'}`.as('type'),
          'subject as postUri',
          'subjectCid as postCid',
          'creator as originatorDid',
          'indexedAt as cursor',
        ])

      let postsAndRepostsQb = db.db
        .selectFrom(postsQb.union(repostsQb).as('posts_and_reposts'))
        .innerJoin('post', 'post.uri', 'postUri')
        .innerJoin('ipld_block', 'ipld_block.cid', 'post.cid')
        .innerJoin('did_handle as author', 'author.did', 'post.creator')
        .leftJoin(
          'profile as author_profile',
          'author_profile.creator',
          'author.did',
        )
        .innerJoin(
          'did_handle as originator',
          'originator.did',
          'originatorDid',
        )
        .leftJoin(
          'profile as originator_profile',
          'originator_profile.creator',
          'originatorDid',
        )
        .select([
          'type',
          'postUri',
          'postCid',
          'cursor',
          'ipld_block.content as recordBytes',
          'ipld_block.indexedAt as indexedAt',
          'author.did as authorDid',
          'author.handle as authorHandle',
          'author_profile.displayName as authorDisplayName',
          'originator.did as originatorDid',
          'originator.handle as originatorHandle',
          'originator_profile.displayName as originatorDisplayName',
          db.db
            .selectFrom('vote')
            .whereRef('subject', '=', ref('postUri'))
            .where('direction', '=', 'up')
            .select(countAll.as('count'))
            .as('upvoteCount'),
          db.db
            .selectFrom('vote')
            .whereRef('subject', '=', ref('postUri'))
            .where('direction', '=', 'down')
            .select(countAll.as('count'))
            .as('downvoteCount'),
          db.db
            .selectFrom('repost')
            .whereRef('subject', '=', ref('postUri'))
            .select(countAll.as('count'))
            .as('repostCount'),
          db.db
            .selectFrom('post')
            .whereRef('replyParent', '=', ref('postUri'))
            .select(countAll.as('count'))
            .as('replyCount'),
          db.db
            .selectFrom('repost')
            .where('creator', '=', requester)
            .whereRef('subject', '=', ref('postUri'))
            .select('uri')
            .as('requesterRepost'),
          db.db
            .selectFrom('vote')
            .where('creator', '=', requester)
            .whereRef('subject', '=', ref('postUri'))
            .where('direction', '=', 'up')
            .select('uri')
            .as('requesterUpvote'),
          db.db
            .selectFrom('vote')
            .where('creator', '=', requester)
            .whereRef('subject', '=', ref('postUri'))
            .where('direction', '=', 'down')
            .select('uri')
            .as('requesterDownvote'),
        ])

      postsAndRepostsQb = paginate(postsAndRepostsQb, {
        limit,
        before,
        by: ref('cursor'),
      })

      const queryRes = await postsAndRepostsQb.execute()
      const feed = queryRes.map(rowToFeedItem)

      return {
        encoding: 'application/json',
        body: {
          feed,
          cursor: queryRes.at(-1)?.cursor,
        },
      }
    },
  )
}
