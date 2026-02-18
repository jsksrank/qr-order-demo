"use client";
import { useEffect, useRef, useState } from "react";

/**
 * QrScanner — html5-qrcode の React ラッパー
 *
 * Props:
 *   mode     "qr" | "barcode"    スキャン対象
 *   active   boolean             true でカメラ起動、false で停止
 *   onScan   (text, format) =>   読み取り成功コールバック
 *   onError  (msg) =>            エラーコールバック（任意）
 */
export default function QrScanner({ mode = "qr", active = false, onScan, onError }) {
  const scannerRef = useRef(null);
  const mountedRef = useRef(true);
  const lastScanRef = useRef({ text: "", time: 0 });
  const containerRef = useRef(`qr-reader-${Math.random().toString(36).slice(2, 8)}`);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!active) {
      // カメラ停止
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          try { scannerRef.current?.clear(); } catch (_) {}
          scannerRef.current = null;
          if (mountedRef.current) setReady(false);
        });
      }
      return;
    }

    // カメラ起動（ブラウザ専用ライブラリを動的にimport）
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

        if (cancelled || !mountedRef.current) return;

        // 既存インスタンスがあれば先に停止
        if (scannerRef.current) {
          try { await scannerRef.current.stop(); } catch (_) {}
          try { scannerRef.current.clear(); } catch (_) {}
          scannerRef.current = null;
        }

        const scanner = new Html5Qrcode(containerRef.current);
        scannerRef.current = scanner;

        const config =
          mode === "barcode"
            ? {
                fps: 10,
                qrbox: { width: 260, height: 100 },
                formatsToSupport: [
                  Html5QrcodeSupportedFormats.EAN_13,
                  Html5QrcodeSupportedFormats.EAN_8,
                  Html5QrcodeSupportedFormats.UPC_A,
                  Html5QrcodeSupportedFormats.UPC_E,
                  Html5QrcodeSupportedFormats.CODE_128,
                ],
              }
            : {
                fps: 10,
                qrbox: { width: 200, height: 200 },
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
              };

        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText, decodedResult) => {
            // 3秒間デバウンス（同じコードの連続読み取り防止）
            const now = Date.now();
            if (
              decodedText === lastScanRef.current.text &&
              now - lastScanRef.current.time < 3000
            ) {
              return;
            }
            lastScanRef.current = { text: decodedText, time: now };

            // バイブレーション
            if (navigator.vibrate) navigator.vibrate(100);

            const fmt = decodedResult?.result?.format?.formatName || "Unknown";
            onScan?.(decodedText, fmt);
          },
          () => {} // scan failure は無視
        );

        if (mountedRef.current) {
          setReady(true);
          setError(null);
        }
      } catch (err) {
        console.error("QrScanner start error:", err);
        const msg = errorMessage(err);
        if (mountedRef.current) setError(msg);
        onError?.(msg);
      }
    })();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          try { scannerRef.current?.clear(); } catch (_) {}
          scannerRef.current = null;
        });
      }
    };
  }, [active, mode]); // onScan/onError は除外（親で useCallback で安定化）

  return (
    <div>
      <div
        id={containerRef.current}
        style={{
          width: "100%",
          borderRadius: 16,
          overflow: "hidden",
          background: "#111827",
          minHeight: active ? 260 : 0,
        }}
      />
      {active && !ready && !error && (
        <div
          style={{
            padding: "14px",
            textAlign: "center",
            fontSize: 13,
            color: "#6b7280",
          }}
        >
          カメラを起動中...
        </div>
      )}
      {error && (
        <div
          style={{
            padding: "12px 14px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 10,
            marginTop: 8,
            fontSize: 12,
            color: "#dc2626",
            lineHeight: 1.6,
          }}
        >
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

function errorMessage(err) {
  const s = String(err);
  if (s.includes("NotAllowedError"))
    return "カメラへのアクセスを許可してください。ブラウザの設定からカメラ権限を確認できます。";
  if (s.includes("NotFoundError"))
    return "カメラが見つかりません。端末にカメラがあるか確認してください。";
  if (s.includes("NotReadableError"))
    return "他のアプリがカメラを使用中の可能性があります。他のアプリを閉じて再試行してください。";
  if (s.includes("OverconstrainedError"))
    return "背面カメラが利用できません。端末のカメラ設定を確認してください。";
  return `カメラ起動エラー: ${s}`;
}
