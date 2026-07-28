"use client"

import { useEffect, useRef } from "react"
import type { BoardEvent } from "@/durable-objects/board-room"

export function useBoardRealtime(boardId: string, onEvent: (event: BoardEvent) => void) {
  const onEventRef = useRef(onEvent)
  useEffect(() => {
    onEventRef.current = onEvent
  })

  useEffect(() => {
    let socket: WebSocket | null = null
    let cancelled = false
    let retryTimeout: ReturnType<typeof setTimeout> | null = null

    function connect() {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
      socket = new WebSocket(`${protocol}//${window.location.host}/api/boards/${boardId}/ws`)

      socket.addEventListener("message", (event) => {
        try {
          onEventRef.current(JSON.parse(event.data) as BoardEvent)
        } catch {
          // ignore malformed messages
        }
      })

      socket.addEventListener("close", () => {
        if (cancelled) return
        retryTimeout = setTimeout(connect, 2000)
      })
    }

    connect()

    return () => {
      cancelled = true
      if (retryTimeout) clearTimeout(retryTimeout)
      socket?.close()
    }
  }, [boardId])
}
