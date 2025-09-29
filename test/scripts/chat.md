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

**For Chat Session implementation:**
- AutoBE should provide RESTful APIs for chat session creation, read operations, update operations (title change), and deletion
- I'll handle all the actual chat conversation logic myself by creating websocket server logic
- The websocket implementation will handle connection management and history creation
- AutoBE should never touch the chat conversation logic implementation itself

However, when images, PDFs, or other files are attached in conversation history, these attached files should be recorded once more in `ChatSessionHistoryFile`.

- `ChatSession`
- `ChatSessionConnection` (connected_at ~ disconnected_at)
- `ChatSessionHistory`
- `ChatSessionHistoryFile`
- `ChatSessionAggregate` (token usage aggregation, etc.)

For the `type` in `ChatSessionHistory`, I'm thinking of the following structure. Please flesh it out and add comments for documentation. I'll refactor and improve it directly to implement the websocket server, and since this is stored as JSON value in DB, it doesn't need to be too strict.

```typescript
type IWrtnChatSessionHistory = 
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

Here is a pseudo-code example of how DB models might be designed in Prisma. By the way, don't trust me too much about this. Just use it as a reference and design it better on your own.

```prisma
model wrtn_chat_sessions {
  id String @id @db.Uuid
  wrtn_account_id String @db.Uuid
  wrtn_member_id String @db.Uuid
  vendor String
  title String?
  created_at DateTime @db.Timestamptz
  updated_at DateTime @db.Timestamptz
  deleted_at DateTime? @db.Timestamptz
}
model wrtn_chat_session_connections {
  id String @id @db.Uuid
  wrtn_chat_session_id String @db.Uuid
  wrtn_member_id String @db.Uuid
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

- `Procedure`
- `ProcedureSession`
- `ProcedureSessionConnection`
- `ProcedureSessionHistory`
- `ProcedureSessionAggregate`

However, for procedures too, detailed history data should be stored as JSON, but the attributes listed below must be recorded for tracking and detailed management.

```prisma
model wrtn_procedures { ... }
model wrtn_procedure_sessions { ... }
model wrtn_procedure_session_connections { ... }
model wrtn_procedure_session_histories {
  ...
  type String
  arguments String // JSON value
  success Boolean
  value String // JSON value
}
model wrtn_procedure_session_aggregates {
  ...
  token_usage String // JSON value
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

Especially for statistics and dashboards, I only said they were necessary without specifying detailed specs. I completely trust your capabilities, so please design and implement them well on your own.