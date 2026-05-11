import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("[ErrorBoundary]", error, info);
    this.setState({ info: info.componentStack ?? null });
  }

  reset = () => {
    this.setState({ error: null, info: null });
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#0a0a0a",
          color: "#e88c5a",
          padding: 28,
          overflow: "auto",
          fontFamily: "ui-monospace, monospace",
          fontSize: 13,
          lineHeight: 1.5,
          zIndex: 99999,
        }}
      >
        <h2 style={{ color: "#fff", marginTop: 0, fontFamily: "ui-sans-serif" }}>
          Render error
        </h2>
        <pre style={{ whiteSpace: "pre-wrap", color: "#e88c5a" }}>
          {this.state.error.name}: {this.state.error.message}
        </pre>
        {this.state.error.stack && (
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: "pointer", color: "#888" }}>Stack</summary>
            <pre style={{ whiteSpace: "pre-wrap", color: "#aaa", fontSize: 11, marginTop: 8 }}>
              {this.state.error.stack}
            </pre>
          </details>
        )}
        {this.state.info && (
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: "pointer", color: "#888" }}>Component stack</summary>
            <pre style={{ whiteSpace: "pre-wrap", color: "#aaa", fontSize: 11, marginTop: 8 }}>
              {this.state.info}
            </pre>
          </details>
        )}
        <button
          onClick={this.reset}
          style={{
            marginTop: 16,
            padding: "6px 14px",
            background: "#2a4a2a",
            color: "#cfd",
            border: "1px solid #3a5a3a",
            borderRadius: 6,
            cursor: "pointer",
            fontFamily: "ui-sans-serif",
            fontSize: 13,
          }}
        >
          Dismiss
        </button>
      </div>
    );
  }
}
