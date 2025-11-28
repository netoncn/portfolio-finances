import { toast } from "sonner";

interface ToastErrorOptions {
  title?: string;
  description?: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "An unexpected error occurred";
}

export function showErrorToast(
  error: unknown,
  options: ToastErrorOptions = {},
) {
  const errorMessage = getErrorMessage(error);
  const title = options.title || "Error";
  const description = options.description || errorMessage;

  toast.error(title, {
    description,
  });
}

export function showSuccessToast(message: string, description?: string) {
  if (description) {
    toast.success(message, { description });
  } else {
    toast.success(message);
  }
}

export function showInfoToast(message: string, description?: string) {
  if (description) {
    toast.info(message, { description });
  } else {
    toast.info(message);
  }
}

export function showWarningToast(message: string, description?: string) {
  if (description) {
    toast.warning(message, { description });
  } else {
    toast.warning(message);
  }
}

export function showLoadingToast(message: string) {
  const id = toast.loading(message);

  return {
    id,
    success: (successMessage: string) => {
      toast.success(successMessage, { id });
    },
    error: (error: unknown, options: ToastErrorOptions = {}) => {
      const errorMessage = getErrorMessage(error);
      toast.error(options.title || "Error", {
        id,
        description: options.description || errorMessage,
      });
    },
    dismiss: () => {
      toast.dismiss(id);
    },
  };
}

export async function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error?: string;
  },
): Promise<T> {
  toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: (error: unknown) => {
      if (messages.error) {
        return messages.error;
      }
      return getErrorMessage(error);
    },
  });
  return promise;
}
