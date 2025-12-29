import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, open, title, description, action, ...props }) =>
        open ? (
          <Toast
            key={id}
            {...props}
            className="mt-2"
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>

            {action}
            <ToastClose onClick={() => dismiss(id)} />
          </Toast>
        ) : null
      )}
      <ToastViewport />
    </ToastProvider>
  );
}
