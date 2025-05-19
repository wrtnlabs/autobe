export const PRISMA_EXAMPLE = `
// Filename - articles.prisma
/// Attachment File.
///
/// Every attachment files that are managed in this shopping mall system.
///
/// For reference, it is possible to omit one of file name or extension like
/// ".gitignore" or "README" case, but not possible to omit both of them,
///
/// @namespace Articles
/// @author Samchon
model attachment_files {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// File name, except extension.
  ///
  /// If there's file ".gitignore", then its name is an empty string.
  ///
  /// @maxLength 255
  name String @db.VarChar

  /// Extension.
  ///
  /// Possible to omit like "README" case.
  ///
  /// @minLength 1
  /// @maxLength 8
  extension String? @db.VarChar

  /// URL path of the real file.
  ///
  /// @format uri
  url String @db.VarChar(1024)

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  //----
  // RELATIONS
  //----
  bbs_article_snapshot_files                bbs_article_snapshot_files[]
  bbs_article_comment_snapshots_files       bbs_article_comment_snapshot_files[]
  shopping_sale_snapshot_content_files      shopping_sale_snapshot_content_files[]
  shopping_sale_snapshot_content_thumbnails shopping_sale_snapshot_content_thumbnails[]

  @@index([url])
}

/// Article entity.
///
/// "bbs_articles" is a super-type entity of all kinds of articles in the
/// current shopping mall system, literally shaping individual articles of
/// the bulletin board.
///
/// And, as you can see, the elements that must inevitably exist in the
/// article, such as the title or the body, do not exist in the "bbs_articles",
/// but exist in the subsidiary entity, {@link bbs_article_snapshots}, as a
/// 1: N relationship, which is because a new snapshot record is published
/// every time the article is modified.
///
/// The reason why a new snapshot record is published every time the article
/// is modified is to preserve the evidence. Due to the nature of e-commerce,
/// there is always a threat of dispute among the participants. And it can
/// happen that disputes arise through articles or comments, and to prevent
/// such things as modifying existing articles to manipulate the situation,
/// the article is designed in this structure.
///
/// In other words, to keep evidence, and prevent fraud.
///
/// @namespace Articles
/// @erd Inquiries
/// @author Samchon
model bbs_articles {
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Creation time of article.
  created_at DateTime @db.Timestamptz

  /// Deletion time of article.
  ///
  /// To keep evidence, do not delete the article, but just mark it as
  /// deleted.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// List of snapshots.
  ///
  /// It is created for the first time when an article is created, and is
  /// accumulated every time the article is modified.
  ///
  /// @minItems 1
  snapshots bbs_article_snapshots[]

  /// List of comments.
  comments bbs_article_comments[]

  of_inquiry        shopping_sale_snapshot_inquiries?
  of_inquiry_answer shopping_sale_snapshot_inquiry_answers?

  mv_last mv_bbs_article_last_snapshots?

  @@index([created_at])
}

/// Snapshot of article.
///
/// "bbs_article_snapshots" is a snapshot entity that contains the contents of
/// the article, as mentioned in {@link bbs_articles}, the contents of the
/// article are separated from the article record to keep evidence and prevent
/// fraud.
///
/// @namespace Articles
/// @erd Inquiries
/// @author Samchon
model bbs_article_snapshots {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belong article's {@link bbs_articles.id}
  ///
  /// @format uuid
  bbs_article_id String @db.Uuid

  /// Format of body.
  ///
  /// Same meaning with extension like "html", "md", "txt".
  format String @db.VarChar

  /// Title of article.
  title String @db.VarChar

  /// Content body of article.
  body String

  /// Creation time of record.
  ///
  /// It means creation time or update time or article.
  created_at DateTime @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// Belong article info.
  article bbs_articles @relation(fields: [bbs_article_id], references: [id], onDelete: Cascade)

  /// List of wrappers of attachment files.
  to_files bbs_article_snapshot_files[]

  of_review                                shopping_sale_snapshot_review_snapshots?
  mv_last                                  mv_bbs_article_last_snapshots?
  shopping_sale_snapshot_inquiry_favorites shopping_sale_snapshot_inquiry_favorites[]

  @@index([bbs_article_id, created_at])
  @@index([title(ops: raw("gin_trgm_ops"))], type: Gin)
  @@index([body(ops: raw("gin_trgm_ops"))], type: Gin)
}

/// Attachment file of article snapshot.
///
/// "bbs_article_snapshot_files" is an entity that shapes the attached files of
/// the article snapshot.
///
/// "bbs_article_snapshot_files" is a typical pair relationship table to
/// resolve the M: N relationship between {@link bbs_article_snapshots} and
/// {@link attachment_files} tables. Also, to ensure the order of the attached
/// files, it has an additional "sequence" attribute, which we will continue to
/// see in this documents.
///
/// @namespace Articles
/// @author Samchon
model bbs_article_snapshot_files {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged snapshot's {@link bbs_article_snapshots.id}
  ///
  /// @format uuid
  bbs_article_snapshot_id String @db.Uuid

  /// Belonged file's {@link attachment_files.id}
  ///
  /// @format uuid
  attachment_file_id String @db.Uuid

  /// Sequence of attachment file in the snapshot.
  ///
  /// @format int
  sequence Int @db.Integer

  //----
  // RELATIONS
  //----
  /// Belonged article.
  snapshot bbs_article_snapshots @relation(fields: [bbs_article_snapshot_id], references: [id], onDelete: Cascade)

  /// Belonged file.
  file attachment_files @relation(fields: [attachment_file_id], references: [id], onDelete: Cascade)

  @@index([bbs_article_snapshot_id])
  @@index([attachment_file_id])
}

/// Comment written on an article.
///
/// "bbs_article_comments" is an entity that shapes the comments written on an
/// article.
///
/// And for this comment, as in the previous relationship between
/// {@link bbs_articles} and {@link bbs_article_snapshots}, the content body
/// of the comment is stored in the sub {@link bbs_article_comment_snapshots}
/// table for evidentialism, and a new snapshot record is issued every time
/// the comment is modified.
///
/// Also, "bbs_article_comments" is expressing the relationship of the
/// hierarchical reply structure through the "parent_id" attribute.
///
/// @namespace Articles
/// @erd Inquiries
/// @author Samchon
model bbs_article_comments {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged article's {@link bbs_articles.id}
  ///
  /// @format uuid
  bbs_article_id String @db.Uuid

  /// Parent comment's {@link bbs_article_comments.id}
  ///
  /// Used to express the hierarchical reply structure.
  ///
  /// @format uuid
  parent_id String? @db.Uuid

  /// Creation time of comment.
  created_at DateTime @db.Timestamptz

  /// Deletion time of comment.
  ///
  /// Do not allow to delete the comment, but just mark it as deleted,
  /// to keep evidence.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// Belonged article.
  article bbs_articles @relation(fields: [bbs_article_id], references: [id], onDelete: Cascade)

  /// Parent comment.
  ///
  /// Only when reply case.
  parent bbs_article_comments? @relation("bbs_article_comments_reply", fields: [parent_id], references: [id], onDelete: Cascade)

  /// List of children comments.
  ///
  /// Reply comments of current.
  children bbs_article_comments[] @relation("bbs_article_comments_reply")

  /// List of snapshots.
  ///
  /// It is created for the first time when a comment is created, and is
  /// accumulated every time the comment is modified.
  ///
  /// @minItems 1
  snapshots  bbs_article_comment_snapshots[]
  of_inquiry shopping_sale_snapshot_inquiry_comments?

  @@index([bbs_article_id, parent_id, created_at])
}

/// Snapshot of comment.
///
/// "bbs_article_comment_snapshots" is a snapshot entity that contains the
/// contents of the comment.
///
/// As mentioned in {@link bbs_article_comments}, designed to keep evidence
/// and prevent fraud.
///
/// @namespace Articles
/// @author Samchon
model bbs_article_comment_snapshots {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged article's {@link bbs_article_comments.id}
  ///
  /// @format uuid
  bbs_article_comment_id String @db.Uuid

  /// Format of content body.
  ///
  /// Same meaning with extension like "html", "md", "txt".
  format String @db.VarChar

  /// Content body of comment.
  body String

  /// Creation time of record.
  ///
  /// It means creation time or update time or comment.
  created_at DateTime @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// Belong comment info.
  comment bbs_article_comments @relation(fields: [bbs_article_comment_id], references: [id], onDelete: Cascade)

  /// List of wrappers of attachment files.
  files bbs_article_comment_snapshot_files[]

  @@index([bbs_article_comment_id, created_at])
  @@index([body(ops: raw("gin_trgm_ops"))], type: Gin)
}

/// Attachment file of comment snapshot.
///
/// "bbs_article_comment_snapshot_files" is an entity resolving the M:N
/// relationship between {@link bbs_article_comment_snapshots} and
/// {@link attachment_files} tables.
///
/// @namespace Articles
/// @author Samchon
model bbs_article_comment_snapshot_files {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged snapshot's {@link bbs_article_comment_snapshots.id}
  ///
  /// @format uuid
  bbs_article_comment_snapshot_id String @db.Uuid

  /// Belonged file's {@link attachment_files.id}
  ///
  /// @format uuid
  attachment_file_id String @db.Uuid

  /// Sequence order.
  ///
  /// Sequence order of the attached file in the belonged snapshot.
  ///
  /// @type int
  sequence Int @db.Integer

  //----
  // RELATIONS
  //----
  /// Belonged article.
  snapshot bbs_article_comment_snapshots @relation(fields: [bbs_article_comment_snapshot_id], references: [id], onDelete: Cascade)

  /// Belonged file.
  file attachment_files @relation(fields: [attachment_file_id], references: [id], onDelete: Cascade)

  @@index([bbs_article_comment_snapshot_id])
  @@index([attachment_file_id])
}

/// @hidden
model mv_bbs_article_last_snapshots {
  bbs_article_id          String @id @db.Uuid
  bbs_article_snapshot_id String @db.Uuid

  article  bbs_articles          @relation(fields: [bbs_article_id], references: [id], onDelete: Cascade)
  snapshot bbs_article_snapshots @relation(fields: [bbs_article_snapshot_id], references: [id], onDelete: Cascade)

  @@unique([bbs_article_snapshot_id])
}

// Filename - systematic.prisma
/// Channel information.
///
/// "shopping_channels" is a concept that shapes the distribution channel in
/// the market. Therefore, the difference in the channel in this e-commerce
/// system means that it is another site or application.
///
/// By the way, if your shopping mall system requires only one channel, then
/// just use only one. This concept is designed to be expandable in the future.
///
/// @namespace Systematic
/// @erd Sales
/// @author Samchon
model shopping_channels {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Identifier code.
  code String @db.VarChar

  /// Name of channel.
  name String @db.VarChar

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Update time of record.
  updated_at DateTime @db.Timestamptz

  /// Deletion time of record.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  shopping_channel_categories shopping_channel_categories[]
  shopping_customers          shopping_customers[]
  shopping_citizens           shopping_citizens[]
  shopping_members            shopping_members[]
  shopping_member_emails      shopping_member_emails[]
  shopping_external_users     shopping_external_users[]

  @@unique([code])
  @@unique([name])
  @@index([created_at])
}

/// Category of channel.
///
/// "shopping_channel_categories" is a concept that refers to classification
/// categories within a specific channel, and is exactly the same as the concept
/// commonly referred to as "category" in shopping malls.
///
/// And "shopping_channel_categories" is different with
/// {@link shopping_sections}. {@link shopping_sections} refers to a "corner"
/// that is independent spatial information in the offline market, which cannot
/// simultaneously classified in a {@link shopping_sales sale}. Besides,
/// "shopping_channel_categories" can be classified into multiple categories
/// in a {@link shopping_sales sale} simultaneously.
///
/// Product | Section (corner) | Categories
/// --------|------------------|--------------------------------------
/// Beef  | Butcher corner   | Frozen food, Meat, **Favorite food**
/// Grape   | Fruit corner   | Fresh food, **Favorite food**
///
/// In addition, as "shopping_channel_categories" has 1:N self recursive
/// relationship, it is possible to express below hierarchical structures.
/// Thus, each channel can set their own category classification as they want.
///
///   - Food > Meat > Frozen
///   - Electronics > Notebook > 15 inches
///   - Miscellaneous > Wallet
///
/// Furthermore, "shopping_channel_categories" is designed to merge between
/// themselves, so there is no burden to edit the category at any time.
///
/// @namespace Systematic
/// @erd Sales
/// @author Samchon
model shopping_channel_categories {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged channel's {@link shopping_channels.id}.
  ///
  /// @format uuid
  shopping_channel_id String @db.Uuid

  /// Parent category's {@link shopping_channel_categories.id}.
  ///
  /// Only when the category is a subcategory of another one.
  ///
  /// @format uuid
  parent_id String? @db.Uuid

  /// Identifier code.
  code String @db.VarChar

  /// Name of category.
  name String @db.VarChar

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Updadte time of record.
  updated_at DateTime @db.Timestamptz

  /// Deletion time of record.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  channel                           shopping_channels                   @relation(fields: [shopping_channel_id], references: [id], onDelete: Cascade)
  parent                            shopping_channel_categories?        @relation("shopping_channel_categories_children", fields: [parent_id], references: [id], onDelete: Cascade)
  children                          shopping_channel_categories[]       @relation("shopping_channel_categories_children")
  shopping_sale_snapshot_categories shopping_sale_snapshot_categories[]

  @@unique([shopping_channel_id, code])
  @@unique([shopping_channel_id, parent_id, name])
  @@index([parent_id])
}

/// Section information.
///
/// "shopping_sections" is a concept that refers to the spatial information
/// of the market.
///
/// If we compare the section mentioned here to the offline market, it means
/// a spatially separated area within the store, such as the "fruit corner"
/// or "butcher corner". Therefore, in the {@link shopping_sales sale} entity,
/// it is not possible to classify multiple sections simultaneously, but only
/// one section can be classified.
///
/// By the way, if your shopping mall system requires only one section, then
/// just use only one. This concept is designed to be expandable in the future.
///
/// @namespace Systematic
/// @erd Sales
/// @author Samchon
model shopping_sections {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Identifier code.
  code String @db.VarChar

  /// Name of section.
  name String @db.VarChar

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Update time of record.
  updated_at DateTime @db.Timestamptz

  /// Deletion time of record.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  shopping_sales                    shopping_sales[]
  shopping_coupon_section_criterias shopping_coupon_section_criterias[]

  @@unique([code])
  @@unique([name])
  @@index([created_at])
}

/// @hidden
model mv_cache_times {
  id     String   @id @db.Uuid
  schema String   @db.VarChar
  table  String   @db.VarChar
  key    String   @db.VarChar
  value  DateTime @db.Timestamptz

  @@unique([schema, table, key])
}

// Filename - actors.prisma
/// Customer information, but not a person but a **connection** basis.
///
/// "shopping_customers" is an entity that literally embodies the information
/// of those who participated in the market as customers. By the way, the
/// "shopping_Customers" does not mean a person, but a **connection** basis.
/// Therefore, even if the same person connects to the shopping mall multiple,
/// multiple records are created in "shopping_customers".
///
/// The first purpose of this is to track the customer's inflow path in detail, and
/// it is for cases where the same person enters as a non-member, puts items in the
/// {@link shopping_cart_commodities shopping cart} in advance, and only authenticates
/// their real name or registers/logs in at the moment of
/// {@link shopping_order_publishes payment}. It is the second. Lastly, it is
/// to accurately track the activities that a person performs at the
/// shopping mall in various ways like below.
///
/// - Same person comes from an {@link shopping_external_users external service}
/// - Same person creates multiple {@link shopping_members accounts}
/// - Same person makes a purchase as a non-member with only {@link shopping_citizens real name authentication}
/// - Same person acts both {@link shopping_sellers seller} and {@link shopping_administrators admin} at the same time
///
/// Therefore, "shopping_customers" can have multiple records with the same
/// {@link shopping_citizens}, {@link shopping_members}, and
/// {@link shopping_external_users}. Additionally, if a customer signs up for
/// membership after verifying their real name or signs up for our service
/// after being a user of an external service, all related records are changed
/// at once. Therefore, identification and tracking of customers can be done
/// very systematically.
///
/// @namespace Actors
/// @erd Coins
/// @erd Favorites
/// @author Samchon
model shopping_customers {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged channel's {@link shopping_channels.id}
  ///
  /// @format uuid
  shopping_channel_id String @db.Uuid /// @format uuid

  /// Belonged member's {@link shopping_members.id}
  ///
  /// @format uuid
  shopping_member_id String? @db.Uuid /// @format uuid

  /// Belonged external service user's {@link shopping_external_users.id}
  ///
  /// @format uuid
  shopping_external_user_id String? @db.Uuid /// @format uuid

  /// Belonged citizen's {@link shopping_citizens.id}
  ///
  /// @format uuid
  shopping_citizen_id String? @db.Uuid /// @format uuid

  /// Connection URL.
  ///
  /// {@link window.location.href}
  ///
  /// @format uri
  href String @db.VarChar(1024)

  /// Referrer URL.
  ///
  /// {@link window.document.referrer}
  ///
  /// @format uri
  referrer String? @db.VarChar(1024)

  /// IP address,
  ///
  /// @pattern ((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))
  ip String @db.VarChar

  /// Creation time of record.
  ///
  /// It means the time when the customer connected to the shopping mall.
  created_at DateTime @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// Belonged channel.
  channel shopping_channels @relation(fields: [shopping_channel_id], references: [id], onDelete: Cascade)

  /// Belonged member.
  member shopping_members? @relation(fields: [shopping_member_id], references: [id], onDelete: Cascade)

  /// Belonged external user.
  external_user shopping_external_users? @relation(fields: [shopping_external_user_id], references: [id], onDelete: Cascade)

  /// Belonged citizen.
  citizen shopping_citizens? @relation(fields: [shopping_citizen_id], references: [id], onDelete: Cascade)

  shopping_carts                           shopping_carts[]
  shopping_coupons                         shopping_coupons[]
  shopping_coupon_tickets                  shopping_coupon_tickets[]
  shopping_deliveries                      shopping_deliveries[]
  shopping_deposit_charges                 shopping_deposit_charges[]
  shopping_orders                          shopping_orders[]
  shopping_sales                           shopping_sales[]
  shopping_sale_snapshot_inquiries         shopping_sale_snapshot_inquiries[]
  shopping_sale_snapshot_inquiry_answers   shopping_sale_snapshot_inquiry_answers[]
  shopping_sale_snapshot_inquiry_comments  shopping_sale_snapshot_inquiry_comments[]
  shopping_sale_favorites                  shopping_sale_favorites[]
  shopping_sale_snapshot_inquiry_favorites shopping_sale_snapshot_inquiry_favorites[]
  shopping_address_favorites               shopping_address_favorites[]
  shopping_mileage_donations               shopping_mileage_donations[]

  @@index([shopping_channel_id, created_at])
  @@index([shopping_citizen_id, created_at])
  @@index([shopping_external_user_id, created_at])
  @@index([shopping_member_id, created_at])
  @@index([href])
  @@index([referrer])
  @@index([ip])
  @@index([created_at])
}

/// External user information.
///
/// "shopping_external_users" is an entity dsigned for when this system needs
/// to connect with external services and welcome their users as customers of
/// this service.
///
/// For reference, customers who connect from an external service must have
/// this record, and the external service user is identified through the two
/// attributes "application" and "uid". If a customer connected from an
/// external service completes {@link shopping_citizens real-name authentication}
/// from this service, each time the external service user reconnects to this
/// service and issues a new {@link shopping_customers customer} authentication
/// token, {@link shopping_citizens real-name authentication} begins with
/// completed.
///
/// And "password" is the password issued to the user by the external service
/// system (the so-called permanent user authentication token), and is never
/// the actual user password. However, for customers who entered the same
/// "application" and "uid" as the current external system user, this is to
/// determine whether to view this as a correct external system user or a
/// violation.
///
/// In addition, additional information received from external services can
/// be recorded in the "data" field in JSON format.
///
/// @namespace Actors
/// @author Samchon
model shopping_external_users {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged channel's {@link shopping_channels.id}
  shopping_channel_id String @db.Uuid

  /// Belonged citizen's {@link shopping_citizens.id}
  shopping_citizen_id String? @db.Uuid

  /// Identifier code of the external service.
  ///
  /// It can be same with {@link shopping_channels.code} in common.
  application String @db.VarChar

  /// Identifier key of external user from the external system.
  uid String @db.VarChar

  /// Nickname of external user in the external system.
  nickname String @db.VarChar

  /// Additional information about external user from the external system.
  data String?

  /// Password of external user from the external system.
  ///
  /// This is a password issued to the user by an external service, and is
  /// by no means the actual user password. However, for customers who
  /// entered the same application and code as the current external system
  /// user, this is to determine whether to view this as a correct external
  /// system user or a violation.
  password String @db.VarChar

  /// Creation time of record.
  ///
  /// Another word, first time when the external user connected.
  created_at DateTime

  //----
  // RELATIONS
  //----
  channel            shopping_channels    @relation(fields: [shopping_channel_id], references: [id], onDelete: Cascade)
  citizen            shopping_citizens?   @relation(fields: [shopping_citizen_id], references: [id], onDelete: Cascade)
  shopping_customers shopping_customers[]

  @@unique([shopping_channel_id, application, uid])
  @@unique([shopping_channel_id, application, nickname])
  @@index([shopping_citizen_id])
  @@index([application, created_at])
  @@index([created_at])
  @@index([nickname(ops: raw("gin_trgm_ops"))], type: Gin)
}

/// Citizen verification information.
///
/// "shopping_citizens" is an entity that records the user's real name and
/// mobile input information.
///
/// For reference, in South Korea, real name authentication is required for
/// e-commerce participants, so the "name" attribute is important. However,
/// the situation is different overseas, so in reality, "mobile" attributes
/// are the most important, and identification of individual users is also
/// done based on this mobile.
///
/// Of course, real name and mobile phone authentication information are
/// encrypted and stored.
///
/// @namespace Actors
/// @erd Coins
/// @author Samchon
model shopping_citizens {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged channel's {@link shopping_channels.id}
  ///
  /// This is to manage personal information separately for each channel,
  /// and also to recognize cases where the same citizen is authenticated
  /// through different channels.
  ///
  /// @format uuid
  shopping_channel_id String? @db.Uuid

  /// Mobile phone number.
  ///
  /// @pattern ^[0-9]*$
  mobile String @db.VarChar

  /// Real name, or equivalent name identifiable.
  name String @db.VarChar

  /// Creation time of record.
  ///
  /// In other words, the 1st time of citizen activation.
  created_at DateTime @db.Timestamptz

  /// Deletion time of record.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  channel shopping_channels? @relation(fields: [shopping_channel_id], references: [id], onDelete: Cascade)

  customers         shopping_customers[]
  members           shopping_members[]
  deposit_histories shopping_deposit_histories[]
  mileage_histories shopping_mileage_histories[]

  mv_deposit_balance                     mv_shopping_deposit_balances?
  mv_mileage_balance                     mv_shopping_mileage_balances?
  mv_shopping_coupon_citizen_inventories mv_shopping_coupon_citizen_inventories[]
  shopping_external_users                shopping_external_users[]
  shopping_mileage_donations             shopping_mileage_donations[]

  @@unique([shopping_channel_id, mobile])
  @@index([mobile])
  @@index([name])
  @@index([created_at])
}

/// Member Account.
///
/// "shopping_members" is an entity that symbolizes the case when a user
/// signs up as a member of this system.
///
/// In addition, "shopping_members" itself is a supertype entity, forming
/// and managing subtypes for various types of members. However,
/// {@link shopping_customers} are an exception, and due to the nature of
/// their records being created on a per-connection basis, they are not
/// divided into separate subtype entities when they sign up for membership.
///
/// For reference, "shopping_members" allows multiple subtypes. Therefore,
/// it is also possible for a {@link shopping_citizens citizen} to be sometimes
/// a {@link shopping_customers customer}, sometimes a
/// {@link shopping_sellers seller}, sometimes an
/// {@link shopping_administrators administrator}, and so on.
///
/// Of course, this is according to system theory, and it is unclear what
/// the planning will be like.
///
/// @namespace Actors
/// @author Samchon
model shopping_members {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged channel's {@link shopping_channels.id}
  ///
  /// @format uuid
  shopping_channel_id String @db.Uuid

  /// Belonged citizen's {@link shopping_citizens.id}
  ///
  /// @format uuid
  shopping_citizen_id String? @db.Uuid

  /// Nickname.
  nickname String @db.VarChar

  /// Password for log-in.
  password String @db.VarChar

  /// Creation time of record.
  ///
  /// In other words, the joining time.
  created_at DateTime @db.Timestamptz

  /// Update time of record.
  updated_at DateTime @db.Timestamptz

  /// Deletion time of record.
  withdrawn_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// Belonged channel.
  channel shopping_channels @relation(fields: [shopping_channel_id], references: [id], onDelete: Cascade)

  /// Belonged citizen.
  citizen shopping_citizens? @relation(fields: [shopping_citizen_id], references: [id], onDelete: Cascade)

  /// List of customer records (connections).
  customers shopping_customers[]

  /// List of email addresses.
  emails shopping_member_emails[]

  of_seller shopping_sellers?
  of_admin  shopping_administrators?

  @@unique([shopping_channel_id, nickname])
  @@unique([shopping_channel_id, shopping_citizen_id])
  @@index([shopping_citizen_id])
  @@index([nickname(ops: raw("gin_trgm_ops"))], type: Gin)
  @@index([created_at])
}

/// Email address of member.
///
/// This system allows multiple email addresses to be registered for one
/// {@link shopping_members member}. If you don't have to plan such multiple
/// email addresses, just use only one.
///
/// @namespace Actors
/// @author Samchon
model shopping_member_emails {
  //----
  // COLUMNS
  //----
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged channel's {@link shopping_channels.id}
  ///
  /// Duplicated attribute with {@link shopping_members.channel_id}, but
  /// just denormalized for composing unique constraint.
  ///
  /// @format uuid
  /// @hidden
  shopping_channel_id String @db.Uuid

  /// Belonged member's {@link shopping_members.id}
  ///
  /// @format uuid
  shopping_member_id String @db.Uuid

  /// Email address.
  ///
  /// @format email
  value String @db.VarChar

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  //----
  // RELATIONS
  //----
  channel shopping_channels @relation(fields: [shopping_channel_id], references: [id], onDelete: Cascade)
  member  shopping_members  @relation(fields: [shopping_member_id], references: [id], onDelete: Cascade)

  @@unique([shopping_channel_id, value])
  @@unique([shopping_member_id, value])
  @@index([value(ops: raw("gin_trgm_ops"))], type: Gin)
}

/// Seller information.
///
/// "shopping_sellers" is an entity that embodies a person who registers
/// {@link shoppingsales sales} to operate selling activities, with
/// {@link shoppingmembers membership} joining.
///
/// For reference, unlike {@link shopping_customers customers} which can
/// participate even without {@link shopping_members membership} joining,
/// seller must join membership to operate sales. Also, seller must
/// do the {@link shopping_citizens real-name authentication}, too.
///
/// @namespace Actors
/// @author Samchon
model shopping_sellers {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged member's {@link shopping_members.id}.
  ///
  /// @format uuid
  shopping_member_id String @db.Uuid

  /// Creation time of record.
  ///
  /// Joining time as seller, and it can be different with
  /// {@link shopping_members membership} joining time.
  created_at DateTime @db.Timestamptz

  /// Withdrawal time.
  ///
  /// It can be different with {@link shopping_members.deleted_at}.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONSHIPS
  //----
  member                                  shopping_members                          @relation(fields: [shopping_member_id], references: [id], onDelete: Cascade)
  shopping_order_goods                    shopping_order_goods[]
  shopping_coupon_seller_criterias        shopping_coupon_seller_criterias[]
  mv_shopping_order_publish_seller_states mv_shopping_order_publish_seller_states[]

  @@unique([shopping_member_id])
  @@index([created_at])
}

/// Administrator account.
///
/// "shopping_administrators" is an entity that embodies a person who manages
/// the shopping mall system, with {@link shopping_members membership} joining.
///
/// For reference, unlike {@link shopping_customers customers} which can
/// participate even without {@link shopping_members membership} joining,
/// administrator must join membership to operate sales. Also, administrator must
/// do the {@link shopping_citizens real-name authentication}, too.
///
/// @todo Not detailed yet.
/// @namespace Actors
/// @author Samchon
model shopping_administrators {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged member's {@link shopping_members.id}.
  ///
  /// @format uuid
  shopping_member_id String @db.Uuid

  /// Creation time of record.
  ///
  /// Joining time as an administrator, and can be different with
  /// {@link shopping_members membership} joining time.
  created_at DateTime @db.Timestamptz

  /// Deletion time of record.
  ///
  /// Withdrawal time from administrator, and can be different with
  /// {@link shopping_members.deleted_at}.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  member shopping_members @relation(fields: [shopping_member_id], references: [id], onDelete: Cascade)

  @@unique([shopping_member_id])
  @@index([created_at])
}

/// The address information.
///
/// @namespace Actors
/// @erd Orders
/// @erd Favorites
/// @author Samchon
model shopping_addresses {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Mobile number.
  mobile String @db.VarChar

  /// Representative name of the address.
  ///
  /// Sometimes be receiver's name, and sometimes be place name.
  name String @db.VarChar

  /// Target country.
  country String @db.VarChar

  /// Target province.
  province String @db.VarChar

  /// Target city.
  city String @db.VarChar

  /// Department name.
  department String @db.VarChar

  /// Detailed address containing room number.
  possession String @db.VarChar

  /// Zip code, or postal code.
  zip_code String @db.VarChar

  /// Special description if required.
  special_note String? @db.VarChar

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// List of orders.
  orders                     shopping_orders[]
  shopping_address_favorites shopping_address_favorites[]
  shopping_order_publishes   shopping_order_publishes[]

  @@index([mobile])
  @@index([name])
}

// Filename - sales.prisma
/// Seller **sales** products.
///
/// "shopping_sales" is an entity that embodies "product sales" (sales)
/// information registered by the {@link shopping_sellers seller}. And the
/// main information of the sale is recorded in the sub
/// {@link shopping_sale_snapshots}, not in the main "shopping_sales".
/// When a seller changes a previously registered item, the existing
/// "shopping_sales" record is not changed, but a new snapshot record is
/// created.
///
/// This is to preserve the {@link shopping_customers customer}'s
/// {@link shopping_orders purchase history} flawlessly after the customer
/// purchases a specific item, even if the seller changes the components or
/// price of the item. It is also intended to support sellers in so-called
/// A/B testing, which involves changing components or prices and measuring
/// the performance in each case.
///
/// @namespace Sales
/// @erd Systematic
/// @erd Favorites
/// @author Samchon
model shopping_sales {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged section's {@link shopping_sections.id}
  ///
  /// @format uuid
  shopping_section_id String @db.Uuid

  /// Belonged seller's {@link shopping_customers.id}
  ///
  /// @format uuid
  shopping_seller_customer_id String @db.Uuid

  /// Creation time of record.
  ///
  /// Note that, this property is different with "opened_at", which means
  /// the opening time of sale.
  created_at DateTime @db.Timestamptz

  /// Opening time of sale.
  ///
  /// If "null" value assigned, it means not opened yet.
  opened_at DateTime? @db.Timestamptz

  /// Closing time of sale.
  ///
  /// If "null" value assigned, the sale is forever.
  closed_at DateTime? @db.Timestamptz

  /// Paused time.
  ///
  /// The time when seller paused the sale in some reason.
  ///
  /// {@link shopping_customers Customers} still can see the sale in list
  /// and detail page, but a label "The sale is paused for a while by seller"
  /// be attached.
  paused_at DateTime? @db.Timestamptz

  /// Suspended time.
  ///
  /// The time when seller suspended the sale in some reason.
  ///
  /// {@link shopping_customers Customers} can't see the sale in list and
  /// detail page. It seems almost same with soft deletion, but there're
  /// some differences.
  ///
  /// At 1st, seller and {@link shopping_administrators administrator} can
  /// see suspended sale in list and detail page. At 2nd, seller can
  /// resume the sale at any time.
  suspended_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  section                        shopping_sections                @relation(fields: [shopping_section_id], references: [id], onDelete: Cascade)
  sellerCustomer                 shopping_customers               @relation(fields: [shopping_seller_customer_id], references: [id], onDelete: Cascade)
  snapshots                      shopping_sale_snapshots[]
  shopping_coupon_sale_criterias shopping_coupon_sale_criterias[]

  mv_last                 mv_shopping_sale_last_snapshots?
  shopping_sale_favorites shopping_sale_favorites[]

  @@index([shopping_section_id])
  @@index([shopping_seller_customer_id])
  @@index([created_at])
  @@index([opened_at, closed_at, suspended_at])
}

/// Sale snapshot information.
///
/// "shopping_sale_snapshots" is an entity representing snapshot record of
/// belonged {@link shopping_sales sale}. The snapshot record is created
/// whenever the seller newly creates or updates the sale.
///
/// Sale | Cart | Order
/// -----|------|------
/// x | {@link shopping_carts} | {@link shopping_orders}
/// {@link shopping_sale_snapshots} | {@link shopping_cart_commodities} | {@link shopping_order_goods}
/// {@link shopping_sale_snapshot_unit_stocks} | {@link shopping_cart_commodity_stocks} | x
///
/// @namespace Sales
/// @erd Systematic
/// @erd Inquiries
/// @erd Carts
/// @erd Favorites
/// @author Samchon
model shopping_sale_snapshots {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged sale's {@link shopping_sales.id}
  ///
  /// @format uuid
  shopping_sale_id String @db.Uuid

  /// Creation time of record.
  ///
  /// It means the time when the seller created or updated the sale.
  created_at DateTime @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// Belonged sale.
  sale shopping_sales @relation(fields: [shopping_sale_id], references: [id], onDelete: Cascade)

  content       shopping_sale_snapshot_contents?
  units         shopping_sale_snapshot_units[]
  tags          shopping_sale_snapshot_tags[]
  to_categories shopping_sale_snapshot_categories[]

  shopping_cart_commodities        shopping_cart_commodities[]
  shopping_sale_snapshot_inquiries shopping_sale_snapshot_inquiries[]

  mv_last                 mv_shopping_sale_last_snapshots?
  mv_price_range          mv_shopping_sale_snapshot_prices?
  shopping_sale_favorites shopping_sale_favorites[]

  @@index([shopping_sale_id, created_at])
}

/// Product composition information handled in the sale snapshot.
///
/// "shopping_sale_snapshot_units" is an entity that embodies the
/// "individual product" information handled in the
/// {@link shopping_sale_snapshots sale snapshot}.
///
/// For reference, the reason why "shopping_sale_snapshot_units" is separated
/// from {@link shopping_sale_snapshots} by an algebraic relationship of
/// 1: N is because there are some cases where multiple products are sold
/// in one listing. This is the case with so-called "bundled products".
///
/// - Bundle from regular product (Macbook Set)
///   - main body
///   - keyboard
///   - mouse
///   - Apple Care (Free A/S Voucher)
///
/// And again, "shopping_sale_snapshot_units" does not in itself refer to
/// the final {@link shopping_sale_snapshot_unit_stocks stock} that the
/// customer will purchase.
/// The {@link shopping_sale_snapshot_unit_stocks final stock} can be
/// found only after selecting all given
/// {@link shopping_sale_snapshot_unit_options options} and their
/// {@link shopping_sale_snapshot_unit_option_candidates candidate} values.
///
/// For example, even if you buy a Macbook, the
/// {@link shopping_sale_snapshot_unit_stocks final stocks} are determined
/// only after selecting all the
/// {@link shopping_sale_snapshot_unit_options options} (CPU / RAM / SSD), etc.
///
/// @namespace Sales
/// @erd Carts
/// @author Samchon
model shopping_sale_snapshot_units {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged snapshot's {@link shopping_sale_snapshots.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_id String @db.Uuid

  /// Representative name of the unit.
  name String @db.VarChar

  /// Whether the unit is primary or not.
  ///
  /// Just a labeling value.
  primary Boolean @db.Boolean

  /// Whether the unit is required or not.
  ///
  /// When the unit is required, the customer must select the unit. If do
  /// not select, customer can't buy it.
  ///
  /// For example, if there's a sale "Macbook Set" and one of the unit is
  /// the "Main Body", is it possible to buy the "Macbook Set" without the
  /// "Main Body" unit? This property is for that case.
  required Boolean @db.Boolean

  /// Sequence order in belonged snapshot.
  sequence Int @db.Integer

  //----
  // RELATIONS
  //----
  /// Belonged snapshot.
  snapshot shopping_sale_snapshots @relation(fields: [shopping_sale_snapshot_id], references: [id], onDelete: Cascade)

  /// List of options.
  options shopping_sale_snapshot_unit_options[]

  /// List of stocks.
  stocks                         shopping_sale_snapshot_unit_stocks[]
  shopping_cart_commodity_stocks shopping_cart_commodity_stocks[]
  mv_price_range                 mv_shopping_sale_snapshot_unit_prices?

  @@unique([shopping_sale_snapshot_id, name])
}

/// Individual option information on units for sale.
///
/// "shopping_sale_snapshot_unit_options" is a subsidiary entity of
/// {@link shopping_sale_snapshot_units} that represents individual products
/// in the sale, and is an entity designed to represent individual option
/// information for the unit.
///
/// - Examples of Options
///   - optional options
///   - Computer: CPU, RAM, SSD, etc.
///   - Clothes: size, color, style, etc.
///   - descriptive options
///   - Engrave
///   - Simple question
///
/// If the "type" of option is a "variable" value in ""select"", the
/// {@link shopping_sale_snapshot_unit_stocks final stock} that the customer
/// will purchase changes depending on the selection of the
/// {@link shopping_sale_snapshot_unit_option_candidates candidate} value.
///
/// Conversely, if it is a "type" other than ""select"", or if the "type"
/// is ""select"" but "variable" is "false", this is an option that has no
/// meaning beyond simple information transfer. Therefore, no matter what
/// value the customer enters and chooses when purchasing it, the option in
/// this case does not affect the
/// {@link shopping_sale_snapshot_unit_stocks final stock}.
///
/// @namespace Sales
/// @erd Carts
/// @author Samchon
model shopping_sale_snapshot_unit_options {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged unit's {@link shopping_sale_snapshot_units.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_unit_id String @db.Uuid

  /// Name of the option.
  name String @db.VarChar

  /// Type of the option.
  ///
  /// - "select": The way selecting one of the candidate values.
  /// - "boolean"
  /// - "number"
  /// - "string"
  type String @db.VarChar

  /// Whether the option is variable or not.
  ///
  /// When "type" of current option is ""select"", this attribute means
  /// whether selecting different
  /// {@link shopping_sale_snapshot_unit_option_candidate candidate} value
  /// affects the {@link shopping_sale_snapshot_unit_stocks final stock}
  /// or not.
  ///
  /// For reference, if "type" value is not ""select"", this attribute
  /// is always "false".
  variable Boolean @db.Boolean

  /// Sequence order in belonged unit.
  ///
  /// @type int
  sequence Int @db.Integer

  //----
  // RELATIONS
  //----
  /// Belonged unit.
  unit shopping_sale_snapshot_units @relation(fields: [shopping_sale_snapshot_unit_id], references: [id], onDelete: Cascade)

  /// List of candidates.
  candidates                                shopping_sale_snapshot_unit_option_candidates[]
  shopping_cart_commodity_stock_choices     shopping_cart_commodity_stock_choices[]
  shopping_sale_snapshot_unit_stock_choices shopping_sale_snapshot_unit_stock_choices[]

  @@unique([shopping_sale_snapshot_unit_id, name])
}

/// Selectable candidate values within an option.
///
/// "shopping_sale_snapshot_unit_option_candidates" is an entity that
/// represents individual candidate values that can be selected from
/// {@link shopping_sale_snapshot_unit_options options} of the "select" type.
///
/// - Example
///   - RAM: 8GB, 16GB, 32GB
///   - GPU: RTX 3060, RTX 4080, TESLA
///   - License: Private, Commercial, Educatiion
///
/// By the way, if belonged {@link shopping_sale_snapshot_unit_options option}
/// is not "select" type, this entity never being used.
///
/// @namespace Sales
/// @erd Carts
/// @author Samchon
model shopping_sale_snapshot_unit_option_candidates {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged option's {@link shopping_sale_snapshot_unit_options.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_unit_option_id String @db.Uuid

  /// Representative name of candidate value.
  name String @db.VarChar

  /// Sequence order in option.
  sequence Int @db.Integer

  //----
  // RELATIONS
  //----
  /// Belonged entity.
  option shopping_sale_snapshot_unit_options @relation(fields: [shopping_sale_snapshot_unit_option_id], references: [id], onDelete: Cascade)

  /// List of choices in stock.
  choices                               shopping_sale_snapshot_unit_stock_choices[]
  shopping_cart_commodity_stock_choices shopping_cart_commodity_stock_choices[]

  @@unique([shopping_sale_snapshot_unit_option_id, name])
}

/// Final component information on units for sale.
///
/// "shopping_sale_snapshot_unit_stocks" is a subsidiary entity of
/// {@link shopping_sale_snapshot_units} that represents a product catalog
/// for sale, and is a kind of final stock that is constructed by selecting
/// all {@link shopping_sale_snapshot_unit_options options}
/// (variable "select" type) and their
/// {@link shopping_sale_snapshot_unit_option_candidates candidate} values in
/// the belonging unit. It is the "good" itself that customers actually
/// purchase.
///
/// - Product Name) MacBook
///   - Options
///   - CPU: { i3, i5, i7, i9 }
///   - RAM: { 8GB, 16GB, 32GB, 64GB, 96GB }
///   - SSD: { 256GB, 512GB, 1TB }
///   - Number of final stocks: 4 * 5 * 3 = 60
///
/// For reference, the total number of "shopping_sale_snapshot_unit_stocks"
/// records in an attribution unit can be obtained using Cartesian Product.
/// In other words, the value obtained by multiplying all the candidate
/// values that each (variable "select" type) option can have by the number
/// of cases is the total number of final stocks in the unit.
///
/// Of course, without a single variable "select" type option, the final
/// stocks count in the unit is only 1.
///
/// @namespace Sales
/// @erd Carts
/// @author Samchon
model shopping_sale_snapshot_unit_stocks {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged unit's {@link shopping_sale_snapshot_units.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_unit_id String @db.Uuid

  /// Name of the final stock.
  name String @db.VarChar

  /// Nominal price.
  ///
  /// This is not real price to pay, but just a nominal price to show.
  /// If this value is greater than the "real_price", it would be shown
  /// like seller is giving a discount.
  ///
  /// @minimum 0
  nominal_price Float @db.DoublePrecision

  /// Real price to pay.
  ///
  /// @minimum 0
  real_price Float @db.DoublePrecision

  /// Initial inventory quantity.
  ///
  /// If this stock has been sold over this quantity count, the stock can't
  /// be sold anymore, because of out of stock. In that case, the seller can
  /// supplement the inventory quantity by registering some
  /// {@link shopping_sale_snapshot_unit_stock_supplements} records.
  ///
  /// @minimum 0
  quantity Int

  /// Sequence order in belonged unit.
  sequence Int @db.Integer

  //----
  // RELATIONS
  //----
  /// Belonged unit.
  unit shopping_sale_snapshot_units @relation(fields: [shopping_sale_snapshot_unit_id], references: [id], onDelete: Cascade)

  /// List of choices.
  ///
  /// Which candidate values are chosen in each option.
  choices shopping_sale_snapshot_unit_stock_choices[]

  /// List of supplements of inventory quantity.
  supplements shopping_sale_snapshot_unit_stock_supplements[]

  shopping_cart_commodity_stocks shopping_cart_commodity_stocks[]

  mv_inventory             mv_shopping_sale_snapshot_unit_stock_inventories?
  shopping_delivery_pieces shopping_delivery_pieces[]

  @@unique([shopping_sale_snapshot_unit_id, name])
}

/// Selection information of final stock.
///
/// "shopping_sale_snapshot_unit_stock_choices" is an entity that represents
/// which {@link shopping_sale_snapshot_unit_options option} of each "variable"
/// "select" "type" was selected for each stock and which
/// {@link shopping_sale_snapshot_unit_option_candidates candidate value} was
/// selected within it.
///
/// Of course, if the bound {@link shopping_sale_snapshot_units unit} does not
/// have any {@link shopping_sale_snapshot_unit_options options}, this entity
/// can also be ignored.
///
/// @namespace Sales
/// @author Samchon
model shopping_sale_snapshot_unit_stock_choices {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged stock's {@link shopping_sale_snapshot_unit_stocks.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_unit_stock_id String @db.Uuid

  /// Belonged option's {@link shopping_sale_snapshot_unit_options.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_unit_option_id String @db.Uuid

  /// Belonged candidate's {@link shopping_sale_snapshot_unit_option_candidates.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_unit_option_candidate_id String @db.Uuid

  /// Sequence order in belonged stock.
  sequence Int @db.Integer

  //----
  // RELATIONS
  //----
  /// Belonged stock.
  stock shopping_sale_snapshot_unit_stocks @relation(map: "fk_shopping_sale_snapshot_unit_stock_choices_stock", fields: [shopping_sale_snapshot_unit_stock_id], references: [id], onDelete: Cascade)

  option shopping_sale_snapshot_unit_options? @relation(map: "fk_shopping_sale_snapshot_unit_stock_choices_option", fields: [shopping_sale_snapshot_unit_option_id], references: [id], onDelete: Cascade)

  /// Belonged candidate.
  candidate shopping_sale_snapshot_unit_option_candidates? @relation(map: "fk_shopping_sale_snapshot_unit_stock_choices_candidate", fields: [shopping_sale_snapshot_unit_option_candidate_id], references: [id], onDelete: Cascade)

  @@unique([shopping_sale_snapshot_unit_stock_id, shopping_sale_snapshot_unit_option_candidate_id])
}

/// Supplementation of inventory quantity of stock.
///
/// You know what? If a stock has been sold over its
/// {@link shopping_sale_snapshot_unit_stocks.inventory initial inventory quantity},
/// the stock can't be sold anymore, because of out of stock. In that case, how the
/// {@link shopping_sellers} should do?
///
/// When the sotck is sold out, seller can supplement the inventory record by
/// registering this "shopping_sale_snapshot_unit_stock_supplements" record. Right,
/// this "shopping_sale_snapshot_unit_stock_supplements" is an entity that embodies
/// the supplementation of the inventory quantity of the belonged
/// {@link shopping_sale_snapshot_unit_stocks stock}.
///
/// @describe Sales
/// @author Samchon
model shopping_sale_snapshot_unit_stock_supplements {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged stock's {@link shopping_sale_snapshot_unit_stocks.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_unit_stock_id String @db.Uuid

  /// Supplemented inventory quantity.
  quantity Int

  /// Creation time of record.
  ///
  /// When the inventory be supplemented.
  created_at DateTime @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// Belonged stock.
  stock shopping_sale_snapshot_unit_stocks @relation(fields: [shopping_sale_snapshot_unit_stock_id], references: [id], onDelete: Cascade)

  @@index([shopping_sale_snapshot_unit_stock_id, created_at])
}

/// Category classification info of sale snapshot.
///
/// "shopping_sale_snapshot_categories" is an entity that expresses
/// which {@link shopping_channel_categories category} the listing
/// {@link shopping_sale_snapshots snapshot}.
///
/// It is designed to resolve the M:N relationship between
/// {@link shopping_sale_snapshots} and {@link shopping_channel_categories},
/// respectively. Of course, if the target category being referred to is a
/// major category, all minor categories belonging to it can also be used.
///
/// @namespace Sales
/// @erd Systematic
/// @author Samchon
model shopping_sale_snapshot_categories {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged snapshot's {@link shopping_sale_snapshots.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_id String @db.Uuid

  /// Belonged category's {@link shopping_channel_categories.id}
  ///
  /// @format uuid
  shopping_channel_category_id String @db.Uuid

  /// Sequence order in belonged snapshot.
  sequence Int @db.Integer

  //----
  // RELATIONS
  //----
  snapshot shopping_sale_snapshots     @relation(fields: [shopping_sale_snapshot_id], references: [id], onDelete: Cascade)
  category shopping_channel_categories @relation(fields: [shopping_channel_category_id], references: [id], onDelete: Cascade)

  @@unique([shopping_sale_snapshot_id, shopping_channel_category_id])
  @@index([shopping_channel_category_id])
}

/// Content information of sale snapshot.
///
/// "shopping_sale_snapshot_contents" is an entity embodies the body contents
/// of {@link shopping_sale_snapshots sale snapshot}. Also, it contains
/// revert policy of the sale.
///
/// @describe Sales
/// @author Samchon
model shopping_sale_snapshot_contents {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged snapshot's {@link shopping_sale_snapshots.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_id String @db.Uuid

  /// Title of the content.
  title String @db.VarChar

  /// Format of the body content.
  ///
  /// Same meaning with extension like "html", "md", "txt".
  format String @db.VarChar

  /// The main body content.
  body String @db.Text

  /// Revert policy.
  ///
  /// This is essential in South Korea, but I don't know well in overseas.
  ///
  /// Just use when you need.
  revert_policy String? @db.VarChar

  //----
  // RELATIONS
  //----
  /// Belonged snapshot.
  snapshot shopping_sale_snapshots @relation(fields: [shopping_sale_snapshot_id], references: [id], onDelete: Cascade)

  to_files      shopping_sale_snapshot_content_files[]
  to_thumbnails shopping_sale_snapshot_content_thumbnails[]

  @@unique([shopping_sale_snapshot_id])
  @@index([title(ops: raw("gin_trgm_ops"))], type: Gin)
  @@index([body(ops: raw("gin_trgm_ops"))], type: Gin)
}

/// Attachment file of sale snapshot content.
///
/// @describe Sales
/// @author Samchon
model shopping_sale_snapshot_content_files {
  id                                String @id @db.Uuid
  shopping_sale_snapshot_content_id String @db.Uuid
  attachment_file_id                String @db.Uuid
  sequence                          Int    @db.Integer

  content shopping_sale_snapshot_contents @relation(fields: [shopping_sale_snapshot_content_id], references: [id], onDelete: Cascade)
  file    attachment_files                @relation(fields: [attachment_file_id], references: [id], onDelete: Cascade)

  @@index([shopping_sale_snapshot_content_id])
  @@index([attachment_file_id])
}

/// Thumbnail of sale snapshot content.
///
/// @describe Sales
/// @author Samchon
model shopping_sale_snapshot_content_thumbnails {
  id                                String @id @db.Uuid
  shopping_sale_snapshot_content_id String @db.Uuid
  attachment_file_id                String @db.Uuid
  sequence                          Int    @db.Integer

  content shopping_sale_snapshot_contents @relation(fields: [shopping_sale_snapshot_content_id], references: [id], onDelete: Cascade)
  file    attachment_files                @relation(fields: [attachment_file_id], references: [id], onDelete: Cascade)

  @@index([shopping_sale_snapshot_content_id])
  @@index([attachment_file_id])
}

/// Search tag of sale snapshot.
///
/// @describe Sales
/// @author Samchon
model shopping_sale_snapshot_tags {
  id                        String @id @db.Uuid
  shopping_sale_snapshot_id String @db.Uuid
  value                     String @db.VarChar
  sequence                  Int    @db.Integer

  snapshot shopping_sale_snapshots @relation(fields: [shopping_sale_snapshot_id], references: [id], onDelete: Cascade)

  @@unique([shopping_sale_snapshot_id, value])
  @@index([value(ops: raw("gin_trgm_ops"))], type: Gin)
}

/// @hidden
model mv_shopping_sale_last_snapshots {
  shopping_sale_id          String @id @db.Uuid
  shopping_sale_snapshot_id String @db.Uuid

  sale     shopping_sales          @relation(fields: [shopping_sale_id], references: [id], onDelete: Cascade)
  snapshot shopping_sale_snapshots @relation(fields: [shopping_sale_snapshot_id], references: [id], onDelete: Cascade)

  @@unique([shopping_sale_snapshot_id])
}

/// @hidden
model mv_shopping_sale_snapshot_prices {
  shopping_sale_snapshot_id String @id @db.Uuid
  nominal_lowest            Float  @db.DoublePrecision
  nominal_highest           Float  @db.DoublePrecision
  real_lowest               Float  @db.DoublePrecision
  real_highest              Float  @db.DoublePrecision

  snapshot shopping_sale_snapshots @relation(fields: [shopping_sale_snapshot_id], references: [id], onDelete: Cascade)

  @@index([real_lowest, real_highest])
}

/// @hidden
model mv_shopping_sale_snapshot_unit_prices {
  shopping_sale_snapshot_unit_id String @id @db.Uuid
  nominal_lowest                 Float  @db.DoublePrecision
  nominal_highest                Float  @db.DoublePrecision
  real_lowest                    Float  @db.DoublePrecision
  real_highest                   Float  @db.DoublePrecision

  unit shopping_sale_snapshot_units @relation(fields: [shopping_sale_snapshot_unit_id], references: [id], onDelete: Cascade)
}

/// @hidden
model mv_shopping_sale_snapshot_unit_stock_inventories {
  shopping_sale_snapshot_unit_stock_id String @id @db.Uuid
  income                               Int    @db.Integer
  outcome                              Int    @db.Integer

  stock shopping_sale_snapshot_unit_stocks @relation(fields: [shopping_sale_snapshot_unit_stock_id], references: [id], onDelete: Cascade)

  @@index([shopping_sale_snapshot_unit_stock_id])
}

// Filename - carts.prisma
/// Shopping Cart.
///
/// "shopping_carts" is literally a space where
/// {@link shopping_customers customer} temporarily stores products before
/// {@link shopping_orders purchase}.
///
/// By the way, it is possible for {@link shopping_sellers sellers} or
/// {@link shopping_administrators administrators} to compose a shopping cart.
/// Of course, the reason why they can compose a shopping cart is not for
/// {@link shopping_orders purchasing}, but for providing a shopping cart template
/// to {@link shopping_customers customers}.
///
/// Sale | Cart | Order
/// -----|------|------
/// x | {@link shopping_carts} | {@link shopping_orders}
/// {@link shopping_sale_snapshots} | {@link shopping_cart_commodities} | {@link shopping_order_goods}
/// {@link shopping_sale_snapshot_unit_stocks} | {@link shopping_cart_commodity_stocks} | x
///
/// @namespace Carts
/// @author Samchon
model shopping_carts {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged customer's {@link shopping_customers.id}
  ///
  /// @format uuid
  shopping_customer_id String @db.Uuid

  /// Type of the cart creator.
  ///
  /// - customer
  /// - seller
  /// - administrator
  actor_type String @db.VarChar

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Deletion time of record.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// Belonged customer.
  customer shopping_customers @relation(fields: [shopping_customer_id], references: [id], onDelete: Cascade)

  /// List of commodities containing sale snapshot.
  commodities shopping_cart_commodities[]

  @@index([shopping_customer_id, actor_type, created_at, deleted_at])
}

/// Item in a shopping cart.
///
/// "shopping_cart_commodities" is an entity that represents a
/// {@link shopping_sale_snapshots snapshot} of the items that
/// {@link shopping_customers customer} has placed into his
/// {@link shopping_carts shopping cart} with a
/// {@link shopping_orders purchase} in mind. And if the customer continues
/// this into an actual {@link shopping_orders order} in the future,
/// "shopping_cart_commodities" be changed to {@link shopping_order_goods}.
///
/// And while adding a sale snapshot to the shopping cart, the customer
/// inevitably selects specific {@link shopping_sale_snapshot_units units} and
/// {@link shopping_sale_snapshot_unit_stocks final stocks} within the listing
/// snapshot. Information about these units and stocks is recorded in the
/// subsidiary entity {@link shopping_cart_commodity_stocks}. Also, there is an
/// attribute "volume" that indicates how many sets of snapshots of the
/// target commodity will be purchased. This "volume" is a value that will be
/// multiplied by {@link shopping_cart_commodity_stocks.quantity}, the quantity
/// for each component.
///
///
/// @namespace Carts
/// @erd Orders
/// @author Samchon
model shopping_cart_commodities {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged cart's {@link shopping_carts.id}
  ///
  /// @format uuid
  shopping_cart_id String @db.Uuid

  /// Target snapshot's {@link shopping_sale_snapshots.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_id String @db.Uuid

  /// Volume count.
  ///
  /// The value multiplied to {@link shopping_cart_commodity_stocks.quantity}.
  ///
  /// @format uint
  /// @minimum 1
  volume Int @db.Integer

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Deletion time of record.
  deleted_at DateTime? @db.Timestamptz

  /// Whether be published or not.
  ///
  /// Is current commodity ordered and be paid?
  ///
  /// Until purchase the commodity, the commodity can be reused to create new
  /// cart commodity. This variable can be computed by referencing
  /// {@link Orders order} related tables, but just denormalized for the
  /// performance reason.
  ///
  /// @hidden
  published Boolean

  //----
  // RELATIONS
  //----
  /// Belonged cart.
  cart shopping_carts @relation(fields: [shopping_cart_id], references: [id], onDelete: Cascade)

  /// Target snapshot.
  snapshot shopping_sale_snapshots @relation(fields: [shopping_sale_snapshot_id], references: [id], onDelete: Cascade)

  /// List of wrapper of final stocks.
  stocks shopping_cart_commodity_stocks[]

  /// List of order goods for purchase.
  order_goods shopping_order_goods[]

  mv_price mv_shopping_cart_commodity_prices?

  @@index([shopping_cart_id, created_at])
  @@index([shopping_sale_snapshot_id])
}

/// Final stock information of commodity added to the shopping cart.
///
/// "shopping_cart_commodity_stocks" is a subsidiary entity of
/// {@link shopping_cart_commodities} that embodies the information of the
/// {@link shopping_sale_snapshots snapshot} of the items in the shopping cart,
/// and is a concept that corresponds to the individual
/// {@link shopping_sale_snapshot_units units} in the target item snapshot
/// and the {@link shopping_sale_snapshot_unit_stocks stock} finally selected
/// among those {@link shopping_sale_snapshot_units units}.
///
/// Therefore, if the customer selects multiple units and stocks from the
/// target sale snapshot, the attributed {@link shopping_cart_commodities} record
/// also has multiple corresponding "shopping_cart_commodity_stocks" records.
///
/// And "shopping_cart_commodity_stocks" has a "quantity" property that indicates
/// how many final stocks would be purchased in total. The final quantity
/// actually purchased can be multiplied by the
/// {@link shopping_cart_commodities.volume} value of the parent entity.
///
/// @namespace Carts
/// @erd Orders
/// @author Samchon
model shopping_cart_commodity_stocks {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged commodity's {@link shopping_cart_commodities.id}
  ///
  /// @format uuid
  shopping_cart_commodity_id String @db.Uuid

  /// Target unit's {@link shopping_sale_snapshot_units.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_unit_id String @db.Uuid

  /// Target final stock's {@link shopping_sale_snapshot_unit_stocks.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_unit_stock_id String @db.Uuid

  /// Quantity count.
  ///
  /// @type uint
  /// @minimum 1
  quantity Int @db.Integer

  /// Sequence order in belonged cart commodity.
  ///
  /// @type int
  sequence Int @db.Integer

  //----
  // RELATIONS
  //----
  /// Belonged cart commodity.
  commodity shopping_cart_commodities @relation(fields: [shopping_cart_commodity_id], references: [id], onDelete: Cascade)

  /// Target unit.
  unit shopping_sale_snapshot_units @relation(map: "rel_shopping_cart_commodity_stocks_unit", fields: [shopping_sale_snapshot_unit_id], references: [id], onDelete: Cascade)

  /// Target final stock.
  stock shopping_sale_snapshot_unit_stocks @relation(map: "rel_shopping_cart_commodity_stocks_stock", fields: [shopping_sale_snapshot_unit_stock_id], references: [id], onDelete: Cascade)

  /// List of choices, how customer has determined for each option.
  choices shopping_cart_commodity_stock_choices[]

  @@index([shopping_cart_commodity_id])
  @@index([shopping_sale_snapshot_unit_id], map: "idx_shopping_cart_commodity_stocks_unit")
  @@index([shopping_sale_snapshot_unit_stock_id], map: "idx_shopping_cart_commodity_stocks_stock")
}

/// Option choice information for the final stock added to the shopping cart.
///
/// "shopping_cart_commodity_stock_choices" is a subsidiary entity of
/// {@link shopping_cart_commodity_stocks}. It records which
/// {@link shopping_sale_snapshot_unit_options options} the customer
/// specifically used while putting a specific
/// {@link shopping_sale_snapshot_units unit} and specific
/// {@link shopping_sale_snapshot_unit_stocks stock} of the
/// {@link shopping_sale_snapshots sale snapshot} in the shopping cart, and
/// which {@link shopping_sale_snapshot_unit_option_candidates candidate values}
/// were selected or written within the shopping cart.
///
/// Therefore, "shopping_cart_commodity_stock_choices" has reference properties
/// and predicate properties for candidate values in addition to references
/// to options. If the "type" of target option is "select", enter the
/// candidate value selected by the customer. Otherwise, enter the value
/// written by the customer.
///
/// @namespace Carts
/// @author Samchon
model shopping_cart_commodity_stock_choices {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged cart-commodity-stock's {@link shopping_cart_commodity_stocks.id}
  ///
  /// @format uuid
  shopping_cart_commodity_stock_id String @db.Uuid

  /// Target option's {@link shopping_sale_snapshot_unit_options.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_unit_option_id String @db.Uuid

  /// Selected candidate's {@link shopping_sale_snapshot_unit_option_candidates.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_unit_option_candidate_id String? @db.Uuid

  /// User-written value for descriptive option.
  value String? @db.VarChar

  /// Sequence order in belonged cart-commodity-stock.
  ///
  /// @type int
  sequence Int @db.Integer

  //----
  // RELATIONS
  //----
  /// Belonged cart-commodity-stock.
  stock shopping_cart_commodity_stocks @relation(fields: [shopping_cart_commodity_stock_id], references: [id], onDelete: Cascade)

  /// Target option.
  option shopping_sale_snapshot_unit_options @relation(map: "rel_shopping_cart_commodity_stock_choices_option", fields: [shopping_sale_snapshot_unit_option_id], references: [id], onDelete: Cascade)

  /// Selected candidate value for "select" typed option.
  candidate shopping_sale_snapshot_unit_option_candidates? @relation(map: "rel_shopping_cart_commodity_stock_choices_candidate", fields: [shopping_sale_snapshot_unit_option_candidate_id], references: [id], onDelete: Cascade)

  @@index([shopping_cart_commodity_stock_id])
  @@index([shopping_sale_snapshot_unit_option_id], map: "idx_shopping_cart_commodity_stock_choices_option")
  @@index([shopping_sale_snapshot_unit_option_candidate_id], map: "idx_shopping_cart_commodity_stock_choices_candidate")
}

/// @hidden
model mv_shopping_cart_commodity_prices {
  shopping_cart_commodity_id String @id @db.Uuid
  nominal                    Float  @db.DoublePrecision
  real                       Float  @db.DoublePrecision
  volumed_price              Float  @db.DoublePrecision

  commodity shopping_cart_commodities @relation(fields: [shopping_cart_commodity_id], references: [id], onDelete: Cascade)
}

// Filename - orders.prisma
/// Order application information.
///
/// "shopping_orders" is an entity that embodies
/// {@link shopping_customers customer}'s order application information.
/// However, please note that at this time, you are still at the
/// "order application" stage and not the "order confirmation" stage.
///
/// And as soon as a customer applies for an order, all
/// {@link shopping_cart_commodities commodities} in the target shopping cart are
/// promoted to {@link shopping_order_goods}, and those
/// {@link shopping_order_goods} records are created under this
/// "shopping_orders".
///
/// Of course, not all commodities in the target shopping cart become
/// {@link shopping_order_goods}, but only those selected by the customer
/// become the {@link shopping_order_goods}.
///
/// Sale | Cart | Order
/// -----|------|------
/// x | {@link shopping_carts} | {@link shopping_orders}
/// {@link shopping_sale_snapshots} | {@link shopping_cart_commodities} | {@link shopping_order_goods}
/// {@link shopping_sale_snapshot_unit_stocks} | {@link shopping_cart_commodity_stocks} | x
///
/// @namespace Orders
/// @author Samchon
model shopping_orders {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged customer's {@link shopping_customers.id}
  ///
  /// @format uuid
  shopping_customer_id String @db.Uuid

  /// Target address' {@link shopping_addresses.id}
  ///
  /// @format uuid
  shopping_address_id String? @db.Uuid

  /// Representative name of the order.
  name String @db.VarChar

  /// Amount of cash payment.
  ///
  /// @minimum 0
  cash Float @db.DoublePrecision

  /// Amount of deposit payment instead of cash.
  ///
  /// @minimum 0
  deposit Float @db.DoublePrecision

  /// Amount of mileage payment instead of cash.
  ///
  /// @minimum 0
  mileage Float @db.DoublePrecision

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Deletion time of record.
  ///
  /// If order be published, unable to erase it. In that case, you
  /// {@link shopping_order_publishes.cancelled_at} instead, or utilize
  /// {@link shopping_order_good_reverts} instead.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// Belonged customer.
  customer shopping_customers @relation(fields: [shopping_customer_id], references: [id], onDelete: Cascade)

  /// Target address.
  address shopping_addresses? @relation(fields: [shopping_address_id], references: [id], onDelete: Cascade)

  /// Publish information.
  publish shopping_order_publishes?

  /// List of goods to purchase.
  goods shopping_order_goods[]

  /// List of paid tickets for discount
  ticket_payments shopping_coupon_ticket_payments[]
  mv_price        mv_shopping_order_prices?

  @@index([shopping_customer_id, created_at])
  @@index([created_at])
}

/// Information about the individual goods that make up your order.
///
/// "shopping_order_goods" is an entity that represents each good ordered
/// by a {@link shopping_customers customer}, and the record is created in the
/// process of upgrading the product {@link shopping_cart_commodities commodity}
/// in the {@link shopping_carts shopping cart} to a good due to the customer's
/// {@link shopping_orders order request}.
///
/// And "shopping_order_goods", like {@link shopping_cart_commodities}, is a concept
/// that corresponds to the listing
/// {@link shopping_sale_snapshots sale snapshot}.
///
/// For reference, "shopping_order_goods" also contains "volume" information
/// separately from the belonging {@link shopping_cart_commodities.volume}. This is
/// because there are some cases where you put 3 books in your shopping cart
/// and then change them to 4 during the actual order application process.
/// This is to increase the reusability of the shopping cart by changing the
/// volume attribute of the current entity rather than directly changing the
/// shopping_cart_commodities information.
///
/// In addition, "shopping_order_goods" becomes the most basic unit for
/// the post-order process, that is, after service (A/S). For example,
/// after receiving a customer's product, confirming the order is recorded
/// in the "confirmed_at" attribute. Additionally, "shopping_order_goods" is
/// the unit in which customers issue issues or request exchanges or refunds
/// for ordered products.
///
/// @namespace Orders
/// @author Samchon
model shopping_order_goods {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged order's {@link shopping_orders.id}
  ///
  /// @format uuid
  shopping_order_id String @db.Uuid

  /// Belonged cart commodity's {@link shopping_cart_commodities.id}
  ///
  /// @format uuid
  shopping_cart_commodity_id String @db.Uuid

  /// Belonged seller's {@link shopping_sellers.id}
  ///
  /// It can be computed by referencing related {@link shopping_sales},
  /// but denormalized for performance reason.
  ///
  /// @format uuid
  /// @hidden
  shopping_seller_id String @db.Uuid

  /// Volume count.
  ///
  /// The value multiplied to {@link shopping_cart_commodity_stocks.quantity}.
  /// It's purpose is exactly same with {@link shopping_cart_commodities.volume},
  /// but rewritten because the {@link shopping_cart_commodities} records are
  /// reusable until payment.
  ///
  /// @format uint
  /// @minimum 1
  volume Int @db.Integer

  /// Sequence order(?) in belonged order.
  ///
  /// @format int
  sequence Int @db.Integer

  /// Confirmation time of order good.
  ///
  /// When be confirmed, customer can't request refund or exchange.
  ///
  /// The confirmation be accomplished by following cases.
  ///
  /// - Customer does it directly.
  /// - 14 days after the delivery.
  confirmed_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// Belonged order.
  order shopping_orders @relation(fields: [shopping_order_id], references: [id], onDelete: Cascade)

  /// Belonged cart commodity.
  commodity shopping_cart_commodities @relation(fields: [shopping_cart_commodity_id], references: [id], onDelete: Cascade)

  /// Belonged seller.
  seller          shopping_sellers                 @relation(fields: [shopping_seller_id], references: [id], onDelete: Cascade)
  delivery_pieces shopping_delivery_pieces[]
  reviews         shopping_sale_snapshot_reviews[]

  mv_price mv_shopping_order_good_prices?
  mv_state mv_shopping_order_good_states?

  @@unique([shopping_order_id, shopping_cart_commodity_id])
  @@index([shopping_cart_commodity_id])
  @@index([shopping_seller_id])
}

/// Order completion and payment information.
///
/// "shopping_order_publishes" is an entity that embodies the series of
/// processes in which a customer pays for his or her
/// {@link shopping_orders order}, thereby completing the order. And only after
/// the order is completed, can the seller recognize that the customer has
/// purchased his product.
///
/// By the way, please note that just because the "shopping_order_publishes"
/// record exists, it does not mean that the payment has been completed.
/// Of course, with "credit cards" and "Google Pay", payment application and
/// payment occur at the same time. However, there are some cases where
/// payment is made after the payment application, such as "bank transfer" or
/// "virtual account payment". Therefore, to see the completion of payment,
/// be sure to check the "paid_at" property.
///
/// In addition, even after payment has been made, there may be cases where
/// it is suddenly cancelled, so please be aware of this as well.
///
/// @namespace Orders
/// @author Samchon
model shopping_order_publishes {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged order's {@link shopping_orders.id}
  ///
  /// @format uuid
  shopping_order_id String @db.Uuid

  /// Target address' {@link shopping_addresses.id}
  ///
  /// The place to receive the goods. For reference, the address information
  /// also has an information of receiver, and it can be different with the
  /// customer who has ordered.
  ///
  /// @format uuid
  shopping_address_id String @db.Uuid

  /// Password for encryption.
  ///
  /// This shopping mall system uses a randomly issued password to
  /// encrypt payment history, and is completely unrelated to the user.
  password String? @db.VarChar

  /// Creation time of record.
  ///
  /// Note that, this property does not mean the payment completion time.
  created_at DateTime @db.Timestamptz

  /// Completion time of payment.
  ///
  /// This property is the only way to know if the payment has been
  /// completed. If this property is "null", the payment has not been
  /// completed yet.
  paid_at DateTime? @db.Timestamptz

  /// The time when the payment was cancelled or reverted.
  cancelled_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// Belonged order.
  order shopping_orders @relation(fields: [shopping_order_id], references: [id], onDelete: Cascade)

  /// Target address.
  address          shopping_addresses                        @relation(fields: [shopping_address_id], references: [id], onDelete: Cascade)
  pieces           shopping_delivery_pieces[]
  mv_state         mv_shopping_order_publish_states?
  mv_seller_states mv_shopping_order_publish_seller_states[]

  @@unique([shopping_order_id])
  @@index([created_at, paid_at, cancelled_at])
  @@index([paid_at, cancelled_at])
}

/// Delivery information.
///
/// When delivering {@link shopping_order_goods goods} to
/// {@link shopping_customers customer}, {@link shopping_selleres seller} can deliver
/// multiple {@link shopping_sale_snapshot_unit_stocks stocks}, goods at once. Also,
/// it is possible to deliver a stock or good in multiple times due to physical
/// restriction like volume or weight problem.
///
/// As you can see from above, the relationship between delivery with
/// {@link shopping_orders order} (or good) is not 1: 1 or N: 1, but M: N. Entity
/// "shopping_deliveries" has been designed to represent such relationship, by
/// referencing target stocks or goods through subsidiary entity
/// {@link shopping_delivery_pieces}.
///
/// Also, delivery does not end with only one step. It has multiple processes like
/// manufacturing, planning, shipping and delivering. Those steps are represented by
/// another subsidiary entity {@link shopping_delivery_journeys}.
///
/// @todo No shipper entity yet
/// @namespace Orders
/// @author Samchon
model shopping_deliveries {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged seller's {@link shopping_sellers.id}
  ///
  /// @format uuid
  shopping_seller_customer_id String @db.Uuid

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Deletion time of record.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  sellerCustomer shopping_customers           @relation(fields: [shopping_seller_customer_id], references: [id], onDelete: Cascade)
  journeys       shopping_delivery_journeys[]
  pieces         shopping_delivery_pieces[]
  shippers       shopping_delivery_shippers[]
  mv_state       mv_shopping_delivery_states?

  @@index([shopping_seller_customer_id, created_at])
  @@index([created_at])
}

/// Which stocks are delivered.
///
/// "shopping_delivery_pieces" is a subsidiary entity of {@link shopping_deliveries},
/// describing how much quantity is delivered for each
/// {@link shopping_sale_snapshot_unit_stocks stock} in {@link shopping_orders}.
///
/// For reference, as an order can be delivered in multiple times due to volume or
/// weight problem, it is possible to have multiple "shopping_delivery_pieces" records
/// for a single stock.
///
/// @namespace Orders
/// @author Samchon
model shopping_delivery_pieces {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged delivery's {@link shopping_deliveries.id}
  ///
  /// @format uuid
  shopping_delivery_id String @db.Uuid

  /// Target order-publish'es {@link shopping_order_publishes.id}
  ///
  /// @format uuid
  shopping_order_publish_id String @db.Uuid

  /// Target good's {@link shopping_order_goods.id}
  ///
  /// @format uuid
  shopping_order_good_id String @db.Uuid

  /// Target stock's {@link shopping_sale_snapshot_unit_stocks.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_unit_stock_id String @db.Uuid

  /// Quantity count.
  ///
  /// It can be precision value to express split shipping.
  ///
  /// @exclusiveMinimum 0
  quantity Float @db.DoublePrecision

  /// Sequence order in belonged delivery.
  ///
  /// @type int
  sequence Int @db.Integer

  //----
  // RELATIONS
  //----
  delivery shopping_deliveries                @relation(fields: [shopping_delivery_id], references: [id], onDelete: Cascade)
  publish  shopping_order_publishes           @relation(fields: [shopping_order_publish_id], references: [id], onDelete: Cascade)
  good     shopping_order_goods               @relation(fields: [shopping_order_good_id], references: [id], onDelete: Cascade)
  stock    shopping_sale_snapshot_unit_stocks @relation(fields: [shopping_sale_snapshot_unit_stock_id], references: [id], onDelete: Cascade)

  @@index([shopping_delivery_id])
  @@index([shopping_order_good_id])
}

/// Shipper information of delivery.
///
/// @namespace Orders
/// @author Samchon
model shopping_delivery_shippers {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged delivery's {@link shopping_deliveries.id}
  ///
  /// @format uuid
  shopping_delivery_id String @db.Uuid

  /// Mobile number of shipper.
  mobile String @db.VarChar

  /// Name of shipper.
  name String @db.VarChar

  /// Company of shipper.
  company String? @db.VarChar

  created_at DateTime @db.Timestamptz

  //----
  // RELATIONS
  //----
  delivery shopping_deliveries @relation(fields: [shopping_delivery_id], references: [id], onDelete: Cascade)

  @@index([shopping_delivery_id])
}

/// Journey of delivery.
///
/// "shopping_delivery_journeys" is a subsidiary entity of {@link shopping_deliveries},
/// describing each journey of the delivery. For reference, the word journey means
/// each step of the delivery process, such as preparing, shipping, and delivering
/// {@link shopping_order_goods goods} to the {@link shopping_customers customer}.
///
/// @namespace Orders
/// @author Samchon
model shopping_delivery_journeys {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// @format uuid
  shopping_delivery_id String @db.Uuid

  /// Type of journey.
  ///
  /// - preparing
  /// - manufacturing
  /// - shipping
  /// - delivering
  type String @db.VarChar

  /// Title of journey.
  title String? @db.VarChar

  /// Description of journey.
  description String?

  /// Sequence order in belonged delivery.
  sequence Int @db.Integer

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Start time of journey.
  started_at DateTime? @db.Timestamptz

  /// Completion time of journey.
  completed_at DateTime? @db.Timestamptz

  /// Deletion time of record.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// Belonged delivery.
  delivery shopping_deliveries @relation(fields: [shopping_delivery_id], references: [id], onDelete: Cascade)

  @@index([shopping_delivery_id])
}

/// @hidden
model mv_shopping_order_prices {
  shopping_order_id String @id @db.Uuid
  quantity          Int    @db.Integer
  nominal           Float  @db.DoublePrecision
  real              Float  @db.DoublePrecision
  ticket            Float  @db.DoublePrecision

  order shopping_orders @relation(fields: [shopping_order_id], references: [id], onDelete: Cascade)
}

/// @hidden
model mv_shopping_order_good_prices {
  shopping_order_good_id String @id @db.Uuid
  nominal                Float  @db.DoublePrecision
  real                   Float  @db.DoublePrecision
  cash                   Float  @db.DoublePrecision
  deposit                Float  @db.DoublePrecision
  mileage                Float  @db.DoublePrecision
  ticket                 Float  @db.DoublePrecision

  good shopping_order_goods @relation(fields: [shopping_order_good_id], references: [id], onDelete: Cascade)
}

/// @hidden
model mv_shopping_order_publish_states {
  shopping_order_publish_id String @id @db.Uuid
  value                     String @db.VarChar

  publish shopping_order_publishes @relation(fields: [shopping_order_publish_id], references: [id], onDelete: Cascade)
}

/// @hidden
model mv_shopping_order_good_states {
  shopping_order_good_id String @id @db.Uuid
  value                  String @db.VarChar

  good shopping_order_goods @relation(fields: [shopping_order_good_id], references: [id], onDelete: Cascade)
}

/// @hidden
model mv_shopping_order_publish_seller_states {
  id                        String @id @db.Uuid
  shopping_order_publish_id String @db.Uuid
  shopping_seller_id        String @db.Uuid
  value                     String @db.VarChar

  publish shopping_order_publishes @relation(fields: [shopping_order_publish_id], references: [id], onDelete: Cascade)
  seller  shopping_sellers         @relation(fields: [shopping_seller_id], references: [id], onDelete: Cascade)

  @@unique([shopping_order_publish_id, shopping_seller_id])
  @@index([shopping_order_publish_id])
}

/// @hidden
model mv_shopping_delivery_states {
  shopping_delivery_id String @id @db.Uuid
  value                String @db.VarChar

  delivery shopping_deliveries @relation(fields: [shopping_delivery_id], references: [id], onDelete: Cascade)
}

// Filename - coupons.prisma
/// Discount coupon.
///
/// "shopping_coupons" is an entity that symbolizes discount coupons at a
/// shopping mall.
///
/// Note that, "shopping_coupons" only contains specification information
/// about discount coupons. Please keep in mind that this is a different
/// concept from {@link shopping_coupon_tickets}, which refers to the issuance
/// of a discount coupon, or {@link shopping_coupon_ticket_payments}, which
/// refers to its payment.
///
/// Additionally, discount coupons are applied on an
/// {@link shopping_orders order-by-order} basis, but each has its own unique
/// restrictions. For example, a coupon with
/// {@link shopping_coupon_seller_criterias} may or may not be used only for
/// {@link shopping_sale_snapshots snapshots} of listings registered by the
/// {@link shopping_sellers seller}. Also, there are restrictions such as
/// minimum amount restrictions for using discount coupons and maximum discount
/// amount limits.
///
/// In addition, you can set whether to issue discount coupons publicly or give
/// them only to people who know the specific issuing code. In addition, there
/// are restrictions such as issued discount coupons having an expiration date
/// or being issued only to customers who came in through a
/// {@link shopping_coupon_funnel_criterias specific funnel}.
///
/// For more information, please refer to the properties below and the
/// subsidiary entities described later.
///
/// @namespace Coupons
/// @author Samchon
model shopping_coupons {
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged administrator or seller's {@link shopping_customers.id}
  ///
  /// @format uuid
  shopping_customer_id String @db.Uuid

  /// Type of the coupon creator.
  ///
  /// - administrator
  /// - seller
  actor_type String @db.VarChar

  /// Reprensentative name of coupon.
  name String @db.VarChar

  /// Access level of coupon.
  ///
  /// - "public": possible to find from public API
  /// - "private": unable to find from public API
  ///   - arbitrarily assigned by the seller or administrator
  ///   - issued from one-time link
  access String @db.VarChar

  /// Exclusivity or not.
  ///
  /// An exclusive discount coupon refers to a discount coupon that has an
  /// exclusive relationship with other discount coupons and can only be used
  /// alone. That is, when an exclusive discount coupon is used, no other
  /// discount coupon can be used for the same {@link shopping_orders order}
  /// or {@link shopping_order_goods good}.
  ///
  /// Please note that this "exclusive" attribute is a very different
  /// concept from "multiplicative", which means whether the same coupon
  /// can be multiplied and applied to multiple coupons of the same order,
  /// so please do not confuse them.
  exclusive Boolean @db.Boolean

  /// Discount unit.
  ///
  /// - amount: Absolute value
  /// - percent: 0 ~ 100 %
  unit String @db.VarChar

  /// Discount value.
  ///
  /// If "unit" is percent, range of value is limited from 0 to 100.
  ///
  /// @exclusiveMinimum 0
  value Float @db.DoublePrecision

  /// Minimum purchase amount for discount.
  ///
  /// When setting this value, discount coupons cannot be applied to
  /// order totals that are less than this value.
  ///
  /// @exclusiveMinimum 0
  threshold Float? @db.DoublePrecision

  /// Maximum amount available for discount.
  ///
  /// When this value is set, no further discount will be given no matter
  /// how much you order.
  limit Int? @db.Integer /// @format uint @minimum 1

  /// Whether be multiplied to volume or not.
  ///
  /// "multiplicative" is a property which means whether the same coupon
  /// can be multiplied to the volume of order or not. It would be meaningful
  /// only when the unit of discount is "amount". Otherwise, it's always "false".
  ///
  /// Therefore, if the "multiplicative" value is "true", the discount amount
  /// will be multiplied by the volume of order. For example, if the discount
  /// amount is "1,000 won" and the volume of order is "3", the total discount
  /// amount will be "3,000 won".
  ///
  /// For reference, if there's a good that its price is lower than the amount
  /// value, the good wouldn't be discounted.
  ///
  /// ex) "5,000 won" coupon and "10" volume of order
  ///
  /// - "false": Only "5,000 won" would be discounted
  /// - "true": "50,000 won" would be discounted
  multiplicative Boolean @db.Boolean

  /// Limited quantity issued.
  ///
  /// If there is a limit to the quantity issued, it becomes impossible to
  /// issue tickets exceeding this value.
  ///
  /// In other words, the concept of N coupons being issued on a first-come,
  /// first-served basis is created.
  ///
  /// @format uint
  /// @minimum 1
  volume Int? @db.Integer

  /// Limited quantity issued per person.
  ///
  /// As a limit to the total amount of issuance per person, it is common to
  /// assign 1 to limit duplicate issuance to the same citizen, or to use
  /// the "NULL" value to set no limit.
  ///
  /// Of course, by assigning a value of N, the total amount issued to the
  /// same citizen can be limited.
  ///
  /// @format uint
  /// @minimum 1
  volume_per_citizen Int? @db.Integer

  /// Expiration day(s) value.
  ///
  /// The concept of expiring N days after a discount coupon ticket is issued.
  ///
  /// Therefore, customers must use the ticket within N days, if possible,
  /// from the time it is issued.
  ///
  /// @format uint
  /// @minimum 1
  expired_in Int? @db.Integer

  /// Expiration date.
  ///
  /// A concept that expires after YYYY-MM-DD after a discount coupon ticket
  /// is issued.
  ///
  /// Double restrictions are possible with "expired_in", of which the one
  /// with the shorter expiration date is used.
  expired_at DateTime? @db.Timestamptz

  /// Opening time of the coupon.
  opened_at DateTime? @db.Timestamptz

  /// Closing time of the coupon.
  ///
  /// Tickets cannot be issued after this time.
  ///
  /// However, previously issued tickets can still be used until their
  /// expiration date.
  closed_at DateTime? @db.Timestamptz

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Update time of record.
  ///
  /// Only possible to update until "opened_at".
  updated_at DateTime @db.Timestamptz

  /// Deletion time of record.
  ///
  /// Pre-issued tickets can still be used until their expiration date.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// Administrator or seller who've designed this coupon.
  customer shopping_customers @relation(fields: [shopping_customer_id], references: [id], onDelete: Cascade)

  /// List of criterias.
  criterias shopping_coupon_criterias[]

  /// List of one-time issuance codes.
  ///
  /// If the "accessor" value of this discount coupon is private, a dedicated
  /// code is required to issue a ticket for the discount coupon. A list of
  /// those one-time use codes.
  disposables shopping_coupon_disposables[]

  /// List of tickets.
  ///
  /// Histories of tickets issued to customers.
  tickets                shopping_coupon_tickets[]
  mv_inventory           mv_shopping_coupon_inventories?
  mv_citizen_inventories mv_shopping_coupon_citizen_inventories[]

  @@index([shopping_customer_id, actor_type])
  @@index([name(ops: raw("gin_trgm_ops"))], type: Gin)
  @@index([created_at])
  @@index([opened_at])
}

/// Supertype for the applicable conditions of the discount coupon.
///
/// "shopping_coupon_criterias" is a supertype entity that embodies the
/// conditions for applying a {@link shopping_coupons discount coupon}. All
/// subtype entities that wish to impose constraints on the reference unit of
/// a discount coupon were created by inheriting this. For example, the
/// {@link shopping_coupon_section_criterias} entity, designed to limit
/// application to a specific {@link shopping_sections section}, inherits this
/// entity "shopping_coupon_criterias".
///
/// In addition, constraints on reference units can be specified through the
/// "direction" property to proceed as an inclusion condition or, conversely,
/// as an exclusion condition. If the direction value is "include", the coupon
/// is applicable only to the reference object. Conversely, if the direction
/// value is "exclude", it is a coupon that cannot be applied to the reference
/// object.
///
/// @namespace Coupons
/// @author Samchon
model shopping_coupon_criterias {
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged coupon's {@link shopping_coupons.id}
  ///
  /// @format uuid
  shopping_coupon_id String @db.Uuid

  /// Type of criteria.
  ///
  /// It means which subtype being used.
  type String @db.VarChar

  /// Direction of criteria.
  ///
  /// - include
  /// - exclude
  direction String @db.VarChar

  /// Sequence order in belonged coupon.
  ///
  /// @format int
  sequence Int @db.Integer

  //----
  // RELATIONS
  //----
  /// Belonged coupon.
  coupon shopping_coupons @relation(fields: [shopping_coupon_id], references: [id], onDelete: Cascade)

  of_section shopping_coupon_section_criterias?
  of_sale    shopping_coupon_sale_criterias?
  of_funnel  shopping_coupon_funnel_criterias?
  of_seller  shopping_coupon_seller_criterias?

  @@index([shopping_coupon_id])
}

/// Conditions for sections of discount coupons.
///
/// "shopping_coupon_section_criterias" is a subtype entity of
/// {@link shopping_coupon_criterias} and is used when setting conditions for
/// a specific {@link shopping_sections section}.
///
/// If the {@link shopping_coupon_criterias.direction} value is "include",
/// the coupon can only be used for that section. Conversely, if it is
/// "exclude", the coupon cannot be used. And if there are multiple
/// "shopping_coupon_section_criterias" records within one coupon, conditions
/// are applied on a bundle basis. Coupons may or may not be applicable to
/// eligible sections.
///
/// @namespace Coupons
/// @author Samchon
model shopping_coupon_section_criterias {
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Target section's {@link shopping_coupon_criterias.id}
  ///
  /// @format uuid
  shopping_section_id String @db.Uuid

  //----
  // RELATIONS
  //----
  /// Supertype entity.
  base shopping_coupon_criterias @relation(fields: [id], references: [id], onDelete: Cascade)

  /// Belonged section.
  section shopping_sections @relation(fields: [shopping_section_id], references: [id], onDelete: Cascade)

  @@index([shopping_section_id])
}

/// Conditions for sellers of discount coupons.
///
/// "shopping_coupon_seller_criterias" is a subtype entity of
/// {@link shopping_coupon_criterias} and is used when setting conditions for
/// a specific {@link shopping_sellers seller}.
///
/// If the {@link shopping_coupon_criterias.direction} value is "include", the
/// coupon can only be used for that seller. Conversely, if it is "exclude",
/// the coupon cannot be used.
///
/// And if there are multiple "shopping_coupon_seller_criterias" records within
/// one coupon, conditions are applied on a bundle basis. Coupons may or may
/// not be applicable to eligible sellers.
///
/// @namespace Coupons
/// @author Samchon
model shopping_coupon_seller_criterias {
  /// PK + FK.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Target seller's {@link shopping_sellers.id}
  ///
  /// @format uuid
  shopping_seller_id String @db.Uuid

  //----
  // RELATIONS
  //----
  /// Supertype entity.
  base shopping_coupon_criterias @relation(fields: [id], references: [id], onDelete: Cascade)

  /// Target seller.
  seller shopping_sellers @relation(fields: [shopping_seller_id], references: [id], onDelete: Cascade)

  @@index([shopping_seller_id])
}

/// Conditions for a specific item in a discount coupon.
///
/// "shopping_coupon_sale_criterias" is a subtype entity of
/// {@link shopping_coupon_criterias} and is used when setting conditions for
/// a specific {@link shopping_sales sale}.
///
/// If the {@link shopping_coupon_criterias.direction} value is "include",
/// the coupon can only be used for that item. Conversely, if it is "exclude",
/// it is a coupon that cannot be used.
///
/// And if there are multiple shopping_coupon_sale_criterias records within one coupon, conditions are applied on a bundle basis. Coupons that may or may not be applicable to target properties.
///
/// @namespace Coupons
/// @author Samchon
model shopping_coupon_sale_criterias {
  /// PK + FK.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Target sale's {@link shopping_sales.id}
  ///
  /// @format uuid
  shopping_sale_id String @db.Uuid

  //----
  // RELATIONS
  //----
  /// Supertype entity.
  base shopping_coupon_criterias @relation(fields: [id], references: [id], onDelete: Cascade)

  /// Target sale.
  sale shopping_sales @relation(fields: [shopping_sale_id], references: [id], onDelete: Cascade)

  @@index([shopping_sale_id])
}

/// Limit the funnel of discount coupons.
///
/// "shopping_coupon_funnel_criterias" is a subtype entity of
/// {@link shopping_coupon_criterias}, and is used when you want to issue or
/// exclude discount coupons only to {@link shopping_customers customers} who
/// came from a specific path.
///
/// And funnel restrictions are possible in 3 ways: The first is
/// {@link shopping_customers.referrer}, and by parsing
/// {@link shopping_customers.href}, which records the customer's access
/// address, restrictions can be made in units of specific URLs or variables.
///
/// @namespace Coupons
/// @author Samchon
model shopping_coupon_funnel_criterias {
  /// PK + FK.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// What kind of funnel is it?
  ///
  /// - path
  /// - referrer
  /// - variable
  kind String @db.VarChar

  /// Key name of funnel, when "kind" is "variable".
  key String? @db.VarChar

  /// Value of funnel.
  value String @db.VarChar

  //----
  // RELATIONS
  //----
  /// Supertype entity.
  base shopping_coupon_criterias @relation(fields: [id], references: [id], onDelete: Cascade)
}

/// Discount coupon ticket issuance details.
///
/// "shopping_coupon_tickets" is an entity that symbolizes
/// {@link shopping_coupons discount coupon} tickets issued by
/// {@link shopping_customers customers}.
///
/// And if the target discount coupon specification itself has an expiration
/// date, the expiration date is recorded in "expired_at" and is automatically
/// discarded after that expiration date. Of course, it doesn't matter if you
/// use the discount coupon for your order within the deadline.
///
/// @namespace Coupons
/// @author Samchon
model shopping_coupon_tickets {
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged customer's {@link shopping_customers.id}
  ///
  /// @format uuid
  shopping_customer_id String @db.Uuid

  /// Belonged coupon's {@link shopping_coupons.id}
  ///
  /// @format uuid
  shopping_coupon_id String @db.Uuid

  /// Belonged disposable's {@link shopping_coupon_disposables.id}
  ///
  /// Only when current ticket be issued from one-time code.
  ///
  /// @format uuid
  shopping_coupon_disposable_id String? @db.Uuid

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Expiration time of ticket.
  expired_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// Belonged customer.
  customer shopping_customers @relation(fields: [shopping_customer_id], references: [id], onDelete: Cascade)

  /// Belonged coupon.
  coupon shopping_coupons @relation(fields: [shopping_coupon_id], references: [id], onDelete: Cascade)

  /// Belonged disposable when issued from one-time code.
  disposable shopping_coupon_disposables? @relation(fields: [shopping_coupon_disposable_id], references: [id], onDelete: Cascade)

  /// Payment information.
  payment shopping_coupon_ticket_payments?

  @@unique([shopping_coupon_disposable_id])
  @@index([shopping_customer_id, created_at])
  @@index([shopping_coupon_id, created_at])
}

/// Discount coupon ticket payment details.
///
/// "shopping_coupon_ticket_payments" is an entity that embodies the payment
/// information for the {@link shoppiing_orders order} of
/// {@link shopping_coupon_tickets}, and is used when a consumer uses the
/// discount coupon ticket he or she was issued to order and has the payment
/// amount deducted.
///
/// And since {@link shopping_orders} itself is not an entity used in situations
/// where an order is completed, but rather an entity designed to express an
/// order request, the creation of this "shopping_coupon_ticket_payments" record
/// does not actually mean that the attached ticket disappears. Until the
/// {@link shopping_customers customer}
/// {@link shopping_order_publishes.paid_at completes the payment} and
/// confirms the order, the ticket can be understood as a kind of deposit.
///
/// Additionally, this record can be deleted by the customer reversing the
/// payment of the ticket, but it can also be deleted when the attribution
/// order itself is cancelled.
///
/// @namespace Coupons
/// @author Samchon
model shopping_coupon_ticket_payments {
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged ticket's {@link shopping_coupon_tickets.id}
  ///
  /// @format uuid
  shopping_coupon_ticket_id String @db.Uuid

  /// Target order's {@link shopping_orders.id}
  ///
  /// @format uuid
  shopping_order_id String @db.Uuid

  /// Sequence order(?) in belonged order.
  ///
  /// @format int
  sequence Int @db.Integer

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Deletion time of record.
  ///
  /// In other words, it means that the target order be erased or payment
  /// be cancelled.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// Belonged ticket.
  ticket shopping_coupon_tickets @relation(fields: [shopping_coupon_ticket_id], references: [id], onDelete: Cascade)

  /// Target order.
  order shopping_orders @relation(fields: [shopping_order_id], references: [id], onDelete: Cascade)

  @@unique([shopping_coupon_ticket_id])
  @@index([shopping_order_id])
}

/// Discount coupon issuance code management.
///
/// If a {@link shopping_coupons discount coupon} is not public and anyone can
/// receive the ticket, but can only be received by entering a specific
/// password (one-time code), use this "shopping_coupon_disposables" entity.
///
/// I repeat again, the code code is "one-time use". In other words, if any of
/// the customers enters the code, the code is discarded when the ticket
/// issuance to the customer is completed. Therefore, if you want to issue
/// tickets multiple times using a discount coupon as a secret code, the
/// issuing code must also be supported by the corresponding quantity.
///
/// @namespace Coupons
/// @author Samchon
model shopping_coupon_disposables {
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged coupon's {@link shopping_coupons.id}
  ///
  /// @format uuid
  shopping_coupon_id String @db.Uuid

  /// Identifier code.
  ///
  /// Another word, one-time password for issuance.
  code String @db.VarChar

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Expired time of record.
  expired_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// Belonged discount coupon.
  coupon shopping_coupons @relation(fields: [shopping_coupon_id], references: [id], onDelete: Cascade)

  /// Ticket issued by this one-time code.
  ticket shopping_coupon_tickets?

  @@unique([code])
  @@index([shopping_coupon_id])
}

/// @hidden
model mv_shopping_coupon_inventories {
  shopping_coupon_id String @id @db.Uuid
  value              Int    @db.Integer

  coupon shopping_coupons @relation(fields: [shopping_coupon_id], references: [id], onDelete: Cascade)
}

/// @hidden
model mv_shopping_coupon_citizen_inventories {
  id                  String @id @db.Uuid
  shopping_coupon_id  String @db.Uuid
  shopping_citizen_id String @db.Uuid
  value               Int    @db.Integer

  citizen shopping_citizens @relation(fields: [shopping_citizen_id], references: [id], onDelete: Cascade)
  coupon  shopping_coupons  @relation(fields: [shopping_coupon_id], references: [id], onDelete: Cascade)

  @@unique([shopping_coupon_id, shopping_citizen_id])
  @@index([shopping_coupon_id])
}

// Filename - coin.prisma
/// Meta information of the deposit.
///
/// "shopping_deposits" is an entity that embodies the specifications for
/// incomes and outcomes of deposit at a shopping mall. In other words,
/// "shopping_deposits" is not {@link shopping_deposit_histories}, which
/// refers to the deposit/outcome details of deposits, but is simply
/// metadata that specifies specifications for income/outcome scenarios.
///
/// @namespace Coins
/// @author Samchon
model shopping_deposits {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Identifier code.
  code String @db.VarChar

  /// The source table occurring the deposit event.
  source String @db.VarChar

  /// Direction of deposit.
  ///
  /// - "1": Income
  /// - "-1": outcome
  direction Int @db.Integer

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  //// Deletion time of record.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// List of histories; income/outcome details.
  histories shopping_deposit_histories[]

  @@unique([code])
  @@index([source])
  @@index([created_at])
}

/// Deposit income/outcome details of customers (citizens).
///
/// "shopping_deposit_histories" is an entity that embodies the
/// {@link shopping_customers customer}'s income/outcome history.
///
/// You can think of it as a kind of accounting ledger table. Therefore,
/// note that, "value" must have positive number only, even if it is a
/// outcome. The minus value must be expressed by multiplying the
/// {@link shopping_deposits.direction} value of the corresponding.
///
/// @namespace Coins
/// @author Samchon
model shopping_deposit_histories {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged metadata's {@link shopping_deposits.id}
  ///
  /// @format uuid
  shopping_deposit_id String @db.Uuid

  /// Belonged citizen's {@link shopping_citizens.id}
  ///
  /// @format uuid
  shopping_citizen_id String @db.Uuid

  /// The source record occurred deposit/outcome.
  ///
  /// @format uuid
  source_id String @db.Uuid

  /// Income/outcome amount of deposit.
  ///
  /// It must be a positive number, and you can check
  /// {@link shopping_deposits.direction} for incomes and outcomes.
  /// If you want to express the figures for incomes and outcomes as
  /// positive/negative numbers, you can also multiply this field value by
  /// the attributed {@link shopping_deposits.direction} value.
  ///
  /// @minimum 0
  value Float @db.DoublePrecision

  /// Balance value.
  ///
  /// Total balance value after the transaction.
  balance Float @db.DoublePrecision

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Cancelled time of record.
  cancelled_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  deposit shopping_deposits @relation(fields: [shopping_deposit_id], references: [id], onDelete: Cascade)
  citizen shopping_citizens @relation(fields: [shopping_citizen_id], references: [id], onDelete: Cascade)

  @@index([shopping_deposit_id, created_at, cancelled_at])
  @@index([shopping_deposit_id, source_id, created_at, cancelled_at])
  @@index([shopping_citizen_id, created_at, cancelled_at])
  @@index([created_at, cancelled_at])
}

/// Deposit deposit.
///
/// "shopping_deposit_charges" is an entity that symbolizes the act of a
/// {@link shopping_customers customer} applying for a deposit to a shopping
/// mall.
///
/// However, "shopping_deposit_charges" expresses the customer's intention to
/// make a deposit, but it has not yet been confirmed. Only when the customer
/// completes the {@link shopping_deposit_charge_publishes.paid_at payment}
/// will the deposit increase be confirmed.
///
/// @namespace Coins
/// @author Samchon
model shopping_deposit_charges {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged metadata's {@link shopping_deposits.id}
  ///
  /// @format uuid
  shopping_customer_id String @db.Uuid

  /// Charging amount.
  ///
  /// @exclusiveMinimum 0
  value Float @db.DoublePrecision

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Deletion time of record.
  ///
  /// Only when be stopped before publishing.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  customer shopping_customers                 @relation(fields: [shopping_customer_id], references: [id], onDelete: Cascade)
  publish  shopping_deposit_charge_publishes?

  @@index([shopping_customer_id, created_at, deleted_at])
  @@index([created_at, deleted_at])
}

/// Payment progress information for deposits.
///
/// "shopping_deposit_charge_publishes" is an entity that embodies the process
/// of a {@link shopping_customers customer} applying for a deposit and making
/// a payment.
///
/// Please note that the existence of the "shopping_deposit_charge_publishes"
/// record does not mean that payment has been completed. Payment is complete
/// only when payment ("paid_at") is complete. This is what the
/// "process of payment" mentioned above means.
///
/// However, even after payment has been made, there may be cases where it is
/// suddenly cancelled, so you must be careful about this as well.
///
/// @namespace Coins
/// @author Samchon
model shopping_deposit_charge_publishes {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged charge appliance's {@link shopping_deposit_charges.id}
  ///
  /// @format uuid
  shopping_deposit_charge_id String @db.Uuid

  /// Password for encryption.
  ///
  /// This shopping mall system uses a randomly issued password to encrypt
  /// payment history, and is completely unrelated to the user.
  password String? @db.VarChar

  /// Creation time of record.
  ///
  /// Note that, this property does not mean the payment completion time.
  created_at DateTime @db.Timestamptz

  /// Completion time of payment.
  ///
  /// This property is the only way to know if the payment has been
  /// completed. If this property is null, the payment has not been
  /// completed yet.
  paid_at DateTime? @db.Timestamptz

  /// The time when the payment was cancelled or reverted.
  cancelled_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  charge shopping_deposit_charges @relation(fields: [shopping_deposit_charge_id], references: [id], onDelete: Cascade)

  @@unique([shopping_deposit_charge_id])
}

/// Meta information of mileage.
///
/// "shopping_mileages" is an entity that embodies specifications for mileage
/// deposits and outcomes at a shopping mall. In other words,
/// "shopping_mileages" is not {@link shopping_mileage_histories}, which means
/// mileage deposit and outcome history, but is simply metadata that
/// specifies specifications for scenarios in which mileage is deposited and
/// withdrawn.
///
/// @namespace Coins
/// @author Samchon
model shopping_mileages {
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Identifier code.
  code String @db.VarChar

  /// The source table occurring the mileage event.
  source String @db.VarChar

  /// Direction of mileage.
  ///
  /// - "1": Income
  /// - "-1": outcome
  direction Int @db.Integer

  /// Default value of mileage.
  ///
  /// Possible to omit, and how to use this default value is up to the
  /// backend program. It is okay to use it as a default value when
  /// creating a new record, or percentage value to be applied.
  ///
  /// @minimum 0
  value Float? @db.DoublePrecision

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Deletion time of record.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  histories shopping_mileage_histories[]

  @@unique([code])
  @@index([source])
  @@index([created_at])
}

/// @namespace Coins
/// @author Samchon
model shopping_mileage_donations {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged seller's {@link shopping_customers.id}
  ///
  /// @format uuid
  shopping_admin_customer_id String @db.Uuid

  /// Belonged citizen's {@link shopping_citizens.id}
  ///
  /// @format uuid
  shopping_citizen_id String @db.Uuid

  /// Amount of donation.
  value Float @db.DoublePrecision

  /// Reason of donation.
  reason String

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  //----
  // RELATIONS
  //----
  adminCustomer shopping_customers @relation(fields: [shopping_admin_customer_id], references: [id], onDelete: Cascade)
  citizen       shopping_citizens  @relation(fields: [shopping_citizen_id], references: [id], onDelete: Cascade)

  @@index([shopping_admin_customer_id])
  @@index([shopping_citizen_id, created_at])
}

/// Mileagea income/outcome details of customers (citizens).
///
/// "shopping_mileage_histories" is an entity that embodies the
/// {@link shopping_customers customer}'s deposit/outcome history.
///
/// You can think of it as a kind of accounting ledger table. Therefore,
/// note that, "value" must have positive number only, even if it is a
/// outcome. The minus value must be expressed by multiplying the
/// {@link shopping_mileages.direction} value of the corresponding.
///
/// @namespace Coins
/// @author Samchon
model shopping_mileage_histories {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged metadata's {@link shopping_mileages.id}
  ///
  /// @format uuid
  shopping_mileage_id String @db.Uuid

  /// Belonged citizen's {@link shopping_citizens.id}
  ///
  /// @format uuid
  shopping_citizen_id String @db.Uuid

  /// The source record occurred income/outcome.
  ///
  /// @format uuid
  source_id String @db.Uuid

  /// Income/outcome amount of mileage.
  ///
  /// It must be a positive number, and you can check
  /// {@link shopping_mileages.direction} for incomes and outcomes.
  /// If you want to express the figures for incomes and outcomes as
  /// positive/negative numbers, you can also multiply this field value by
  /// the attributed {@link shopping_mileages.direction} value.
  ///
  /// @minimum 0
  value Float @db.DoublePrecision

  /// Balance value.
  ///
  /// Total balance value after the transaction.
  balance Float @db.DoublePrecision

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Cancelled time of record.
  cancelled_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  mileage shopping_mileages @relation(fields: [shopping_mileage_id], references: [id], onDelete: Cascade)
  citizen shopping_citizens @relation(fields: [shopping_citizen_id], references: [id], onDelete: Cascade)

  @@index([shopping_mileage_id, created_at, cancelled_at])
  @@index([shopping_mileage_id, source_id, created_at, cancelled_at])
  @@index([shopping_citizen_id, created_at, cancelled_at])
  @@index([created_at, cancelled_at])
}

/// @hidden
model mv_shopping_deposit_balances {
  shopping_citizen_id String @id @db.Uuid
  value               Float  @db.DoublePrecision

  citizen shopping_citizens @relation(fields: [shopping_citizen_id], references: [id], onDelete: Cascade)
}

/// @hidden
model mv_shopping_mileage_balances {
  shopping_citizen_id String @id @db.Uuid
  value               Float  @db.DoublePrecision

  citizen shopping_citizens @relation(fields: [shopping_citizen_id], references: [id], onDelete: Cascade)
}

// Filename - inquiries.prisma
/// Inquiry about a sale snapshot.
///
/// "shopping_sale_snapshot_inquiries" is a subtype entity of
/// {@link bbs_articles}, and represents inquiries written by
/// {@link shopping_customers customers} about a {@link shopping_sales sale}
/// registered by the {@link shopping_sellers seller} (however, to trace the
/// exact {@link shopping_sale_snapshots snapshot}, it is referencing not
/// sale but snapshot).
///
/// In addition, since the customer is waiting for the seller's response after
/// writing the inquiry, whether the seller has viewed the inquiry written by
/// the customer is provided for reference as "read_by_seller_at" property.
/// Of course, since the inquiry itself is a subtype of a article, it is also
/// possible for sellers to communicate with each other through
/// {@link shopping_sale_snapshot_inquiry_comments comments} before an
/// {@link shopping_sale_snapshot_inquiry_responses official response}.
///
/// However, comments themselves can be made by every customers, even if they
/// are not the person who wrote the article. Of course, it cannot be written
/// unless the seller is a party.
///
/// @namespace Inquiries
/// @erd Favorites
/// @author Samchon
model shopping_sale_snapshot_inquiries {
  //----
  // COLUMNS
  //----
  /// PK + FK.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged snapshot's {@link shopping_sale_snapshots.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_id String @db.Uuid

  /// Writer customer's {@link shopping_customers.id}
  ///
  /// @format uuid
  shopping_customer_id String @db.Uuid

  /// Type of the inquiry article.
  ///
  /// - "question"
  /// - "review"
  type String @db.VarChar

  /// Creation time of record.
  ///
  /// Duplicated property for fast sorting.
  ///
  /// @hidden
  created_at DateTime @db.Timestamptz

  /// The first time when the seller read the inquiry.
  read_by_seller_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  base     bbs_articles            @relation(fields: [id], references: [id], onDelete: Cascade)
  snapshot shopping_sale_snapshots @relation(fields: [shopping_sale_snapshot_id], references: [id], onDelete: Cascade)
  customer shopping_customers      @relation(fields: [shopping_customer_id], references: [id], onDelete: Cascade)

  of_question                              shopping_sale_snapshot_questions?
  of_review                                shopping_sale_snapshot_reviews?
  answer                                   shopping_sale_snapshot_inquiry_answers?
  shopping_sale_snapshot_inquiry_favorites shopping_sale_snapshot_inquiry_favorites[]

  @@index([shopping_sale_snapshot_id])
  @@index([shopping_customer_id])
}

/// Question about sale snapshot.
///
/// "shopping_sale_snapshot_questions" is a subtype entity of
/// {@link shopping_sale_snapshot_inquiries}, and is used when a
/// {@link shopping_customers customer} wants to ask something about a
/// sale ({@link shopping_sale_snapshots snapshot} at the time) registered by
/// the {@link shopping_sellers seller}.
///
/// And, like most shopping malls, "shopping_sale_snapshot_questions" also
/// provides a "secret" attribute, allowing you to create a "secret message"
/// that can only be viewed by the seller and the customer who wrote the
/// question.
///
/// @namespace Inquiries
/// @author Samchon
model shopping_sale_snapshot_questions {
  //----
  // COLUMNS
  //----
  /// PK + FK.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Whether secret or not.
  ///
  /// If secret article, only the writer customer and related seller can see
  /// the detailed content.
  secret Boolean @db.Boolean

  //----
  // RELATIONS
  //----
  base shopping_sale_snapshot_inquiries @relation(fields: [id], references: [id], onDelete: Cascade)
}

/// Reviews for sale snapshots.
///
/// "shopping_sale_snapshot_reviews" is a subtype entity of
/// {@link shopping_sale_snapshot_inquiries}, and is used when a
/// {@link shopping_customers customer} purchases a sale
/// ({@link shopping_sale_snapshots snapshot} at the time) registered by the
/// {@link shopping_sellers seller} as a product and leaves a review and
/// rating for it.
///
/// For reference, "shopping_sale_snapshot_reviews" and
/// {@link shopping_order_goods} have a logarithmic relationship of N: 1,
/// but this does not mean that customers can continue to write reviews for
/// the same product indefinitely. Wouldn't there be restrictions, such as
/// if you write a review once, you can write an additional review a month
/// later?
///
/// @namespace Inquiries
/// @author Samchon
model shopping_sale_snapshot_reviews {
  //----
  // COLUMNS
  //----
  /// PK + FK.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged good's {@link shopping_order_goods.id}
  ///
  /// @format uuid
  shopping_order_good_id String @db.Uuid

  //----
  // RELATIONS
  //----
  base shopping_sale_snapshot_inquiries @relation(fields: [id], references: [id], onDelete: Cascade)
  good shopping_order_goods             @relation(fields: [shopping_order_good_id], references: [id], onDelete: Cascade)

  @@index([shopping_order_good_id])
}

/// A snapshot of the content of the review for the sale snapshot.
///
/// "shopping_sale_snapshot_review_snapshots" is a subtype entity of
/// {@link bbs_article_snapshots} and is designed to add a "score" property
/// to the content of {@link shopping_sale_snapshot_reviews review article}.
///
/// In other words, after writing a review article, customers can edit it
/// and change the evaluation "score" at any time.
///
/// @namespace Inquiries
/// @author Samchon
model shopping_sale_snapshot_review_snapshots {
  //----
  // COLUMNS
  //----
  /// PK + FK.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Estimation score value.
  ///
  /// @minimum 0
  /// @maximum 100
  score Float @db.DoublePrecision

  //----
  // RELATIONS
  //----
  base bbs_article_snapshots @relation(fields: [id], references: [id], onDelete: Cascade)
}

/// Answers to inquiries about sale snapshots.
///
/// "shopping_sale_snapshot_inquiry_answers" is an entity that embodies the
/// official answer written by the {@link shopping_sellers seller} to the
/// {@link shopping_sale_snapshot_inquiries inquiry} written by the
/// {@link shopping_customers customer}.
///
/// Of course, in addition to writing an official response like this, it is
/// also possible for the seller to communicate with the inquiry written
/// customer and multiple customers through
/// {@link shopping_sale_snapshot_inquiry_comments comments} in the
/// attribution inquiry.
///
/// For reference, it is not possible to write comments on this answer.
/// Encourage people to write comments on the inquiry article. This is to
/// prevent comments from being scattered in both inquiry and response
/// articles.
///
/// @namespace Inquiries
/// @author Samchon
model shopping_sale_snapshot_inquiry_answers {
  //----
  // COLUMNS
  //----
  /// PK + FK
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged inquiry's {@link shopping_sale_snapshot_inquiries.id}
  ///
  /// @format uuid
  shopping_sale_snapshot_inquiry_id String @db.Uuid

  /// Answered seller's {@link shopping_customers.id}
  ///
  /// @format uuid
  shopping_seller_customer_id String @db.Uuid

  //----
  // RELATIONS
  //----
  base           bbs_articles                     @relation(fields: [id], references: [id], onDelete: Cascade)
  inquiry        shopping_sale_snapshot_inquiries @relation(fields: [shopping_sale_snapshot_inquiry_id], references: [id], onDelete: Cascade)
  sellerCustomer shopping_customers               @relation(fields: [shopping_seller_customer_id], references: [id], onDelete: Cascade)

  @@unique([shopping_sale_snapshot_inquiry_id])
  @@index([shopping_seller_customer_id])
}

/// A comment written on an inquiry article.
///
/// "shopping_sale_snapshot_inquiry_comments" is a subtype entity of
/// {@link bbs_article_comments}, and is used when you want to communicate with
/// multiple people about an {@link shopping_sale_snapshot_inquiries inquiry}
/// written by a {@link shopping_customers customer}.
///
/// For reference, only related parties can write comments for
/// {@link shopping_sellers sellers}, but there is no limit to customers.
/// In other words, anyone customer can freely write a comment, even if they are
/// not the person who wrote the inquiry.
///
/// @namespace Inquiries
/// @author Samchon
model shopping_sale_snapshot_inquiry_comments {
  //----
  // COLUMNS
  //----
  /// PK + FK
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Writer's {@link shopping_customers.id}
  ///
  /// @format uuid
  shopping_customer_id String @db.Uuid

  /// Type of the writer.
  ///
  /// - customer
  /// - seller
  actor_type String @db.VarChar

  //----
  // RELATIONS
  //----
  base     bbs_article_comments @relation(fields: [id], references: [id], onDelete: Cascade)
  customer shopping_customers   @relation(fields: [shopping_customer_id], references: [id], onDelete: Cascade)

  @@index([shopping_customer_id])
}

// Filename - favorites.prisma
/// Favorite sales.
///
/// "shopping_sale_favorites" is an entity that symbolizes the
/// {@link shopping_sales sale} that the {@link shopping_customers customer}
/// has favorited. Also, "shopping_sale_favorites" archives the
/// {@link shopping_sale_snapshots snapshot} of the sale at the time when the
/// customer favorites it.
///
/// @namespace Favorites
/// @author Samchon
model shopping_sale_favorites {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged customer's {@link shopping_customers.id}
  shopping_customer_id String @db.Uuid

  /// Target sale's {@link shopping_sales.id}
  shopping_sale_id String @db.Uuid

  /// Target snapshot's {@link shopping_sale_snapshots.id}
  ///
  /// The snapshot of the sale at the time when the customer favorites it.
  shopping_sale_snapshot_id String @db.Uuid

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Deletion time of record.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  customer shopping_customers      @relation(fields: [shopping_customer_id], references: [id], onDelete: Cascade)
  sale     shopping_sales          @relation(fields: [shopping_sale_id], references: [id], onDelete: Cascade)
  snapshot shopping_sale_snapshots @relation(fields: [shopping_sale_snapshot_id], references: [id], onDelete: Cascade)

  @@index([shopping_customer_id])
  @@index([shopping_sale_id])
  @@index([shopping_sale_snapshot_id])
}

/// Favorite inquiries.
///
/// "shopping_sale_snapshot_inquiry_favorites" is an entity that symbolizes
/// the {@link shopping_sale_snapshot_inquiries inquiry} that the
/// {@link shopping_customers customer} has favorited. Also,
/// "shopping_sale_snapshot_inquiry_favorites" archives the
/// {@link shopping_sale_snapshots snapshot} of the inquiry at the time when
/// the customer favorites it.
///
/// @namespace Favorites
/// @author Samchon
model shopping_sale_snapshot_inquiry_favorites {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged customer's {@link shopping_customers.id}
  shopping_customer_id String @db.Uuid

  /// Target inquiry's {@link shopping_sale_snapshot_inquiries.id}
  shopping_sale_snapshot_inquiry_id String @db.Uuid

  /// Target snapshot's {@link shopping_sale_snapshots.id}
  ///
  /// The snapshot of the inquiry at the time when the customer favorites it.
  bbs_article_snapshot_id String @db.Uuid

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Deletion time of record.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  /// Belonged customer.
  customer shopping_customers @relation(fields: [shopping_customer_id], references: [id], onDelete: Cascade)

  /// Belonged inquiry.
  inquiry shopping_sale_snapshot_inquiries @relation(fields: [shopping_sale_snapshot_inquiry_id], references: [id], onDelete: Cascade)

  /// Belonged snapshot.
  snapshot bbs_article_snapshots @relation(fields: [bbs_article_snapshot_id], references: [id], onDelete: Cascade)

  @@index([shopping_customer_id])
  @@index([shopping_sale_snapshot_inquiry_id])
}

/// Favorite addresses.
///
/// "shopping_address_favorites" is an entity that symbolizes the
/// {@link shopping_addresses address} that the
/// {@link shopping_customers customer} has favorited.
///
/// @namespace Favorites
/// @author Samchon
model shopping_address_favorites {
  //----
  // COLUMNS
  //----
  /// Primary Key.
  ///
  /// @format uuid
  id String @id @db.Uuid

  /// Belonged customer's {@link shopping_customers.id}
  shopping_customer_id String @db.Uuid

  /// Target address's {@link shopping_addresses.id}
  shopping_address_id String @db.Uuid

  /// Title of the favorite address.
  title String @db.VarChar

  /// Whether the favorite address is primary or not.
  primary Boolean @db.Boolean

  /// Creation time of record.
  created_at DateTime @db.Timestamptz

  /// Deletion time of record.
  deleted_at DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  customer shopping_customers @relation(fields: [shopping_customer_id], references: [id], onDelete: Cascade)
  address  shopping_addresses @relation(fields: [shopping_address_id], references: [id], onDelete: Cascade)

  @@index([shopping_customer_id])
  @@index([shopping_address_id])
}
`;
