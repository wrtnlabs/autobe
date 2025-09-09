import {
  IAutoBeHackathon,
  IAutoBeHackathonSession,
  IAutoBeRpcListener,
  IAutoBeRpcService,
  IAutobeHackathonParticipant,
} from "@autobe/interface";
import { WebSocketAcceptor } from "tgrid";
import { tags } from "typia";

import { AutoBeHackathonGlobal } from "../AutoBeHackathonGlobal";
import { IEntity } from "../structures/IEntity";
import { AutoBeHackathonParticipantProvider } from "./AutoBeHackathonParticipantProvider";
import { AutoBeHackathonProvider } from "./AutoBeHackathonProvider";
import { AutoBeHackathonSessionConnectionProvider } from "./AutoBeHackathonSessionConnectionProvider";
import { AutoBeHackathonSessionProvider } from "./AutoBeHackathonSessionProvider";
import { AutoBeHackathonSessionSocketAcceptor } from "./acceptors/AutoBeHackathonSessionSocketAcceptor";

export namespace AutoBeHackathonSessionSocketProvider {
  export const connect = async (props: {
    hackathonCode: string;
    id: string & tags.Format<"uuid">;
    acceptor: WebSocketAcceptor<
      IAutoBeHackathonSession.IHeader,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >;
  }): Promise<void> => {
    // PREPARE RELATED ENTITIES
    const hackathon: IAutoBeHackathon = await findHackathon(props);
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

    // START COMMUNICATION
    await AutoBeHackathonSessionSocketAcceptor.connect({
      session,
      connection,
      acceptor: props.acceptor,
    });
  };

  export const replay = async (props: {
    hackathonCode: string;
    id: string & tags.Format<"uuid">;
    acceptor: WebSocketAcceptor<
      IAutoBeHackathonSession.IHeader,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >;
  }): Promise<void> => {
    // PREPARE RELATED ENTITIES
    const hackathon: IAutoBeHackathon = await findHackathon(props);
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

    // START COMMUNICATION
    await AutoBeHackathonSessionSocketAcceptor.replay({
      session,
      connection:
        await AutoBeHackathonGlobal.prisma.autobe_hackathon_session_connections.findFirstOrThrow(
          {
            where: {
              autobe_hackathon_session_id: session.id,
            },
            orderBy: {
              created_at: "desc",
            },
          },
        ),
      acceptor: props.acceptor,
    });
  };

  const findSession = async (props: {
    hackathon: IAutoBeHackathon;
    participant: IAutobeHackathonParticipant;
    id: string;
    acceptor: WebSocketAcceptor<
      IAutoBeHackathonSession.IHeader,
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
      IAutoBeHackathonSession.IHeader,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >;
  }): Promise<IAutoBeHackathon> => {
    try {
      return await AutoBeHackathonProvider.get(props.hackathonCode);
    } catch (error) {
      await props.acceptor.reject(1006, "Hackathon not found");
      throw error;
    }
  };

  const authorize = async (props: {
    hackathon: IAutoBeHackathon;
    acceptor: WebSocketAcceptor<
      IAutoBeHackathonSession.IHeader,
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
