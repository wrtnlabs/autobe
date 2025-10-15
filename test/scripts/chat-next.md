> You must speak English. Never speak any other language like Korean or Chinese.
>
> I repeat that, you have to speak English. Write every documents and codes in English.

# Enterprise AI Chatbot Service Requirements

## 1. Overview
I'm building an AI chatbot service.

However, since this AI chatbot service targets enterprise customers, it's not just about providing a standalone AI agent. We need to meticulously manage and track chat session details and costs. For users, we need to manage them by enterprise organization units and grant or restrict permissions accordingly.

Additionally, there are special-purpose agent procedures that are a type of AI agent but don't use chat interfaces. Instead, they only accept designated forms as input to perform specific tasks. These exist as a kind of plugin system where enterprise administrators or team leaders can directly activate/deactivate them to limit the scope of tools available to each company and team.

Beyond this, we need detailed monitoring of individual/organizational usage, costs, and other statistical information through dashboards, and administrators should be able to handle billing and payment management at the organizational level.

In other words, while the core is AI chatbot + procedures, it has all imaginable management features added on top for enterprise customers: organization and user management, chat session management, cost and billing management, etc.

> Since this service is being created by Wrtn Technologies, please use the prefix `Wrtn` (lowercase `wrtn`).

**Important Note**: This requirements document covers the core structure, but some implementation details are intentionally left incomplete. AutoBE should identify and implement any missing components necessary for a complete enterprise B2B service, including but not limited to: file management systems, billing/cost tracking, permission management, dashboard/analytics, session transfer mechanisms, and security/authentication systems. Use your best judgment to fill these gaps appropriately.

## 2. Internal Member (Moderator)

This is a B2B enterprise-exclusive service, and `wrtn_members` refers to internal Wrtn service members (not enterprise employees). Each member can have multiple email addresses.

However, simply registering as an internal member doesn't immediately grant permissions to manage enterprise services. Only when approved by an administrator can members be promoted to moderator or administrator roles.

Internal members have a `role` field with values (administrator, moderator, member) that determines their system permissions.

Also, internal members mainly have administrative roles for managing the B2B service itself. role이 administrator 나 moderator 인 경우에는 enterprise 를 개설하고 폐쇄할 수 있는 권한을 가지고 있으며, member 의 경우에는 enterprise 를 단순 열람하는 것만이 가능하다.

참고로 `WrtnMember` 가 `WrtnEnterprise` 를 개설할 때, enterprise 를 개설하면서 동시에 `wrtn_enterprise_employee_invitations` 레코드도 함께 발행된다. 그리고 해당 `wrtn_enterprise_employee_invitations` 에서의 

```prisma
model wrtn_members {
  id String @id @uuid
  name String
  mobile String
  password String

  // - administrator: can appoint and invite administrator and moderator
  // - moderator: can appoint and invite member
  // - member: just viewing statistics
  role String
  created_at DateTime
  updated_at DateTime // updated when title changes
  approved_at DateTime? // first approved time
  deleted_at DateTime?
  
  @@unique([mobile])
  @@index([name])
}

model wrtn_member_appointments {
  id String @id @uuid
  wrtn_member_id String @uuid  

  // some member who appointed
  // however, it can be null due to the first membership seeding
  wrtn_appointer_id String? @uuid
  role String
  created_at DateTime
}

model wrtn_member_invitations {
  id String @id @uuid
  wrtn_member_id String @uuid // invitor's member id
  email String
  created_at DateTime
}

model wrtn_member_emails {
  id String @id @uuid
  wrtn_member_id String @uuid
  email String
  verified_at DateTime?
  created_at DateTime
  deleted_at DateTime?
  
  @@unique([email])
  @@index([wrtn_member_id])
}
```

## 3. Enterprise

```prisma
model wrtn_enterprises {
  id String @id @uuid
  code String
  name String
  created_at DateTime
  updated_at DateTime
  deleted_at DateTime?
}

model wrtn_enterprise_employees {
  id String @id @uuid
  wrtn_enterprise_id String @uuid
  email String
  password String
  name String

  // - owner
  // - manager
  // - member
  // - observer
  title String
  created_at DateTime
  updated_at DateTime // whenever title changed
  approved_at DateTime? // first approved time
  deleted_at DateTime? // the fired time

  @@unique([wrtn_enterprise_id, email])
  @@index([wrtn_enterprise_id, name])
}

model wrtn_enterprise_employee_appointments {
  id String @id @uuid
  wrtn_enterprise_employee_id String @uuid
  wrtn_enterprise_appointer_id String? @uuid
  title String
  created_at DateTime
}

model wrtn_enterprise_employee_invitations {
  id String @id @uuid
  wrtn_enterprise_id String @uuid
  wrtn_enterprise_team_id String? @uuid
  wrtn_enterprise_invitor_id String @uuid
  email String @uuid
  title String
  created_at DateTime
  deleted_at DateTime?
}

model wrtn_enterprise_teams {
  id String @id @uuid
  wrtn_enterprise_id String @uuid
  parent_id String? @uuid
  code String
  name String
  created_at DateTime
  updated_at DateTime
  deleted_at DateTime?

  @@unique([wrtn_enterprise_id, code])
  @@unique([wrtn_enterprise_id, name])
}

model wrtn_enterprise_team_companions {
  id String @id @uuid
  wrtn_enterprise_team_id String @uuid
  wrtn_enterprise_employee_id String @uuid
  role String
  created_at DateTime
  updated_at DateTime
  deleted_at DateTime?
  
  @@unique([wrtn_enterprise_team_id, wrtn_enterprise_employee_id])
}

model wrtn_enterprise_team_companion_appointments {
  id String @id @uuid
  wrtn_enterprise_team_appointer_id String @uuid
  wrtn_enterprise_team_employee_id String @uuid
  role String
  created_at DateTime
}

model wrtn_enterprise_team_companion_invitations {
  id String @id @uuid
  wrtn_enterprise_team_id String @uuid // target team
  wrtn_enterprise_employee_id String @uuid // target employee to invite
  wrtn_enterprise_invitor_id String @uuid // some employee who invited
}
```

## 4. AI Chatbot

```prisma
model wrtn_chat_sessions {
  id String @id @db.Uuid
  wrtn_enterprise_employee_id String @db.Uuid
  vendor String
  title String?
  created_at DateTime @db.Timestamptz
  updated_at DateTime @db.Timestamptz
  deleted_at DateTime? @db.Timestamptz
}

model wrtn_chat_session_connections {
  id String @id @db.Uuid
  wrtn_chat_session_id String @db.Uuid
  connected_at DateTime @db.Timestamptz
  disconnected_at DateTime? @db.Timestamptz
}

model wrtn_chat_session_histories {
  id String @id @db.Uuid
  wrtn_chat_session_id String @db.Uuid
  wrtn_chat_session_connection_id String @db.Uuid
  type String // Discrminator type
  data String // JSON value, encrypted
  token_usage String? // JSON value
  created_at DateTime @db.Timestamptz
}

model wrtn_chat_session_history_files {
  id String @id @db.Uuid
  wrtn_chat_session_history_id String @db.Uuid
  wrtn_file_id String @db.Uuid
  sequence Int
}

model wrtn_chat_session_aggregates {
  id String @id @db.Uuid
  wrtn_chat_session_id String @db.Uuid
  token_usage String // JSON value

  @@unique([wrtn_chat_session_id])
}
```

## 5. AI Procedure
Procedure is a type of special-purpose AI agent that doesn't use chat interfaces but only accepts designated forms as input to perform specific tasks. Stable Diffusion for image generation is the most representative example.

**For Procedure Session implementation:**
- AutoBE should provide RESTful APIs for procedure session creation, read operations, update operations (title change), and deletion
- I'll handle all the actual procedure execution logic myself by creating websocket server logic
- The websocket implementation will handle connection management and history creation
- AutoBE should never touch the procedure execution logic implementation itself

By the way, enterprise or team managers can limit which procedures can be used by their members. For example, in a company, the "Image Generation" procedure might be allowed for the "Marketing" team but restricted for the "Engineering" team.

```prisma
model wrtn_procedures {
  id String @id @db.Uuid
  code String
  name String
  description String?
  icon String? // URL or emoji
  active Boolean @default(true)
  created_at DateTime @db.Timestamptz
  updated_at DateTime @db.Timestamptz
  deleted_at DateTime? @db.Timestamptz
  
  @@unique([code])
  @@index([active])
}

model wrtn_procedure_sessions {
  id String @id @db.Uuid
  wrtn_enterprise_employee_id String @db.Uuid
  wrtn_procedure_id String @db.Uuid
  title String?
  created_at DateTime @db.Timestamptz
  updated_at DateTime @db.Timestamptz
  deleted_at DateTime? @db.Timestamptz
  
  @@index([wrtn_enterprise_employee_id])
  @@index([wrtn_procedure_id])
}

model wrtn_procedure_session_connections {
  id String @id @db.Uuid
  wrtn_procedure_session_id String @db.Uuid
  wrtn_enterprise_employee_id String @db.Uuid
  connected_at DateTime @db.Timestamptz
  disconnected_at DateTime? @db.Timestamptz
  
  @@index([wrtn_procedure_session_id])
}

model wrtn_procedure_session_histories {
  id String @id @db.Uuid
  wrtn_procedure_session_id String @db.Uuid
  wrtn_procedure_session_connection_id String @db.Uuid
  type String // Discriminator type
  arguments String // JSON value, encrypted
  success Boolean // Whether returned or exception thrown
  value String // JSON value of return or exception, encrypted
  token_usage String // JSON value
  created_at DateTime @db.Timestamptz
  
  @@index([wrtn_procedure_session_id])
}

model wrtn_procedure_session_aggregates {
  id String @id @db.Uuid
  wrtn_procedure_session_id String @db.Uuid
  token_usage String // JSON value
  
  @@unique([wrtn_procedure_session_id])
}
```