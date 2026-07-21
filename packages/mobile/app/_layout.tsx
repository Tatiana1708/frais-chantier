import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import * as SplashScreen from "expo-splash-screen";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { OneDollarStatsProvider } from "../lib/analytics";
import { authClient } from "../lib/auth";
import { initDb } from "../lib/db";
import { onConnect } from "../lib/network";
import { runFullSync, refreshReferenceData } from "../lib/sync";
import appJson from "../app.json";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

const applicationId = appJson.expo.extra.applicationId ?? "";
const hostname = applicationId ? `${applicationId}-mobile` : "localhost";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!session && !inAuthGroup) router.replace("/(auth)/sign-in");
    if (session && inAuthGroup) router.replace("/(tabs)");
  }, [session, isPending, segments]);

  useEffect(() => {
    if (!session) return;
    refreshReferenceData().catch(() => {});
    runFullSync(session.user.id).catch(() => {});
    const unsubscribe = onConnect(() => {
      runFullSync(session.user.id).catch(() => {});
    });
    return () => unsubscribe();
  }, [session?.user.id]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    initDb();
    setDbReady(true);
  }, []);

  useEffect(() => {
    if (fontsLoaded && dbReady) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, dbReady]);

  if (!fontsLoaded || !dbReady) return null;

  return (
    <ErrorBoundary>
      {/* Runable analytics provider — do not remove, required for analytics tracking */}
      <OneDollarStatsProvider
        config={{
          hostname,
          collectorUrl: "https://r.lilstts.com/events",
          devmode: true,
        }}
      >
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthGate>
              <Slot />
            </AuthGate>
          </QueryClientProvider>
        </SafeAreaProvider>
      </OneDollarStatsProvider>
    </ErrorBoundary>
  );
}
