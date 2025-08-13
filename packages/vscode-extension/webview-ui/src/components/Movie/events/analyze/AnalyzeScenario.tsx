import { AutoBeAnalyzeScenarioEvent } from "@autobe/interface";
import React, { useState } from "react";

interface IAnalyzeScenarioProps {
  /**
   * @example
   *   ```json
   *   {"type":"analyzeScenario","prefix":"discussionBoard","roles":[{"name":"guest","description":"Unregistered users who can only browse publicly available discussions and view content but cannot interact (post, comment, or vote)."},{"name":"member","description":"Registered users who can create, edit, and delete their own posts and comments, vote on content, and participate in discussions. Can report inappropriate content."},{"name":"moderator","description":"Users responsible for overseeing discussions: deleting inappropriate posts/comments, suspending users, resolving reports, and maintaining civility."},{"name":"admin","description":"System administrators with full privileges: managing users and roles, configuring board settings, viewing audit logs, and managing all service data."}],"files":[{"reason":"To provide an at-a-glance guide to the documentation structure and enable easy navigation for stakeholders and developers. Will include descriptive links to all other documents.","filename":"00-toc.md"},{"reason":"To define the vision, mission, and core value proposition of the political/economic discussion board, summarizing why it exists and its key business goals.","filename":"01-service-overview.md","documentType":"service-overview","outline":["Service Vision and Mission","Business Objectives","Market Need and Differentiation","Core Values and Principles","Target Audience"],"audience":"business stakeholders","keyQuestions":["What is the primary purpose of this service?","What makes this discussion board unique in the marketplace?","What are the long-term goals and value proposition?"],"detailLevel":"high-level overview"},{"reason":"To deeply analyze the problems, pain points, and motivations behind the need for a dedicated political/economic discussion board, forming the foundation for all requirements.","filename":"02-problem-definition.md","documentType":"requirement","outline":["User Pain Points","Existing Alternatives","Unmet Needs","Problem Scenarios","Opportunity Analysis"],"audience":"business stakeholders","keyQuestions":["What problems does this platform solve for users?","Why are existing solutions insufficient?","What unique challenges do political/economic discussions present?"],"detailLevel":"high-level overview"},{"reason":"To articulate the overall business model, including revenue strategies, user acquisition, and success metrics, ensuring sustainability and scalability.","filename":"03-business-model.md","documentType":"business-model","outline":["Revenue Streams","User Acquisition and Growth","Cost Structure","Success KPIs and Metrics"],"audience":"business stakeholders and leadership","keyQuestions":["How will the service generate revenue?","What are the main expenses and cost drivers?","How will the success of the platform be measured?"],"detailLevel":"moderate detail"},{"reason":"To map out the main user roles, their permissions, and detailed user personas to guide role design and experience differentiation. This will serve as the reference for authentication/authorization logic.","filename":"04-user-roles-and-personas.md","documentType":"user-story","outline":["User Role Definitions and Hierarchy","Permission Matrix","Persona Profiles (Guest, Member, Moderator, Admin)","Role-Based User Journeys"],"audience":"product managers, backend developers","keyQuestions":["What are the major user roles and what are their exact capabilities?","What typical persona scenarios does the system need to support?","How does the experience differ by role?"],"detailLevel":"detailed specification"},{"reason":"To define all core functional requirements for the discussion board, using EARS format where possible, and specifying workflows, rules, and user interactions strictly in business terms.","filename":"05-functional-requirements.md","documentType":"requirement","outline":["Overview of Core Features","Posting and Commenting","Voting and User Interaction","Reporting and Moderation Processes","Board and Category Management"],"audience":"backend developers, product managers","keyQuestions":["What are the essential features and business rules for all users?","How should posts/comments be managed?","What are the expected workflows for voting, reporting, etc.?"],"detailLevel":"detailed specification"},{"reason":"To provide a comprehensive guide to authentication, session management, and role-based authorization, including the complete JWT token and permission structure principles for backend development.","filename":"06-authentication-and-authorization.md","documentType":"requirement","outline":["Authentication Flows (Registration, Login, Logout, Reset)","Session and Token Management","Role-Based Access Control","Permission Matrix and Escalation Paths"],"audience":"backend developers","keyQuestions":["What are the complete authentication flows?","How should tokens and sessions be handled securely?","How is access and permission enforced for each role?"],"detailLevel":"detailed specification"},{"reason":"To document complete user scenarios and journeys for core platform actions, illustrating step-by-step what happens from each role's perspective.","filename":"07-user-scenarios-and-journeys.md","documentType":"user-story","outline":["Scenario Overviews","Typical Flows for Each Role","Edge Cases and Special Scenarios"],"audience":"backend developers, product managers","keyQuestions":["What are the most common and critical user flows?","What edge cases must be considered?"],"detailLevel":"moderate detail"},{"reason":"To define all business logic and rules behind voting, content ranking, and moderation—to ensure fair transparent operation and reduce abuse or gaming.","filename":"08-business-rules.md","documentType":"requirement","outline":["Voting Rules","Content Ranking Logic","Moderation Guidelines","User Suspension/Ban Logic"],"audience":"backend developers","keyQuestions":["How should votes be handled and counted?","What rules apply to moderation and banning?","What prevents abuse?"],"detailLevel":"detailed specification"},{"reason":"To specify error cases, user-facing recovery behaviors, and expected system responses for exceptional/unwanted situations, focusing on reliability and user trust.","filename":"09-error-handling-and-exception-scenarios.md","documentType":"requirement","outline":["Common Error Cases","User-Facing Recovery Flows","System Constraints and Graceful Failures"],"audience":"backend developers","keyQuestions":["How are errors/edge cases handled and communicated?","What recovery options are made available to users?"],"detailLevel":"moderate detail"},{"reason":"To describe system non-functional requirements for performance, scalability, data retention, compliance, logging, and privacy—critical for a discussion board handling sensitive political/economic content.","filename":"10-non-functional-requirements.md","documentType":"requirement","outline":["Performance and Scalability","Data Retention and Privacy","Audit Logging","Compliance Requirements"],"audience":"backend developers, product managers","keyQuestions":["What performance and uptime metrics are required?","How is user data protected and logged?","What compliance guidelines must be met?"],"detailLevel":"detailed specification"}],"step":0,"created_at":"2025-08-13T05:37:47.899Z"}}
   *   ```;
   */
  event: AutoBeAnalyzeScenarioEvent;
}

const AnalyzeScenario = (props: IAnalyzeScenarioProps) => {
  const { event } = props;
  const [isRolesExpanded, setIsRolesExpanded] = useState(false);
  const [isFilesExpanded, setIsFilesExpanded] = useState(false);

  return (
    <div className="flex justify-start mb-4">
      <div className="flex-1 max-w-3xl">
        {/* 메시지 버블 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
          <div className="space-y-3">
            {/* 제목 */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-blue-800">
                분석 시나리오 생성
              </h3>
            </div>

            {/* 프로젝트 정보 */}
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="text-sm text-gray-700">
                <span className="font-medium text-blue-600">프로젝트:</span>{" "}
                {event.prefix}
              </div>
            </div>

            {/* 역할 정보 */}
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="text-sm text-gray-700 mb-2">
                <span className="font-medium text-blue-600">사용자 역할:</span>
              </div>
              <div className="space-y-2">
                {(isRolesExpanded ? event.roles : event.roles.slice(0, 3)).map(
                  (role, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="text-xs">
                        <span className="font-medium text-gray-800">
                          {role.name}:
                        </span>
                        <span className="text-gray-600 ml-1">
                          {role.description.length > 80
                            ? role.description.substring(0, 80) + "..."
                            : role.description}
                        </span>
                      </div>
                    </div>
                  ),
                )}
                {event.roles.length > 3 && (
                  <div
                    className="text-xs text-blue-500 italic cursor-pointer hover:text-blue-700 hover:underline"
                    onClick={() => setIsRolesExpanded(!isRolesExpanded)}
                  >
                    {isRolesExpanded
                      ? "접기"
                      : `+${event.roles.length - 3}개 더...`}
                  </div>
                )}
              </div>
            </div>

            {/* 문서 정보 */}
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="text-sm text-gray-700 mb-2">
                <span className="font-medium text-blue-600">생성될 문서:</span>{" "}
                {event.files.length}개
              </div>
              <div className="text-xs text-gray-600">
                {(isFilesExpanded ? event.files : event.files.slice(0, 3)).map(
                  (file, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 mb-1"
                    >
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <span>{file.filename}</span>
                    </div>
                  ),
                )}
                {event.files.length > 3 && (
                  <div
                    className="text-blue-500 italic cursor-pointer hover:text-blue-700 hover:underline"
                    onClick={() => setIsFilesExpanded(!isFilesExpanded)}
                  >
                    {isFilesExpanded
                      ? "접기"
                      : `+${event.files.length - 3}개 더...`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 시간 표시 */}
        <div className="mt-1 ml-1">
          <span className="text-xs text-gray-400">
            {event.created_at
              ? new Date(event.created_at).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              : "Assistant"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnalyzeScenario;
