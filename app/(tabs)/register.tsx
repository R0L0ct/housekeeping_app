import { View, Text, FlatList, ActivityIndicator } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useFocusEffect } from "@react-navigation/native";

interface Stats {
  id: number;
  work_date: string;
  average: string;
  total_hours: string;
}
const register = () => {
  const db = useSQLiteContext();
  const [workStats, setWorkStats] = useState<Stats[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const result = await db.getAllAsync<Stats>(
            "SELECT * FROM work_stats"
          );
          if (result.length) {
            setWorkStats(result);
            setLoading(false);
          }
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();

      return () => {
        setLoading(true);
      };
    }, [])
  );
  const renderItem = ({ item }: { item: Stats }) => {
    return (
      <View style={styles.row}>
        <Text style={styles.cell}>{item.work_date}</Text>
        <Text style={styles.cell}>{item.total_hours}</Text>
        <Text style={styles.cell}>{item.average}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#fafafa" />
      </View>
    );
  }
  return (
    <View style={styles.table}>
      <View style={styles.header}>
        <Text style={[styles.cell, styles.headerCell]}>Fecha</Text>
        <Text style={[styles.cell, styles.headerCell]}>Horas Totales</Text>
        <Text style={[styles.cell, styles.headerCell]}>Promedio</Text>
      </View>
      <FlatList
        data={workStats}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={true}
        contentContainerStyle={styles.listContentContainer}
        style={styles.list}
      />
    </View>
  );
};

export default register;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  touchable: {
    flexDirection: "row",
    gap: 10,
  },
  searchContainer: {
    width: "100%",
    flexDirection: "row",
    paddingTop: 25,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    backgroundColor: "#fafafa",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    color: "white",
  },
  addButton: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007BFF",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  listContentContainer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  list: {
    flex: 1,
  },
  table: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
    paddingTop: 30,
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },

  cell: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
  },
  headerCell: {
    fontWeight: "bold",
  },
  scrollContainer: {
    maxHeight: 300, // Ajusta el alto según tus necesidades
  },
});
