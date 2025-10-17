import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Extract emoji from title if it's a React element
        let displayTitle = title;
        let emoji = variant === 'destructive' ? '⚠️' : '✅';
        
        if (title && typeof title === 'object' && typeof title !== 'string') {
          const titleElement = title as any;
          if (titleElement.props?.children) {
            const children = titleElement.props.children;
            if (Array.isArray(children) && children.length === 2) {
              displayTitle = children[0]?.props?.children || children[0];
              emoji = children[1]?.props?.children || emoji;
            }
          }
        }

        return (
          <Toast key={id} variant={variant} {...props} className="relative pr-16">
            <span className="absolute top-3 right-10 text-xl">{emoji}</span>
            <div className="grid gap-1">
              {displayTitle && <ToastTitle>{displayTitle}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
