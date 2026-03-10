"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ConfirmOptions = {
  message: string;
  danger?: boolean;
};

type ConfirmContextValue = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return async () => false;
  }
  return ctx.confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    message: string;
    danger?: boolean;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        message: opts.message,
        danger: opts.danger,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state?.resolve(true);
    setState(null);
  }, [state]);

  const handleCancel = useCallback(() => {
    state?.resolve(false);
    setState(null);
  }, [state]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9998,
            padding: 16,
          }}
          onClick={handleCancel}
        >
          <div
            style={{
              background: "#16161a",
              border: "1px solid #252529",
              borderRadius: 14,
              padding: 24,
              maxWidth: 360,
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ margin: 0, fontSize: 15, color: "#c8c8d0", lineHeight: 1.5 }}>
              {state.message}
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: "10px 18px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid #252529",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#9a9aa5",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                გაუქმება
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  padding: "10px 18px",
                  background: state.danger ? "rgba(220,60,60,0.15)" : "#f0f0f2",
                  border: state.danger ? "1px solid rgba(220,60,60,0.3)" : "none",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: state.danger ? "#e07070" : "#0e0e10",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                დადასტურება
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
