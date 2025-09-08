import { AutoBeTokenUsage } from "@autobe/agent";
import {
  IAutoBeHackathonSession,
  IAutobeHackathon,
  IAutobeHackathonParticipant,
} from "@autobe/hackathon-api";
import { IAutoBeRpcListener, IAutoBeRpcService } from "@autobe/interface";
import { WebSocketAcceptor } from "tgrid";
import { tags } from "typia";
import { v4 } from "uuid";

import { AutoBeHackathonGlobal } from "../AutoBeHackathonGlobal";
import { IEntity } from "../structures/IEntity";
import { AutoBeHackathonParticipantProvider } from "./AutoBeHackathonParticipantProvider";
import { AutoBeHackathonProvider } from "./AutoBeHackathonProvider";
import { AutoBeHackathonSessionConnectionProvider } from "./AutoBeHackathonSessionConnectionProvider";
import { AutoBeHackathonSessionProvider } from "./AutoBeHackathonSessionProvider";

export namespace AutoBeHackathonSessionSocketProvider {
  export const start = async (props: {
    hackathonCode: string;
    acceptor: WebSocketAcceptor<
      IAutoBeHackathonSession.IStartHeader,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >;
  }): Promise<void> => {
    // PREPARE ENTITIES
    const hackathon: IAutobeHackathon = await findHackathon(props);
    const participant: IAutobeHackathonParticipant = await authorize({
      hackathon,
      acceptor: props.acceptor,
    });
    const session: IEntity =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_sessions.create({
        data: {
          id: v4(),
          autobe_hackathon_id: hackathon.id,
          autobe_hackathon_participant_id: participant.id,
          model: props.acceptor.header.model,
          created_at: new Date(),
          completed_at: null,
          review_article_url: null,
          aggregate: {
            create: {
              id: v4(),
              state: null,
              token_usage: new AutoBeTokenUsage().toJSON() as any,
            },
          },
        },
      });
    const connection: IEntity =
      await AutoBeHackathonSessionConnectionProvider.emplace({
        session,
        acceptor: props.acceptor,
      });

    // @todo START COMMUNICATION
    connection;
  };

  export const restart = async (props: {
    hackathonCode: string;
    id: string & tags.Format<"uuid">;
    acceptor: WebSocketAcceptor<
      IAutoBeHackathonSession.IRestartHeader,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >;
  }): Promise<void> => {
    // PREPARE RELATED ENTITIES
    const hackathon: IAutobeHackathon = await findHackathon(props);
    const participant: IAutobeHackathonParticipant = await authorize({
      hackathon,
      acceptor: props.acceptor,
    });
    const session: IAutoBeHackathonSession.ISummary = await findSession({
      hackathon,
      participant,
      id: props.id,
      acceptor: props.acceptor,
    });
    const connection: IEntity =
      await AutoBeHackathonSessionConnectionProvider.emplace({
        session,
        acceptor: props.acceptor,
      });

    // @todo START COMMUNICATION
    connection;
  };

  export const replay = async (props: {
    hackathonCode: string;
    id: string & tags.Format<"uuid">;
    acceptor: WebSocketAcceptor<
      IAutoBeHackathonSession.IReplayHeader,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >;
  }): Promise<void> => {
    // PREPARE RELATED ENTITIES
    const hackathon: IAutobeHackathon = await findHackathon(props);
    const participant: IAutobeHackathonParticipant = await authorize({
      hackathon,
      acceptor: props.acceptor,
    });
    const session: IAutoBeHackathonSession.ISummary = await findSession({
      hackathon,
      participant,
      id: props.id,
      acceptor: props.acceptor,
    });

    // @todo START COMMUNICATION
    session;
  };

  const findSession = async (props: {
    hackathon: IAutobeHackathon;
    participant: IAutobeHackathonParticipant;
    id: string;
    acceptor: WebSocketAcceptor<
      IAutoBeHackathonSession.IReplayHeader,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >;
  }): Promise<IAutoBeHackathonSession.ISummary> => {
    try {
      const record = await AutoBeHackathonSessionProvider.find({
        hackathon: props.hackathon,
        participant: props.participant,
        id: props.id,
        payload: AutoBeHackathonSessionProvider.summarize.select(),
      });
      return AutoBeHackathonSessionProvider.summarize.transform(record);
    } catch (error) {
      await props.acceptor.reject(1006, "Session not found");
      throw error;
    }
  };

  const findHackathon = async (props: {
    hackathonCode: string;
    acceptor: WebSocketAcceptor<
      IAutoBeHackathonSession.IReplayHeader,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >;
  }): Promise<IAutobeHackathon> => {
    try {
      return await AutoBeHackathonProvider.get(props.hackathonCode);
    } catch (error) {
      await props.acceptor.reject(1006, "Hackathon not found");
      throw error;
    }
  };

  const authorize = async (props: {
    hackathon: IAutobeHackathon;
    acceptor: WebSocketAcceptor<
      IAutoBeHackathonSession.IReplayHeader,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >;
  }): Promise<IAutobeHackathonParticipant> => {
    try {
      return await AutoBeHackathonParticipantProvider.authorize({
        hackathon: props.hackathon,
        accessToken: props.acceptor.header?.Authorization,
      });
    } catch (error) {
      await props.acceptor.reject(1008, "Unauthorized");
      throw error;
    }
  };
}
