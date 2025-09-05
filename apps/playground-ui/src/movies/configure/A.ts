import { IAutoBePlaygroundHeader, IAutoBeRpcService } from "@autobe/interface";
import { AutoBeListener, IAutoBeAgentSessionStorageStrategy } from "@autobe/ui";
import { ILlmSchema } from "@samchon/openapi";

interface IProps {
  headers: IAutoBePlaygroundHeader<ILlmSchema.Model>;
  listener: AutoBeListener;
  connect: () => Promise<IAutoBeRpcService>;
  sessionId?: string;
  storageStrategy: IAutoBeAgentSessionStorageStrategy;
}

export const getAutoBeAgentSession = async (props: IProps) => {
  const service = await props.connect();
  const id = props.sessionId ?? globalThis.crypto.randomUUID();

  props.listener.on(async (events) => {
    await props.storageStrategy.appendEvent({
      id,
      events,
    });
    await props.storageStrategy.setTokenUsage({
      id,
      tokenUsage: await service.getTokenUsage(),
    });
  });

  return {
    service: {
      getFiles: service.getFiles,
      getHistories: service.getHistories,
      getTokenUsage: service.getTokenUsage,
      conversate: async (content) => {
        const result = await service.conversate(content);
        await props.storageStrategy.appendHistory({
          id,
          history: result,
        });
        return result;
      },
    } satisfies IAutoBeRpcService,
    id,
    listener: props.listener,
    headers: props.headers,
  };
};
