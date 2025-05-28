# 3. User Personas – Internal Bulletin Board System

## Overview
This document describes the primary user personas who will interact with the Internal Bulletin Board System. Well-defined personas help developers understand the varying needs, behaviors, motivations, and goals of different stakeholders. Each persona below includes a concise summary of their role, objectives, challenges, and interactions with the system. For clarity and practicality, at least two distinct personas are detailed: the typical employee user and the system administrator.

---

## Table of Contents
1. Persona 1: Employee User
    - Profile & Demographics
    - Needs & Goals
    - Behaviors & Pain Points
    - System Interaction Example
2. Persona 2: System Administrator
    - Profile & Demographics
    - Needs & Goals
    - Behaviors & Pain Points
    - System Interaction Example
3. Persona Mapping Table
4. Persona Use Considerations

---

## 1. Persona 1: Employee User
### Profile & Demographics
- **Name:** Alex Kim (Example)
- **Role:** General Employee (Staff, middle management)
- **Department:** Any (e.g., Marketing, HR, Engineering)
- **Age:** 28-45
- **Technical Proficiency:** Average office user, comfortable with basic business IT tools

### Needs & Goals
- Quickly access important company-wide announcements
- Share work-related or casual updates on the free board
- Read, comment on, and like posts from colleagues
- Find popular discussions or trending news
- Engage with colleagues in a secure, workplace-specific environment

### Behaviors & Pain Points
- Checks announcements daily for updates
- Frequently skims the popular board for trending posts
- May miss critical information if the UI is cluttered
- Concern about privacy or unauthorized access to sensitive posts
- Seeks an easy, mobile-friendly experience
- Prefers non-intrusive notifications

### System Interaction Example
> **Scenario:** Alex logs in with a company email on a Monday morning. The dashboard shows new announcements. Alex navigates to the Free Board, reads a few posts, likes a colleague’s update, and comments a question. Later, Alex checks the Popular Board to see what’s trending. For the first login, Alex is prompted to change the default password from "1234"—this step is completed smoothly.

---

## 2. Persona 2: System Administrator
### Profile & Demographics
- **Name:** Jamie Lee (Example)
- **Role:** IT System Administrator, HR Admin
- **Department:** IT or HR
- **Age:** 32-55
- **Technical Proficiency:** High, experienced with system management, access control, and policy enforcement

### Needs & Goals
- Ensure secure access: only authorized company email users
- Manage board configuration and user privileges
- Monitor user activity, moderate inappropriate posts
- Respond quickly to support requests or system issues
- Enforce password policies and audit login attempts

### Behaviors & Pain Points
- Reviews logs for unauthorized login attempts
- Deletes or edits posts violating company policy
- Handles password resets and onboarding of new users
- Needs a robust, reliable system with minimal downtime
- Worries about data breaches, duplicate likes, and permanent deletes

### System Interaction Example
> **Scenario:** Jamie receives a report of an inappropriate post. Logs in, navigates to the relevant board, deletes the post, and permanently removes it from the system. Runs a report on recent activity to ensure no similar issues exist, and reviews new user login events to ensure password change compliance.

---

## 3. Persona Mapping Table

| Persona         | Frequency of Use | Key Features Used               | Motivation                  |
|----------------|------------------|---------------------------------|-----------------------------|
| Employee User  | Daily            | Announcements, Free Board, Popular Board, Posting, Liking, Comments | Stay informed, Participate  |
| Admin          | Weekly/Daily     | Post/Comment Management, User Audit, Board Settings                | Ensure Security, Compliance |

---

## 4. Persona Use Considerations
- **Accessibility:** Employ best practices for all user types—large buttons, clear text, helpful tooltips.
- **Support:** Online help and FAQs serve all personas.
- **Localization:** UI and messages should support the user’s locale (en-US initially).
- **Security:** Strictly enforce authentication policies for every persona.

---

Is there anything in this persona description that should be refined or another user persona you want to add?