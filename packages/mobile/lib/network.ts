import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

export function useIsOnline() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
    return () => unsubscribe();
  }, []);

  return isOnline;
}

export function onConnect(callback: () => void) {
  let wasOnline = true;
  return NetInfo.addEventListener((state) => {
    const online = Boolean(state.isConnected && state.isInternetReachable !== false);
    if (online && !wasOnline) callback();
    wasOnline = online;
  });
}
