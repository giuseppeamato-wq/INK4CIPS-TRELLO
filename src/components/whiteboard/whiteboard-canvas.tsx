"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { saveBoardWhiteboardAction } from "@/lib/actions/whiteboard"
import type { WhiteboardData, WhiteboardEdge, WhiteboardNode } from "@/lib/queries/whiteboard"
import { cn } from "@/lib/utils"

const CANVAS_WIDTH = 3200
const CANVAS_HEIGHT = 1900
const ZOOM_MIN = 0.4
const ZOOM_MAX = 2
const PALETTE = ["#d9d9d9", "#f2c94c", "#3fc7a6", "#ef5b5b", "#5b8def", "#b28ce0"]

type Shape = WhiteboardNode["shape"]
type Tool = "select" | "add" | "connect"
type SelectedType = "node" | "edge" | null

function newId(prefix: string) {
  return prefix + Date.now() + Math.random().toString(36).slice(2, 7)
}

function randomStickyRotation() {
  return +(Math.random() * 6 - 3).toFixed(1)
}

function luminance(hex: string) {
  const c = hex.replace("#", "")
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

function shapeDefaultSize(shape: Shape) {
  if (shape === "circle") return { w: 60, h: 60 }
  if (shape === "text") return { w: 140, h: 30 }
  if (shape === "sticky") return { w: 150, h: 150 }
  return { w: 170, h: 44 }
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M15 5L8 12L15 19" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function SelectIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M4 3L11 20L13.5 13.5L20 11L4 3Z" fill="#1a1a1a" />
    </svg>
  )
}
function RectIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="6" width="17" height="12" rx="2.5" stroke="#1a1a1a" strokeWidth="1.8" />
    </svg>
  )
}
function PillIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="8" width="19" height="8" rx="4" stroke="#1a1a1a" strokeWidth="1.8" />
    </svg>
  )
}
function CircleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="#1a1a1a" strokeWidth="1.8" />
    </svg>
  )
}
function TextIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M5 5H19M12 5V19" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function StickyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M4 4H20V20H14L4 20V4Z" stroke="#1a1a1a" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 20V14H20" stroke="#1a1a1a" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}
function ConnectIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 19L19 4M19 4H10M19 4V13"
        stroke="#1a1a1a"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function DuplicateIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="8" y="8" width="12" height="12" rx="2" stroke="#1a1a1a" strokeWidth="1.8" />
      <path
        d="M16 8V5.5C16 4.7 15.3 4 14.5 4H5.5C4.7 4 4 4.7 4 5.5V14.5C4 15.3 4.7 16 5.5 16H8"
        stroke="#1a1a1a"
        strokeWidth="1.8"
      />
    </svg>
  )
}
function ZoomOutIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path d="M5 12H19" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
function ZoomInIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path d="M12 5V19M5 12H19" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
function ExportIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3V15M12 15L7 10M12 15L17 10"
        stroke="#1a1a1a"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 18V19.5C4 20.3 4.7 21 5.5 21H18.5C19.3 21 20 20.3 20 19.5V18" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function DeleteIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7H20M9 7V4H15V7M6 7L7 20H17L18 7"
        stroke="#e05555"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ToolButton({
  onClick,
  active,
  title,
  children,
  disabled,
  danger,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg",
        active ? "bg-foreground/10" : danger ? "bg-[#fff5f5]" : "bg-transparent hover:bg-foreground/5",
        disabled ? "cursor-default opacity-35" : "cursor-pointer"
      )}
    >
      {children}
    </button>
  )
}

export function WhiteboardCanvas({
  boardId,
  boardName,
  backHref,
  initialData,
}: {
  boardId: string
  boardName: string
  backHref: string
  initialData: WhiteboardData
}) {
  const [nodes, setNodes] = useState<WhiteboardNode[]>(initialData.nodes)
  const [edges, setEdges] = useState<WhiteboardEdge[]>(initialData.edges)
  const [tool, setTool] = useState<Tool>("select")
  const [pendingShape, setPendingShape] = useState<Shape | null>(null)
  const [color, setColor] = useState(PALETTE[3])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<SelectedType>(null)
  const [connectFrom, setConnectFrom] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)

  const canvasRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const nodeTextRefs = useRef<Record<string, HTMLSpanElement | null>>({})
  // Holds the teardown for whichever drag/resize/pan gesture is currently in
  // flight, so an unmount mid-gesture still removes its window listeners.
  const activeGestureCleanup = useRef<(() => void) | null>(null)

  // Window-level listeners (keydown, and the drag/resize/pan gesture
  // listeners) are bound once per gesture and would otherwise close over
  // stale state, so they read through this ref instead.
  const latest = useRef({ selectedId, selectedType, editingId, tool, zoom, nodes, edges })
  useLayoutEffect(() => {
    latest.current = { selectedId, selectedType, editingId, tool, zoom, nodes, edges }
  }, [selectedId, selectedType, editingId, tool, zoom, nodes, edges])

  useEffect(() => {
    return () => activeGestureCleanup.current?.()
  }, [])

  const persist = useCallback(
    (nextNodes: WhiteboardNode[], nextEdges: WhiteboardEdge[]) => {
      saveBoardWhiteboardAction(boardId, { nodes: nextNodes, edges: nextEdges }).catch((err) => {
        toast.error(err instanceof Error ? err.message : "Errore nel salvataggio della lavagna")
      })
    },
    [boardId]
  )

  const zoomIn = useCallback(() => setZoom((z) => Math.min(ZOOM_MAX, +(z + 0.1).toFixed(2))), [])
  const zoomOut = useCallback(() => setZoom((z) => Math.max(ZOOM_MIN, +(z - 0.1).toFixed(2))), [])
  const zoomReset = useCallback(() => setZoom(1), [])

  const deleteSelected = useCallback(() => {
    const { selectedId: id, selectedType: type } = latest.current
    if (!id) return
    if (type === "node") {
      const nextNodes = nodes.filter((n) => n.id !== id)
      const nextEdges = edges.filter((e) => e.fromId !== id && e.toId !== id)
      setNodes(nextNodes)
      setEdges(nextEdges)
      persist(nextNodes, nextEdges)
    } else {
      const nextEdges = edges.filter((e) => e.id !== id)
      setEdges(nextEdges)
      persist(nodes, nextEdges)
    }
    setSelectedId(null)
    setSelectedType(null)
  }, [nodes, edges, persist])

  const duplicateSelected = useCallback(() => {
    const { selectedId: id, selectedType: type } = latest.current
    if (type !== "node" || !id) return
    const orig = nodes.find((n) => n.id === id)
    if (!orig) return
    const copy: WhiteboardNode = { ...orig, id: newId("n"), x: orig.x + 24, y: orig.y + 24 }
    const nextNodes = [...nodes, copy]
    setNodes(nextNodes)
    setSelectedId(copy.id)
    setSelectedType("node")
    persist(nextNodes, edges)
  }, [nodes, edges, persist])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement && document.activeElement.tagName) || ""
      const { selectedId: sid, editingId: eid, selectedType: st } = latest.current
      if ((e.key === "Delete" || e.key === "Backspace") && sid && !eid && tag !== "SPAN") {
        e.preventDefault()
        deleteSelected()
        return
      }
      if ((e.key === "+" || e.key === "=") && tag !== "SPAN") {
        e.preventDefault()
        zoomIn()
        return
      }
      if (e.key === "-" && tag !== "SPAN") {
        e.preventDefault()
        zoomOut()
        return
      }
      if (e.key === "d" && (e.ctrlKey || e.metaKey) && st === "node" && tag !== "SPAN") {
        e.preventDefault()
        duplicateSelected()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [deleteSelected, zoomIn, zoomOut, duplicateSelected])

  const startAdd = (shape: Shape) => {
    setTool("add")
    setPendingShape(shape)
    setConnectFrom(null)
  }

  const setSelectTool = () => {
    setTool("select")
    setConnectFrom(null)
  }

  const setConnectTool = () => {
    setTool("connect")
    setConnectFrom(null)
  }

  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, +(z + delta).toFixed(2))))
  }

  const startPan = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const startX = e.clientX
    const startY = e.clientY
    const startLeft = container.scrollLeft
    const startTop = container.scrollTop

    function onMove(ev: MouseEvent) {
      container.scrollLeft = startLeft - (ev.clientX - startX)
      container.scrollTop = startTop - (ev.clientY - startY)
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      activeGestureCleanup.current = null
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    activeGestureCleanup.current = onUp
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    const x = e.nativeEvent.offsetX / zoom
    const y = e.nativeEvent.offsetY / zoom
    if (tool === "add" && pendingShape) {
      const { w, h } = shapeDefaultSize(pendingShape)
      const id = newId("n")
      const node: WhiteboardNode = {
        id,
        x: x - w / 2,
        y: y - h / 2,
        w,
        h,
        shape: pendingShape,
        color: pendingShape === "sticky" ? "#f9e27d" : color,
        text: pendingShape === "text" ? "Testo" : pendingShape === "sticky" ? "Nota" : "Nuovo",
        rotate: pendingShape === "sticky" ? randomStickyRotation() : 0,
      }
      const nextNodes = [...nodes, node]
      setNodes(nextNodes)
      setTool("select")
      setSelectedId(id)
      setSelectedType("node")
      setEditingId(id)
      persist(nextNodes, edges)
    } else {
      setSelectedId(null)
      setSelectedType(null)
      setConnectFrom(null)
      if (tool === "select") startPan(e)
    }
  }

  const selectNode = (node: WhiteboardNode, e: React.MouseEvent) => {
    e.stopPropagation()
    if (tool === "connect") {
      if (!connectFrom) {
        setConnectFrom(node.id)
      } else if (connectFrom !== node.id) {
        const edge: WhiteboardEdge = { id: newId("e"), fromId: connectFrom, toId: node.id }
        const nextEdges = [...edges, edge]
        setEdges(nextEdges)
        setConnectFrom(null)
        setTool("select")
        persist(nodes, nextEdges)
      }
      return
    }
    setSelectedId(node.id)
    setSelectedType("node")
  }

  const nodeMouseDown = (node: WhiteboardNode, e: React.MouseEvent) => {
    if (tool !== "select") return
    e.stopPropagation()
    const id = node.id
    const startX = e.clientX
    const startY = e.clientY
    const origX = node.x
    const origY = node.y

    function onMove(ev: MouseEvent) {
      const dx = (ev.clientX - startX) / latest.current.zoom
      const dy = (ev.clientY - startY) / latest.current.zoom
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x: origX + dx, y: origY + dy } : n)))
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      activeGestureCleanup.current = null
      persist(latest.current.nodes, latest.current.edges)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    activeGestureCleanup.current = onUp
    setSelectedId(node.id)
    setSelectedType("node")
  }

  const resizeMouseDown = (node: WhiteboardNode, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const id = node.id
    const startX = e.clientX
    const startY = e.clientY
    const origW = node.w
    const origH = node.h

    function onMove(ev: MouseEvent) {
      const dx = (ev.clientX - startX) / latest.current.zoom
      const dy = (ev.clientY - startY) / latest.current.zoom
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, w: Math.max(40, origW + dx), h: Math.max(28, origH + dy) } : n))
      )
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      activeGestureCleanup.current = null
      persist(latest.current.nodes, latest.current.edges)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    activeGestureCleanup.current = onUp
  }

  const startEditing = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingId(id)
    setTimeout(() => {
      const el = nodeTextRefs.current[id]
      if (el) {
        el.focus()
        window.getSelection()?.selectAllChildren(el)
      }
    }, 0)
  }

  const commitEditing = (id: string, text: string) => {
    const nextNodes = nodes.map((n) => (n.id === id ? { ...n, text: text.trim() || n.text } : n))
    setNodes(nextNodes)
    setEditingId(null)
    persist(nextNodes, edges)
  }

  const selectEdge = (edge: WhiteboardEdge, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedId(edge.id)
    setSelectedType("edge")
  }

  const setNodeColor = (hex: string) => {
    if (selectedType === "node" && selectedId) {
      const nextNodes = nodes.map((n) => (n.id === selectedId ? { ...n, color: hex } : n))
      setNodes(nextNodes)
      setColor(hex)
      persist(nextNodes, edges)
    } else {
      setColor(hex)
    }
  }

  const exportPng = async () => {
    if (!canvasRef.current) return
    const originalZoom = zoom
    setZoom(1)
    setSelectedId(null)
    setSelectedType(null)
    await new Promise((r) => setTimeout(r, 60))
    const html2canvas = (await import("html2canvas")).default
    const canvas = await html2canvas(canvasRef.current, { backgroundColor: "#fafafa" })
    const link = document.createElement("a")
    link.download = "lavagna-progetto.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
    setZoom(originalZoom)
  }

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const hasSelection = !!selectedId
  const canDuplicate = selectedType === "node"

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2 overflow-x-auto border-b border-border bg-white px-3.5 py-2">
        <Link
          href={backHref}
          aria-label="Torna alla board"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f7f7f7]"
        >
          <BackIcon />
        </Link>
        <div className="shrink-0 font-heading text-sm font-extrabold whitespace-nowrap text-foreground">
          Lavagna <span className="font-medium text-ink-faint">· {boardName}</span>
        </div>
        <div className="h-[22px] w-px shrink-0 bg-border" />

        <div className="flex shrink-0 items-center gap-[3px]">
          <ToolButton onClick={setSelectTool} active={tool === "select"} title="Seleziona / sposta">
            <SelectIcon />
          </ToolButton>
          <ToolButton onClick={() => startAdd("rect")} active={tool === "add" && pendingShape === "rect"} title="Aggiungi riquadro">
            <RectIcon />
          </ToolButton>
          <ToolButton onClick={() => startAdd("pill")} active={tool === "add" && pendingShape === "pill"} title="Aggiungi pillola">
            <PillIcon />
          </ToolButton>
          <ToolButton onClick={() => startAdd("circle")} active={tool === "add" && pendingShape === "circle"} title="Aggiungi cerchio">
            <CircleIcon />
          </ToolButton>
          <ToolButton onClick={() => startAdd("text")} active={tool === "add" && pendingShape === "text"} title="Aggiungi testo">
            <TextIcon />
          </ToolButton>
          <ToolButton onClick={() => startAdd("sticky")} active={tool === "add" && pendingShape === "sticky"} title="Aggiungi post-it">
            <StickyIcon />
          </ToolButton>
          <ToolButton onClick={setConnectTool} active={tool === "connect"} title="Collega con freccia">
            <ConnectIcon />
          </ToolButton>
          <ToolButton onClick={duplicateSelected} disabled={!canDuplicate} title="Duplica selezione">
            <DuplicateIcon />
          </ToolButton>
        </div>

        <div className="h-[22px] w-px shrink-0 bg-border" />
        <div className="flex shrink-0 items-center gap-1">
          {PALETTE.map((hex) => {
            const ringed =
              (selectedType === "node" && selectedId && byId[selectedId]?.color === hex) ||
              (!selectedId && color === hex)
            return (
              <button
                key={hex}
                type="button"
                aria-label={hex}
                onClick={() => setNodeColor(hex)}
                className={cn("size-4 shrink-0 rounded-full", ringed && "ring-2 ring-foreground ring-offset-2 ring-offset-white")}
                style={{ background: hex }}
              />
            )
          })}
        </div>

        <div className="h-[22px] w-px shrink-0 bg-border" />
        <div className="flex shrink-0 items-center gap-px">
          <button
            type="button"
            onClick={zoomOut}
            title="Riduci zoom"
            className="flex size-6 items-center justify-center rounded-md bg-[#f7f7f7]"
          >
            <ZoomOutIcon />
          </button>
          <button
            type="button"
            onClick={zoomReset}
            title="Reimposta zoom"
            className="w-9 text-center text-[10.5px] font-semibold text-[#5a5a5a]"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            title="Aumenta zoom"
            className="flex size-6 items-center justify-center rounded-md bg-[#f7f7f7]"
          >
            <ZoomInIcon />
          </button>
        </div>

        <div className="min-w-2 flex-1" />

        <button
          type="button"
          onClick={exportPng}
          title="Esporta come immagine"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f7f7f7]"
        >
          <ExportIcon />
        </button>
        <ToolButton onClick={deleteSelected} disabled={!hasSelection} danger title="Elimina selezione">
          <DeleteIcon />
        </ToolButton>
      </div>

      <div
        ref={scrollRef}
        onWheel={onWheel}
        className="relative flex-1 overflow-auto bg-[#fafafa]"
        style={{
          backgroundImage: "radial-gradient(circle, #e2e2e2 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div style={{ width: CANVAS_WIDTH * zoom, height: CANVAS_HEIGHT * zoom, position: "relative" }}>
          <div
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              position: "relative",
              cursor: tool === "add" ? "crosshair" : "grab",
              transform: `scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            <svg
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
            >
              <defs>
                <marker id="wbArrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 Z" fill="#8a8a8a" />
                </marker>
              </defs>
              {edges.map((edge) => {
                const from = byId[edge.fromId]
                const to = byId[edge.toId]
                if (!from || !to) return null
                const selected = selectedId === edge.id && selectedType === "edge"
                const x1 = from.x + from.w / 2
                const y1 = from.y + from.h / 2
                const x2 = to.x + to.w / 2
                const y2 = to.y + to.h / 2
                return (
                  <g key={edge.id}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={selected ? "#1a1a1a" : "#8a8a8a"}
                      strokeWidth={2}
                      markerEnd="url(#wbArrow)"
                      style={{ pointerEvents: "none" }}
                    />
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="transparent"
                      strokeWidth={16}
                      onClick={(e) => selectEdge(edge, e)}
                      style={{ pointerEvents: "auto", cursor: "pointer" }}
                    />
                  </g>
                )
              })}
            </svg>

            {nodes.map((node) => {
              const selected = selectedId === node.id && selectedType === "node"
              const isEditing = editingId === node.id
              const isConnectFrom = connectFrom === node.id
              const radius =
                node.shape === "circle"
                  ? "50%"
                  : node.shape === "pill"
                    ? node.h / 2 + "px"
                    : node.shape === "text"
                      ? "4px"
                      : node.shape === "sticky"
                        ? "2px"
                        : "10px"
              const bg = node.shape === "text" ? "transparent" : node.color
              const textColor = node.shape === "text" ? "#1a1a1a" : luminance(node.color) > 0.6 ? "#1a1a1a" : "#ffffff"
              const ring = isConnectFrom
                ? "0 0 0 3px #5b8def"
                : selected
                  ? "0 0 0 3px #1a1a1a"
                  : node.shape === "sticky"
                    ? "0 4px 10px rgba(0,0,0,0.2)"
                    : "0 1px 3px rgba(0,0,0,0.15)"
              const border = node.shape === "text" ? "1.5px dashed #cfcfcf" : "none"
              const rotate = node.shape === "sticky" ? node.rotate || 0 : 0
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => nodeMouseDown(node, e)}
                  onClick={(e) => selectNode(node, e)}
                  onDoubleClick={(e) => startEditing(node.id, e)}
                  style={{
                    position: "absolute",
                    left: node.x,
                    top: node.y,
                    width: node.w,
                    height: node.h,
                    background: bg,
                    borderRadius: radius,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: tool === "select" ? "grab" : tool === "connect" ? "pointer" : "default",
                    boxShadow: ring,
                    border,
                    padding: "0 12px",
                    userSelect: "none",
                    transform: `rotate(${rotate}deg)`,
                  }}
                >
                  <span
                    ref={(el) => {
                      nodeTextRefs.current[node.id] = el
                    }}
                    contentEditable={isEditing}
                    suppressContentEditableWarning
                    onBlur={(e) => commitEditing(node.id, e.currentTarget.innerText)}
                    onMouseDown={(e) => {
                      if (isEditing) e.stopPropagation()
                    }}
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: textColor,
                      textAlign: "center",
                      outline: "none",
                      lineHeight: 1.3,
                      overflowWrap: "break-word",
                      maxWidth: "100%",
                      cursor: isEditing ? "text" : "inherit",
                    }}
                  >
                    {node.text}
                  </span>
                  {selected && (
                    <div
                      onMouseDown={(e) => resizeMouseDown(node, e)}
                      style={{
                        position: "absolute",
                        right: -4,
                        bottom: -4,
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: "#1a1a1a",
                        cursor: "nwse-resize",
                      }}
                    />
                  )}
                </div>
              )
            })}

            {nodes.length === 0 && (
              <div className="absolute top-10 left-[60px] max-w-[320px] text-[13px] leading-relaxed font-medium text-ink-faint">
                Usa la barra in alto per aggiungere riquadri, pillole, cerchi, testo o post-it.
                <br />
                Trascina per spostare, doppio click per rinominare, usa la freccia per collegare gli elementi.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
