import {
  AutoBeAnalyzeReviewEvent,
  AutoBeAnalyzeStartEvent,
  AutoBeAnalyzeWriteEvent,
  AutoBeEvent,
  IAutoBeRpcService,
} from "@autobe/interface";
import { Container } from "@mui/material";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { sleep_for } from "tstl";
import { v4 } from "uuid";

import { AutoBePlaygroundEventMovie } from "./movies/events/AutoBePlaygroundEventMovie";
import { IAutoBePlaygroundEventGroup } from "./structures/IAutoBePlaygroundEventGroup";

const service: IAutoBeRpcService = {
  conversate: async () => [],
  getFiles: async () => ({}),
  getHistories: async () => [],
  getTokenUsage: async () => null!,
};

const base = () => ({
  id: v4(),
  created_at: new Date().toISOString(),
  step: 0,
});

const ExperimentalApplication = () => {
  const [eventGroups, setEventGroups] = useState<IAutoBePlaygroundEventGroup[]>(
    [],
  );
  const create = async <Event extends AutoBeEvent>(
    event: Event,
  ): Promise<IAutoBePlaygroundEventGroup<Event>> => {
    const group: IAutoBePlaygroundEventGroup<Event> = {
      type: event.type,
      events: [event],
    };
    eventGroups.push(group);
    setEventGroups([...eventGroups]);
    await sleep_for(1_000);
    return group;
  };
  const accumulate = async <Event extends AutoBeEvent>(
    group: IAutoBePlaygroundEventGroup<Event>,
    event: Event,
  ): Promise<void> => {
    group.events.push(event);
    setEventGroups([...eventGroups]);
    await sleep_for(1_000);
  };
  useEffect(() => {
    const scheduler = async () => {
      //----
      // ANALYZE
      //----
      // start
      await create({
        ...base(),
        type: "analyzeStart",
        reason: "User requested to analyze the requirement.",
      } satisfies AutoBeAnalyzeStartEvent);

      // write
      const analyzeWriteGroup = await create({
        ...base(),
        type: "analyzeWrite",
        files: {},
      } satisfies AutoBeAnalyzeWriteEvent);
      for (let i: number = 0; i < 5; ++i)
        await accumulate(analyzeWriteGroup, {
          ...base(),
          type: "analyzeWrite",
          files: {},
        } satisfies AutoBeAnalyzeWriteEvent);

      // review
      const analyzeReviewGroup = await create({
        ...base(),
        type: "analyzeReview",
        review: "",
      } satisfies AutoBeAnalyzeReviewEvent);
      for (let i: number = 0; i < 3; ++i)
        await accumulate(analyzeReviewGroup, {
          ...base(),
          type: "analyzeReview",
          review: "",
        } satisfies AutoBeAnalyzeReviewEvent);

      // complete
    };
    scheduler().catch(() => {});
  }, []);
  return (
    <Container
      style={{
        width: "100%",
        minHeight: "100%",
        backgroundColor: "lightblue",
        margin: 0,
      }}
    >
      {eventGroups.map((e, i) => (
        <AutoBePlaygroundEventMovie
          key={i}
          service={service}
          events={e.events}
        />
      ))}
    </Container>
  );
};

createRoot(window.document.getElementById("root")!).render(
  <ExperimentalApplication />,
);
