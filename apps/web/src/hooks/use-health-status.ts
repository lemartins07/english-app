"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiRequestError } from "@/lib/api/errors";
import { fetchHealth } from "@/lib/api/health";

type HealthStatus = "loading" | "healthy" | "unhealthy";

interface HealthState {
  status: HealthStatus;
  latencyMs?: number;
  checkedAt?: Date;
  error?: string;
}

interface UseHealthStatusOptions {
  intervalMs?: number;
}

export function useHealthStatus(options: UseHealthStatusOptions = {}) {
  const { intervalMs = 60_000 } = options;
  const [state, setState] = useState<HealthState>({ status: "loading" });
  const controllerRef = useRef<AbortController | null>(null);

  const runCheck = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState((prev) => ({
      ...prev,
      status: "loading",
      error: undefined,
    }));

    try {
      const result = await fetchHealth({ signal: controller.signal });
      setState({
        status: "healthy",
        latencyMs: result.dependencies.database.latencyMs,
        checkedAt: new Date(result.timestamp),
      });
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Não foi possível verificar a saúde da API.";

      setState({
        status: "unhealthy",
        error: message,
        checkedAt: new Date(),
      });
    }
  }, []);

  useEffect(() => {
    void runCheck();

    if (intervalMs <= 0) {
      return () => controllerRef.current?.abort();
    }

    const id = setInterval(() => {
      void runCheck();
    }, intervalMs);

    return () => {
      clearInterval(id);
      controllerRef.current?.abort();
    };
  }, [intervalMs, runCheck]);

  return {
    status: state.status,
    latencyMs: state.latencyMs,
    checkedAt: state.checkedAt,
    error: state.error,
    loading: state.status === "loading",
    refresh: runCheck,
  };
}
