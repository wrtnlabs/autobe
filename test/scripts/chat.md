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

## User
This AI chatbot service requires membership registration to use, and each member can have multiple email addresses.

When a regular member additionally has a moderator or administrator record (each having a 1:1 relationship with member), they acquire corresponding system permissions.

Also, each member can have accounts, and `ChatSession` or `ProcedureSession` etc. are all attributed to these accounts. These accounts can be transferred to other members - considering cases where employees leave the company and need to hand over their sessions and assets to successors.

- `Member`
  - Name
  - Phone number
  - Password
- `MemberEmail`
  - Email address, but must be verified
  - Multiple emails can be registered per member
- `Account`
  - Account code (someone)
  - Can be transferred to other members
- `Moderator`
  - When regular member has additional moderator record, gains moderator permissions
- `Administrator`
  - When regular member has additional administrator record, gains administrator permissions

## Enterprise
Companies or corporations are referred to as enterprise. All employees hired by that company are called employee, and each organization within the company is called team. Finally, members of each team are called companion. Naturally, an employee can belong to multiple teams simultaneously.

However, teams have a hierarchical structure. That is, one team can be a sub-team of another team. For example, there might be an "Engineering" team with sub-teams like "Backend", "Frontend", "AI", etc. Each team can only belong to one parent team (i.e., multiple parent teams are not allowed).

Also, employees have company-level positions called title with values (owner, manager, member). Companions have team-level roles called role with values (chief, manager, member).

Finally, all appointment and position/role change information for employees and companions must be recorded for tracking. Member appointments can be made by managers, and manager appointments can be made by owners/chiefs. Even if someone who was previously a manager is currently demoted to member, the past appointment or change history must not be compromised.

- `Enterprise`: Company or corporation
- `EnterpriseEmployee`: Employee targets member
- `EnterpriseTeam`: Has hierarchical structure
- `EnterpriseTeamCompanion`: Team member targets employee

## Chat Session
A chat session is an entity that records who opened it with which model (e.g., `openai/gpt-4.1`) and when. User connection information to that session is called connection. All conversation history in each session is referred to as history.

The detailed content in `ChatHistory` will be stored in JSON format. This is because there are so many types that it's difficult to normalize in DB, the content is constantly added, and the data and attribute formats can sometimes be binary or streaming. So in DB design, we'll use one JSON (text) field, but separately record the `type` to know what kind of history it is.

Also, the backend application created by AutoBE will only provide read functionality for `ChatSession` and `ChatSessionHistory`. I'll handle all the actual chat session creation, connection, and conversation logic myself by creating websocket server logic. So AutoBE should only handle table design and read operations, and never touch the chat logic implementation itself. You know how inefficient it would be to implement chat logic with RESTful API, right? I'll handle everything with websockets.

However, when images, PDFs, or other files are attached in conversation history, these attached files should be recorded once more in `ChatSessionHistoryFile`.

- `ChatSession`
- `ChatSessionConnection` (connected_at ~ disconnected_at)
- `ChatSessionHistory`
- `ChatSessionHistoryFile`
- `ChatSessionAggregate` (token usage aggregation, etc.)

Below is the chat session schema designed for AutoBE's hackathon competition. This will be very helpful for AutoBE in requirements analysis and DB design.

```prisma
model autobe_hackathon_sessions {
  //----
  // COLUMNS
  //----
  id                              String    @id @db.Uuid
  autobe_hackathon_id             String    @db.Uuid
  autobe_hackathon_participant_id String    @db.Uuid
  model                           String    @db.VarChar
  timezone                        String    @db.VarChar
  title                           String?   @db.VarChar
  review_article_url              String?   @db.VarChar(2048)
  created_at                      DateTime  @db.Timestamptz
  completed_at                    DateTime? @db.Timestamptz
  deleted_at                      DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  hackathon   autobe_hackathons             @relation(fields: [autobe_hackathon_id], references: [id], onDelete: Cascade)
  participant autobe_hackathon_participants @relation(fields: [autobe_hackathon_participant_id], references: [id], onDelete: Cascade)

  connections autobe_hackathon_session_connections[]
  histories   autobe_hackathon_session_histories[]
  events      autobe_hackathon_session_events[]
  aggregate   autobe_hackathon_session_aggregates?

  @@index([autobe_hackathon_id, created_at])
  @@index([autobe_hackathon_participant_id, created_at])
}

model autobe_hackathon_session_connections {
  //----
  // COLUMNS
  //----
  id                          String    @id @db.Uuid
  autobe_hackathon_session_id String    @db.Uuid
  created_at                  DateTime  @db.Timestamptz
  disconnected_at             DateTime? @db.Timestamptz

  //----
  // RELATIONS
  //----
  session                            autobe_hackathon_sessions            @relation(fields: [autobe_hackathon_session_id], references: [id], onDelete: Cascade)
  autobe_hackathon_session_histories autobe_hackathon_session_histories[]
  autobe_hackathon_session_events    autobe_hackathon_session_events[]

  @@index([autobe_hackathon_session_id, created_at])
}

model autobe_hackathon_session_histories {
  //----
  // COLUMNS
  //----
  id                                     String   @id @db.Uuid
  autobe_hackathon_session_id            String   @db.Uuid
  autobe_hackathon_session_connection_id String   @db.Uuid
  type                                   String   @db.VarChar
  data                                   String  // JSON value, encrypted for security
  created_at                             DateTime @db.Timestamptz

  //----
  // RELATIONS
  //----
  session    autobe_hackathon_sessions            @relation(fields: [autobe_hackathon_session_id], references: [id], onDelete: Cascade, map: "autobe_hackathon_session_histories_session_fkey")
  connection autobe_hackathon_session_connections @relation(fields: [autobe_hackathon_session_connection_id], references: [id], onDelete: Cascade, map: "autobe_hackathon_session_histories_connection_fkey")

  @@index([autobe_hackathon_session_id, created_at], map: "autobe_hackathon_session_histories_session_idx")
  @@index([autobe_hackathon_session_connection_id, created_at], map: "autobe_hackathon_session_histories_connection_idx")
}

model autobe_hackathon_session_aggregates {
  id String @id @db.Uuid
  autobe_hackathon_session_id String @db.Uuid
  token_usage String // JSON value

  @@unique([autobe_hackathon_session_id])
  session autobe_hackathon_sessions @relation(fields: [autobe_hackathon_session_id], references: [id], onDelete: Cascade)
}
```

For the `type` in `ChatSessionHistory`, I'm thinking of the following structure. Please flesh it out and add comments for documentation. I'll refactor and improve it directly to implement the websocket server, and since this is stored as JSON value in DB, it doesn't need to be too strict.

```typescript
interface IWrtnChatSessionHistory = 
  | IWrtnChatSessionSystemMessageHistory
  | IWrtnChatSessionUserMessageHistory
  | IWrtnChatSessionAssistantMessageHistory
  | IWrtnChatSessionFunctionCallMessageHistory;

// messages
interface IWrtnChatSessionSystemMessageHistory {}
interface IWrtnChatSessionUserMessageHistory {}
interface IWrtnChatSessionAssistantMessageHistory {}

// function call
interface IWrtnChatSessionFunctionCallMessageHistory {
  application: string; // application name (group of functions)
  function: string; // function name
  arguments: Record<string, any>;
  success: boolean; // success or failure
  value: unknown; // return value or exception value
}
```

## Chat Procedure
Procedure is a type of special-purpose AI agent that doesn't use chat interfaces but only accepts designated forms as input to perform specific tasks. Stable Diffusion for image generation is the most representative example.

Of course, I'll handle the detailed implementation myself, and AutoBE just needs to handle DB design and RESTful API adequately. Since I'll modify and rewrite everything anyway, don't overthink it and just make it reasonably.

By the way, enterprise or team managers can limit which procedures can be used by their members. For example, in a company, the "Image Generation" procedure might be allowed for the "Marketing" team but restricted for the "Engineering" team.

- `Procedure`
- `ProcedureSession`
- `ProcedureSessionHistory`

However, for procedures too, detailed history data should be stored as JSON, but the attributes listed below must be recorded for tracking and detailed management.

```prisma
model wrtn_chat_procedures { ... }
model wrtn_chat_procedure_sessions { ... }
model wrtn_chat_procedure_session_histories {
  ...
  type String
  arguments String // JSON value
  success Boolean
  value String // JSON value
}
```

## Discretion
If there are other elements needed to implement this service, AutoBE should discover, design, and implement them independently.

If you discover something I didn't directly mention, you can proceed with your own discretion. If there's something I mentioned but missed, you can supplement and improve it appropriately without damaging the basic story.

Especially for statistics and dashboards, I only said they were necessary without specifying detailed specs. I completely trust your capabilities, so please design and implement them well on your own.