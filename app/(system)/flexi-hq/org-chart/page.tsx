"use client";

import { showApiError } from "@/lib/error-toast";
import {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
  type CSSProperties,
} from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";


import {
  Building2,
  GitBranch,
  Layers3,
  BriefcaseBusiness,
  MoreVertical,
  Eye,
  Pencil,
  Plus,
  Workflow,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Loader2,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";

const Tree = dynamic(() => import("react-d3-tree"), {
  ssr: false,
});

const COMPANY_UUID = "6eca7723-dee6-411b-918a-830915d8605a";

type NodeType = "company" | "division" | "department" | "designation";

type OrgChartApiNode = {
  type: NodeType;
  id: number;
  uuid: string | number;
  name: string;
  code: string | null;
  head_name: string | null;
  location?: string | null;
  employee_count: number;
  children?: OrgChartApiNode[];
};

type OrgChartApiResponse = {
  success: boolean;
  message: string;
  data: OrgChartApiNode;
};

type D3OrgNode = {
  name: string;
  attributes: {
    id: string;
    uuid: string;
    type: NodeType;
    code: string;
    head: string;
    employees: number;
    location: string;
  };
  children?: D3OrgNode[];
};

type TypeMetaItem = {
  label: string;
  color: string;
  icon: LucideIcon;
  addChildLabel?: string;
};

const NODE_W = 248;
const NODE_H = 150;

const TYPE_META: Record<NodeType, TypeMetaItem> = {
  company: {
    label: "Company",
    color: "#2F80ED",
    icon: Building2,
    addChildLabel: "Add Division",
  },
  division: {
    label: "Division",
    color: "#9B51E0",
    icon: GitBranch,
    addChildLabel: "Add Department",
  },
  department: {
    label: "Department",
    color: "#219653",
    icon: Layers3,
    addChildLabel: "Add Designation",
  },
  designation: {
    label: "Designation",
    color: "#F2994A",
    icon: BriefcaseBusiness,
  },
};

function toD3TreeData(node: OrgChartApiNode): D3OrgNode {
  return {
    name: node.name,
    attributes: {
      id: String(node.id),
      uuid: String(node.uuid),
      type: node.type,
      code: node.code ?? "—",
      head: node.head_name ?? "No head assigned",
      employees: node.employee_count ?? 0,
      location: node.location ?? "—",
    },
    children: node.children?.length ? node.children.map(toD3TreeData) : undefined,
  };
}

function LegendPill({ type }: { type: NodeType }) {
  const { label, color, icon: Icon } = TYPE_META[type];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 999,
        border: "1px solid #e2e8f0",
        background: "#fff",
        fontSize: 12,
        fontWeight: 600,
        color: "#334155",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
        }}
      />
      <Icon size={12} color={color} />
      {label}
    </span>
  );
}

type CustomNodeProps = {
  nodeDatum: any;
  toggleNode: () => void;
  search: string;
  openMenuId: string | null;
  setOpenMenuId: (value: string | null) => void;
  onAction: (action: string, node: any) => void;
};

function CustomNodeCard({
  nodeDatum,
  toggleNode,
  search,
  openMenuId,
  setOpenMenuId,
  onAction,
}: CustomNodeProps) {
  const attrs = nodeDatum.attributes ?? {};
  const type = (attrs.type ?? "company") as NodeType;
  const id = attrs.uuid ?? attrs.id ?? nodeDatum.name;
  const { label, color, icon: Icon, addChildLabel } = TYPE_META[type];

  const hasChildren =
    Boolean(nodeDatum.children?.length) || Boolean(nodeDatum._children?.length);

  const isCollapsed =
    !Boolean(nodeDatum.children?.length) && Boolean(nodeDatum._children?.length);

  const searchable = [
    nodeDatum.name,
    type,
    attrs.code,
    attrs.head,
    attrs.location,
  ]
    .join(" ")
    .toLowerCase();

  const isHighlighted =
    search.trim().length > 0 &&
    searchable.includes(search.trim().toLowerCase());

  const childCount =
    nodeDatum.children?.length ?? nodeDatum._children?.length ?? 0;

  const menuItems: Array<{
    lbl: string;
    Icon: LucideIcon;
    action: string;
  }> = [
    { lbl: "View", Icon: Eye, action: "view" },
    { lbl: "Edit", Icon: Pencil, action: "edit" },
    ...(addChildLabel
      ? [{ lbl: addChildLabel, Icon: Plus, action: addChildLabel }]
      : []),
    ...(hasChildren
      ? [
          {
            lbl: isCollapsed ? "Expand Children" : "Collapse Children",
            Icon: Workflow,
            action: "toggle",
          },
        ]
      : []),
  ];

  return (
    <g>
      <foreignObject
        width={NODE_W}
        height={NODE_H + 80}
        x={-NODE_W / 2}
        y={-NODE_H / 2}
      >
        <div
          style={{
            width: NODE_W,
            minHeight: NODE_H,
            background: "#fff",
            border: isHighlighted ? `2px solid ${color}` : "1px solid #e2e8f0",
            borderTop: `3px solid ${color}`,
            borderRadius: 10,
            padding: "13px 12px 11px",
            boxSizing: "border-box",
            boxShadow: isHighlighted
              ? `0 0 0 3px ${color}25, 0 6px 20px rgba(0,0,0,0.10)`
              : "0 3px 14px rgba(15,23,42,0.08)",
            position: "relative",
            fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={(event) => {
              event.stopPropagation();
              setOpenMenuId(openMenuId === id ? null : id);
            }}
            style={{
              position: "absolute",
              right: 8,
              top: 8,
              width: 26,
              height: 26,
              borderRadius: 7,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <MoreVertical size={13} color="#64748b" />
          </button>

          {openMenuId === id && (
            <div
              onClick={(event) => event.stopPropagation()}
              style={{
                position: "absolute",
                top: 38,
                right: 8,
                width: 190,
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 6,
                boxShadow: "0 16px 36px rgba(15,23,42,0.16)",
                zIndex: 999,
              }}
            >
              {menuItems.map(({ lbl, Icon: MenuIcon, action }) => (
                <button
                  key={action}
                  onClick={(event) => {
                    event.stopPropagation();

                    if (action === "toggle") {
                      toggleNode();
                    } else {
                      onAction(action, nodeDatum);
                    }

                    setOpenMenuId(null);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 11px",
                    border: "none",
                    background: "transparent",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    color: "#334155",
                    textAlign: "left",
                  }}
                  onMouseOver={(event) => {
                    event.currentTarget.style.background = "#f1f5f9";
                  }}
                  onMouseOut={(event) => {
                    event.currentTarget.style.background = "transparent";
                  }}
                >
                  <MenuIcon size={14} />
                  {lbl}
                </button>
              ))}
            </div>
          )}

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: `${color}18`,
              borderRadius: 999,
              padding: "3px 9px",
              fontSize: 10,
              fontWeight: 700,
              color,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 7,
              marginRight: 30,
            }}
          >
            <Icon size={10} />
            {label}
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#0f172a",
              lineHeight: 1.35,
              marginBottom: 5,
            }}
          >
            {nodeDatum.name}
          </div>

          <div
            style={{
              fontSize: 11,
              color: "#64748b",
              lineHeight: 1.5,
              marginBottom: 6,
            }}
          >
            {attrs.head} · {attrs.location}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color,
                background: `${color}14`,
                borderRadius: 5,
                padding: "2px 7px",
              }}
            >
              {attrs.code}
            </span>

            <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>
              {attrs.employees} employees
            </span>

            {isCollapsed && childCount > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#fff",
                  background: color,
                  borderRadius: 5,
                  padding: "2px 7px",
                  marginLeft: "auto",
                }}
              >
                +{childCount}
              </span>
            )}
          </div>

          {hasChildren && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                toggleNode();
              }}
              style={{
                marginTop: 10,
                width: "100%",
                height: 30,
                borderRadius: 8,
                border: `1px solid ${color}33`,
                background: isCollapsed ? `${color}12` : "#f8fafc",
                color,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isCollapsed ? `Expand ${childCount} children` : "Collapse children"}
            </button>
          )}
        </div>
      </foreignObject>
    </g>
  );
}

export default function Page() {
  const [orgRoot, setOrgRoot] = useState<OrgChartApiNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [lastAction, setLastAction] = useState("No action yet");
  const [zoom, setZoom] = useState(0.82);
  const [translate, setTranslate] = useState({ x: 600, y: 90 });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const fetchOrgChart = useCallback(async (silent = false) => {
    try {
      if (silent) setIsRefreshing(true);
      else setIsLoading(true);

      const response = await api.get<OrgChartApiResponse>("/org-chart/tree", {
        headers: {
          "X-Company-ID": COMPANY_UUID,
        },
      });

      setOrgRoot(response.data.data);
    } catch (error: any) {
      showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Failed to load organization chart." });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgChart();
  }, [fetchOrgChart]);

  const treeData = useMemo(() => {
    if (!orgRoot) return [];
    return [toD3TreeData(orgRoot)];
  }, [orgRoot]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    setTranslate({
      x: el.clientWidth / 2,
      y: 90,
    });
  }, [orgRoot]);

  const handleAction = useCallback((action: string, node: any) => {
    setLastAction(`${action} → ${node.name}`);
  }, []);

  const resetView = useCallback(() => {
    const el = wrapperRef.current;

    setZoom(0.82);
    setTranslate({
      x: el ? el.clientWidth / 2 : 600,
      y: 90,
    });
  }, []);

  const renderCustomNodeElement = useCallback(
    ({ nodeDatum, toggleNode }: any) => (
      <CustomNodeCard
        nodeDatum={nodeDatum}
        toggleNode={toggleNode}
        search={search}
        openMenuId={openMenuId}
        setOpenMenuId={setOpenMenuId}
        onAction={handleAction}
      />
    ),
    [search, openMenuId, handleAction]
  );

  const controlButtonStyle: CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: 20,
        fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <style>{`
        .rd3t-link {
          stroke: #cbd5e1 !important;
          stroke-width: 1.5px !important;
          fill: none !important;
        }

        .rd3t-node > circle,
        .rd3t-leaf-node > circle {
          display: none;
        }
      `}</style>

      <div
        style={{
          maxWidth: 1600,
          margin: "0 auto",
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 20,
          boxShadow: "0 8px 30px rgba(15,23,42,0.06)",
          padding: 22,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            marginBottom: 16,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Company Organizational Chart
            </h1>

            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
              {orgRoot
                ? `${orgRoot.name} → Divisions → Departments → Designations`
                : "Company → Divisions → Departments → Designations"}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
            }}
          >
          

          

            <button
              title="Refresh"
              onClick={() => fetchOrgChart(true)}
              style={controlButtonStyle}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 size={15} color="#475569" className="animate-spin" />
              ) : (
                <RefreshCw size={15} color="#475569" />
              )}
            </button>

            {[
              {
                Icon: ZoomOut,
                title: "Zoom out",
                onClick: () =>
                  setZoom((prev) => Math.max(0.3, +(prev - 0.1).toFixed(2))),
              },
              {
                Icon: Maximize2,
                title: "Reset",
                onClick: resetView,
              },
              {
                Icon: ZoomIn,
                title: "Zoom in",
                onClick: () =>
                  setZoom((prev) => Math.min(2, +(prev + 0.1).toFixed(2))),
              },
            ].map(({ Icon, title, onClick }) => (
              <button
                key={title}
                title={title}
                onClick={onClick}
                style={controlButtonStyle}
              >
                <Icon size={15} color="#475569" />
              </button>
            ))}

            <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
              {Math.round(zoom * 100)}%
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 14,
            alignItems: "center",
          }}
        >
          {(Object.keys(TYPE_META) as NodeType[]).map((type) => (
            <LegendPill key={type} type={type} />
          ))}

          <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>
            Drag empty space to pan · Scroll to zoom · Click node button to
            collapse · ⋮ for actions
          </span>
        </div>

        <div
          ref={wrapperRef}
          onClick={() => setOpenMenuId(null)}
          style={{
            width: "100%",
            height: 920,
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            overflow: "hidden",
            position: "relative",
            cursor: "grab",
            userSelect: "none",
          }}
        >
          {isLoading ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 10,
                color: "#64748b",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Loader2 size={28} className="animate-spin" />
              Loading organization chart...
            </div>
          ) : treeData.length === 0 ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              No organization chart data found.
            </div>
          ) : (
            <Tree
              data={treeData as any}
              orientation="vertical"
              pathFunc="step"
              collapsible
              draggable
              zoomable
              zoom={zoom}
              translate={translate}
              scaleExtent={{ min: 0.3, max: 2 }}
              nodeSize={{ x: 300, y: 230 }}
              separation={{ siblings: 1.15, nonSiblings: 1.3 }}
              initialDepth={2}
              transitionDuration={280}
              shouldCollapseNeighborNodes={false}
              renderCustomNodeElement={renderCustomNodeElement}
              onUpdate={(state: any) => {
                if (state?.translate) setTranslate(state.translate);
                if (typeof state?.zoom === "number") setZoom(state.zoom);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}