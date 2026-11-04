import React from "react";
import { Asterisk, Check } from "lucide-react";

export default function ToastNotification({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="awwwards-toast-pill" role="status" aria-live="polite">
      <div className="toast-content">
        <Asterisk size={15} className="toast-star" />
        <span>{message}</span>
      </div>
    </div>
  );
}

