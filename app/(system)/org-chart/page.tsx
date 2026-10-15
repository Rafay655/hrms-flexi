"use client";

import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  type CSSProperties,
} from "react";
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
  type LucideIcon,
} from "lucide-react";

// ─── Layout constants ─────────────────────────────────────────────────────────
const NODE_W = 248;
const NODE_H = 134;
const H_GAP = 28;
const V_GAP = 68;

// ─── Types ────────────────────────────────────────────────────────────────────
type NodeType = "company" | "division" | "department" | "designation";

type NodeDetails = {
  code: string;
  head: string;
  employees: number;
  location: string;
};

type BaseNode = {
  id: string;
  name: string;
  type: NodeType;
  details: NodeDetails;
};

type OrgNode = BaseNode & {
  children?: OrgNode[];
};

type LayoutNode = BaseNode & {
  cx: number;
  cy: number;
  _sw: number;
  _origChildren?: OrgNode[];
  children: LayoutNode[];
};

type Edge = {
  from: LayoutNode;
  to: LayoutNode;
};

type PanState = {
  x: number;
  y: number;
};
type TypeMetaItem = {
  label: string;
  color: string;
  icon: LucideIcon;
  addChildLabel?: string;
};

// ─── Type config ──────────────────────────────────────────────────────────────
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

// ─── Raw data ─────────────────────────────────────────────────────────────────
const RAW_DATA: OrgNode = {
  id: "company-1",
  name: "ABC Holdings Pvt Ltd",
  type: "company",
  details: {
    code: "COMP-001",
    head: "Bilal Khan",
    employees: 1240,
    location: "Lahore, Pakistan",
  },
  children: [
    {
      id: "division-tech",
      name: "Technology Division",
      type: "division",
      details: {
        code: "DIV-TECH",
        head: "Ali Raza",
        employees: 320,
        location: "Lahore",
      },
      children: [
        {
          id: "department-platform",
          name: "Platform Department",
          type: "department",
          details: {
            code: "DEP-PLAT",
            head: "Ahmed Usman",
            employees: 96,
            location: "Lahore",
          },
          children: [
            {
              id: "des-em",
              name: "Engineering Manager",
              type: "designation",
              details: {
                code: "DES-EM",
                head: "Ahmed Usman",
                employees: 1,
                location: "Lahore",
              },
            },
            {
              id: "des-sfe",
              name: "Senior Frontend Engineer",
              type: "designation",
              details: {
                code: "DES-SFE",
                head: "Sara Malik",
                employees: 8,
                location: "Lahore",
              },
            },
            {
              id: "des-be",
              name: "Backend Engineer",
              type: "designation",
              details: {
                code: "DES-BE",
                head: "Hamza Tariq",
                employees: 12,
                location: "Lahore",
              },
            },
          ],
        },
        {
          id: "department-product",
          name: "Product Department",
          type: "department",
          details: {
            code: "DEP-PROD",
            head: "Maham Noor",
            employees: 42,
            location: "Islamabad",
          },
          children: [
            {
              id: "des-pm",
              name: "Product Manager",
              type: "designation",
              details: {
                code: "DES-PM",
                head: "Maham Noor",
                employees: 3,
                location: "Islamabad",
              },
            },
            {
              id: "des-ba",
              name: "Business Analyst",
              type: "designation",
              details: {
                code: "DES-BA",
                head: "Saad Ali",
                employees: 5,
                location: "Islamabad",
              },
            },
          ],
        },
      ],
    },
    {
      id: "division-operations",
      name: "Operations Division",
      type: "division",
      details: {
        code: "DIV-OPS",
        head: "Farah Imran",
        employees: 260,
        location: "Karachi",
      },
      children: [
        {
          id: "department-finance",
          name: "Finance Department",
          type: "department",
          details: {
            code: "DEP-FIN",
            head: "Kashif Hussain",
            employees: 28,
            location: "Karachi",
          },
          children: [
            {
              id: "des-fm",
              name: "Finance Manager",
              type: "designation",
              details: {
                code: "DES-FM",
                head: "Kashif Hussain",
                employees: 1,
                location: "Karachi",
              },
            },
            {
              id: "des-acc",
              name: "Accountant",
              type: "designation",
              details: {
                code: "DES-ACC",
                head: "Areeba Khan",
                employees: 6,
                location: "Karachi",
              },
            },
          ],
        },
        {
          id: "department-hr",
          name: "HR Department",
          type: "department",
          details: {
            code: "DEP-HR",
            head: "Sania Waheed",
            employees: 22,
            location: "Karachi",
          },
          children: [
            {
              id: "des-hrm",
              name: "HR Manager",
              type: "designation",
              details: {
                code: "DES-HRM",
                head: "Sania Waheed",
                employees: 1,
                location: "Karachi",
              },
            },
            {
              id: "des-ta",
              name: "Talent Acquisition Specialist",
              type: "designation",
              details: {
                code: "DES-TA",
                head: "Aiman Javed",
                employees: 4,
                location: "Karachi",
              },
            },
          ],
        },
      ],
    },
  ],
};

// ─── Layout engine ────────────────────────────────────────────────────────────
function getSubtreeWidth(node: OrgNode, collapsed: Set<string>): number {
  if (collapsed.has(node.id) || !node.children?.length) return NODE_W + H_GAP;

  return node.children.reduce(
    (sum, child) => sum + getSubtreeWidth(child, collapsed),
    0
  );
}

function layoutTree(
  node: OrgNode,
  collapsed: Set<string>,
  depth = 0,
  leftEdge = 0
): LayoutNode {
  const sw = getSubtreeWidth(node, collapsed);
  const cx = leftEdge + sw / 2;
  const cy = depth * (NODE_H + V_GAP);

  const laid: LayoutNode = {
    ...node,
    cx,
    cy,
    _sw: sw,
    _origChildren: node.children,
    children: [],
  };

  if (!collapsed.has(node.id) && node.children?.length) {
    let x = leftEdge;

    laid.children = node.children.map((child) => {
      const childLayout = layoutTree(child, collapsed, depth + 1, x);
      x += getSubtreeWidth(child, collapsed);
      return childLayout;
    });
  }

  return laid;
}

function flattenNodes(tree: LayoutNode): LayoutNode[] {
  const list: LayoutNode[] = [];

  const walk = (node: LayoutNode) => {
    list.push(node);
    node.children.forEach(walk);
  };

  walk(tree);
  return list;
}

function flattenEdges(tree: LayoutNode): Edge[] {
  const list: Edge[] = [];

  const walk = (node: LayoutNode) => {
    node.children.forEach((child) => {
      list.push({ from: node, to: child });
      walk(child);
    });
  };

  walk(tree);
  return list;
}

function getBBox(tree: LayoutNode) {
  const nodes = flattenNodes(tree);
  const minX = Math.min(...nodes.map((node) => node.cx - NODE_W / 2));
  const maxX = Math.max(...nodes.map((node) => node.cx + NODE_W / 2));
  const maxY = Math.max(...nodes.map((node) => node.cy + NODE_H));

  return {
    minX,
    maxX,
    width: maxX - minX,
    height: maxY,
  };
}

// ─── Components ───────────────────────────────────────────────────────────────
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
        style={{ width: 8, height: 8, borderRadius: "50%", background: color }}
      />
      <Icon size={12} color={color} />
      {label}
    </span>
  );
}

function EdgePath({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  const midY = (y1 + y2) / 2;

  return (
    <path
      d={`M${x1},${y1} L${x1},${midY} L${x2},${midY} L${x2},${y2}`}
      fill="none"
      stroke="#cbd5e1"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  );
}

type NodeCardProps = {
  node: LayoutNode;
  isMenuOpen: boolean;
  onToggleMenu: (id: string | null) => void;
  onAction: (action: string, node: LayoutNode) => void;
  onToggleCollapse: (id: string) => void;
  search: string;
  isCollapsed: boolean;
};

function NodeCard({
  node,
  isMenuOpen,
  onToggleMenu,
  onAction,
  onToggleCollapse,
  search,
  isCollapsed,
}: NodeCardProps) {
  const { label, color, icon: Icon, addChildLabel } = TYPE_META[node.type];

  const searchable = [
    node.name,
    node.type,
    node.details?.code,
    node.details?.head,
    node.details?.location,
  ]
    .join(" ")
    .toLowerCase();

  const isHighlighted =
    search.trim().length > 0 &&
    searchable.includes(search.trim().toLowerCase());

  const origChildCount = node._origChildren?.length ?? 0;

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
    ...(origChildCount > 0
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
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        width: NODE_W,
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
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleMenu(node.id);
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

      {isMenuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
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
              onClick={(e) => {
                e.stopPropagation();
                if (action === "toggle") {
                  onToggleCollapse(node.id);
                  onToggleMenu(null);
                } else {
                  onAction(action, node);
                  onToggleMenu(null);
                }
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
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <MenuIcon size={14} />
              &nbsp;{lbl}
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
        {node.name}
      </div>

      <div
        style={{
          fontSize: 11,
          color: "#64748b",
          lineHeight: 1.5,
          marginBottom: 6,
        }}
      >
        {node.details?.head} · {node.details?.location}
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
          {node.details?.code}
        </span>

        <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>
          {node.details?.employees} employees
        </span>

        {isCollapsed && origChildCount > 0 && (
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
            +{origChildCount}
          </span>
        )}
      </div>

      {origChildCount > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(node.id);
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
          {isCollapsed
            ? `Expand ${origChildCount} children`
            : "Collapse children"}
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Page() {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [lastAction, setLastAction] = useState<string>("No action yet");
  const [zoom, setZoom] = useState<number>(0.82);
  const [pan, setPan] = useState<PanState>({ x: 0, y: 40 });

  const isDragging = useRef<boolean>(false);
  const lastMouse = useRef<PanState>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const tree = useMemo(() => layoutTree(RAW_DATA, collapsed), [collapsed]);
  const nodes = useMemo(() => flattenNodes(tree), [tree]);
  const edges = useMemo(() => flattenEdges(tree), [tree]);
  const bbox = useMemo(() => getBBox(tree), [tree]);

  const CANVAS_W = bbox.width + H_GAP * 4;
  const CANVAS_H = bbox.height + V_GAP * 2;
  const OX = -bbox.minX + H_GAP * 2;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    setPan({
      x: el.clientWidth / 2 - (CANVAS_W * 0.82) / 2,
      y: 40,
    });
  }, [CANVAS_W]);

  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleAction = useCallback((action: string, node: LayoutNode) => {
    setOpenMenuId(null);
    setLastAction(`${action} → ${node.name}`);
  }, []);

  const resetView = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    setZoom(0.82);
    setPan({
      x: el.clientWidth / 2 - (CANVAS_W * 0.82) / 2,
      y: 40,
    });
  }, [CANVAS_W]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.style.cursor = "grabbing";
    },
    []
  );

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;

    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };

    setPan((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = false;
    e.currentTarget.style.cursor = "grab";
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;

    setZoom((prev) => Math.min(2, Math.max(0.3, +(prev * factor).toFixed(3))));
  }, []);

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
              Company → Divisions → Departments → Designations
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
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                color="#94a3b8"
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, head, code…"
                style={{
                  width: 260,
                  height: 38,
                  padding: "0 12px 0 30px",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  outline: "none",
                  fontSize: 13,
                  background: "#f8fafc",
                  color: "#0f172a",
                }}
              />
            </div>

            <div
              style={{
                height: 38,
                display: "flex",
                alignItems: "center",
                padding: "0 13px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                fontSize: 12,
                color: "#64748b",
                gap: 4,
                whiteSpace: "nowrap",
              }}
            >
              Last:&nbsp;
              <b style={{ color: "#0f172a", fontWeight: 700 }}>
                {lastAction}
              </b>
            </div>

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
            Drag empty space to pan · Scroll to zoom · ⋮ for actions
          </span>
        </div>

        <div
          ref={containerRef}
          onClick={() => setOpenMenuId(null)}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
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
          <div
            style={{
              position: "absolute",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              width: CANVAS_W,
              height: CANVAS_H,
            }}
          >
            <svg
              width={CANVAS_W}
              height={CANVAS_H}
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                overflow: "visible",
              }}
            >
              {edges.map(({ from, to }) => (
                <EdgePath
                  key={`${from.id}-${to.id}`}
                  x1={from.cx + OX}
                  y1={from.cy + NODE_H}
                  x2={to.cx + OX}
                  y2={to.cy}
                />
              ))}
            </svg>

            {nodes.map((node) => (
              <div
                key={node.id}
                style={{
                  position: "absolute",
                  left: node.cx + OX - NODE_W / 2,
                  top: node.cy,
                  zIndex: openMenuId === node.id ? 50 : 1,
                }}
              >
                <NodeCard
                  node={node}
                  isMenuOpen={openMenuId === node.id}
                  onToggleMenu={(id) =>
                    setOpenMenuId((prev) => (prev === id ? null : id))
                  }
                  onAction={handleAction}
                  onToggleCollapse={handleToggleCollapse}
                  search={search}
                  isCollapsed={collapsed.has(node.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}