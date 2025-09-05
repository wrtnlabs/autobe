import { Suspense } from "react";

import {
  AutoBeChatSidebar,
  IAutoBeChatSidebarProps,
} from "./AutoBeChatSidebar";
import { AutoBeChatSidebarSkeleton } from "./AutoBeChatSidebarSkeleton";

/** Props for AutoBeChatSidebarWithSuspense component */
export interface IAutoBeChatSidebarWithSuspenseProps
  extends Omit<IAutoBeChatSidebarProps, "getSessionList"> {
  /** Number of skeleton items to show while loading */
  skeletonCount?: number;
}

/**
 * Chat sidebar with built-in Suspense boundary and skeleton loading state
 *
 * This component automatically handles loading states by wrapping the main
 * sidebar component with Suspense and providing a matching skeleton UI. Perfect
 * for when the storageStrategy.getSessionList() returns a Promise.
 *
 * @example
 *   ```tsx
 *   <AutoBeChatSidebarWithSuspense
 *     storageStrategy={myStorageStrategy}
 *     isOpen={sidebarOpen}
 *     onToggle={() => setSidebarOpen(!sidebarOpen)}
 *     activeConversationId="session-123"
 *     onConversationSelect={(id) => console.log('Selected:', id)}
 *     onDeleteConversation={(id) => console.log('Delete:', id)}
 *     skeletonCount={6}
 *   />
 *   ```;
 */
export const AutoBeChatSidebarWithSuspense = (
  props: IAutoBeChatSidebarWithSuspenseProps,
) => {
  const { skeletonCount = 5, ...sidebarProps } = props;

  return (
    <Suspense
      fallback={
        <AutoBeChatSidebarSkeleton
          isCollapsed={props.isCollapsed}
          onToggle={props.onToggle}
          className={props.className}
          skeletonCount={skeletonCount}
        />
      }
    >
      <AutoBeChatSidebar
        {...sidebarProps}
        getSessionList={props.storageStrategy.getSessionList()}
      />
    </Suspense>
  );
};

export default AutoBeChatSidebarWithSuspense;
