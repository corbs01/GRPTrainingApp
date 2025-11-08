import { useEffect, useState } from "react";

import { ContentStatus, getContentStatus, subscribeToContentStatus } from "./contentLoader";

export const useContentStatus = (): ContentStatus => {
  const [status, setStatus] = useState<ContentStatus>(() => getContentStatus());

  useEffect(() => {
    const unsubscribe = subscribeToContentStatus(setStatus);
    return () => unsubscribe();
  }, []);

  return status;
};
