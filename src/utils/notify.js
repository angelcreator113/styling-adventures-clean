// src/utils/notify.js
import toast from "react-hot-toast";

export const notify = {
  success(msg, opts) {
    toast.success(msg, { id: opts?.id, duration: opts?.duration });
  },
  error(msg, opts) {
    toast.error(msg, { id: opts?.id, duration: opts?.duration });
  },
  info(msg, opts) {
    toast(msg, { id: opts?.id, duration: opts?.duration });
  },
  // Spinner + resolves to success/error styling automatically
  promise(promise, { loading = "Working…", success = "Done!", error = "Something went wrong." }, opts) {
    return toast.promise(promise, { loading, success, error }, { id: opts?.id });
  },
};
