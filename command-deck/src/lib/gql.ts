// 极简 GraphQL 客户端：HTTP 查询 + graphql-ws 订阅
import { createClient, Client } from "graphql-ws";

const GQL_HTTP = "/graphql";
const GQL_WS = () => {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${location.host}/graphql`;
};

async function gqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(GQL_HTTP, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401) {
    throw new AuthError();
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  return json.data as T;
}

export class AuthError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "AuthError";
  }
}

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`登录失败: HTTP ${res.status}`);
}

let wsClient: Client | null = null;

export function subscribe<T>(
  query: string,
  variables: Record<string, unknown>,
  onNext: (data: T) => void,
  onError?: (err: unknown) => void,
): () => void {
  if (!wsClient) {
    wsClient = createClient({
      url: GQL_WS(),
      retryAttempts: 5,
      lazy: false,
    });
  }
  const unsub = wsClient.subscribe(
    { query, variables },
    {
      next: (res) => {
        if (res.errors?.length) {
          onError?.(new Error(res.errors[0].message));
          return;
        }
        onNext(res.data as T);
      },
      error: (err) => onError?.(err),
      complete: () => undefined,
    },
  );
  return () => unsub();
}

export const queries = {
  flows: /* GraphQL */ `
    query Flows {
      flows {
        id
        title
        status
        provider { name type }
        createdAt
        updatedAt
      }
    }
  `,
  flowDetail: /* GraphQL */ `
    query FlowDetail($flowId: ID!) {
      flow(flowId: $flowId) {
        id
        title
        status
        provider { name type }
        createdAt
        updatedAt
      }
      tasks(flowId: $flowId) {
        id
        title
        status
        input
        result
        flowId
        subtasks { id status title description result taskId }
        createdAt
        updatedAt
      }
      toolCallLogs(flowId: $flowId) {
        id callId status name args result durationSeconds
        flowId taskId subtaskId createdAt updatedAt
      }
      terminalLogs(flowId: $flowId) {
        id flowId taskId subtaskId type text terminal createdAt
      }
    }
  `,
};

export const subscriptions = {
  taskUpdated: /* GraphQL */ `
    subscription TaskUpdated($flowId: ID!) {
      taskUpdated(flowId: $flowId) {
        id title status flowId
        subtasks { id status title taskId }
        updatedAt
      }
    }
  `,
  toolCallAdded: /* GraphQL */ `
    subscription ToolCallAdded($flowId: ID!) {
      toolCallLogAdded(flowId: $flowId) {
        id callId status name args result durationSeconds
        flowId taskId subtaskId createdAt updatedAt
      }
    }
  `,
  messageAdded: /* GraphQL */ `
    subscription MessageAdded($flowId: ID!) {
      messageLogAdded(flowId: $flowId) {
        id type message result flowId taskId subtaskId createdAt
      }
    }
  `,
  terminalAdded: /* GraphQL */ `
    subscription TerminalAdded($flowId: ID!) {
      terminalLogAdded(flowId: $flowId) {
        id flowId taskId subtaskId type text terminal createdAt
      }
    }
  `,
};

export { gqlRequest };
