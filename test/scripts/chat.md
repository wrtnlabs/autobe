> You must speak English. Never speak any other language like Korean or Chinese.
>
> I repeat that, you have to speak English. Write every documents and codes in English.

# Enterprise AI Chatbot Service Requirements

## Overview
I'm building an AI chatbot service.

However, since this AI chatbot service targets enterprise customers, it's not just about providing a standalone AI agent. We need to meticulously manage and track chat session details and costs. For users, we need to manage them by enterprise organization units and grant or restrict permissions accordingly.

Additionally, there are special-purpose agent procedures that are a type of AI agent but don't use chat interfaces. Instead, they only accept designated forms as input to perform specific tasks. These exist as a kind of plugin system where enterprise administrators or team leaders can directly activate/deactivate them to limit the scope of tools available to each company and team.

Beyond this, we need detailed monitoring of individual/organizational usage, costs, and other statistical information through dashboards, and administrators should be able to handle billing and payment management at the organizational level.

In other words, while the core is AI chatbot + procedures, it has all imaginable management features added on top for enterprise customers: organization and user management, chat session management, cost and billing management, etc.

> Since this service is being created by Wrtn Technologies, please use the prefix `Wrtn` (lowercase `wrtn`).

**Important Note**: This requirements document covers the core structure, but some implementation details are intentionally left incomplete. AutoBE should identify and implement any missing components necessary for a complete enterprise B2B service, including but not limited to: file management systems, billing/cost tracking, permission management, dashboard/analytics, session transfer mechanisms, and security/authentication systems. Use your best judgment to fill these gaps appropriately.

## User
This is a B2B enterprise-exclusive service, and `WrtnMember` refers to internal Wrtn service members (not enterprise employees). Each member can have multiple email addresses.

However, simply registering as an internal member doesn't immediately grant permissions to manage enterprise services. Only when approved by an administrator can members be promoted to moderator or administrator roles.

Internal members have a `title` field with values (administrator, moderator, member) that determines their system permissions.

Also, internal members mainly have administrative roles for managing the B2B service itself.

- `WrtnMember`
- `WrtnMemberAppointment`
- Title of `WrtnMember`
  - administrator
  - moderator
  - guest

```prisma
model wrtn_members {
  id String @id @uuid
  name String
  mobile String
  password String
  title String
  created_at DateTime
  updated_at DateTime // updated when title changes
  approved_at DateTime? // first approved time  
  deleted_at DateTime?
  
  @@unique([mobile])
  @@index([name])
  @@index([title])
}

model wrtn_member_appointments {
  id String @id @uuid
  wrtn_appointer_id String @uuid
  wrtn_member_id String @uuid  
  title String
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

## Enterprise
Companies or corporations are referred to as enterprise. `WrtnEnterpriseEmployee` refers to enterprise members (not internal Wrtn service members). All employees hired by that company are called employee, and each organization within the company is called team. Finally, members of each team are called companion. Naturally, an employee can belong to multiple teams simultaneously.

**Important**: Only `WrtnMember` (internal Wrtn service administrators) can create enterprises. When an enterprise is created, the WrtnMember also appoints the initial owner employee. Since this initial owner is appointed by WrtnMember (not by another enterprise employee), there is no `wrtn_enterprise_employee_appointments` record for this first owner - their `approved_at` timestamp directly indicates when they were appointed as owner.

After the initial owner is established, `WrtnEnterpriseEmployee` registration follows normal flow: new employees must be approved by another employee with a title of manager or higher to become an official enterprise member, and these appointments are recorded in `wrtn_enterprise_employee_appointments`.

However, teams have a hierarchical structure. That is, one team can be a sub-team of another team. For example, there might be an "Engineering" team with sub-teams like "Backend", "Frontend", "AI", etc. Each team can only belong to one parent team (i.e., multiple parent teams are not allowed).

Also, employees have company-level positions called title with values (owner, manager, member). Companions have team-level roles called role with values (chief, manager, member).

Finally, all appointment and position/role change information for employees and companions must be recorded for tracking. Member appointments can be made by managers, and manager appointments can be made by owners/chiefs. Even if someone who was previously a manager is currently demoted to member, the past appointment or change history must not be compromised.

Note: The key difference between `WrtnMember` and `WrtnEnterpriseEmployee` is that `WrtnMember` can have multiple email addresses simultaneously, while `WrtnEnterpriseEmployee` has a single email per enterprise.

`WrtnChatSession` and `WrtnProcedureSession` are directly attributed to `WrtnEnterpriseEmployee`. When employees leave the company, their sessions can be transferred to other employees.

- `WrtnEnterprise`: Company or corporation
- `WrtnEnterpriseEmployee`: Employed member (or someone applying)
- `WrtnEnterpriseEmployeeAppointment`
- `WrtnEnterpriseTeam`: Has hierarchical structure
- `WrtnEnterpriseTeamCompanion`: Team member targets employee
- `WrtnEnterpriseTeamCompanionAppointment`

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
  wrtn_enterprise_appointer_id String @uuid
  wrtn_enterprise_employee_id String @uuid
  title String
  created_at DateTime
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
```

## Chat Session
A chat session is an entity that records who opened it with which model (e.g., `openai/gpt-4.1`) and when. User connection information to that session is called connection. All conversation history in each session is referred to as history.

The detailed content in `WrtnChatSessionHistory` will be stored in JSON format. This is because there are so many types that it's difficult to normalize in DB, the content is constantly added, and the data and attribute formats can sometimes be binary or streaming. So in DB design, we'll use one JSON (text) field, but separately record the `type` to know what kind of history it is.

**For Chat Session implementation:**
- AutoBE should provide RESTful APIs for chat session creation, read operations, update operations (title change), and deletion
- I'll handle all the actual chat conversation logic myself by creating websocket server logic
- The websocket implementation will handle connection management and history creation
- AutoBE should never touch the chat conversation logic implementation itself

However, when images, PDFs, or other files are attached in conversation history, these attached files should be recorded once more in `WrtnChatSessionHistoryFile`.

- `WrtnChatSession`
- `WrtnChatSessionConnection` (connected_at ~ disconnected_at)
- `WrtnChatSessionHistory`
- `WrtnChatSessionHistoryFile`
- `WrtnChatSessionAggregate` (token usage aggregation, etc.)

For the `type` in `WrtnChatSessionHistory`, I'm thinking of the following structure. Please flesh it out and add comments for documentation. I'll refactor and improve it directly to implement the websocket server, and since this is stored as JSON value in DB, it doesn't need to be too strict.

```typescript
type IWrtnChatSessionHistory = 
  | IWrtnChatSessionSystemMessageHistory
  | IWrtnChatSessionUserMessageHistory
  | IWrtnChatSessionAssistantMessageHistory
  | IWrtnChatSessionFunctionCallMessageHistory;

// System message - initial instructions or context
interface IWrtnChatSessionSystemMessageHistory {
  type: 'system';
  content: string; // system prompt or instructions
  metadata?: {
    purpose?: string; // e.g., 'initial_context', 'rule_update'
  };
}

// User message - from the enterprise employee
interface IWrtnChatSessionUserMessageHistory {
  type: 'user';
  content: string; // user's message text
  attachments?: Array<{
    file_id: string;
    filename: string;
    mime_type: string;
    size: number;
  }>;
  metadata?: {
    edited?: boolean; // if message was edited after sending
    voice_input?: boolean; // if input via voice
  };
}

// Assistant message - AI response
interface IWrtnChatSessionAssistantMessageHistory {
  type: 'assistant';
  content: string; // assistant's response text
  metadata?: {
    model?: string; // specific model used if different from session default
    truncated?: boolean; // if response was cut off
    reasoning_tokens?: number; // for o1 models
  };
}

// Function call - tool/API usage
interface IWrtnChatSessionFunctionCallMessageHistory {
  type: 'function_call';
  application: string; // application name (group of functions)
  function: string; // function name
  arguments: Record<string, any>;
  success: boolean; // success or failure
  value: unknown; // return value or exception value
  metadata?: {
    duration_ms?: number; // execution time
    retry_count?: number; // if retried
  };
}
```

Here is a pseudo-code example of how DB models might be designed in Prisma. By the way, don't trust me too much about this. Just use it as a reference and design it better on your own.

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
  wrtn_enterprise_employee_id String @db.Uuid
  connected_at DateTime @db.Timestamptz
  disconnected_at DateTime? @db.Timestamptz
}
model wrtn_chat_session_histories {
  id String @id @db.Uuid
  wrtn_chat_session_id String @db.Uuid
  wrtn_chat_session_connection_id String @db.Uuid
  type String
  value String // JSON value, encrypted
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

## Chat Procedure
Procedure is a type of special-purpose AI agent that doesn't use chat interfaces but only accepts designated forms as input to perform specific tasks. Stable Diffusion for image generation is the most representative example.

**For Procedure Session implementation:**
- AutoBE should provide RESTful APIs for procedure session creation, read operations, update operations (title change), and deletion
- I'll handle all the actual procedure execution logic myself by creating websocket server logic
- The websocket implementation will handle connection management and history creation
- AutoBE should never touch the procedure execution logic implementation itself

By the way, enterprise or team managers can limit which procedures can be used by their members. For example, in a company, the "Image Generation" procedure might be allowed for the "Marketing" team but restricted for the "Engineering" team.

- `WrtnProcedure`
- `WrtnProcedureSession`
- `WrtnProcedureSessionConnection`
- `WrtnProcedureSessionHistory`
- `WrtnProcedureSessionAggregate`

However, for procedures too, detailed history data should be stored as JSON, but the attributes listed below must be recorded for tracking and detailed management.

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
  type String
  arguments String // JSON value
  success Boolean
  value String // JSON value, encrypted
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

## Token Usage Analytics

For both `ChatSessionAggregate` and `ProcedureSessionAggregate`, the token usage information should follow this structure:

```typescript
export interface IWrtnTokenUsage {
  total: number;
  input: IWrtnTokenUsage.IInput;
  output: IWrtnTokenUsage.IOutput;
}

export namespace IWrtnTokenUsage {
  export interface IInput {
    total: number;
    cached: number;
  }

  export interface IOutput {
    total: number;
    reasoning: number;
    accepted_prediction: number;
    rejected_prediction: number;
  }
}
```

## Discretion
If there are other elements needed to implement this service, AutoBE should discover, design, and implement them independently.

If you discover something I didn't directly mention, you can proceed with your own discretion. If there's something I mentioned but missed, you can supplement and improve it appropriately without damaging the basic story.

**Specifically, AutoBE must fill in the following missing components**:
- **File Management**: Design `wrtn_files` table and related storage system for attachments
- **Billing & Cost Management**: Implement cost tracking, invoicing, and payment systems
- **Permission System**: Create mechanism for restricting procedures by enterprise/team
- **Dashboard & Analytics**: Design comprehensive statistics and monitoring systems
- **Session Transfer**: Implement mechanism for transferring sessions between employees
- **Security & Authentication**: Add proper authentication, authorization, and encryption systems

Especially for statistics and dashboards, I only said they were necessary without specifying detailed specs. I completely trust your capabilities, so please design and implement them well on your own.