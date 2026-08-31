"use client";

export function ConfirmDeleteButton({
  confirmText = "Sigurno želiš obrisati ovo? Ova radnja se ne može poništiti.",
  children = "Obriši",
  className = "text-crimson hover:underline",
}: {
  confirmText?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(confirmText)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
