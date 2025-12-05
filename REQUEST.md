## Prisma Schema
```prisma
model bbs_article_comments {
  id String @id @db.Uuid
  bbs_article_id String @db.Uuid
  parent_id String? @db.Uuid
  bbs_user_id String @db.Uuid
  bbs_user_session_id String @db.Uuid
  content String
  created_at DateTime @db.Timestamptz
  updated_at DateTime @db.Timestamptz
  deleted_at DateTime? @db.Timestamptz

  article bbs_articles @relation(fields: [bbs_article_id], references: [id], onDelete: Cascade)
  parent bbs_article_comments? @relation("bbs_article_comments_reply", fields: [parent_id], references: [id], onDelete: Cascade)
  user bbs_users @relation(fields: [bbs_user_id], references: [id], onDelete: Cascade)
  userSession bbs_user_sessions @relation(fields: [bbs_user_session_id], references: [id], onDelete: Cascade)

  children bbs_article_comments[] @relation("bbs_article_comments_reply")
  bbs_article_comment_files bbs_article_comment_files[]
  bbs_article_comment_tags bbs_article_comment_tags[]
  bbs_article_comment_links bbs_article_comment_links[];
  bbs_article_comment_hits bbs_article_comment_hits[];
  bbs_article_comment_likes bbs_article_comment_likes[];
}
```

> ```prisma
> model bbs_article_comment_links {
>   id                     String    @id @db.Uuid
>   bbs_article_comment_id String    @db.Uuid
>   url                    String    @db.Text
>   sequence               Int
>   created_at             DateTime  @db.Timestamptz
>   updated_at             DateTime  @db.Timestamptz
>   deleted_at             DateTime? @db.Timestamptz
>
>   comment bbs_article_comments @relation(fields: [bbs_article_comment_id], references: [id], onDelete: Cascade)
> }
> ```

## DTO Type
```typescript
export interface IBbsArticleComment {
  id: string & tags.Format<"uuid">;
  parent: IBbsArticleComment.ISummary | null;
  writer: IBbsUser.ISummary;
  tags: IBbsArticleCommentTag[];
  files: IBbsArticleCommentFile[];
  links: IBbsArticleCommentLink[];
  content: string;
  hit: number;
  like: number;
  created_at: string & tags.Format<"date-time">;
  updated_at: string & tags.Format<"date-time">;
  deleted_at: (string & tags.Format<"date-time">) | null;
}
export namespace IBbsArticleComment {
  export interface ICreate {
    parent_id: (string & tags.Format<"uuid">) | null;
    content: string;
    tags: IBbsArticleCommentTag.ICreate[];
    files: IBbsArticleCommentFile.ICreate[];
    links: IBbsArticleCommentLink.ICreate[];
  }
}
```

> ```typescript
> export interface IBbsArticleCommentLink {
>   id: string & tags.Format<"uuid">;
>   url: string & tags.Format<"url">;
>   created_at: string & tags.Format<"date-time">;
>   updated_at: string & tags.Format<"date-time">;
>   deleted_at: (string & tags.Format<"date-time">) | null;
> }
>
> export namespace IBbsArticleCommentLink {
>   export interface ICreate {
>     url: string & tags.Format<"url">;
>   }
> }
> ```

## Collector

> ```typescript
> // Forward declarations of reused collectors
> export namespace BbsArticleCommentFileCollector {
>   export async function collect(props: {
>     body: IBbsArticleCommentFile.ICreate;
>     bbsArticleComment: IEntity;
>     sequence: number;
>   }) {
>     return { ... } satisfies Prisma.bbs_article_comment_filesCreateInput;
>   }
> }
>
> export namespace BbsArticleCommentTagCollector {
>   export async function collect(props: {
>     body: IBbsArticleCommentTag.ICreate;
>     bbsArticleComment: IEntity;
>   }) {
>     return { ... } satisfies Prisma.bbs_article_comment_tagsCreateInput;
>   }
> }
> ```

```typescript
export namespace BbsArticleCommentCollector {
  export async function collect(props: {
    body: IBbsArticleComment.ICreate;
    bbsArticle: IEntity;
    bbsUser: IEntity;
    bbsUserSession: IEntity;
  }) {
    // declare id variable for re-using for dependents
    const id: string = v4(); // PK is always by `v4()`
    return {
      //----
      // SCALAR FIELDS
      //----
      id, 
      content: props.body.content,
      created_at: new Date(), // default value
      updated_at: new Date(), // default value
      deleted_at: null, // default value
      // never directly write FK columns
      // - bbs_article_id
      // - parent_id
      // - bbs_user_id
      // - bbs_user_session_id

      //----
      // BELONGED RELATIONS
      //----
      // instead, declare belonged relations by connection
      article: {
        // not bbs_article_id, but article connection
        connect: { id: props.bbsArticle.id },
      },
      user: {
        connect: { id: props.bbsUser.id },
      },
      userSession: {
        connect: { id: props.bbsUserSession.id },
      },
      // nullable FK must be defined like below, connection or undefined
      parent: props.body.parent_id
        ? {
            connect: { id: props.body.parent_id },
          }
        : undefined,

      //----
      // HAS RELATIONS
      //----
      // create only when records are
      bbs_article_comment_files: props.body.files.length
        ? {
            // must use `ArrayUtil.asyncMap()` instead of `Promise.all(Array.map)`
            create: await ArrayUtil.asyncMap(
              props.body.files,
              async (elem, i) =>
                await BbsArticleCommentFileCollector.collect({ 
                  body: elem,
                  bbsArticleComment: { id }, // re-use id variable
                  sequence: i, // if sequence property required, do it like that
                }),
            )
          }
        : undefined,
      // if matched collector exists, you must use it
      bbs_article_comment_tags: props.body.tags.length
        ? {
            create: await ArrayUtil.asyncMap(
              props.body.tags,
              async (elem) =>
                await BbsArticleCommentTagCollector.collect({
                  body: elem,
                  bbsArticleComment: { id },
                }),
            )
          }
        : undefined,
      // inlined creation only when matched collector does not exist 
      bbs_article_comment_links: props.body.links.length
        ? {
            create: await ArrayUtil.asyncMap(
              props.body.links,
              async (elem, i) => {
                const linkId: string = v4(); // for re-using
                return {
                  id: linkId,
                  comment: {
                    connect: { id },
                  },
                  url: elem.url,
                  sequence: i,
                  created_at: new Date(),
                  updated_at: new Date(),
                  deleted_at: null,
                } satisfies Prisma.bbs_article_comment_linksCreateInput;
              },
            )
          }
        : undefined,
      // don't make that actually cannot make
      // - bbs_article_comment_hits
      // - bbs_article_comment_likes
    } satisfies Prisma.bbs_article_commentsCreateInput;
  }
}
```

## Transformer

> ```typescript
> // Forward declarations of reused transformers
> export namespace BbsUserAtSummaryTransformer {
>   export type Payload = Prisma.bbs_usersGetPayload<ReturnType<typeof select>>;
>   export function select() {
>     return { ... } satisfies Prisma.bbs_usersFindManyArgs;
>   }
>   export async function transform(input: Payload): Promise<IBbsUser.ISummary>;
> }
>
> export namespace BbsArticleCommentAtSummaryTransformer {
>   export type Payload = Prisma.bbs_article_commentsGetPayload<ReturnType<typeof select>>;
>   export function select() {
>     return { ... } satisfies Prisma.bbs_article_commentsFindManyArgs;
>   }
>   export async function transform(input: Payload): Promise<IBbsArticleComment.ISummary>;
> }
>
> export namespace BbsArticleCommentFileTransformer {
>   export type Payload = Prisma.bbs_article_comment_filesGetPayload<ReturnType<typeof select>>;
>   export function select() {
>     return { ... } satisfies Prisma.bbs_article_comment_filesFindManyArgs;
>   }
>   export async function transform(input: Payload): Promise<IBbsArticleCommentFile>;
> }
>
> export namespace BbsArticleCommentTagTransformer {
>   export type Payload = Prisma.bbs_article_comment_tagsGetPayload<ReturnType<typeof select>>;
>   export function select() {
>     return { ... } satisfies Prisma.bbs_article_comment_tagsFindManyArgs;
>   }
>   export async function transform(input: Payload): Promise<IBbsArticleCommentTag>;
> }
> ```

```typescript
export namespace BbsArticleCommentTransformer {
  export type Payload = Prisma.bbs_article_commentsGetPayload<
    ReturnType<typeof select>
  >;

  export function select() {
    return {
      select: {
        // SCALAR COLUMNS
        id: true,
        content: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,

        // BELONGED RELATIONS
        user: BbsUserAtSummaryTransformer.select(),
        parent: BbsArticleCommentAtSummaryTransformer.select(),

        // HAS RELATIONS
        bbs_article_comment_files: BbsArticleCommentFileTransformer.select(),
        bbs_article_comment_tags: BbsArticleCommentTagTransformer.select(),
        bbs_article_comment_links: {
          select: {
            id: true,
            url: true,
            sequence: true,
            created_at: true,
            updated_at: true,
            deleted_at: true,
          },
        },

        // AGGREGATIONS
        _count: {
          select: {
            bbs_article_comment_hits: true,
            bbs_article_comment_likes: true,
          },
        },
      },
    } satisfies Prisma.bbs_article_commentsFindManyArgs;
  }
  
  export async function transform(input: Payload): Promise<IBbsArticleComment> {
    return {
      // SCALAR COLUMNS
      id: input.id,
      content: input.content,
      created_at: input.created_at.toISOString(),
      updated_at: input.updated_at.toISOString(),
      deleted_at: input.deleted_at?.toISOString() ?? null,

      // BELONGED RELATIONS
      writer: await BbsUserAtSummaryTransformer.transform(input.user),
      parent: input.parent
        ? await BbsArticleCommentAtSummaryTransformer.transform(
            input.parent,
          )
        : null,

      // HAS RELATIONS
      files: await ArrayUtil.asyncMap(
        input.bbs_article_comment_files.sort(
          (a, b) => a.sequence - b.sequence,
        ),
        async (elem) =>
          await BbsArticleCommentFileTransformer.transform(elem),
      ),
      tags: await ArrayUtil.asyncMap(
        input.bbs_article_comment_tags,
        async elem =>
          await BbsArticleCommentTagTransformer.transform(elem),
      ),
      links: await ArrayUtil.asyncMap(
        input.bbs_article_comment_links.sort(
          (a, b) => a.sequence - b.sequence,
        ),
        async elem => {
          return {
            id: elem.id,
            url: elem.url,
            created_at: elem.created_at.toISOString(),
            updated_at: elem.updated_at.toISOString(),
            deleted_at: elem.deleted_at?.toISOString() ?? null,
          }
        }
      ),
      
      // AGGREGATIONS
      hit: input._count.bbs_article_comment_hits,
      like: input._count.bbs_article_comment_likes,
    };
  }
}
```