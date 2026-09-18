import { Tabs, TabList, TabTrigger, TabSlot } from "expo-router/ui";
import { Text, StyleSheet } from "react-native";

export default function AppTabs() {
  return (
    <Tabs style={styles.tabs}>
      <TabSlot style={styles.slot} />
      <TabList style={styles.tabList}>
        <TabTrigger name="index" href="/" style={styles.tabTrigger}>
          <Text>Home</Text>
        </TabTrigger>
        <TabTrigger name="planner" href="/planner" style={styles.tabTrigger}>
          <Text>Planner</Text>
        </TabTrigger>
        <TabTrigger name="history" href="/history" style={styles.tabTrigger}>
          <Text>Historie</Text>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flex: 1,
  },
  slot: {
    flex: 1,
  },
  tabList: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ccc",
  },
  tabTrigger: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
