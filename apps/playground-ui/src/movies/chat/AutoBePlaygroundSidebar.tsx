import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn, formatTokens } from "@/utils";
import {
  IAutoBePlaygroundSession,
  IAutoBePlaygroundVendor,
  IAutoBePlaygroundVendorModel,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import {
  IAutoBeAgentSessionStorageStrategy,
  useAutoBeAgentSessionList,
  useSearchParams,
} from "@autobe/ui";
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { getConnection } from "../../utils/connection";

export const AutoBePlaygroundSidebar = (
  props: AutoBePlaygroundSidebar.IProps,
) => {
  const { sessionList, refreshSessionList } = useAutoBeAgentSessionList();
  const { searchParams, setSearchParams } = useSearchParams();
  const activeSessionId = searchParams.get("session-id") ?? null;

  const [sessions, setSessions] = useState<
    IAutoBePlaygroundSession.ISummary[] | null
  >(null);
  const [filterVendorId, setFilterVendorId] = useState<string | null>(null);
  const [filterModel, setFilterModel] = useState<string | null>(null);
  const [vendors, setVendors] = useState<IAutoBePlaygroundVendor[]>([]);
  const [vendorModels, setVendorModels] = useState<
    IAutoBePlaygroundVendorModel[]
  >([]);

  useEffect(() => {
    pApi.functional.autobe.playground.vendors
      .index(getConnection(), {})
      .then((page) => setVendors(page.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!filterVendorId) {
      setVendorModels([]);
      return;
    }
    pApi.functional.autobe.playground.vendors.models
      .index(getConnection(), filterVendorId)
      .then(setVendorModels)
      .catch(console.error);
  }, [filterVendorId]);

  const loadSessions = useCallback(async () => {
    try {
      const page = await pApi.functional.autobe.playground.sessions.index(
        getConnection(),
        {
          limit: 100,
          vendor_id: filterVendorId ?? undefined,
          model: filterModel || undefined,
        },
      );
      setSessions(page.data);
    } catch (err) {
      console.error("Failed to load sessions:", err);
      setSessions([]);
    }
  }, [filterVendorId, filterModel]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions, sessionList]);

  const handleNewChat = () => {
    setSearchParams((sp) => {
      const next = new URLSearchParams(sp);
      next.delete("session-id");
      return next;
    });
  };

  const handleSessionSelect = (id: string) => {
    setSearchParams((sp) => {
      const next = new URLSearchParams(sp);
      next.set("session-id", id);
      return next;
    });
  };

  const handleSessionDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await props.storageStrategy.deleteSession({ id });
    await loadSessions();
    refreshSessionList();
  };

  const width = props.isCollapsed ? 48 : 300;

  return (
    <div
      className={cn(
        "h-full flex flex-col border-r bg-sidebar-background transition-all duration-200 overflow-hidden",
      )}
      style={{ width, minWidth: width }}
    >
      {/* Toggle + New Chat */}
      <div
        className={cn(
          "flex items-center p-1 gap-1",
          props.isCollapsed ? "justify-center" : "justify-between",
        )}
      >
        {!props.isCollapsed && (
          <Button
            variant="outline"
            size="sm"
            className="ml-1 text-xs"
            onClick={handleNewChat}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Chat
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={props.onToggle}
        >
          {props.isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {!props.isCollapsed && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <Separator />

          {/* Filters */}
          <div className="px-3 py-2 space-y-1.5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Filters
            </p>
            <Select
              value={filterVendorId ?? "__all__"}
              onValueChange={(v) =>
                setFilterVendorId(v === "__all__" ? null : v)
              }
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Vendors</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id} className="text-xs">
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter by model..."
              list="sidebar-model-filter"
              className="h-7 text-xs"
              value={filterModel ?? ""}
              onChange={(e) => setFilterModel(e.target.value || null)}
            />
            <datalist id="sidebar-model-filter">
              {vendorModels.map((m) => (
                <option key={m.model} value={m.model} />
              ))}
            </datalist>
          </div>

          <Separator />

          {/* Sessions */}
          <div className="px-3 pt-2 pb-1">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Sessions
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-1.5 pb-2">
              {sessions === null ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-6">
                  No sessions yet
                </p>
              ) : (
                <div className="space-y-0.5">
                  {sessions.map((s) => {
                    const isActive = s.id === activeSessionId;
                    const title = s.title ?? s.model;
                    const date = new Date(s.created_at);

                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSessionSelect(s.id)}
                        className={cn(
                          "group w-full flex items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isActive && "bg-primary/10 font-semibold",
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-[0.82rem] truncate",
                              isActive ? "font-semibold" : "font-normal",
                            )}
                          >
                            {title}
                          </p>
                          <p className="text-[0.68rem] text-muted-foreground truncate mt-0.5">
                            {s.vendor?.name ?? "Unknown"} / {s.model}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {date.toLocaleDateString()}
                            </span>
                            {s.phase && (
                              <Badge
                                variant="secondary"
                                className="h-4 text-[0.65rem] px-1.5 capitalize"
                              >
                                {s.phase}
                              </Badge>
                            )}
                            {s.completed_at && (
                              <Badge
                                variant="outline"
                                className="h-4 text-[0.65rem] px-1.5 text-success border-success/30"
                              >
                                Done
                              </Badge>
                            )}
                          </div>
                          {s.token_usage.aggregate.total > 0 && (
                            <p className="text-[0.65rem] text-muted-foreground mt-0.5">
                              {formatTokens(s.token_usage.aggregate.total)} tokens
                              {" (in: "}
                              {formatTokens(s.token_usage.aggregate.input.total)}
                              {s.token_usage.aggregate.input.cached > 0 && (
                                <>
                                  , {formatTokens(s.token_usage.aggregate.input.cached)}{" "}
                                  cached
                                </>
                              )}
                              {" / out: "}
                              {formatTokens(s.token_usage.aggregate.output.total)}
                              {")"}
                            </p>
                          )}
                        </div>
                        {!isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive shrink-0"
                            onClick={(e) => handleSessionDelete(e, s.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export namespace AutoBePlaygroundSidebar {
  export interface IProps {
    storageStrategy: IAutoBeAgentSessionStorageStrategy;
    isCollapsed: boolean;
    onToggle: () => void;
  }
}
