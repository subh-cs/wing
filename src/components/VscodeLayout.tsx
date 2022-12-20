import { useEffect, useRef, useState } from "react";

import { LogEntry, LogType } from "../../electron/main/consoleLogger.js";
import { ExplorerItem } from "../../electron/main/router/app.js";
import { Breadcrumbs } from "../design-system/Breadcrumbs.js";
import { Error } from "../design-system/Error.js";
import { LeftResizableWidget } from "../design-system/LeftResizableWidget.js";
import { Loader } from "../design-system/Loader.js";
import { RightResizableWidget } from "../design-system/RightResizableWidget.js";
import { ScrollableArea } from "../design-system/ScrollableArea.js";
import { TopResizableWidget } from "../design-system/TopResizableWidget.js";
import {
  SELECTED_TREE_ITEM_CSS_ID,
  TreeMenu,
  TreeMenuItem,
} from "../design-system/TreeMenu.js";
import { ResourceIcon } from "../stories/utils.js";
import { trpc } from "../utils/trpc.js";
import { useTreeMenuItems } from "../utils/useTreeMenuItems.js";

import { HeaderBanner } from "./HeaderBanner.js";
import { MetadataPanel } from "./MetadataPanel.js";
import { NewNodeRelationshipsView } from "./NewNodeRelationshipsView.js";
import { NodeLogs } from "./NodeLogs.js";
import NodeLogsFilters from "./NodeLogsFilters.js";
import { ResourceExploreView } from "./ResourceExploreView.js";

export interface VscodeLayoutProps {
  isLoading?: boolean;
  isError?: boolean;
}

const NewIssueUrl = "https://github.com/winglang/wing/issues/new/choose";

export const VscodeLayout = ({ isError, isLoading }: VscodeLayoutProps) => {
  const [showBanner, setShowBanner] = useState(true);

  const treeMenu = useTreeMenuItems();
  const explorerTree = trpc.useQuery(["app.explorerTree"], {
    onSuccess(rootItem) {
      treeMenu.setItems([createTreeMenuItemFromExplorerTreeItem(rootItem)]);
      treeMenu.setCurrent("root");
    },
  });

  useEffect(() => {
    treeMenu.expandAll();
  }, [treeMenu.items]);

  const openExternalUrl = (url: string) => {
    if (window.electronTRPC) {
      window.electronTRPC.ipcRenderer.send("open-external-url", url);
    }
  };

  const childRelationships = trpc.useQuery([
    "app.childRelationships",
    { path: treeMenu.currentItemId },
  ]);

  useEffect(() => {
    document.querySelector(`.${SELECTED_TREE_ITEM_CSS_ID}`)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [treeMenu.currentItemId]);

  const breadcrumbs = trpc.useQuery([
    "app.nodeBreadcrumbs",
    { path: treeMenu.currentItemId },
  ]);

  const currentNode = trpc.useQuery([
    "app.node",
    { path: treeMenu.currentItemId },
  ]);

  const [selectedLogTypeFilters, setSelectedLogTypeFilters] = useState<
    LogType[]
  >(["info", "warn", "error"]);
  const logs = trpc.useQuery([
    "app.logs",
    {
      filters: {
        type: {
          verbose: selectedLogTypeFilters.includes("verbose"),
          info: selectedLogTypeFilters.includes("info"),
          warn: selectedLogTypeFilters.includes("warn"),
          error: selectedLogTypeFilters.includes("error"),
        },
        source: {
          compiler: true,
          console: true,
          simulator: true,
        },
      },
    },
  ]);
  const logsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const div = logsRef.current;
    if (div) {
      div.scrollTo({ top: div.scrollHeight });
    }
  }, [logs.data]);

  const metadata = trpc.useQuery([
    "app.nodeMetadata",
    {
      path: treeMenu.currentItemId,
    },
  ]);

  return (
    <div className="h-full flex flex-col bg-slate-100 select-none">
      {showBanner && (
        <HeaderBanner
          title={
            "Our Console is at an initial stage of development, and we'd love to hear your feedback!"
          }
          buttonLabel={"Open an issue"}
          onClick={() => openExternalUrl(NewIssueUrl)}
          onClose={() => setShowBanner(false)}
        />
      )}

      <div className="flex-1 flex relative">
        {(isLoading || explorerTree.isLoading) && !isError && (
          <Loader text={"Compiling..."} />
        )}
        {(isError || explorerTree.isError) && (
          <Error text={"Oooops :( Compiler error..."} />
        )}
        <RightResizableWidget className="h-full flex flex-col w-60 min-w-[20rem] min-h-[15rem] border-r border-slate-200">
          <TreeMenu
            title="Explorer"
            items={treeMenu.items}
            selectedItemId={treeMenu.currentItemId}
            openMenuItemIds={treeMenu.openItemIds}
            onItemClick={(item) => {
              treeMenu.setCurrent(item.id);
            }}
            onItemToggle={(item) => {
              treeMenu.toggle(item.id);
            }}
            onExpandAll={() => treeMenu.expandAll()}
            onCollapseAll={() => treeMenu.collapseAll()}
          />
        </RightResizableWidget>

        <div className="flex-1 flex flex-col">
          <div className="flex-0 flex-shrink-0 w-full h-9 relative bg-white border-b">
            {breadcrumbs.data && (
              <ScrollableArea
                overflowX
                scrollbarSize="xs"
                className="flex flex-col justify-around overflow-y-hidden"
              >
                <Breadcrumbs
                  breadcrumbs={breadcrumbs.data.map((node) => ({
                    id: node.path,
                    name: node.id,
                    icon: (
                      <ResourceIcon
                        resourceType={node.type}
                        className="w-4 h-4"
                      />
                    ),
                  }))}
                  onBreadcrumbClicked={(breadcrumb) => {
                    treeMenu.expand(breadcrumb.id);
                    treeMenu.setCurrent(breadcrumb.id);
                  }}
                />
              </ScrollableArea>
            )}
          </div>

          <div className="flex-1 flex">
            <div className="flex-1 relative">
              <ScrollableArea overflowX className="flex flex-col bg-white">
                {currentNode.data?.type === "constructs.Construct" &&
                  childRelationships.data && (
                    <div className="flex-1 bg-white min-w-[40rem] p-4 mx-auto flex flex-col gap-y-2">
                      {childRelationships.data.map((child, index) => (
                        <NewNodeRelationshipsView
                          key={child.node.id}
                          node={{
                            id: child.node.id,
                            path: child.node.path,
                            icon: (
                              <ResourceIcon
                                resourceType={child.node.type}
                                className="w-4 h-4"
                              />
                            ),
                          }}
                          inbound={child.inbound.map((relationship) => ({
                            id: relationship.node.id,
                            path: relationship.node.path,
                            icon: (
                              <ResourceIcon
                                resourceType={relationship.node.type}
                                className="w-4 h-4"
                              />
                            ),
                            relationshipName: relationship.relationshipType,
                          }))}
                          outbound={child.outbound.map((relationship) => ({
                            id: relationship.node.id,
                            path: relationship.node.path,
                            icon: (
                              <ResourceIcon
                                resourceType={relationship.node.type}
                                className="w-4 h-4"
                              />
                            ),
                            relationshipName: relationship.relationshipType,
                          }))}
                          onClick={(path) => {
                            treeMenu.expand(path);
                            treeMenu.setCurrent(path);
                          }}
                        />
                      ))}
                    </div>
                  )}

                {currentNode.data?.type?.startsWith("wingsdk.cloud") && (
                  <ResourceExploreView
                    resourceType={currentNode.data.type}
                    resourcePath={currentNode.data.path}
                  />
                )}
              </ScrollableArea>
            </div>

            <LeftResizableWidget className="bg-white flex-shrink min-w-[20rem] border-l z-10">
              {metadata.data && (
                <MetadataPanel
                  node={metadata.data.node}
                  inbound={metadata.data.inbound}
                  outbound={metadata.data.outbound}
                  onConnectionNodeClick={(path) => {
                    treeMenu.expand(path);
                    treeMenu.setCurrent(path);
                  }}
                />
              )}
            </LeftResizableWidget>
          </div>
        </div>
      </div>

      <TopResizableWidget className="border-t bg-white min-h-[5rem] h-[12rem] pt-1.5">
        <div className="relative h-full flex flex-col gap-2">
          <div className="flex px-4">
            <NodeLogsFilters
              selected={selectedLogTypeFilters}
              onChange={(types) => setSelectedLogTypeFilters(types)}
            />
          </div>

          <div className="relative h-full">
            <ScrollableArea ref={logsRef} overflowY className="px-4 pb-1.5">
              <NodeLogs logs={logs.data ?? []} />
            </ScrollableArea>
          </div>
        </div>
      </TopResizableWidget>
    </div>
  );
};

function createTreeMenuItemFromExplorerTreeItem(
  item: ExplorerItem,
): TreeMenuItem {
  return {
    id: item.id,
    label: item.label,
    icon: item.type ? (
      <ResourceIcon
        resourceType={item.type}
        className="w-4 h-4"
        darkenOnGroupHover
      />
    ) : undefined,
    children: item.childItems?.map((item) =>
      createTreeMenuItemFromExplorerTreeItem(item),
    ),
  };
}
