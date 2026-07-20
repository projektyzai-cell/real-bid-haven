import { AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Graphical confirmation dialog styled with the StaySafe design tokens.
 * Replaces native window.confirm() calls throughout the app.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Potwierdź",
  cancelLabel = "Anuluj",
  destructive = false,
  loading = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => (!o && !loading ? onCancel() : undefined)}>
      <AlertDialogContent className="rounded-3xl border-border bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
                destructive
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-gold"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </span>
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="rounded-xl">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className={`rounded-xl font-bold uppercase tracking-wide ${
              destructive
                ? "bg-destructive text-destructive-foreground hover:opacity-90"
                : "bg-[var(--gold)] text-[var(--gold-foreground)] hover:opacity-90"
            }`}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
