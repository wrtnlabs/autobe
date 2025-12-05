REALIZE_COLLECTOR_WRITE.md 및 REALIZE_TRANSFORMER_WRITE.md로 에이전트를 구성해도, 그 성공률이 매우 빈약하다. 이에 다음 지시사항을 기초로 이들 문서를 싹 다 다시 써다오. 물론 Prisma DB schema와 DTO type을 정밀 분석해야한다하는 기본 원칙은 절대 안 변함.

다만 구체적인 예제가 부실하여 영 못하는게 아닌가 그러한 생각만이 들 뿐임. 따라서 내가 제시해주는 예제를 골자로하여, 컨텐츠를 완전 다시 구성해 볼 것. 스토리 전개도 예제를 먼저 제시하고, 그 다음에 설명을 하는 방식으로 바꾸어보자. 이게 맞는거 같더라.

=================================================

`REALIZE_COLLECTOR.WRITE.md`의 성공률이 너무 낮음.

이에 컨텐츠를 아예 완전히 다시 쓰고자 함.

아래 예시 코드를 참고하여, 이를 기준으로 컨텐츠를 새로이 전개해나가주기 바람.

물론, 컨텐츠를 완전히 다시 쓴다고하여도 function calling을 한다는 것이나 input materials로 주어지는 정보는 그대로이다. 또한 Prisma schema와 DTO type을 정밀하게 분석하고 변환해야한다는 것은 마찬가지이니라.

## Prisma Schema

Prisma DB schema 정의임. 무조건 정독하고 정밀하게 분석해야함.

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

아래는 차후 예제에서 neighbor collector/transformer가 없어 inlining으로 직접 구성해야하는 DB 테이블.

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

Prisma Schema를 정밀 분석한 후에는, DTO 타입도 정밀 분석해야함.

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

Collector 구성 예시.

보다시피 column 및 belonged relation에 대하여는 절대 누락이 있어서는 안 됨. `id`, `created_at`, `updated_at`이나 `deleted_at`처럼 DTO에는 없는 컬럼들도 있을진데, 기본값으로 구성 가능할 수 있는 것들은 다 구성해야함.

그리고 보다시피 순서를 의미하는 sequence 컬럼을 가진 DB 테이블이 있다면, 아래처럼 `i`를 이용해서 그 sequence 값을 채워줄 수 있어야하고, 또한 sequence 컬럼을 가지는 DB 테이블에 대한 collector를 만들때는 당연히 이 sequence를 props 파라미터 상 속성으로써로 반드시 받아내야함.

이외에 props에 body 및 sequence 외에 들어가는 IEntity 타입들은 모두, API operation상 path parameters에서 추려낼 수 있는 애들임.

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
      // must define every scalar columns without any ommission
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
      // also, never omit any belonged relation connection
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

아래는 재사용 가능한 neighbor collector들의 정의.

이처럼 특정 타입에 대한 collector 존재시, 반드시 이를 재사용해야함.

Neighbor collector아 있는데도 이를 사용하지 않고 inlining 하는것은 절대 금지사항.

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

## Transformer

Transformer는 payload -> select -> transform 함수 순으로 구성해야함.

아래 예제에서 보다시피, DTO에 필요한 컬럼 및 relation들은 반드시 모두 선택해야함.

그리고 neighbor transformer가 있는데 이를 사용하지 않는 것은 절대 금지사항이며, 오직 transformer가 없는 경우에 한정해서만 inlining이 허용됨.

```typescript
export namespace BbsArticleCommentTransformer {
  export type Payload = Prisma.bbs_article_commentsGetPayload<
    ReturnType<typeof select>
  >;

  export function select() {
    return {
      select: {
        //----
        // SCALAR COLUMNS
        //----
        id: true,
        content: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,

        //----
        // BELONGED RELATIONS
        //----
        user: BbsUserAtSummaryTransformer.select(),
        parent: BbsArticleCommentAtSummaryTransformer.select(),

        //----
        // HAS RELATIONS
        //----
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

        //----
        // AGGREGATIONS
        //----
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
      //----
      // SCALAR COLUMNS
      //----
      id: input.id,
      content: input.content,
      created_at: input.created_at.toISOString(),
      updated_at: input.updated_at.toISOString(),
      deleted_at: input.deleted_at?.toISOString() ?? null,

      //----
      // BELONGED RELATIONS
      //----
      writer: await BbsUserAtSummaryTransformer.transform(input.user),
      parent: input.parent
        ? await BbsArticleCommentAtSummaryTransformer.transform(
            input.parent,
          )
        : null,

      //----
      // HAS RELATIONS
      //----
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
      
      //----
      // AGGREGATIONS
      //----
      hit: input._count.bbs_article_comment_hits,
      like: input._count.bbs_article_comment_likes,
    };
  }
}
```

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