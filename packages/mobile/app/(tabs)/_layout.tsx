import { Tabs } from "expo-router";
import { Receipt, PlusCircle, ClipboardText, UserCircle } from "phosphor-react-native";
import { authClient } from "../../lib/auth";
import { colors } from "../../lib/theme";

export default function TabsLayout() {
  const { data: session } = authClient.useSession();
  const role = (session?.user as any)?.role ?? "agent";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
        tabBarStyle: { height: 64, paddingTop: 6, paddingBottom: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dépenses",
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} weight="bold" />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Créer",
          tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} weight="bold" />,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: "Approbations",
          href: role === "superviseur" ? undefined : null,
          tabBarIcon: ({ color, size }) => <ClipboardText size={size} color={color} weight="bold" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <UserCircle size={size} color={color} weight="bold" />,
        }}
      />
    </Tabs>
  );
}
