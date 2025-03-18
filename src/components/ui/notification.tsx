
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, Info, AlertCircle, CheckCircle, Bell } from "lucide-react"

import { cn } from "@/lib/utils"

const notificationVariants = cva(
  "relative rounded-lg border p-4 shadow-md flex items-start gap-3 w-full max-w-md transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
        success: "bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800",
        warning: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800",
        danger: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface NotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationVariants> {
  title?: string
  onClose?: () => void
  icon?: React.ReactNode
}

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  ({ className, variant, title, children, onClose, icon, ...props }, ref) => {
    const getDefaultIcon = () => {
      switch (variant) {
        case "info":
          return <Info className="h-5 w-5 text-blue-500" />
        case "success":
          return <CheckCircle className="h-5 w-5 text-green-500" />
        case "warning":
          return <AlertCircle className="h-5 w-5 text-yellow-500" />
        case "danger":
          return <AlertCircle className="h-5 w-5 text-red-500" />
        default:
          return <Bell className="h-5 w-5 text-gray-500" />
      }
    }

    return (
      <div
        ref={ref}
        className={cn(notificationVariants({ variant }), className)}
        {...props}
      >
        <div className="flex-shrink-0 mt-0.5">
          {icon || getDefaultIcon()}
        </div>
        <div className="flex-1">
          {title && <h5 className="font-medium mb-1">{title}</h5>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)

Notification.displayName = "Notification"

export { Notification }
